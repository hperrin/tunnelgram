<script>
  import {onMount} from 'svelte';
  import PhotoSwipe from 'photoswipe/dist/photoswipe.min';
  import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default.min';

  export let items = [];
  export let options = {};
  let photoswipe;
  let pswp;

  onMount(() => {
    const defaultOptions = {
      shareButtons: [
        {id:'download', label:'Download photo', url:'{{raw_image_url}}', download:true}
      ]
    };

    pswp = new PhotoSwipe(
      photoswipe,
      PhotoSwipeUI_Default,
      items,
      Object.assign({}, defaultOptions, options)
    );
  });

  export function listen (event, callback) {
    pswp.listen(event, callback);
  }

  export function invalidateCurrItems () {
    pswp.invalidateCurrItems();
  }

  export function updateSize (value) {
    pswp.updateSize(value);
  }

  export function init () {
    pswp.init();
  }
</script>
<div bind:this={photoswipe} class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="pswp__bg"></div>
  <div class="pswp__scroll-wrap">
    <div class="pswp__container">
      <div class="pswp__item"></div>
      <div class="pswp__item"></div>
      <div class="pswp__item"></div>
    </div>
    <div class="pswp__ui pswp__ui--hidden">
      <div class="pswp__top-bar">
        <div class="pswp__counter"></div>

        <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>
        <button class="pswp__button pswp__button--share" title="Download"></button>
        <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
        <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>

        <div class="pswp__preloader">
          <div class="pswp__preloader__icn">
            <div class="pswp__preloader__cut">
              <div class="pswp__preloader__donut"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
        <div class="pswp__share-tooltip"></div>
      </div>

      <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>
      <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>

      <div class="pswp__caption">
        <div class="pswp__caption__center"></div>
      </div>
    </div>
  </div>
</div>
