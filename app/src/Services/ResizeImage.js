// Based on: https://stackoverflow.com/a/14845805
export default class ResizeImage {
  constructor (dataURL, type) {
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

    // Create original image.
    this.img = new Image();

    this.ready = new Promise(resolve => this.resolve = resolve);
    this.img.onload = () => this.resolve();

    this.img.src = dataURL;
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

  async resize (maxWidth, maxHeight, crop) {
    // Max size for image.
    maxWidth = maxWidth || 150;
    maxHeight = maxHeight || 150;

    await this.ready;

    if (this.offscreenCanvasSupport) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();
      const offscreenCanvasCopy = this.canvasCopy.transferControlToOffscreen();
      const bitmap = await window.createImageBitmap(this.img, 0, 0, this.img.width, this.img.height);

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
        args: [this.type, maxWidth, maxHeight, crop],
        canvas: offscreenCanvas,
        canvasCopy: offscreenCanvasCopy,
        img: bitmap
      }, [offscreenCanvas, offscreenCanvasCopy]);

      return await promise;
    } else {
      const ctx = this.canvas.getContext('2d');
      const copyContext = this.canvasCopy.getContext('2d');

      // Determine new ratio based on max size.
      let ratio = 1;
      if (this.img.width > maxWidth || this.img.height > maxHeight) {
        if (crop) {
          if (this.img.width - maxWidth > this.img.height - maxHeight) {
            ratio = maxWidth / this.img.width;
          } else {
            ratio = maxHeight / this.img.height;
          }
        } else {
          let ratioWidth = 1;
          let ratioHeight = 1;
          if (this.img.width > maxWidth) {
            ratioWidth = maxWidth / this.img.width;
          }
          if (this.img.height > maxHeight) {
            ratioHeight = maxHeight / this.img.height;
          }
          ratio = Math.min(ratioWidth, ratioHeight);
        }
      }

      // Draw original image in second canvas.
      this.canvasCopy.width = this.img.width;
      this.canvasCopy.height = this.img.height;
      copyContext.drawImage(this.img, 0, 0);

      // Copy and resize second canvas to first canvas.
      this.canvas.width = this.img.width * ratio;
      this.canvas.height = this.img.height * ratio;
      ctx.drawImage(this.canvasCopy, 0, 0, this.canvasCopy.width, this.canvasCopy.height, 0, 0, this.canvas.width, this.canvas.height);

      return {
        data: this.canvas.toDataURL(this.type, .95),
        width: this.canvas.width,
        height: this.canvas.height
      };
    }
  }
}
