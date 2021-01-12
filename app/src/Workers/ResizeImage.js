// Image Resize Web Worker.

let canvas;
let canvas2;
let img;

onmessage = (e) => {
  const { counter, args } = e.data;
  canvas = e.data.canvas;
  canvas2 = e.data.canvas2;
  img = e.data.img;
  const result = resizeImage(...args);
  postMessage({ counter, result });
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
  const ctx = canvas.getContext('2d');
  canvas.width = imgWidth;
  canvas.height = imgHeight;

  // Perform scale operation.
  scale(canvas, canvas2, img, ratio, destWidth, destHeight, x, y);

  return {
    data: canvas.transferToImageBitmap(),
    width: destWidth,
    height: destHeight,
  };
};

function scale(canvas, canvas2, img, ratio, destWidth, destHeight, x, y) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(ratio, ratio);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  canvas2.width = destWidth;
  canvas2.height = destHeight;
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(
    canvas,
    x * -1,
    y * -1,
    destWidth,
    destHeight,
    0,
    0,
    destWidth,
    destHeight,
  );

  //resize canvas
  canvas.width = destWidth;
  canvas.height = destHeight;

  //draw
  ctx.drawImage(canvas2, 0, 0);
}
