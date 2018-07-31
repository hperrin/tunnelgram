// Image Resize Web Worker.

let canvas;
let img;

onmessage = (e) => {
  const {counter, args} = e.data;
  canvas = e.data.canvas;
  img = e.data.img;
  const result = resizeImage(...args);
  postMessage({counter, result});
};

const resizeImage = (type, maxWidth, maxHeight, imgWidth, imgHeight, crop) => {
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

  // Copy and resize second canvas to first canvas.
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
  const ctx = canvas.getContext('2d');
  canvas.width = imgWidth;
  canvas.height = imgHeight;
  ctx.drawImage(img, 0, 0);

  resample_single(canvas, ratioWidth, ratioHeight, destWidth, destHeight, x, y);

  return {
    data: canvas.transferToImageBitmap(),
    width: destWidth,
    height: destHeight
  };
};

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
