<span class="{className} rounded-circle d-inline-block" style="width: {size}px; height: {size}px;">
  {#if user.data.avatar}
    <span class="rounded-circle d-flex justify-content-center align-items-center bg-info text-white w-100 h-100" style="background-size: contain; background-image: url({avatarUrl});">&nbsp;</span>
  {:else}
    <span class="rounded-circle d-flex justify-content-center align-items-center bg-info text-white w-100 h-100" style="font-size: {parseFloat(size) * .55}px; line-height: {parseFloat(size) * .55}px; pointer-events: none; user-select: none;">
      {iconLetters}
    </span>
  {/if}
</span>

<script>
  import {settings} from '../../stores';

  export let user;
  export let className = '';
  export let size = '40';

  $: avatarUrl = user.data.avatar && user.data.avatar.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/');
  $: iconLetters = (() => {
    const nickname = ($settings != null && user.guid in $settings.decrypted.nicknames) ? $settings.decrypted.nicknames[user.guid] : null;
    let letters = '';
    if (nickname) {
      const split = nickname.split(' ');
      letters += split[0].substr(0, 1).toUpperCase();
      if (split.length > 1) {
        letters += split.reverse()[0].substr(0, 1).toUpperCase();
      }
    } else if (user.data.nameFirst || user.data.nameLast) {
      letters += user.data.nameFirst.substr(0, 1).toUpperCase();
      letters += user.data.nameLast.substr(0, 1).toUpperCase()
    }
    return letters;
  })();
</script>
