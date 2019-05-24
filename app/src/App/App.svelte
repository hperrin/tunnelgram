<script>
  import { onMount } from 'svelte';
  import PNotify from 'pnotify/dist/es/PNotify';
  import 'pnotify/dist/es/PNotifyDesktop';
  import TinyGesture from 'tinygesture';
  import Conversation from '../Entities/Tunnelgram/Conversation';
  import LoadingIndicator from './LoadingIndicator';
  import ConversationList from './Conversations/List';
  import ConversationView from './Conversations/View';
  import NavBar from './NavBar';
  import Avatar from './Users/Avatar';
  import UserView from './Users/View';
  import PushSubscriptionsView from './Users/PushSubscriptionsView';
  import { router, navigate } from '../Services/router';
  import { getCookieValue } from '../Services/getCookieValue';
  import { getDisplayName } from '../Services/getDisplayName';
  import { Dropdown } from '../Services/Val/BSN';
  import ErrHandler from '../ErrHandler';
  import {
    logout,
    disconnected,
    beforeInstallPromptEvent,
    requestNotificationPermission,
    requestPersistentStorage,
    brandWeb,
    convosOut,
    brand,
    user,
    userIsTilmeldAdmin,
    view,
    viewUser,
    conversation,
    loadingConversation,
    loadingUser,
    webPushSubscription,
    settings,
  } from '../stores';

  let hideInstallPrompt = false;
  let hideNotificationPrompt =
    !('Notification' in window) || Notification.permission !== 'default';
  let hidePersistentStoragePrompt = true;

  let menuDropdown;
  let menuDropdownComponent;
  $: if (menuDropdown && !menuDropdownComponent) {
    menuDropdownComponent = new Dropdown(menuDropdown);
  } else if (!menuDropdown && menuDropdownComponent) {
    menuDropdownComponent = null;
  }

  let mainUi;
  let mainUiGesture;
  let convos;
  let convosGesture;
  const onPanMove = (gesture, transform) => {
    if (gesture.animationFrame) {
      return;
    }
    gesture.animationFrame = window.requestAnimationFrame(() => {
      if (gesture.swipingDirection === 'horizontal') {
        mainUi.style.transition = 'none';
        mainUi.style.transform = transform();
        window.requestAnimationFrame(() => {
          mainUi.style.transition = null;
        });
      } else if (mainUi.style.transform != null) {
        mainUi.style.transform = null;
      }
      gesture.animationFrame = null;
    });
  };
  const onPanEnd = gesture => {
    window.cancelAnimationFrame(gesture.animationFrame);
    gesture.animationFrame = null;
    mainUi.style.transition = null;
    mainUi.style.transform = null;
  };
  $: {
    // Initialize swipe gestures.
    if (mainUi && !mainUiGesture) {
      // Set the mainUi width to the proper value.
      mainUi.style.width = '100%';
      mainUiGesture = new TinyGesture(mainUi, { mouseSupport: false });
      mainUiGesture.on('swiperight', () => ($convosOut = true));
      mainUiGesture.on(
        'panmove',
        onPanMove.bind(
          null,
          mainUiGesture,
          () =>
            'translate3d(calc(-100% + ' +
            Math.max(mainUiGesture.touchMoveX, 0) +
            'px), 0, 0)',
        ),
      );
      mainUiGesture.on('panend', onPanEnd.bind(null, mainUiGesture));
    } else if (!mainUi && mainUiGesture) {
      mainUiGesture.destroy();
      mainUiGesture = null;
    }
    if (convos && !convosGesture) {
      convosGesture = new TinyGesture(convos, { mouseSupport: false });
      convosGesture.on('swipeleft', () => ($convosOut = false));
      convosGesture.on(
        'panmove',
        onPanMove.bind(
          null,
          convosGesture,
          () => 'translate3d(' + convosGesture.touchMoveX + 'px, 0, 0)',
        ),
      );
      convosGesture.on('panend', onPanEnd.bind(null, convosGesture));
    } else if (!convos && convosGesture) {
      convosGesture.destroy();
      convosGesture = null;
    }
  }

  onMount(() => {
    if (window.inCordova) {
      window.plugins.OneSignal.userProvidedPrivacyConsent(consent => {
        hideNotificationPrompt = consent;
      });
    }

    (async () => {
      if (navigator.storage && navigator.storage.persist) {
        hidePersistentStoragePrompt = await navigator.storage.persisted();
      }
    })();
  });

  async function notification(update) {
    if (document.hidden && $webPushSubscription) {
      // They will get a push notification.
      return;
    }

    if (update.deleted || !update.data) {
      return;
    }

    const conv = new Conversation();
    conv.init(update.data);

    if (conv.data.lastMessage) {
      if (conv.is($conversation) && !document.hidden) {
        // Don't notify if the user is on the conversation and not hidden.
        return;
      }
      await conv.data.lastMessage.ready();
      if ($user.is(conv.data.lastMessage.data.user)) {
        // Don't notify if the user made the message.
        return;
      }
      if (conv.readline >= conv.data.lastMessage.cdate) {
        // Don't notify when a user deletes a message (will result in earlier message becoming lastMessage).
        return;
      }
      await conv.data.lastMessage.data.user.ready();
    } else if (update.added) {
      if ($user.is(conv.data.user)) {
        // Don't notify if the user made a new conversation.
        return;
      }
      await conv.readyAll(1).catch(ErrHandler);
    } else {
      return;
    }

    let notice;
    let options = {};
    if (document.hidden) {
      // If the tab is hidden, display a desktop notice.
      Object.assign(options, {
        modules: {
          Desktop: {
            desktop: Notification.permission === 'granted',
            icon: false,
          },
        },
      });
    }
    if (conv.data.lastMessage) {
      // Notify the user of a new message.
      notice = PNotify.info(
        Object.assign(
          {
            title:
              getDisplayName(conv.data.lastMessage.data.user, 'name') +
              (conv.data.acFull.length > 2 || conv.data.name != null
                ? ' - ' + conv.getName($settings)
                : ''),
            text:
              conv.data.lastMessage.decrypted.text.length > 40
                ? conv.data.lastMessage.decrypted.text.substr(0, 40) + '...'
                : conv.data.lastMessage.decrypted.text,
          },
          options,
        ),
      );
    } else if (update.added) {
      // Notify the user of a new conversation.
      notice = PNotify.info(
        Object.assign(
          {
            title: 'New ' + Conversation.MODE_SHORT_NAME[conv.data.mode],
            text:
              getDisplayName(conv.data.user, 'name') +
              ' started ' +
              (conv.data.acFull.length > 2 || conv.data.name != null
                ? conv.getName($settings)
                : 'a ' + Conversation.MODE_SHORT_NAME[conv.data.mode]) +
              '.',
          },
          options,
        ),
      );
    }

    notice.on('click', e => {
      let target = e.target;
      while (target.parentNode) {
        if (
          target.classList &&
          target.classList.contains('ui-pnotify-closer')
        ) {
          return;
        }
        target = target.parentNode;
      }
      if (document.hidden) {
        window.focus();
      }
      window.requestAnimationFrame(() => {
        navigate('/c/' + conv.guid);
      });
      notice.close();
    });
  }
