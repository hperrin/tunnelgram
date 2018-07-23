// Image Resize Web Worker.

let canvas;
let canvasCopy;
let img;

onmessage = (e) => {
  const {counter, args} = e.data;
  canvas = e.data.canvas;
  canvasCopy = e.data.canvasCopy;
  img = e.data.img;
  const result = resizeImage(...args);
  postMessage({counter, result});
};

// Source: https://stackoverflow.com/a/14845805
const resizeImage = (type, maxWidth, maxHeight, crop) => {
  const ctx = canvas.getContext("2d");
  const copyContext = canvasCopy.getContext("2d");

  // Determine new ratio based on max size.
  let ratio = 1;
  if (img.width > maxWidth || img.height > maxHeight) {
    let ratioWidth = 1;
    let ratioHeight = 1;
    if (img.width > maxWidth) {
      ratioWidth = maxWidth / img.width;
    }
    if (img.height > maxHeight) {
      ratioHeight = maxHeight / img.height;
    }
    ratio = (crop ? Math.max : Math.min)(ratioWidth, ratioHeight);
  }

  // Draw original image in second canvas.
  canvasCopy.width = img.width;
  canvasCopy.height = img.height;
  copyContext.drawImage(img, 0, 0);

  // Copy and resize second canvas to first canvas.
  const ratioWidth = img.width * ratio;
  const ratioHeight = img.height * ratio;
  canvas.width = Math.min(ratioWidth, maxWidth);
  canvas.height = Math.min(ratioHeight, maxHeight);

  let x = 0;
  let y = 0;
  if (crop) {
    x = (maxWidth - ratioWidth) / 2;
    y = (maxHeight - ratioHeight) / 2;
  }

  ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, x, y, ratioWidth, ratioHeight);

  return {
    data: canvas.transferToImageBitmap(),
    width: canvas.width,
    height: canvas.height
  };
};
