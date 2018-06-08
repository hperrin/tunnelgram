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
const resizeImage = (type, maxWidth, maxHeight) => {
  const ctx = canvas.getContext("2d");
  const copyContext = canvasCopy.getContext("2d");

  // Determine new ratio based on max size.
  let ratioWidth = 1;
  let ratioHeight = 1;
  if (img.width > maxWidth) {
    ratioWidth = maxWidth / img.width;
  }
  if (img.height > maxHeight) {
    ratioHeight = maxHeight / img.height;
  }
  let ratio = Math.min(ratioWidth, ratioHeight);

  // Draw original image in second canvas.
  canvasCopy.width = img.width;
  canvasCopy.height = img.height;
  copyContext.drawImage(img, 0, 0);

  // Copy and resize second canvas to first canvas.
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

  return {
    data: canvas.transferToImageBitmap(),
    width: canvas.width,
    height: canvas.height
  };
};
