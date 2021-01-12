<div class="d-flex flex-column align-items-center p-3">
  <form
    class="d-flex flex-column justify-content-start w-std-page"
    on:submit|preventDefault={save}
  >
    <h3 class="mt-3">
      {Conversation.MODE_SHORT_NAME[$conversation.mode]} Settings
    </h3>
    {#if currentUserIsAdmin}
      <div class="form-group">
        <label for="name">Name</label>
        <input
          type="text"
          class="form-control"
          bind:value={name}
          id="name"
          aria-describedby="nameHelp"
          placeholder="Name"
        />
        <small id="nameHelp" class="form-text text-muted">
          Visible to everyone. Leave blank to use auto-generated name based on
          participants.
        </small>
      </div>
      {#if $conversation.mode === Conversation.MODE_CHANNEL_PUBLIC}
        <div class="form-group">
          <label for="openJoining">Open Joining</label>
          <div>
            <label>
              <input
                type="checkbox"
                bind:checked={openJoining}
                id="openJoining"
              />
              Allow anyone to join and send messages.
            </label>
          </div>
        </div>
      {/if}
      <button type="submit" class="btn btn-primary">Save</button>
    {/if}
  </form>
  {#if $conversation.$isUserJoined()}
    <div class="d-flex flex-column justify-content-start mt-3 w-std-page">
      <div class="alert alert-info">
        If you want to start fresh, you can clear your readline and notification
        settings. Try this if you keep getting notified of new messages here,
        even though you've seen them all.
      </div>
      <button
        type="button"
        class="btn btn-info"
        on:click={clearReadline}
        disabled={clearingReadline}>
        Clear my Readline/Notification Settings
      </button>
    </div>
    <div class="d-flex flex-column justify-content-start mt-3 w-std-page">
      {#if !confirmLeave}
        {#if $conversation.mode === Conversation.MODE_CHAT}
          <div class="alert alert-danger">
            If you leave a chat, all of your messages in it will be deleted. It
            may take a while, so the chat will still be in your list for a bit.
          </div>
        {:else if currentUserIsAdmin && $conversation.acFull.length === 1}
          <div class="alert alert-danger">
            You're the only admin in this channel. If you leave it, it will be
            permanently deleted.
          </div>
        {/if}
        <button
          type="button"
          class="btn btn-danger"
          on:click={showConfirmLeave}
          disabled={leavingConversation}>
          Leave {Conversation.MODE_SHORT_NAME[$conversation.mode]}
        </button>
      {:else}
        <div class="alert alert-danger">Are you sure you want to leave?</div>
        <button
          type="button"
          class="btn btn-danger"
          on:click={leave}
          disabled={leavingConversation}>
          Yes, Leave {Conversation.MODE_SHORT_NAME[$conversation.mode]}
        </button>
      {/if}
    </div>
  {/if}
</div>

<script>
  import { navigate } from '../../Services/router';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import { conversation, user } from '../../stores';

  let name = '';
  let openJoining = false;
  let clearingReadline = false;
  let confirmLeave = false;
  let leavingConversation = false;

  $: currentUserIsAdmin =
    $conversation.mode === Conversation.MODE_CHAT ||
    $user.$inArray($conversation.acFull);

  let previousConversation = null;
  $: if (previousConversation !== $conversation) {
    name = $conversation.$decrypted.name;
    if ($conversation.mode === Conversation.MODE_CHANNEL_PUBLIC) {
      openJoining = $conversation.openJoining;
    }
    previousConversation = $conversation;
  }

  function save() {
    if (name === '') {
      $conversation.$decrypted.name = null;
    } else {
      $conversation.$decrypted.name = name;
    }
    if ($conversation.mode === Conversation.MODE_CHANNEL_PUBLIC) {
      $conversation.openJoining = openJoining;
    }
    $conversation.$save();
    $conversation = $conversation;
  }

  async function clearReadline() {
    clearingReadline = true;
    await $conversation.$clearReadline();
    $conversation = $conversation;
    clearingReadline = false;
  }

  function showConfirmLeave() {
    confirmLeave = true;
  }

  function leave() {
    leavingConversation = true;
    navigate('/c');
    $conversation.$leave();
  }
</script>
