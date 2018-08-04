// Based on: https://stackoverflow.com/a/14845805
export default class EditImage {
  constructor (img, type) {
    // Create two canvas.
    this.canvas = document.createElement('canvas');
    this.canvasCopy = document.createElement('canvas');

    this.offscreenCanvasSupport = !!this.canvas.transferControlToOffscreen;

    if (this.offscreenCanvasSupport) {
      this.resizeImageWorker = new Worker('dist/Workers/ResizeImage.js');
      this.resizeImageWorkerCounter = 0;
      this.resizeImageWorkerCallbacks = {};
      this.resizeImageWorker.onmessage = (e) => {
        const {counter, result} = e.data;
        this.resizeImageWorkerCallbacks[counter](result);
        delete this.resizeImageWorkerCallbacks[counter];
      };
    }

    this.img = img;
    this.type = type;
  }

  destroy () {
    if (this.offscreenCanvasSupport) {
      this.resizeImageWorker.terminate();
    }
  }

  resizeContain (maxWidth, maxHeight) {
    return this.resize(maxWidth, maxHeight, false);
  }

  resizeCrop (maxWidth, maxHeight) {
    return this.resize(maxWidth, maxHeight, true);
  }

  async resize (maxWidth = 150, maxHeight = 150, crop) {
    const imgWidth = this.img.videoWidth || this.img.naturalWidth;
    const imgHeight = this.img.videoHeight || this.img.naturalHeight;

    if (this.offscreenCanvasSupport) {
      const canvas2 = document.createElement('canvas');
      const offscreenCanvas = this.canvas.transferControlToOffscreen();
      const offscreenCanvas2 = canvas2.transferControlToOffscreen();
      const bitmap = await window.createImageBitmap(this.img, 0, 0, imgWidth, imgHeight);

      this.resizeImageWorkerCounter++;
      const counter = this.resizeImageWorkerCounter;

      let resolve;
      const promise = new Promise(r => resolve = r);

      this.resizeImageWorkerCallbacks[counter] = result => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.drawImage(result.data, 0, 0, result.width, result.height);
        result.data = canvas.toDataURL(this.type, .95);
        resolve(result);
      };

      this.resizeImageWorker.postMessage({
        counter,
        args: [this.type, maxWidth, maxHeight, imgWidth, imgHeight, crop],
        canvas: offscreenCanvas,
        canvas2: offscreenCanvas2,
        img: bitmap
      }, [offscreenCanvas]);

      return await promise;
    } else {
      // Determine new ratio based on max size.
      let ratio = 1;
      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        let ratioWidth = 1;
        let ratioHeight = 1;
        if (imgWidth > maxWidth) {
          ratioWidth = maxWidth / imgWidth;
        }
        if (imgHeight > maxHeight) {
          ratioHeight = maxHeight / imgHeight;
        }
        ratio = (crop ? Math.max : Math.min)(ratioWidth, ratioHeight);
      }

      // Calculate widths and heights.
      const ratioWidth = Math.floor(imgWidth * ratio);
      const ratioHeight = Math.floor(imgHeight * ratio);
      const destWidth = Math.min(ratioWidth, maxWidth);
      const destHeight = Math.min(ratioHeight, maxHeight);

      let x = 0;
      let y = 0;
      if (crop && (imgWidth > maxWidth || imgHeight > maxHeight)) {
        x = (maxWidth - ratioWidth) / 2;
        y = (maxHeight - ratioHeight) / 2;
      }

      // Prepare main canvas.
      const ctx = this.canvas.getContext('2d');
      this.canvas.width = imgWidth;
      this.canvas.height = imgHeight;

      // Perform scale operation.
      scale(this.canvas, this.img, ratio, destWidth, destHeight, x, y);

      return {
        data: this.canvas.toDataURL(this.type, .95),
        width: destWidth,
        height: destHeight
      };
    }
  }

  rotate () {
    rotate(this.canvas, this.img);
    return this.canvas.toDataURL(this.type, .95);
  }
}

function scale (canvas, img, ratio, destWidth, destHeight, x, y) {
  const canvas2 = document.createElement('canvas');

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(ratio, ratio);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  canvas2.width = destWidth;
  canvas2.height = destHeight;
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(canvas, -x, -y, destWidth, destHeight, 0, 0, destWidth, destHeight);

  //resize canvas
  canvas.width = destWidth;
  canvas.height = destHeight;

  //draw
  ctx.drawImage(canvas2, 0, 0);
}

function rotate (canvas, img) {
  const imgWidth = img.videoWidth || img.naturalWidth;
  const imgHeight = img.videoHeight || img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  canvas.width = imgHeight;
  canvas.height = imgWidth;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2);
  ctx.restore();
}
