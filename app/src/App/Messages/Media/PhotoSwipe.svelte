<div
  bind:this={photoswipe}
  class="pswp"
  tabindex="-1"
  role="dialog"
  aria-hidden="true"
>
  <div class="pswp__bg" />
  <div class="pswp__scroll-wrap">
    <div class="pswp__container">
      <div class="pswp__item" />
      <div class="pswp__item" />
      <div class="pswp__item" />
    </div>
    <div class="pswp__ui pswp__ui--hidden">
      <div class="pswp__top-bar">
        <div class="pswp__counter" />

        <button class="pswp__button pswp__button--close" title="Close (Esc)" />
        <button class="pswp__button pswp__button--share" title="Download" />
        <button
          class="pswp__button pswp__button--fs"
          title="Toggle fullscreen"
        />
        <button class="pswp__button pswp__button--zoom" title="Zoom in/out" />

        <div class="pswp__preloader">
          <div class="pswp__preloader__icn">
            <div class="pswp__preloader__cut">
              <div class="pswp__preloader__donut" />
            </div>
          </div>
        </div>
      </div>

      <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
        <div class="pswp__share-tooltip" />
      </div>

      <button
        class="pswp__button pswp__button--arrow--left"
        title="Previous (arrow left)"
      />
      <button
        class="pswp__button pswp__button--arrow--right"
        title="Next (arrow right)"
      />

      <div class="pswp__caption">
        <div class="pswp__caption__center" />
      </div>
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';

  export let items = [];
  export let options = {};
  let photoswipe;
  let pswp;

  onMount(() => {
    const defaultOptions = {
      shareButtons: [
        {
          id: 'download',
          label: 'Download photo',
          url: '{{raw_image_url}}',
          download: true,
        },
      ],
    };

    pswp = new Promise(async resolve => {
      const PhotoSwipeImport = import(/* webpackChunkName: "photoswipe" */ 'photoswipe/dist/photoswipe.min');
      const PhotoSwipeUI_DefaultImport = import(/* webpackChunkName: "photoswipe-ui-default" */ 'photoswipe/dist/photoswipe-ui-default.min');

      const PhotoSwipe = (await PhotoSwipeImport).default;
      const PhotoSwipeUI_Default = (await PhotoSwipeUI_DefaultImport).default;

      resolve(new PhotoSwipe(
        photoswipe,
        PhotoSwipeUI_Default,
        items,
        Object.assign({}, defaultOptions, options),
      ));
    });
  });

  export async function listen(event, callback) {
    (await pswp).listen(event, callback);
  }

  export async function invalidateCurrItems() {
    (await pswp).invalidateCurrItems();
  }

  export async function updateSize(value) {
    (await pswp).updateSize(value);
  }

  export async function init() {
    (await pswp).init();
  }
</script>
