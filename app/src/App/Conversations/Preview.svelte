<div class="d-flex w-100 justify-content-center align-items-center">
  <div
    class="d-flex justify-content-center align-items-center flex-wrap"
    style="width: 60px; height: 60px;"
  >
    {#each avatarUsersAndWidth.users as user (user.guid)}
      <Avatar bind:user size={avatarUsersAndWidth.width} />
    {/each}
  </div>
  <div class="pl-2" style="width: calc(100% - 60px);">
    <div class="d-flex w-100 justify-content-between align-items-start">
      <h5 class="mb-0" style="word-break: break-word;">
        {conversation.$getName($settings)}
      </h5>
      <small class="ml-1" title={longModifiedDate} style="white-space: nowrap;">
        {modifiedDate}
      </small>
    </div>
    <div class="d-flex w-100 justify-content-between align-items-end">
      {#if conversation.lastMessage}
        <small class="last-message">
          {#if conversation.lastMessage.$decrypted.text != null}
            {conversation.lastMessage.$decrypted.text}
          {:else if conversation.lastMessage.$decrypted.images.length === 1}
            [A photo]
          {:else if conversation.lastMessage.$decrypted.images.length > 1}
            [Photos]
          {:else if conversation.lastMessage.$decrypted.video !== null}
            [A video]
          {/if}
        </small>
      {:else}
        <span style="display: inline-block;" />
      {/if}
      {#if unreadCount === 0}
        <span style="display: inline-block;" />
      {:else}
        <span class="badge badge-primary">
          {unreadCount === true ? 'New' : unreadCount}
        </span>
      {/if}
    </div>
  </div>
</div>

<script>
  import { onMount, onDestroy } from 'svelte';
  import Avatar from '../Users/Avatar';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import { SimpleDateFormatter } from '../../Services/SimpleDateFormatter';
  import ErrHandler from '../../ErrHandler';
  import { settings, user } from '../../stores';

  export let conversation = new Conversation();
  let unreadCount = 0;
  let modifiedDate;
  let longModifiedDate;
  let interval;
  let destroyed = false;

  $: isOwner = $user.$is(conversation.user);
  $: avatarUsersAndWidth = (() => {
    let users;
    if (!conversation.acFull) {
      users = [];
    } else if (conversation.acFull.length === 1) {
      users = conversation.acFull;
    } else {
      users = conversation.acFull.filter(u => !$user.$is(u));
    }
    let i = 1;
    while (i ** 2 < users.length) {
      i++;
    }
    const width = Math.floor(60 / i);
    return { users, width };
  })();

  $: if (conversation) {
    updateTime();
    (async () => {
      unreadCount = await conversation.$unreadCount();
    })();
  }

  $: if (
    conversation &&
    conversation.$containsSleepingReference &&
    !conversation.$tgCalledReadyAll
  ) {
    // Ready the conversation's referenced entities.
    if (
      conversation.$containsSleepingReference &&
      !conversation.$tgCalledReadyAll
    ) {
      conversation.$tgCalledReadyAll = true;
      conversation.$readyAll(1).then(() => {
        conversation.$containsSleepingReference = false;
        conversation.$tgCalledReadyAll = false;
        if (!destroyed) {
          conversation = conversation;
        }
      }, ErrHandler);
    }
  }

  $: if (
    conversation &&
    conversation.lastMessage &&
    !conversation.lastMessage.$cryptReady
  ) {
    conversation.lastMessage.$cryptReadyPromise.then(
      () => (conversation = conversation),
    );
  }

  onMount(() => {
    interval = window.setInterval(() => updateTime(), 10000);
    updateTime();
  });

  onDestroy(() => {
    destroyed = true;
    if (interval) {
      clearInterval(interval);
    }
  });

  function updateTime() {
    modifiedDate = new SimpleDateFormatter(
      Math.min(conversation.mdate, +new Date() / 1000),
    ).format('ago', 'short');
    longModifiedDate = new SimpleDateFormatter(conversation.mdate).format(
      'wymdhms',
      'short',
    );
  }
</script>

<style>
  .last-message {
    max-width: 100%;
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
