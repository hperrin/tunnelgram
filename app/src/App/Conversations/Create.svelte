<div class="d-flex flex-column align-items-center p-3">
  <h2 class="btn-group d-flex w-std-page">
    {#each [Conversation.MODE_CHAT, Conversation.MODE_CHANNEL_PRIVATE, Conversation.MODE_CHANNEL_PUBLIC] as mode}
      <button
        class="btn btn-secondary flex-grow-1 {$conversation.data.mode === mode ? 'active' : ''}"
        type="button"
        on:click={() => ($conversation.data.mode = mode)}
        aria-pressed={$conversation.data.mode === mode}
      >
        {Conversation.MODE_NAME[mode]}
      </button>
    {/each}
  </h2>
  {#if $conversation.data.mode === Conversation.MODE_CHANNEL_PRIVATE}
    <p class="alert alert-info m-3 w-std-page">
      Private channels have admins who can add new members and promote other
      members to admin. New members can see past messages. Private channels are
      still end to end encrypted, so only channel members can read what is sent
      in them.
    </p>
  {:else if $conversation.data.mode === Conversation.MODE_CHANNEL_PUBLIC}
    <p class="alert alert-info m-3 w-std-page">
      Public channels have admins who can add new members and promote other
      members to admin. Everyone can search for and view public channels, and
      they are not encrypted.
    </p>
  {/if}
  <form
    class="d-flex flex-column justify-content-start w-std-page"
    on:submit|preventDefault={save}
  >
    {#if $conversation.data.mode !== Conversation.MODE_CHAT}
      <div class="form-group">
        <label for="name">Name</label>
        <input
          type="text"
          class="form-control"
          bind:value={$conversation.decrypted.name}
          id="name"
          placeholder="Name"
        />
      </div>
    {/if}
    {#if $conversation.data.mode === Conversation.MODE_CHANNEL_PUBLIC}
      <div class="form-group">
        <label for="openJoining">Open Joining</label>
        <div>
          <label>
            <input
              type="checkbox"
              bind:checked={$conversation.data.openJoining}
              id="openJoining"
            />
            Allow anyone to join and send messages.
          </label>
        </div>
      </div>
    {/if}
    <h3 class="mt-3">
      Add {$conversation.data.mode === Conversation.MODE_CHAT ? 'People' : 'Channel Admins'}
    </h3>
    <UserSearchSelector
      bind:this={userSearchSelector}
      className="d-block"
      disabled={startingConversation}
      on:user-selected={event => addUser(event.detail)}
    />
    {#if addUserError != null}
      <div class="alert alert-danger mt-3 mb-0" role="alert">
        {addUserError}
      </div>
    {/if}
    <ul class="list-group mt-3 text-body">
      {#each usersOtherThanCurrent as user (user.guid)}
        <li
          class="list-group-item d-flex justify-content-between
          align-items-center"
        >
          <span class="d-flex align-items-center">
            <span class="mr-2" style="line-height: 0;">
              <Avatar bind:user />
            </span>
            <DisplayName bind:user />
          </span>
          <button
            class="btn btn-danger btn-sm"
            title="Remove user"
            on:click={() => removeUser(user)}
          >
            <i class="fas fa-minus" />
          </button>
        </li>
      {/each}
    </ul>
    {#if $conversation.data.mode === Conversation.MODE_CHAT}
      <div>
        {#if existingConversations}
          {#if existingConversations.length}
            <h3 class="mt-3">Your Chats</h3>
            <div class="list-group mt-3 text-body">
              {#each existingConversations as conversation (conversation.guid)}
                <a
                  class="list-group-item list-group-item-action"
                  href="#/c/{conversation.guid}"
                >
                  <Preview bind:conversation />
                </a>
              {/each}
            </div>
            <h5 class="mt-3">Or Start a New One</h5>
          {/if}
          <button
            type="submit"
            class="btn {existingConversations.length ? 'btn-light' : 'btn-primary'}
            mt-3 w-100"
            disabled={startingConversation}
          >
            {usersOtherThanCurrent.length ? 'Start a Chat' : 'Talk to Yourself'}
          </button>
        {:else if existingConversationsError}
          <div class="alert alert-danger my-3" role="alert">
            Oops... something went wrong.
          </div>
          <button
            type="submit"
            class="btn btn-light mt-3 w-100"
            disabled={startingConversation}
          >
            {usersOtherThanCurrent.length ? 'Start a Chat' : 'Talk to Yourself'}
          </button>
        {:else}
          <div>One second...</div>
        {/if}
      </div>
    {:else}
      <button
        type="submit"
        class="btn btn-primary mt-3 w-100"
        disabled={startingConversation}
      >
        Start the Channel
      </button>
    {/if}
  </form>
</div>

<script>
  import { onDestroy } from 'svelte';
  import { Nymph } from 'nymph-client';
  import { User } from 'tilmeld-client';
  import UserSearchSelector from '../Users/UserSearchSelector';
  import Preview from './Preview';
  import Avatar from '../Users/Avatar';
  import DisplayName from '../Users/DisplayName';
  import { navigate } from '../../Services/router';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import ErrHandler from '../../ErrHandler';
  import { conversation, user } from '../../stores';

  let startingConversation = false;
  let addUserError = null;
  let userSearchSelector;
  let existingConversations = null;
  let existingConversationsError = false;
  let destroyed = false;

  $: usersOtherThanCurrent = ($conversation.data.acFull || []).filter(
    u => !$user.is(u),
  );

  let previousConversationAcFullLength = 0;
  $: if (
    $conversation.guid ||
    $conversation.data.mode !== Conversation.MODE_CHAT
  ) {
    existingConversations = null;
    existingConversationsError = false;
    previousConversationAcFullLength = 0;
  } else if (
    previousConversationAcFullLength !== $conversation.data.acFull.length
  ) {
    previousConversationAcFullLength = $conversation.data.acFull.length;
    existingConversations = null;
    existingConversationsError = false;
    (async () => {
      try {
        const conversations = await $conversation.findMatchingConversations();
        await Promise.all(
          conversations.map(conversation =>
            conversation.readyAll(1).catch(ErrHandler),
          ),
        );
        if (destroyed) {
          return;
        }
        existingConversations = conversations;
      } catch (e) {
        if (destroyed) {
          return;
        }
        existingConversations = null;
        existingConversationsError = true;
      }
    })();
  }

  onDestroy(() => {
    destroyed = true;
  });

  function addUser(user) {
    addUserError = null;

    if ($user.is(user)) {
      addUserError = "You're already in conversations you start.";
      userSearchSelector.focus();
      return;
    }

    if (user.inArray($conversation.data.acFull)) {
      addUserError = "Looks like you've already added them.";
      userSearchSelector.focus();
      return;
    }

    $conversation.data.acFull.push(user);
    $conversation = $conversation;
    userSearchSelector.clear();
    userSearchSelector.focus();
  }

  function removeUser(userToRemove) {
    $conversation.set({
      acFull: $conversation.data.acFull.filter(user => !userToRemove.is(user)),
    });
    $conversation = $conversation;
  }

  function save() {
    startingConversation = true;
    $conversation
      .save()
      .then(() => navigate('/c/' + $conversation.guid), ErrHandler)
      .finally(() => {
        startingConversation = false;
      });
  }
</script>
