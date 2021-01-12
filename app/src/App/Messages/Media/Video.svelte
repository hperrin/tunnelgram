<div
  class="d-flex flex-wrap justify-content-center bg-secondary text-white"
  style="max-width: 450px; font-size: 1em;"
>
  <div class="d-flex justify-content-center align-items-center">
    {#await thumbnailPromise}
      <LoadingIndicator
        width={resource.thumbnailWidth}
        height={resource.thumbnailHeight}
        text="Decrypting..."
      />
    {:then thumbnail}
      <div>
        {#if loading}
          <LoadingIndicator
            width={resource.thumbnailWidth}
            height={resource.thumbnailHeight}
            text="Decrypting..."
          />
        {:else if source}
          <video
            poster={resource.thumbnailSrc}
            width={resource.thumbnailWidth}
            height={resource.thumbnailHeight}
            title={resource.name}
            controls
            autoplay
            playsinline>
            <source src={source} type={resource.dataType} />
          </video>
        {:else}
          <div
            class="d-flex justify-content-center align-items-center
            position-relative"
            tabindex="0"
            on:click={loadVideo}
            style="cursor: pointer;"
          >
            <i class="fas fa-play-circle position-absolute h1 text-white" />
            <div
              class="imageThumbnail"
              style="background-image: url({resource.thumbnailSrc ||
                ''});
              width: {resource.thumbnailWidth}px; height: {resource.thumbnailHeight}px;"
              title={resource.name}
            />
          </div>
        {/if}
      </div>
    {:catch e}
      <span class="badge badge-warning">error</span>
    {/await}
  </div>
</div>

<script>
  import LoadingIndicator from '../../LoadingIndicator';
  import { crypt } from '../../../Services/EncryptionService';

  export let resource;
  let loading = false;
  let source = null;

  $: thumbnailPromise =
    resource.thumbnail instanceof Uint8Array
      ? Promise.resolve(resource.thumbnail)
      : resource.thumbnail;

  $: if (!resource.thumbnailSrc && !resource.thumbnailSrcPromise) {
    if (resource.thumbnail instanceof Uint8Array) {
      const blob = new Blob([resource.thumbnail], {
        type: resource.thumbnailType,
      });
      const source = URL.createObjectURL(blob);
      resource.thumbnailSrc = source;
    } else {
      resource.thumbnailSrcPromise = resource.thumbnail.then((data) => {
        const blob = new Blob([data], { type: resource.thumbnailType });
        const source = URL.createObjectURL(blob);
        resource.thumbnailSrc = source;
      });
    }
  }

  function loadVideo() {
    loading = true;
    const resourcePromise =
      'promise' in resource.data
        ? resource.data.promise()
        : Promise.resolve(resource.data);
    resourcePromise.then((data) => {
      const blob = new Blob([data], { type: resource.dataType });
      source = URL.createObjectURL(blob);
      loading = false;
    });
  }
</script>

<style>
  .imageThumbnail {
    display: inline-block;
    background-position: center;
    background-size: cover;
  }
</style>
