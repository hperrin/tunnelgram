<form on:submit|preventDefault={newMessage}>
  {#if images.length || video != null || mediaLoading}
    <div
      class="d-flex flex-wrap justify-content-start align-items-start
      position-relative bg-secondary pt-2 pl-2">
      {#each images as image, i}
        <div
          class="d-flex justify-content-center align-items-center mr-2 mb-2
          border border-light position-relative"
          style="width: 152px; height: 152px;">
          <img
            src={image.thumbnailImg}
            alt={image.name}
            title={image.name}
            width={image.thumbnailWidth}
            height={image.thumbnailHeight} />
          {#if image.dataType !== 'image/gif'}
            <button
              type="button"
              class="btn btn-sm btn-info rounded-circle thumbnailOverlay
              thumbnailButton"
              style="left: 4px; top: 4px;"
              on:click={() => rotateImage(i)}
              title="Rotate">
              <i
                class="fas fa-undo fa-flip-horizontal text-white d-inline-block"
                style="width: 1em; height: 1em;" />
            </button>
          {/if}
          <button
            type="button"
            class="btn btn-sm btn-danger rounded-circle thumbnailOverlay
            thumbnailButton"
            style="right: 4px; top: 4px;"
            on:click={() => (images = removeIndex(images, i))}
            title="Remove">
            <i
              class="fas fa-times text-white d-inline-block"
              style="width: 1em; height: 1em;" />
          </button>
          <span
            class="badge badge-light thumbnailOverlay"
            style="left: 4px; bottom: 4px; pointer-events: none;">
            {image.dataWidth}x{image.dataHeight}
          </span>
          <span
            class="badge badge-light thumbnailOverlay"
            style="right: 4px; bottom: 4px; pointer-events: none;">
            {round(image.data.length / 1024 / 1024, 1)}MB
          </span>
        </div>
      {/each}
      {#if video != null}
        <div
          class="d-flex justify-content-center align-items-center mr-auto
          ml-auto mb-2 border border-light position-relative"
          style="min-width: 152px; min-height: 152px;">
          <video
            poster={video.thumbnailImg}
            width={video.thumbnailWidth}
            height={video.thumbnailHeight}
            title={video.name}
            controls>
            <source src={video.objectURL} type={video.dataType} />
          </video>
          <button
            type="button"
            class="btn btn-sm btn-danger rounded-circle position-absolute"
            style="opacity: .8; right: 4px; top: 4px;"
            on:click={() => (video = null)}>
            <i
              class="fas fa-times text-white d-inline-block"
              style="width: 1em; height: 1em;" />
          </button>
          <span
            class="badge badge-light position-absolute"
            style="opacity: .8; left: 4px; bottom: 4px; pointer-events: none;">
            {video.dataWidth}x{video.dataHeight} - {Math.floor(video.dataDuration / 60)}:{padSingleDigits(Math.floor(video.dataDuration % 60))}
          </span>
          <span
            class="badge badge-light position-absolute"
            style="opacity: .8; right: 4px; bottom: 4px; pointer-events: none;">
            {round(video.data.length / 1024 / 1024, 1)}MB
          </span>
        </div>
      {/if}
      {#if mediaLoading === 'image'}
        <div
          class="d-flex justify-content-center align-items-center mr-2 mb-2
          text-white"
          style="width: 152px; height: 152px;">
          <LoadingIndicator width="80" height="80" text="Resampling..." />
        </div>
      {/if}
      {#if mediaLoading === 'video'}
        <div
          class="d-flex justify-content-center align-items-center mr-auto
          ml-auto mb-2 text-white"
          style="width: 152px; height: 152px;">
          <LoadingIndicator
            width="150"
            height="150"
            text={transcoder == null ? 'Loading...' : transcodeProgress == null ? 'Preparing...' : 'Transcoding...' + '\n' + Math.floor(transcodeProgress * 100) + '%'}
            progress={transcodeProgress} />
        </div>
        {#if transcoder != null}
          <button
            type="button"
            class="btn btn-sm btn-danger position-absolute"
            style="opacity: .8; right: 4px; top: 4px;"
            on:click={cancelVideoTranscode}>
            Cancel
          </button>
        {/if}
      {/if}
    </div>
  {/if}
  <div class="d-flex align-items-stretch border-dark border-top">
    <input
      class="d-none"
      type="file"
      bind:this={fileInput}
      on:change={event => handleFiles(event.target.files)}
      accept="image/*, video/*"
      multiple />
    {#if window.inCordova}
      <div
        class="add-media-dropdown btn-group dropup p-0"
        bind:this={addMediaDropdown}>
        <button
          class="btn btn-lg btn-success p-0 d-inline-flex justify-content-center
          align-items-center dropdown-toggle"
          style="width: 60px; min-width: 60px; font-size: .8em;"
          type="button"
          title="Add picture/video"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false">
          <i class="fas fa-camera" />
           / 
          <i class="fas fa-video" />
        </button>
        <div class="dropdown-menu">
          <button
            class="dropdown-item p-3"
            type="button"
            on:click={cordovaCapturePhoto}>
            Take a photo
          </button>
          <button
            class="dropdown-item p-3"
            type="button"
            on:click={cordovaCaptureVideo}>
            Take a video
          </button>
          <div class="dropdown-divider" />
          <button
            class="dropdown-item p-3"
            type="button"
            on:click={() => fileInput.click()}>
            Browse library
          </button>
        </div>
      </div>
    {:else}
      <button
        class="btn btn-lg btn-success p-0 d-inline-flex justify-content-center
        align-items-center"
        style="width: 60px; min-width: 60px; font-size: .8em;"
        type="button"
        on:click={() => fileInput.click()}
        title="Add picture/video">
        <i class="fas fa-camera" />
         / 
        <i class="fas fa-video" />
      </button>
    {/if}
    <textarea
      class="text-editor form-control border-0 text-dark"
      bind:value={text}
      placeholder="New message"
      on:keydown={event => handleKeyDown(event)}
      on:keyup={handleKeyUp}
      bind:this={textEditor} />
    <button
      class="btn btn-lg btn-primary"
      style="width: 60px; min-width: 60px;"
      type="submit"
      disabled={messageIsEmpty || mediaLoading}
      title="Send message">
      <i class="fas fa-comment" />
    </button>
  </div>
</form>

<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import emoji from 'node-emoji';
  import PNotify from 'pnotify/dist/es/PNotify';
  import Message from '../../Entities/Tunnelgram/Message';
  import LoadingIndicator from '../LoadingIndicator';
  import { Dropdown } from '../../Services/Val/BSN';
  import { crypt } from '../../Services/EncryptionService';
  import { EditImageService } from '../../Services/EditImageService';
  import { VideoService } from '../../Services/VideoService';
  import ErrHandler from '../../ErrHandler';
  import { brand } from '../../stores';

  const dispatch = createEventDispatcher();
  const mobile = (() => {
    let check = false;
    (function(a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          a,
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substr(0, 4),
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  })();
  const removeIndex = (arr, i) => {
    arr.splice(i, 1);
    return arr;
  };
  const round = (value, precision) =>
    Number.parseFloat(value.toFixed(precision));
  const padSingleDigits = digits => (digits < 10 ? '0' + digits : digits);

  export let conversation;
  export let text = '';
  export let images = [];
  export let video = null;
  let mediaLoading = false;
  let transcoder = null;
  let transcodeProgress = null;
  let destroyed = false;
  let textEditor;
  let fileInput;

  $: messageIsEmpty =
    (text === '' || text.match(/^\s+$/)) && !images.length && video == null;

  let addMediaDropdown;
  let addMediaDropdownComponent;
  $: if (addMediaDropdown && !addMediaDropdownComponent) {
    addMediaDropdownComponent = new Dropdown(addMediaDropdown);
  } else if (!addMediaDropdown && addMediaDropdownComponent) {
    addMediaDropdownComponent = null;
  }

  onDestroy(() => {
    destroyed = true;
    if (transcoder != null) {
      cancelVideoTranscode();
    }
  });

  function handleKeyDown(event) {
    if (event.keyCode === 13 && !mobile && !event.shiftKey) {
      event.preventDefault();
      newMessage();
    }
  }

  function handleKeyUp(event) {
    const emojied = emoji.emojify(text);
    if (emojied !== text) {
      text = emojied;
    }
  }

  function newMessage() {
    if (messageIsEmpty) {
      return;
    }

    const message = new Message();
    message.decrypted.text = text === '' || text.match(/^\s+$/) ? null : text;
    message.decrypted.images = images;
    message.decrypted.video = video;
    message.set({ conversation });

    conversation.pending.push(message);

    const removePending = () => {
      const idx = message.arraySearch(conversation.pending);
      if (idx !== false) {
        conversation.pending.splice(idx, 1);

        if (!destroyed) {
          conversation = conversation;
        }
      }
    };

    message.retrySave = () =>
      message.save(true).then(removePending, ErrHandler);
    message.cancelSave = removePending;
    message.save().then(removePending, ErrHandler);

    conversation = conversation;
    text = '';
    images = [];
    video = null;
    // Scroll to the bottom when the user adds a pending message.
    dispatch('scrollToBottom');
    focus();
  }

  function focus() {
    if (textEditor) {
      textEditor.focus();
    }
  }

  async function rotateImage(index) {
    // Read the image and thumbnail into Images to rotate them.
    const imageData = new Image();
    let resolveData;
    const pData = new Promise(r => (resolveData = r));
    imageData.onload = () => resolveData();
    imageData.src = images[index].dataImg;
    const imageThumbnail = new Image();
    let resolveThumbnail;
    const pThumbnail = new Promise(r => (resolveThumbnail = r));
    imageThumbnail.onload = () => resolveThumbnail();
    imageThumbnail.src = images[index].thumbnailImg;

    await Promise.all([pData, pThumbnail]);

    let rotateData = new EditImageService(imageData, images[index].dataType);
    let rotateThumbnail = new EditImageService(
      imageThumbnail,
      images[index].thumbnailType,
    );

    let dataImg = rotateData.rotate();
    let thumbnailImg = rotateThumbnail.rotate();

    rotateData.destroy();
    rotateThumbnail.destroy();

    const dataMatch = dataImg.match(/^data:(image\/\w+);base64,(.*)$/);
    const data = crypt.decodeBase64(dataMatch[2]);
    const thumbnailMatch = thumbnailImg.match(
      /^data:(image\/\w+);base64,(.*)$/,
    );
    const thumbnail = crypt.decodeBase64(thumbnailMatch[2]);

    images[index] = Object.assign({}, images[index], {
      dataWidth: images[index].dataHeight,
      dataHeight: images[index].dataWidth,
      data,
      dataImg,
      thumbnailWidth: images[index].thumbnailHeight,
      thumbnailHeight: images[index].thumbnailWidth,
      thumbnail,
      thumbnailImg,
    });
  }

  function cordovaCapturePhoto() {
    navigator.camera.getPicture(
      imageURI => {
        window.resolveLocalFileSystemURL(imageURI, entry => {
          entry.file(async file => {
            file.localURL = imageURI;
            const lfile = imageURI.toLowerCase();
            if (lfile.endsWith('.png')) {
              file.type = 'image/png';
            } else if (lfile.endsWith('.gif')) {
              file.type = 'image/gif';
            } else if (lfile.endsWith('.jpeg') || lfile.endsWith('.jpg')) {
              file.type = 'image/jpeg';
            } else {
              file.type = '';
            }
            await handleFiles([file]);
            navigator.camera.cleanup();
          });
        });
      },
      err => {
        // TODO: Error handling.
      },
      {
        correctOrientation: true,
        saveToPhotoAlbum: false,
      },
    );
  }

  function cordovaCaptureVideo() {
    navigator.device.capture.captureVideo(
      mediaFiles => {
        window.resolveLocalFileSystemURL(mediaFiles[0].localURL, entry => {
          entry.file(file => {
            file.type = mediaFiles[0].type;
            file.localURL = entry.toURL();
            handleFiles([file]);
          });
        });
      },
      err => {
        const errObj = {
          textStatus: '',
        };
        switch (err.code) {
          case CaptureError.CAPTURE_INTERNAL_ERR:
            errObj.textStatus =
              'The camera or microphone failed to capture image or sound.';
            break;
          case CaptureError.CAPTURE_APPLICATION_BUSY:
            errObj.textStatus =
              'The camera or audio capture application is currently serving another capture request.';
            break;
          case CaptureError.CAPTURE_INVALID_ARGUMENT:
            errObj.textStatus =
              'Invalid use of the API (e.g., the value of limit is less than one).';
            break;
          case CaptureError.CAPTURE_NO_MEDIA_FILES:
            // errObj.textStatus = 'The user exits the camera or audio capture application before capturing anything.';
            return;
          case CaptureError.CAPTURE_PERMISSION_DENIED:
            // errObj.textStatus = 'The user denied a permission required to perform the given capture request.';
            return;
          case CaptureError.CAPTURE_NOT_SUPPORTED:
            errObj.textStatus =
              'The requested capture operation is not supported.';
            break;
        }
        ErrHandler(errObj);
      },
      {
        quality: 0,
      },
    );
  }

  export async function handleFiles(files) {
    let imageCount = 0;
    const currentImageCount = images.length;

    if (video) {
      PNotify.notice({
        title: 'Whoa There',
        text:
          "You've already got a video pending. Send it or delete it before you add something else.",
      });
      return;
    }

    for (var i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith('video/')) {
        if (currentImageCount + imageCount > 0) {
          PNotify.notice({
            title: 'Images or Video',
            text: 'You gotta pick one.',
          });
          continue;
        }

        mediaLoading = 'video';
        transcoder = null;
        transcodeProgress = null;

        // Read the video into a temporary video element to check it and
        // generate a thumbnail.
        const videoElem = document.createElement('video');
        const tempObjectURL = file.localURL || URL.createObjectURL(file);
        let resolve;
        let p = new Promise(r => (resolve = r));
        videoElem.onloadeddata = () => resolve();
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          videoElem.autoplay = true;
        }
        videoElem.setAttribute('playsinline', '');
        videoElem.setAttribute('webkit-playsinline', '');
        videoElem.src = tempObjectURL;
        await p;
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          videoElem.pause();
        }

        // Make sure it's valid.
        if (
          !videoElem.videoWidth ||
          !videoElem.videoHeight ||
          !videoElem.duration
        ) {
          PNotify.notice({
            title: 'Unreadable',
            text: "Your browser can't read the video stream from this file.",
          });
          mediaLoading = false;
          break;
        }

        // Now read the video fully into memory.
        const reader = new FileReader();
        p = new Promise(r => (resolve = r));
        if (window.inCordova) {
          reader.onloadend = () => resolve(reader.result);
        } else {
          reader.onload = e => resolve(e.target.result);
        }
        reader.readAsArrayBuffer(file);

        let data;
        const result = await p;

        // Does the video need to be transcoded?
        let transcoded = false;
        if (file.type === 'video/mp4' && file.size < 20971520) {
          data = new Uint8Array(result);
        } else {
          transcoded = true;
          PNotify.info({
            title: 'Transcoding',
            text:
              file.size < 20971520
                ? 'Your video is formatted as ' +
                  file.type +
                  '. It needs to be transcoded to video/mp4 to work on all devices. This may take a while.'
                : "Your video is over 20MB (MiB). It needs to be transcoded to a smaller size. This will take over an hour, and it may be clipped if it's too big.",
          });
          try {
            transcoder = new VideoService();
            data = await transcoder.transcode(
              new Uint8Array(result),
              videoElem.duration,
              progress => (transcodeProgress = progress),
            );
          } catch (err) {
            PNotify.error({
              title: 'Transcoding Failed',
              text: err,
            });
            mediaLoading = false;
            transcoder = null;
            transcodeProgress = null;
            return;
          }
        }

        const blob = new Blob([data], { type: 'video/mp4' });
        const objectURL = URL.createObjectURL(blob);

        if (transcoded) {
          // Reload the transcoded video to get a proper thumbnail.
          let resolve;
          const p = new Promise(r => (resolve = r));
          videoElem.onloadeddata = () => resolve();
          videoElem.src = objectURL;
          await p;
        }

        let dataType = 'video/mp4';
        let resizeImage = new EditImageService(videoElem, 'image/jpeg');
        const thumbnailImg = await resizeImage.resizeContain(300, 300);
        resizeImage.destroy();
        const thumbnailMatch = thumbnailImg.data.match(
          /^data:(image\/\w+);base64,(.*)$/,
        );
        const thumbnailType = thumbnailMatch[1];
        const thumbnail = crypt.decodeBase64(thumbnailMatch[2]);

        video = {
          name: file.name + (transcoded ? '-transcoded.mp4' : ''),
          dataType,
          dataWidth: '' + videoElem.videoWidth,
          dataHeight: '' + videoElem.videoHeight,
          dataDuration: '' + videoElem.duration,
          data,
          thumbnailType,
          thumbnailWidth: '' + thumbnailImg.width,
          thumbnailHeight: '' + thumbnailImg.height,
          thumbnail,
          thumbnailImg: thumbnailImg.data,
          objectURL,
        };
        images = [];
        mediaLoading = false;
        transcoder = null;
        transcodeProgress = null;

        break;
      } else if (!file.type.startsWith('image/')) {
        PNotify.notice({
          title: 'Only Images/Video',
          text:
            'Right now, ' +
            $brand +
            ' only supports images and videos. You tried to add: ' +
            file.type,
        });
      } else if (currentImageCount + imageCount === 9) {
        PNotify.notice({
          title: 'Max Images Reached',
          text: 'You can put up to 9 images into a message.',
        });
        break;
      } else if (file.type === 'image/gif' && file.size > 2097152) {
        PNotify.notice({
          title: 'GIF is Too Big',
          text: 'Sorry, but GIFs can only be up to 2 MB.',
        });
      } else {
        mediaLoading = 'image';
        imageCount++;

        // Read the image into an Image to resize it and generate a
        // thumbnail.
        const imageElem = new Image();
        const tempObjectURL = file.localURL || URL.createObjectURL(file);
        let resolve;
        let p = new Promise(r => (resolve = r));
        imageElem.onload = () => resolve();
        imageElem.src = tempObjectURL;
        await p;

        let dataImg;
        let dataType;
        let data;
        let resizeImage = new EditImageService(imageElem, file.type);
        let thumbnailImg = await resizeImage.resizeContain();
        let thumbnailType;
        let thumbnail;
        if (file.type === 'image/gif') {
          // Read the gif into memory.
          const reader = new FileReader();
          p = new Promise(r => (resolve = r));
          if (window.inCordova) {
            reader.onloadend = () => resolve(reader.result);
          } else {
            reader.onload = e => resolve(e.target.result);
          }
          reader.readAsArrayBuffer(file);

          const result = await p;

          data = new Uint8Array(result.slice(0));
          dataType = file.type;
          dataImg = {
            data: 'data:' + file.type + ';base64,' + crypt.encodeBase64(data),
            width: imageElem.naturalWidth,
            height: imageElem.naturalHeight,
          };
          // The thumbnail should be the same as the image, just with a scaled
          // down width and height.
          thumbnail = new Uint8Array(result.slice(0));
          thumbnailType = file.type;
          thumbnailImg.data = dataImg.data;
        } else {
          let size = 3000;
          let dataMatch;
          do {
            // Resize the image repeatedly down until the size is under 2MiB.
            dataImg = await resizeImage.resizeContain(size, size);
            dataMatch = dataImg.data.match(/^data:(image\/\w+);base64,(.*)$/);
            dataType = dataMatch[1];
            data = crypt.decodeBase64(dataMatch[2]);
            size -= 200;
          } while (data.length >= 2097152);
          const thumbnailMatch = thumbnailImg.data.match(
            /^data:(image\/\w+);base64,(.*)$/,
          );
          thumbnailType = thumbnailMatch[1];
          thumbnail = crypt.decodeBase64(thumbnailMatch[2]);
        }
        resizeImage.destroy();

        images = [
          ...images,
          {
            name: file.name,
            dataType,
            dataWidth: '' + dataImg.width,
            dataHeight: '' + dataImg.height,
            data,
            dataImg: dataImg.data,
            thumbnailType,
            thumbnailWidth: '' + thumbnailImg.width,
            thumbnailHeight: '' + thumbnailImg.height,
            thumbnail,
            thumbnailImg: thumbnailImg.data,
          },
        ];
        video = null;

        imageCount--;
        if (imageCount === 0) {
          mediaLoading = false;
        }
      }
    }
  }

  function cancelVideoTranscode() {
    if (transcoder) {
      transcoder.cancel();
    }
    mediaLoading = false;
    transcoder = null;
    transcodeProgress = null;
  }
</script>

<style>
  .add-media-dropdown .dropdown-toggle:after {
    display: none;
  }
  .add-media-dropdown .dropdown-menu {
    width: 100vw;
    max-width: 520px;
  }

  .text-editor:focus {
    box-shadow: none;
  }
  .thumbnailOverlay {
    position: absolute;
    opacity: 0.7;
  }
  .thumbnailButton {
    font-size: 0.7em;
    padding: 0;
    width: 2.2em;
    height: 2.2em;
  }
</style>
