<div class="d-flex flex-column align-items-center p-3">
  <div class="d-flex flex-column justify-content-start w-std-page">
    {#if currentUserIsAdmin}
      <h3 class="mt-3">Add Someone</h3>
      <p>
        {#if $conversation.data.mode === Conversation.MODE_CHAT}
          New people can only see messages sent after you add them.
        {:else if $conversation.data.mode === Conversation.MODE_CHANNEL_PRIVATE}
          New members can see all past messages in this channel.
        {/if}
      </p>
      <UserSearchSelector bind:this={userSearchSelector} className="d-block" disabled={addingUser} on:user-selected={event => addUser(event.detail)} />
      {#if addUserError != null}
        <div class="alert alert-danger mt-3 mb-0" role="alert">
          {addUserError}
        </div>
      {/if}
    {/if}
    <h3 class="mt-3">
      {#if $conversation.data.mode === Conversation.MODE_CHAT}
        People in this Chat
      {:else}
        Channel Admins
      {/if}
    </h3>
    <div class="list-group mt-3 text-body">
      {#each $conversation.data.acFull as curUser (curUser.guid)}
        <a class="list-group-item d-flex justify-content-between align-items-center" href="/#/u/{curUser.data.username}">
          <span class="d-flex align-items-center">
            <span class="mr-2" style="line-height: 0;">
              <Avatar bind:user={curUser} />
            </span>
            <DisplayName bind:user={curUser} /> ({curUser.data.username})
          </span>
          {#if $user.guid === curUser.guid}
            <span>(You)</span>
          {/if}
        </a>
      {/each}
    </div>
    {#if $conversation.data.mode !== Conversation.MODE_CHAT}
      <h3 class="mt-3">Channel Members</h3>
      <div class="list-group mt-3 text-body">
        {#each nonAdminChannelUsers as curUser (curUser.guid)}
          <span class="list-group-item d-flex justify-content-between align-items-center">
            <a class="d-flex align-items-center" href="/#/u/{curUser.data.username}">
              <span class="mr-2" style="line-height: 0;">
                <Avatar bind:user={curUser} />
              </span>
              <DisplayName bind:user={curUser} /> ({curUser.data.username})
            </a>
            {#if $user.guid === curUser.guid}
              <span>(You)</span>
            {:else if currentUserIsAdmin}
              <span>
                <button class="btn btn-primary btn-sm" disabled={addingUser || removingChannelUser} on:click|preventDefault={() => confirm('Are you sure you want to promote this member to admin?') && addAcFullUser(curUser)}>
                  Make Admin
                </button>
                <button class="btn btn-danger btn-sm" title="Remove user" disabled={removingChannelUser} on:click|preventDefault={() => removeChannelUser(curUser)}>
                  <i class="fas fa-minus"></i>
                </button>
              </span>
            {/if}
          </span>
        {/each}
      </div>
      {#if !nonAdminChannelUsers.length && !channelUsersLoading}
        <div class="mt-3">No regular members.</div>
      {/if}
      {#if channelUsersLoading}
        <div class="mt-3">One second...</div>
      {/if}
      {#if !channelUsersReachedEnd}
        <button type="button" class="btn btn-light mt-3 w-100" disabled={channelUsersLoading} on:click={loadMoreChannelUsers}>Show More</button>
      {/if}
    {/if}
  </div>
</div>

<script>
  import UserSearchSelector from '../Users/UserSearchSelector';
  import Avatar from '../Users/Avatar';
  import DisplayName from '../Users/DisplayName';
  import {navigate} from '../../Services/router';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import ErrHandler from '../../ErrHandler';
  import {conversation, user} from '../../stores';

  const CHANNEL_USERS_PAGE_SIZE = 15;

  let addingUser = false;
  let addUserError = null;
  let removingChannelUser = false;
  let userSearchSelector;
  let channelUsers = [];
  let channelUsersLoading = false;
  let channelUsersReachedEnd = false;

  $: currentUserIsAdmin = $conversation.data.mode === Conversation.MODE_CHAT || $user.inArray($conversation.data.acFull);
  $: nonAdminChannelUsers = channelUsers.filter(user => !user.inArray($conversation.data.acFull));

  $: if ($conversation && $conversation.containsSleepingReference && !$conversation._tgCalledReadyAll) {
    // Ready the conversation's referenced entities.
    $conversation._tgCalledReadyAll = true;
    $conversation.readyAll(1).then(() => {
      $conversation.containsSleepingReference = false;
      $conversation._tgCalledReadyAll = false;
      $conversation = $conversation;
    }, ErrHandler);
  }

  let oldConversation = null;
  $: if (oldConversation !== $conversation) {
    oldConversation = $conversation;
    channelUsers = [];
    channelUsersLoading = false;
    channelUsersReachedEnd = false;
    loadMoreChannelUsers();
  }

  async function addUser (user) {
    if ($conversation.data.mode === Conversation.MODE_CHAT) {
      addAcFullUser(user);
    } else {
      try {
        addUserError = null;
        addingUser = true;
        await $conversation.addChannelUser(user);
        channelUsers = [...channelUsers, user];
        userSearchSelector.clear();
        userSearchSelector.focus();
      } catch (err) {
        addUserError = err.message;
      }
      addingUser = false;
    }
  }

  async function removeChannelUser (user) {
    try {
      removingChannelUser = true;
      await $conversation.removeChannelUser(user);
      channelUsers = channelUsers.filter(chUser => !user.is(chUser));
    } catch (errObj) {
      ErrHandler(errObj);
    }
    removingChannelUser = false;
  }

  function addAcFullUser (user) {
    addUserError = null;
    addingUser = false;

    if ($user.is(user)) {
      addUserError = 'You\'re already in this conversation.';
      userSearchSelector.focus();
      return;
    }

    if (user.inArray($conversation.data.acFull)) {
      addUserError = 'They\'re already in this conversation.';
      userSearchSelector.focus();
      return;
    }

    $conversation.data.acFull.push(user);
    $conversation = $conversation;
    addingUser = true;
    $conversation.save().then(() => {
      userSearchSelector.clear();
      userSearchSelector.focus();
    }, ErrHandler).finally(() => addingUser = false);
  }

  async function loadMoreChannelUsers () {
    if ($conversation.data.mode === Conversation.MODE_CHAT || channelUsersReachedEnd) {
      return;
    }

    channelUsersLoading = true;

    let moreUsers;
    try {
      moreUsers = await $conversation.getGroupUsers(
        CHANNEL_USERS_PAGE_SIZE,
        channelUsers.length
      );
    } catch (errObj) {
      ErrHandler(errObj);
      channelUsersLoading = false;
      return;
    }

    // For if the conversation changes mid-ajax.
    if (!channelUsersLoading) {
      return;
    }

    if (moreUsers.length < CHANNEL_USERS_PAGE_SIZE) {
      channelUsersReachedEnd = true;
    }

    channelUsers = [...channelUsers, ...moreUsers];
    channelUsersLoading = false;
  }
</script>
