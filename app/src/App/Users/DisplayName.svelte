{#if nickname != null}{nickname}{:else}{user[prop] || defaultValue}{/if}

<script>
  import { settings } from '../../stores';

  export let user;
  export let prop = 'name';
  export let defaultValue = 'Loading...';

  $: nickname =
    $settings != null && user.guid in $settings.$decrypted.nicknames
      ? $settings.$decrypted.nicknames[user.guid]
      : null;
</script>
