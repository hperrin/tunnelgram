<div
  class="h-100 w-100"
  style="overflow-y: auto; -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;"
>
  <div class="d-flex flex-column align-items-center p-3">
    <div class="d-flex justify-content-center flex-wrap w-100">
      <div class="d-inline-block position-relative m-3">
        {#if $viewUserIsSelf}
          <input
            class="d-none"
            type="file"
            bind:this={avatarInput}
            on:change={(event) => handleAvatar(event.target.files)}
          />
          <button
            class="position-absolute btn btn-primary btn-sm rounded"
            on:click={() => avatarInput.click()}
            style="left: 0; bottom: 0; z-index: 1;">
            <i class="fas fa-upload fa-2x" />
          </button>
        {/if}
        {#if avatarLoading}
          <div
            class="d-flex position-absolute h-100 w-100 justify-content-center
            align-items-center"
          >
            <LoadingIndicator width="160" height="160" />
          </div>
        {/if}
        <Avatar bind:user={$viewUser} size="160" />
      </div>
      <div class="m-3">
        <canvas bind:this={code} />
      </div>
    </div>
    <h2>{$viewUser.name}</h2>
    <div>
      {$viewUser.username}, member since {new SimpleDateFormatter(
        $viewUser.cdate,
      ).format('ymd', 'short')}
    </div>
    <div>
      <button class="btn btn-link" title="Share" on:click={shareShortLink}>
        {shortLinkPreview}
        <i class="fas fa-share" />
      </button>
    </div>
    {#if $viewUser.sponsor}
      <h3>{$viewUserIsSelf ? "You're a Sponsor!" : "They're a sponsor!"}</h3>
    {/if}

    <div class="d-flex flex-column justify-content-start w-std-page">
      {#if !$viewUserIsSelf}
        <div class="form-group">
          <label for="viewUserNickname">Nickname</label>
          <div class="d-flex">
            <input
              type="text"
              class="form-control flex-grow-1"
              id="viewUserNickname"
              bind:value={nickname}
              aria-describedby="viewUserNicknameHelp"
              placeholder="Enter nickname"
              autocomplete="nickname"
            />
            <button
              type="button"
              class="btn btn-primary ml-2"
              style="width: 100px;"
              on:click={saveSettings}> Save </button>
          </div>
          <small id="viewUserNicknameHelp" class="form-text text-muted">
            Only visible to you.
          </small>
        </div>
      {/if}

      {#if $viewUserIsSelf}
        <div class="form-group">
          <label for="accountDetailsUsername">Username</label>
          <input
            type="text"
            class="form-control"
            id="accountDetailsUsername"
            bind:value={$viewUser.username}
            placeholder="Enter username"
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="accountDetailsFirstName">First name</label>
          <input
            type="text"
            class="form-control"
            id="accountDetailsFirstName"
            bind:value={$viewUser.nameFirst}
            placeholder="Enter name"
            autocomplete="given-name"
          />
        </div>
        <div class="form-group">
          <label for="accountDetailsLastName">Last name</label>
          <input
            type="text"
            class="form-control"
            id="accountDetailsLastName"
            bind:value={$viewUser.nameLast}
            placeholder="Enter name"
            autocomplete="family-name"
          />
        </div>
        <div class="form-group">
          <label for="accountDetailsPhone">Phone</label>
          <input
            type="tel"
            class="form-control"
            id="accountDetailsPhone"
            bind:value={$viewUser.phone}
            placeholder="Enter phone number"
            autocomplete="tel"
          />
        </div>
        <div class="form-group">
          <span>Password</span>
          <ChangePassword
            layout="compact"
            classInput="form-control"
            classSubmit="btn btn-primary"
            classButton="btn btn-secondary"
          />
        </div>
        <div class="dropdown" bind:this={experimentsDropdown}>
          <button
            class="btn btn-secondary dropdown-toggle"
            type="button"
            id="experimentsButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"> Experiments </button>
          <div class="dropdown-menu" aria-labelledby="experimentsButton">
            <!-- <a class="dropdown-item" href="javascript:void(0)" on:click={() => setExperiment('EXPERIMENT_WEB_PUSH', EXPERIMENT_WEB_PUSH = !EXPERIMENT_WEB_PUSH)}><input type="checkbox" checked={EXPERIMENT_WEB_PUSH}> Web Push Notifications</a> -->
            <span class="dropdown-item">No experiments right now.</span>
          </div>
        </div>

        <div class="mt-3">
          <button
            type="button"
            class="btn btn-primary w-100"
            on:click={saveUser}> Save changes </button>
        </div>
      {:else}
        <div>
          {#if existingConversations}
            {#if existingConversations.length}
              <h3 class="mt-3">Your Chats and Channels Together</h3>
              <div class="list-group mt-3 text-body">
                {#each existingConversations as conversation (conversation.guid)}
                  <a
                    class="list-group-item list-group-item-action"
                    href="/c/{conversation.guid}">
                    <Preview bind:conversation />
                  </a>
                {/each}
              </div>
              <h3 class="mt-3">Or Start a New Chat</h3>
            {/if}
            <button
              type="button"
              class="btn {existingConversations.length
                ? 'btn-light'
                : 'btn-primary'}
              mt-3 w-100"
              on:click={newConversation}
              disabled={startingConversation}>
              Start a Chat with {$viewUser.nameFirst}
            </button>
          {:else if existingConversationsError}
            <div class="alert alert-danger my-3" role="alert">
              Oops... something went wrong.
            </div>
            <button
              type="button"
              class="btn btn-light mt-3 w-100"
              on:click={newConversation}
              disabled={startingConversation}>
              Start a Chat with {$viewUser.nameFirst}
            </button>
          {:else}
            <div>One second...</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<script>
  import { onDestroy } from 'svelte';
  import { Nymph } from 'nymph-client';
  import ChangePassword from 'tilmeld-components/src/ChangePassword';
  import QRCode from 'qrcode';
  import { info, notice } from '@pnotify/core';
  import Dropdown from 'bootstrap.native/dist/components/dropdown-native.esm.js';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import Avatar from './Avatar';
  import Preview from '../Conversations/Preview';
  import LoadingIndicator from '../LoadingIndicator';
  import { navigate } from '../../Services/router';
  import { EditImageService } from '../../Services/EditImageService';
  import { getCookieValue } from '../../Services/getCookieValue';
  import { SimpleDateFormatter } from '../../Services/SimpleDateFormatter';
  import ErrHandler from '../../ErrHandler';
  import {
    viewUserIsSelf,
    viewUser,
    user,
    userIsSponsor,
    settings,
    conversation,
    conversations,
    brand,
  } from '../../stores';

  let nickname = '';
  let code;
  let startingConversation = false;
  let avatarLoading = false;
  let avatarInput;
  let existingConversations = null;
  let existingConversationsError = false;
  let destroyed = false;
  // let EXPERIMENT_WEB_PUSH = getCookieValue('EXPERIMENT_WEB_PUSH') === 'true';

  $: shortLink = 'http://tngm.me/' + encodeURIComponent($viewUser.username);
  $: shortLinkPreview = 'tngm.me/' + encodeURIComponent($viewUser.username);

  let previousViewUserGuid = -1;
  $: if ($viewUserIsSelf) {
    existingConversations = null;
    existingConversationsError = false;
  } else if (previousViewUserGuid !== $viewUser.guid) {
    previousViewUserGuid = $viewUser.guid;
    existingConversations = null;
    existingConversationsError = false;
    (async () => {
      try {
        const conversations = await Nymph.getEntities(
          {
            class: Conversation.class,
            sort: 'mdate',
            reverse: true,
          },
          {
            type: '&',
            ref: [['acFull', [$viewUser.guid, $user.guid]]],
          },
        );
        await Promise.all(
          conversations.map((conversation) =>
            conversation.$readyAll(1).catch(ErrHandler),
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

  let previousViewUserGuid2 = null;
  $: if (
    $settings &&
    $viewUser &&
    $viewUser.guid in $settings.$decrypted.nicknames &&
    previousViewUserGuid2 !== $viewUser.guid
  ) {
    nickname = $settings.$decrypted.nicknames[$viewUser.guid];
    previousViewUserGuid2 = $viewUser.guid;
  }

  let experimentsDropdown;
  let experimentsDropdownComponent;
  $: if (experimentsDropdown && !experimentsDropdownComponent) {
    experimentsDropdownComponent = new Dropdown(experimentsDropdown);
  } else if (!experimentsDropdown && experimentsDropdownComponent) {
    experimentsDropdownComponent = null;
  }

  $: if (code && shortLink) {
    QRCode.toCanvas(
      code,
      shortLink,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 6,
        color: {
          dark: '#031926',
          light: '#F7F9F9',
        },
      },
      (error) => {
        if (error) console.error(error);
      },
    );
  }

  onDestroy(() => {
    destroyed = true;
  });

  function saveUser() {
    $viewUser.$save().then((userValue) => {
      $user = userValue;
      $viewUser = userValue;
    }, ErrHandler);
  }

  function saveSettings() {
    if ($settings && $viewUser) {
      if (nickname.match(/^\s*$/)) {
        delete $settings.$decrypted.nicknames[$viewUser.guid];
      } else {
        $settings.$decrypted.nicknames[$viewUser.guid] = nickname;
      }
      $settings.$save().then((settingsValue) => {
        $settings = settingsValue;
        $viewUser = $viewUser;
        $conversation = $conversation;
        $conversations = $conversations;
        $user = $user;
      }, ErrHandler);
    }
  }

  function shareShortLink() {
    const baseText =
      'Message ' + ($viewUserIsSelf ? 'me' : $viewUser.name) + ' on ' + $brand;
    if (navigator.share !== undefined) {
      navigator.share({
        text: baseText,
        url: shortLink,
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = baseText + ' at ' + shortLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      info({
        text: 'Copied to Clipboard',
      });
    }
  }

  function newConversation() {
    const conversation = new Conversation();
    conversation.acFull.push($viewUser);

    startingConversation = true;
    conversation
      .$save()
      .then(() => navigate('/c/' + conversation.guid), ErrHandler)
      .finally(() => {
        startingConversation = false;
      });
  }

  function setExperiment(name, value) {
    document.cookie = `${name}=${value ? 'true' : ''}`;
  }

  async function handleAvatar(files) {
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      notice({
        title: 'Only Image',
        text: 'What are you doing? You can only use an image as an avatar.',
      });
      return;
    }

    avatarLoading = true;

    // Read the image into an Image to resize it and generate a thumbnail.
    const image = new Image();
    const tempObjectURL = URL.createObjectURL(file);
    let resolve;
    const p = new Promise((r) => (resolve = r));
    image.onload = () => resolve();
    image.src = tempObjectURL;
    await p;

    let resizeImage = new EditImageService(image, file.type);
    const avatarImg = await resizeImage.resizeCrop(500, 500);
    resizeImage.destroy();

    $viewUser.avatar = avatarImg.data;

    await $viewUser.$save();

    $viewUser = $viewUser;
    avatarLoading = false;
  }
</script>
