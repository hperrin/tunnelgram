<span
  class="{className} rounded-circle d-inline-block position-relative"
  style="width: {size}px; height: {size}px;"
>
  {#if user.avatar}
    <span
      class="rounded-circle d-flex justify-content-center align-items-center
      bg-info text-white w-100 h-100"
      style="background-size: contain; background-image: url({avatarUrl});"
    />
  {:else}
    <span
      class="rounded-circle d-flex justify-content-center align-items-center
      bg-info text-white w-100 h-100"
      style="font-size: {parseFloat(size) * 0.55}px; line-height: {parseFloat(size) * 0.55}px;
      pointer-events: none; user-select: none;"
    >
      {iconLetters}
    </span>
  {/if}
  {#if user.sponsor}
    <span class="position-absolute d-inline-block" style="right: 0; bottom: 0; transform: scale({(size / 40) * .8}); transform-origin: bottom right; color: gold;">
      <i class="fas fa-crown" />
    </span>
  {/if}
</span>

<script>
  import { settings } from '../../stores';

  export let user;
  export let className = '';
  export let size = '40';

  $: avatarUrl =
    user.avatar &&
    user.avatar.replace(
      /^http:\/\/blob:9000\//,
      'http://' + window.location.host.replace(/:\d+$/, '') + ':8082/',
    );
  $: iconLetters = (() => {
    const nickname =
      $settings != null && user.guid in $settings.$decrypted.nicknames
        ? $settings.$decrypted.nicknames[user.guid]
        : null;
    let letters = '';
    if (nickname) {
      const split = nickname.split(' ');
      letters += split[0].substr(0, 1).toUpperCase();
      if (split.length > 1) {
        letters += split
          .reverse()[0]
          .substr(0, 1)
          .toUpperCase();
      }
    } else {
      if (user.nameFirst) {
        letters += user.nameFirst.substr(0, 1).toUpperCase();
      }
      if (user.nameLast) {
        letters += user.nameLast.substr(0, 1).toUpperCase();
      }
    }
    return letters;
  })();
</script>
