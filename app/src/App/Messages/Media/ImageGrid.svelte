<script>
  import PhotoSwipe from './PhotoSwipe';
  import LoadingIndicator from '../../LoadingIndicator';
  import { crypt } from '../../../Services/EncryptionService';

  export let resources;
  let thumbnailContainer;

  $: thumbnailDimension = Math.min(
    ...resources.map(resource =>
      Math.min(
        parseFloat(resource.thumbnailWidth),
        parseFloat(resource.thumbnailHeight),
      ),
    ),
  );
  $: thumbnailContainerMaxWidthMultiplier = resources.length === 4 ? 2 : 3;
  $: thumbnailPromises = resources.map(resource =>
    resource.thumbnail instanceof Uint8Array
      ? Promise.resolve(resource.thumbnail)
      : resource.thumbnail,
  );

  $: {
    for (let i = 0; i < resources.length; i++) {
      if (!resources[i].thumbnailSrc && !resources[i].thumbnailSrcPromise) {
        if (resources[i].thumbnail instanceof Uint8Array) {
          const blob = new Blob([resources[i].thumbnail], {
            type: resources[i].thumbnailType,
          });
          const _source = URL.createObjectURL(blob);
          resources[i].thumbnailSrc = _source;
        } else {
          resources[i].thumbnailSrcPromise = resources[i].thumbnail.then(
            data => {
              const blob = new Blob([data], {
                type: resources[i].thumbnailType,
              });
              const _source = URL.createObjectURL(blob);
              resources[i].thumbnailSrc = _source;
            },
          );
        }
      }
    }
  }

  function getThumbnailDimensions(width, height) {
    const multiplier = thumbnailDimension / Math.min(width, height);
    return {
      width: multiplier * width,
      height: multiplier * height,
    };
  }

  function showBigImage(index) {
    let items = resources.map(resource => {
      return {
        w: resource.dataWidth,
        h: resource.dataHeight,
        src: resource.thumbnailSrc,
        _loading: false,
        _resource: resource,
      };
    });

    let options = {
      index,
      history: false,
      showHideOpacity: true,
      getThumbBoundsFn: index => {
        const rect = thumbnailContainer.children[index].getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width };
      },
    };

    // Initializes and opens PhotoSwipe.
    const pswp = new PhotoSwipe({
      target: document.body,
      props: { items, options },
    });

    pswp.listen('gettingData', function(index, item) {
      if (item._loading) {
        return;
      }
      item._loading = true;
      const resourcePromise =
        'promise' in item._resource.data
          ? item._resource.data.promise()
          : Promise.resolve(item._resource.data);
      resourcePromise.then(data => {
        const blob = new Blob([data], { type: item._resource.dataType });
        const _source = URL.createObjectURL(blob);
        item.src = _source;
        // Sets a flag that slides should be updated.
        pswp.invalidateCurrItems();
        // Updates the content of slides.
        pswp.updateSize(true);
      });
    });

    pswp.listen('destroy', function() {
      pswp.$destroy();
    });

    pswp.init();
  }
</script>

<style>
  .imageThumbnail {
    display: inline-block;
    background-position: center;
    background-size: cover;
  }
</style>

<div
  bind:this={thumbnailContainer}
  class="d-flex flex-wrap justify-content-center bg-secondary text-white"
  style="max-width: {thumbnailDimension * thumbnailContainerMaxWidthMultiplier}px;
  font-size: 1em;">
  {#each resources as resource, index (resource.name)}
    <div class="d-flex justify-content-center align-items-center">
      {#await thumbnailPromises[index]}
        <LoadingIndicator
          width={thumbnailDimension}
          height={thumbnailDimension}
          text="Decrypting..." />
      {:then thumbnail}
        <a
          href="javascript:void(0)"
          on:click={() => showBigImage(index)}
          style="font-size: 0;">
          <div
            class="imageThumbnail"
            style="background-image: url({resource.thumbnailSrc || ''});
            background-size: {getThumbnailDimensions(resource.thumbnailWidth, resource.thumbnailHeight).width}px
            {getThumbnailDimensions(resource.thumbnailWidth, resource.thumbnailHeight).height}px;
            width: {thumbnailDimension}px; height: {thumbnailDimension}px;"
            title={resource.name} />
        </a>
      {:catch e}
        <span class="badge badge-warning">error</span>
      {/await}
    </div>
  {/each}
</div>
