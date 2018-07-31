const expensiveResampling = false;

// Based on: https://stackoverflow.com/a/14845805
export default class ResizeImage {
  constructor (dataURL, type, img) {
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
    if (img) {
      this.ready = Promise.resolve(1);
      this.img = img;
    } else {
      this.img = new Image();

      this.ready = new Promise(resolve => this.resolve = resolve);
      this.img.onload = () => this.resolve();

      this.img.src = dataURL;
    }
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

    const imgWidth = this.img.videoWidth || this.img.naturalWidth;
    const imgHeight = this.img.videoHeight || this.img.naturalHeight;

    if (this.offscreenCanvasSupport) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();
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

      // Draw original image in canvas.
      const ctx = this.canvas.getContext('2d');
      this.canvas.width = imgWidth;
      this.canvas.height = imgHeight;

      if (expensiveResampling) {
        ctx.drawImage(this.img, 0, 0);
        resample_single(this.canvas, ratioWidth, ratioHeight, destWidth, destHeight, x, y, true);
      } else {
        scale(this.canvas, this.img, ratio, destWidth, destHeight, x, y);
      }

      return {
        data: this.canvas.toDataURL(this.type, .95),
        width: destWidth,
        height: destHeight
      };
    }
  }
}

function scale(canvas, img, ratio, destWidth, destHeight, x, y) {
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(ratio, ratio);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const canvas2 = document.createElement('canvas');
  canvas2.width = destWidth;
  canvas2.height = destHeight;
  var ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(canvas, x * -1, y * -1, destWidth, destHeight, 0, 0, destWidth, destHeight);

  //resize canvas
  canvas.width = destWidth;
  canvas.height = destHeight;

  //draw
  ctx.drawImage(canvas2, 0, 0);
}

// source: https://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality/19223362#19223362
/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 *
 * @param {HtmlElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {int} destWidth
 * @param {int} destHeight
 * @param {int} x
 * @param {int} y
 */
function resample_single(canvas, width, height, destWidth, destHeight, x, y) {
  var width_source = canvas.width;
  var height_source = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  var ratio_w = width_source / width;
  var ratio_h = height_source / height;
  var ratio_w_half = Math.ceil(ratio_w / 2);
  var ratio_h_half = Math.ceil(ratio_h / 2);

  var ctx = canvas.getContext('2d');
  var img = ctx.getImageData(0, 0, width_source, height_source);
  var img2 = ctx.createImageData(width, height);
  var data = img.data;
  var data2 = img2.data;

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var x2 = (i + j * width) * 4;
      var weight = 0;
      var weights = 0;
      var weights_alpha = 0;
      var gx_r = 0;
      var gx_g = 0;
      var gx_b = 0;
      var gx_a = 0;
      var center_y = (j + 0.5) * ratio_h;
      var yy_start = Math.floor(j * ratio_h);
      var yy_stop = Math.ceil((j + 1) * ratio_h);
      for (var yy = yy_start; yy < yy_stop; yy++) {
        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        var center_x = (i + 0.5) * ratio_w;
        var w0 = dy * dy; //pre-calc part of w
        var xx_start = Math.floor(i * ratio_w);
        var xx_stop = Math.ceil((i + 1) * ratio_w);
        for (var xx = xx_start; xx < xx_stop; xx++) {
          var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          var w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            //pixel too far
            continue;
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          var pos_x = 4 * (xx + yy * width_source);
          //alpha
          gx_a += weight * data[pos_x + 3];
          weights_alpha += weight;
          //colors
          if (data[pos_x + 3] < 255)
            weight = weight * data[pos_x + 3] / 250;
          gx_r += weight * data[pos_x];
          gx_g += weight * data[pos_x + 1];
          gx_b += weight * data[pos_x + 2];
          weights += weight;
        }
      }
      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights_alpha;
    }
  }
  //resize canvas
  canvas.width = destWidth;
  canvas.height = destHeight;

  //draw
  ctx.putImageData(img2, x, y);
}