</script>

<style>
  .convos {
    width: 100%;
  }
  .main-ui {
    position: absolute;
    left: 100%;
    top: 0;
    bottom: 0;
    z-index: 2;
    transition: transform ease 0.1s;
    transform: translate3d(-100%, 0, 0);
  }
  .convos-out .main-ui {
    transform: translate3d(0, 0, 0);
  }
  @media (min-width: 767.98px) {
    .convos {
      max-width: 330px;
    }
    .main-ui,
    .convos-out .main-ui {
      position: static;
      transform: none;
    }
  }

  .page-name {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  .network-waiting-container {
    display: inline-block;
    width: auto;
    height: 100%;
    margin: 0 0 0 10px;
    perspective: 1000;
    backface-visibility: hidden;
    background: transparent;
  }

  .network-waiting {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1em;
    text-align: center;
    height: 1.5em;
    width: 1.5em;
    color: white;
    border: none;
    border-radius: 50%;
    background: #91b5aa;
    box-shadow: 0 0 0 0 rgba(#91b5aa, 0.5);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.9);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 30px rgba(#91b5aa, 0);
    }
    100% {
      transform: scale(0.9);
      box-shadow: 0 0 0 0 rgba(#91b5aa, 0);
    }
  }
</style>

{#if $disconnected}
  <div
    class="alert alert-warning d-flex justify-content-center align-items-center
    m-0">
    Trying to connect...
    <span class="network-waiting-container">
      <span class="network-waiting">
        <i class="fas fa-wifi" />
      </span>
    </span>
  </div>
{/if}
{#if $beforeInstallPromptEvent && !hideInstallPrompt}
  <div
    class="alert alert-info d-flex justify-content-between align-items-center
    m-0">
    <div>
      Wanna install {$brandWeb} to your device for a native app experience?
      <a
        href="javascript:void(0)"
        on:click={() => (hideInstallPrompt = true) && $beforeInstallPromptEvent.prompt()}>
        Yeah
      </a>
    </div>

    <a
      class="ml-2"
      href="javascript:void(0)"
      on:click={() => (hideInstallPrompt = true)}
      title="Close">
      <i class="fas fa-times" />
    </a>
  </div>
{:else if !hideNotificationPrompt}
  <div
    class="alert alert-info d-flex justify-content-between align-items-center
    m-0">
    <div>
      Do you want notifications for new messages?
      <a
        href="javascript:void(0)"
        on:click={() => (hideNotificationPrompt = true) && $requestNotificationPermission()}>
        Yeah
      </a>
    </div>

    <a
      class="ml-2"
      href="javascript:void(0)"
      on:click={() => (hideNotificationPrompt = true)}
      title="Close">
      <i class="fas fa-times" />
    </a>
  </div>
{:else if false && !hidePersistentStoragePrompt}
  <div
    class="alert alert-info d-flex justify-content-between align-items-center
    m-0">
    <div>
      Do you want to stay logged in when your device runs low on space?
      <a
        href="javascript:void(0)"
        on:click={() => (hidePersistentStoragePrompt = true) && $requestPersistentStorage()}>
        Yeah
      </a>
    </div>

    <a
      class="ml-2"
      href="javascript:void(0)"
      on:click={() => (hidePersistentStoragePrompt = true)}
      title="Close">
      <i class="fas fa-times" />
    </a>
  </div>
{/if}
<div
  class="d-flex flex-row flex-grow-1 h-100 position-relative {$convosOut ? 'convos-out' : ''}">
  <div
    class="convos d-flex flex-column h-100 bg-dark text-light"
    bind:this={convos}>
    <nav class="navbar navbar-expand navbar-dark bg-dark">
      <div class="container-fluid">
        <span class="navbar-brand align-items-center">
          <span>{$brand}</span>
        </span>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item dropdown" bind:this={menuDropdown}>
            <a
              class="nav-link dropdown-toggle p-0 d-flex align-items-center"
              href="javascript:void(0)"
              id="userDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false">
              <Avatar bind:user={$user} size={32} />
            </a>
            <div
              class="dropdown-menu dropdown-menu-right"
              aria-labelledby="userDropdown">
              <h6 class="dropdown-header"> {$user.data.name} </h6>
              <a class="dropdown-item" href="#/u/{$user.data.username}">
                Your Account
              </a>
              <a class="dropdown-item" href="#/pushSubscriptions">
                Push Subscriptions
              </a>
              <div class="dropdown-divider" />
              <a
                class="dropdown-item"
                href="javascript:void(0)"
                on:click={logout}>
                Log Out
              </a>
              {#if $userIsTilmeldAdmin}
                <div class="dropdown-divider" />
                <h6 class="dropdown-header">Admin</h6>
                <a class="dropdown-item" href="/user/" target="_blank">
                  User Admin App
                </a>
              {/if}
            </div>
          </li>
        </ul>
      </div>
    </nav>
    <div style="overflow-y: hidden; height: 100%; flex-basis: 0; flex-grow: 1;">
      <ConversationList
        on:tunnelgram-notification={event => notification(event.detail)} />
    </div>
  </div>
  <!-- This needs the width:0 style, or it will offset the list during loading. -->
  <div
    class="main-ui flex-grow-1 d-flex flex-column h-100 bg-light text-dark"
    style="width: 0;"
    bind:this={mainUi}>
    <nav class="navbar navbar-expand navbar-dark bg-dark">
      <div class="container-fluid">
        <ul class="navbar-nav d-md-none">
          <li class="nav-item">
            <a
              class="nav-link border-secondary rounded px-2"
              href="#/"
              title="Back to list">
              <i class="fas fa-arrow-left" />
            </a>
          </li>
        </ul>
        <span class="page-name navbar-text">
          <span>
            {#if $view === 'pushSubscriptions'}
              Push Subscriptions
            {:else if $view === 'user'}
              {$viewUser.data.name}
            {:else if $settings && $conversation.guid}
              {$conversation.getName($settings)}
            {:else}
              <span style="display: inline-block;" />
            {/if}
          </span>
        </span>
        {#if ['conversation', 'people', 'settings'].indexOf($view) !== -1 && $conversation.guid}
          <NavBar />
        {/if}
      </div>
    </nav>
    <div
      style="overflow-y: auto; -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain; height: 100%; flex-basis: 0; flex-grow: 1;">
      {#if $loadingConversation || $loadingUser}
        <div class="d-flex h-100 align-items-center justify-content-center">
          <div
            style="background-image: url(images/android-chrome-192x192.png);
            background-size: cover; position: absolute; width: 88px; height:
            88px;" />
          <LoadingIndicator width="200" height="200" />
        </div>
      {:else if $view === 'user'}
        <UserView />
      {:else if $view === 'pushSubscriptions'}
        <PushSubscriptionsView />
      {:else}
        <ConversationView />
      {/if}
    </div>
  </div>
</div>
