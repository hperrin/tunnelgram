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

    // Calculate the max bitrate in Kbits/s.
    const currentBitRate = Math.floor((typedArray.length * 8) / duration) / 1000;
    const maxBitRate = Math.floor(Math.floor(20971520 * 8 * .95) / duration) / 1000; // Limit file size to 20ish MB.
    // Since they're most likely trying to upload a better format video, choose
    // between 150% their video's bitrate and the maximum bitrate this video can
    // be to achieve a 20MB file.
    const targetTotalBitRate = Math.min(currentBitRate * 1.5, maxBitRate);
    // const bufSize = Math.max(currentBitRate, maxBitRate) * 2;
    const targetAudioBitRate = Math.min(125, targetTotalBitRate * .25);
    const targetVideoBitRate = targetTotalBitRate - targetAudioBitRate;

    // The common arguments for each pass.
    const commonArgs = [
      '-i', 'input',
      '-f', 'mp4',
      '-qmin', '16',
      '-qmax', '1024',
      '-vcodec', 'libx264',
        '-vf', 'format=yuv420p',
        '-preset', 'veryslow',
        '-profile:v', 'high',
        '-level', '4.2',
        '-b:v', Math.floor(targetVideoBitRate)+'k',
        // '-maxrate', Math.floor(maxBitRate)+'k',
        // '-bufsize', Math.floor(bufSize)+'k',
      '-acodec', 'aac',
        '-b:a', Math.floor(targetAudioBitRate)+'k',
      '-hide_banner'
    ];

    // First pass.
    this.init();
    await this._readyPromise;
    // The worker is ready.
    if (progressCallback) {
      this.stderrCallback = line => {
        const match = line.match(/frame=\s*\d+\s+.*time=([\d:.]+)/);
        if (match) {
          const times = match[1].split(':').reverse().map(parseFloat);
          let seconds = 0;
          for (let i = 0; i < times.length; i++) {
            seconds += times[i] * (60 ** i);
          }
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
    const logFile = firstPass.MEMFS.find(file => file.name === 'ffmpeg2pass-0.log');

    // Second pass.
    this.init();
    await this._readyPromise;
    // The worker is ready.
    if (progressCallback) {
      this.stderrCallback = line => {
        const match = line.match(/frame=\s*\d+\s+.*time=([\d:.]+)/);
        if (match) {
          const times = match[1].split(':').reverse().map(parseFloat);
          let seconds = 0;
          for (let i = 0; i < times.length; i++) {
            seconds += times[i] * (60 ** i);
          }
          progressCallback((seconds + duration) / (duration * 2));
        }
      };
    }
    this.worker.postMessage({
      type: 'run',
      MEMFS: [{name: 'input', data: typedArray}, logFile],
      arguments: [
        ...commonArgs,
        '-pass', '2',
        '-fs', ''+Math.floor(20971520 * .98), // Just stop encoding if it gets to 20MB.
        'output.mp4'
      ]
    });

    let data;
    data = await this.promise;

    return data.MEMFS.find(file => file.name === 'output.mp4').data;
  }
}
