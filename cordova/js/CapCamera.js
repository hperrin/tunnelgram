import { Capacitor, Plugins, CameraResultType } from '@capacitor/core';
import { VideoCapturePlus } from '@ionic-native/video-capture-plus';

const { Camera } = Plugins;

export default class CapCamera {
  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 95,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl
    });
    const imageData = image.dataUrl.match(/data:([\w\/]+);base64,(.+)$/);
    const type = imageData[1];
    const base64 = imageData[2];
    const size = window.atob(base64).length;
    const file = {
      name: 'Captured Image.'+image.format,
      type,
      localURL: image.dataUrl,
      size,
      isDataURL: true,
      base64
    };
    return file;
  }

  async takeVideo() {
    const mediafile = await VideoCapturePlus.captureVideo({
      limit: 1,
      duration: 30,
      highquality: true
    });

    return {
      ...mediafile[0],
      localURL: Capacitor.convertFileSrc(mediafile[0].fullPath)
    };

    // return await new Promise((resolve, reject) => {
    //   navigator.device.capture.captureVideo(
    //     mediaFiles => {
    //       window.resolveLocalFileSystemURL(mediaFiles[0].localURL, entry => {
    //         entry.file(file => {
    //           file.type = mediaFiles[0].type;
    //           file.localURL = entry.toURL();
    //           console.log(file);
    //           resolve(file);
    //         });
    //       });
    //     },
    //     err => {
    //       const errObj = {
    //         textStatus: '',
    //       };
    //       switch (err.code) {
    //         case CaptureError.CAPTURE_INTERNAL_ERR:
    //           errObj.textStatus =
    //             'The camera or microphone failed to capture image or sound.';
    //           break;
    //         case CaptureError.CAPTURE_APPLICATION_BUSY:
    //           errObj.textStatus =
    //             'The camera or audio capture application is currently serving another capture request.';
    //           break;
    //         case CaptureError.CAPTURE_INVALID_ARGUMENT:
    //           errObj.textStatus =
    //             'Invalid use of the API (e.g., the value of limit is less than one).';
    //           break;
    //         case CaptureError.CAPTURE_NO_MEDIA_FILES:
    //           // errObj.textStatus = 'The user exits the camera or audio capture application before capturing anything.';
    //           return;
    //         case CaptureError.CAPTURE_PERMISSION_DENIED:
    //           // errObj.textStatus = 'The user denied a permission required to perform the given capture request.';
    //           return;
    //         case CaptureError.CAPTURE_NOT_SUPPORTED:
    //           errObj.textStatus =
    //             'The requested capture operation is not supported.';
    //           break;
    //       }
    //       reject(errObj);
    //     },
    //     {
    //       quality: 0,
    //     },
    //   );
    // });
  }
}