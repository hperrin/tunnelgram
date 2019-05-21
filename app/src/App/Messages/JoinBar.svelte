<script>
  import ErrHandler from '../../ErrHandler';

  export let conversation;
  let joining = false;

  $: showJoin = conversation && conversation.canUserJoin();

  async function join() {
    joining = true;
    try {
      await conversation.join();
      conversation = conversation;
    } catch (errObj) {
      ErrHandler(errObj);
    }
    joining = false;
  }
</script>

<form on:submit|preventDefault={join}>
  <div class="d-flex justify-content-between align-items-center border-dark border-top">
    {#if showJoin}
      <div class="alert alert-info m-0" style="flex-grow: 1;">
        If you'd like to post in this channel, you can join it.
      </div>
      <button class="btn btn-lg btn-primary" style="width: 60px; min-width: 60px;" type="submit" disabled={joining} title="Join channel">
        Join
      </button>
    {:else}
      <div class="alert alert-info m-0" style="flex-grow: 1;">
        You can't post in this channel unless you are added by an admin.
      </div>
    {/if}
  </div>
</form>
