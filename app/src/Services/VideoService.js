export class VideoService {
  constructor () {
    this.state = 'loading';
  }

  init () {
    this.stdoutCallback = null;
    this.stderrCallback = null;
    this.resolve = () => console.error('Video service wasn\'t ready for resolve.');
    this.reject = () => console.error('Video service wasn\'t ready for reject.');
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this._readyResolve = null;
    this._readyPromise = new Promise(resolve => this._readyResolve = resolve);
    this.worker = new Worker('/node_modules/ffmpeg.js/ffmpeg-worker-mp4.js');
    this.worker.onmessage = e => {
      const msg = e.data;
      switch (msg.type) {
        case 'ready':
          this.state = 'ready';
          this._readyResolve(true);
          break;
        case 'stdout':
          console.log(`FFMPEG.js stdout: ${msg.data}`);
          if (this.stdoutCallback) {
            this.stdoutCallback(msg.data);
          }
          break;
        case 'stderr':
          console.log(`FFMPEG.js stderr: ${msg.data}`);
          if (this.stderrCallback) {
            this.stderrCallback(msg.data);
          }
          break;
        case 'run':
          this.state = 'running';
          break;
        case 'done':
          this.state = 'done';
          this.resolve(msg.data);
          this.worker.terminate();
          break;
        case 'exit':
          this.state = 'closed';
          if (msg.data != 0) {
            this.reject(msg.data);
          }
          this.worker.terminate();
          break;
      }
    };
  }

  async run (...args) {
    if (this.state !== 'loading' && this.state !== 'ready' && this.state !== 'closed') {
      throw new Error('The video worker is not ready.');
    }
    this.init();

    await this._readyPromise;

    // The worker is ready, so run the command.
    this.worker.postMessage({type: 'run', arguments: [...args]});

    return await this.promise;
  }

  async transcode (typedArray, duration, progressCallback) {
    if (this.state !== 'loading' && this.state !== 'ready' && this.state !== 'closed') {
      throw new Error('The video worker is not ready.');
    }

    // Get information about the video.

    // First pass.
    this.init();
    await this._readyPromise;
    // The worker is ready.
    let information = '';
    this.stderrCallback = line => {
      if (information !== '' || line.startsWith('Input #0,')) {
        information += line+'\n';
      }
    };
    this.worker.postMessage({
      type: 'run',
      MEMFS: [{name: 'input', data: typedArray}],
      arguments: [
        '-i', 'input'
      ]
    });

    await this.promise;

    // Extract the information from the output.
    let fileDuration = null;
    let fileBitrate = null;
    let videoCodec = null;
    let videoBitrate = null;
    let audioCodec = null;
    let audioBitrate = null;
    if (information !== '') {
      const fileMatch = information.match(/^\s*Duration: ([\d:.]+), start: [\d:.]+, bitrate: ([\d.]+) (gb|mb|kb|b)\/s\s*$/m);
      if (fileMatch) {
        fileDuration = this.convertFfmpegTimeToSeconds(fileMatch[1]);
        fileBitrate = this.convertFfmpegBitrateToKbps(fileMatch[2], fileMatch[3]);
      }
      const videoMatch = information.match(/^\s*Stream #\d+:\d+(?:[()\w]*): Video: ([^ ,]+)[ ,](?:[^\n]* ([\d.]+) (gb|mb|kb|b)\/s\b)?.*$/m);
      if (videoMatch) {
        videoCodec = videoMatch[1];
        videoBitrate = videoMatch[2] ? this.convertFfmpegBitrateToKbps(videoMatch[2], videoMatch[3]) : null;
      } else {
        throw new Error('FFMPEG can\'t read the video stream.');
      }
      const audioMatch = information.match(/^\s*Stream #\d+:\d+(?:[()\w]*): Audio: ([^ ,]+)[ ,](?:[^\n]* ([\d.]+) (gb|mb|kb|b)\/s\b)?.*$/m);
      if (audioMatch) {
        audioCodec = audioMatch[1];
        audioBitrate = audioMatch[2] ? this.convertFfmpegBitrateToKbps(audioMatch[2], audioMatch[3]) : null;
      }
    } else {
      throw new Error('FFMPEG can\'t read the file streams.');
    }

    // Calculate the max bitrate in Kbits/s.
    if (fileDuration !== null) {
      duration = fileDuration;
    }
    // Since they're most likely trying to upload a better format video, choose
    // between 150% their video's bitrate and the maximum bitrate this video can
    // be to achieve a 20MB file. Audio should be 25% the total bitrate, with a
    // max of either the original audio bitrate or 125.
    const currentBitRate = fileBitrate === null ? Math.floor((typedArray.length * 8) / duration) / 1000 : fileBitrate;
    const maxBitRate = Math.floor(Math.floor(20971520 * 8 * .95) / duration) / 1000; // Limit file size to 20ish MB.
    const targetTotalBitRate = Math.min(currentBitRate * 1.5, maxBitRate);
    // const bufSize = Math.max(currentBitRate, maxBitRate) * 2;
    const targetAudioBitRate = audioCodec === null ? 0 : Math.min(audioBitrate === null ? 125 : audioBitrate, targetTotalBitRate * .25);
    const targetVideoBitRate = Math.min(videoBitrate === null ? Infinity : (videoBitrate * 1.5), targetTotalBitRate - targetAudioBitRate);

    // The common arguments for each pass.
    let commonArgs = [
      '-i', 'input',
      '-f', 'mp4',
      '-hide_banner'
    ];

    let copy = true;

    if (videoCodec === 'h264' && typedArray.length < (20971520 * .98)) {
      // We can just copy the stream.
      commonArgs = [
        ...commonArgs,
        '-vcodec', 'copy'
      ];
    } else {
      // We need to re-encode.
      copy = false;
      commonArgs = [
        ...commonArgs,
        '-vcodec', 'libx264',
          '-qmin', '16',
          '-qmax', '1024',
          '-vf', 'format=yuv420p',
          '-preset', 'fast',
          '-profile:v', 'high',
          '-level', '4.2',
          '-tune', 'film',
          '-b:v', Math.floor(targetVideoBitRate)+'k',
          // '-maxrate', Math.floor(maxBitRate)+'k',
          // '-bufsize', Math.floor(bufSize)+'k',
      ];
    }
    if (audioCodec === null) {
      commonArgs = [
        ...commonArgs,
        '-an'
      ];
    } else if (audioCodec === 'aac' && typedArray.length < (20971520 * .98)) {
      // We can just copy the stream.
      commonArgs = [
        ...commonArgs,
        '-acodec', 'copy'
      ];
    } else {
      // We need to re-encode.
      copy = false;
      commonArgs = [
        ...commonArgs,
        '-acodec', 'aac',
          '-b:a', Math.floor(targetAudioBitRate)+'k',
      ];
    }

    let logFile = null;
    if (!copy) {
      // First pass.
      this.init();
      await this._readyPromise;
      // The worker is ready.
      if (progressCallback) {
        this.stderrCallback = line => {
          const match = line.match(/frame=\s*\d+\s+.*time=([\d:.]+)/);
          if (match) {
            let seconds = this.convertFfmpegTimeToSeconds(match[1]);
            progressCallback(seconds / (duration * 2));
          }
        };
      }
      this.worker.postMessage({
        type: 'run',
        MEMFS: [{name: 'input', data: typedArray}, {name: 'null', data: null}],
        arguments: [
          ...commonArgs,
          '-pass', '1',
          '-y',
          'null'
        ]
      });

      let firstPass;
      firstPass = await this.promise;
      // Grab the log file from the first pass.
      logFile = firstPass.MEMFS.find(file => file.name === 'ffmpeg2pass-0.log');
    }

    // Second pass.
    this.init();
    await this._readyPromise;
    // The worker is ready.
    if (progressCallback) {
      this.stderrCallback = line => {
        const match = line.match(/frame=\s*\d+\s+.*time=([\d:.]+)/);
        if (match) {
          let seconds = this.convertFfmpegTimeToSeconds(match[1]);
          progressCallback((seconds + duration) / (duration * (copy ? 1 : 2)));
        }
      };
    }
    const twoPassArgs = copy ? [] : ['-pass', '2'];
    const logFileArgs = copy ? [] : [logFile];
    this.worker.postMessage({
      type: 'run',
      MEMFS: [{name: 'input', data: typedArray}, ...logFileArgs],
      arguments: [
        ...commonArgs,
        ...twoPassArgs,
        '-fs', ''+Math.floor(20971520 * .98), // Just stop encoding if it gets to 20MB.
        'output.mp4'
      ]
    }, [typedArray.buffer]);

    let data;
    data = await this.promise;

    return data.MEMFS.find(file => file.name === 'output.mp4').data;
  }

  convertFfmpegTimeToSeconds (ffmpegTime) {
    const times = ffmpegTime.split(':').reverse().map(parseFloat);
    let seconds = 0;
    for (let i = 0; i < times.length; i++) {
      seconds += times[i] * (60 ** i);
    }
    return seconds;
  }

  convertFfmpegBitrateToKbps (ffmpegBitrate, unit) {
    let bitrate = parseFloat(ffmpegBitrate);
    switch (unit) {
      case 'gb':
        bitrate *= 1024 * 1024;
        break;
      case 'mb':
        bitrate *= 1024;
        break;
      case 'b':
        bitrate /= 1024;
        break;
    }
    return bitrate;
  }
}
