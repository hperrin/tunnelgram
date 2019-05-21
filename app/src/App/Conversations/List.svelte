<script>
  import {onMount, onDestroy, tick, createEventDispatcher} from 'svelte';
  import {Nymph, PubSub} from 'nymph-client';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import LoadingIndicator from '../LoadingIndicator';
  import Preview from './Preview';
  import {navigate} from '../../Services/router';
  import ErrHandler from '../../ErrHandler';
  import {conversation, conversations, user, settings} from '../../stores';

  const CONVERSATION_PAGE_SIZE = 8;

  const dispatch = createEventDispatcher();

  let disconnected = false;
  let loading = true;
  let loadingEarlierConversations = false;
  let reachedEarliestConversation = false;
  let search = '';
  let destroyed = false;
  let subscription;
  let container;
  const onPubSubConnect = () => {
    if (disconnected) {
      Nymph.getEntities({
        'class': Conversation.class,
        'sort': 'mdate',
        'reverse': true
      }, {
        'type': '|',
        'ref': [
          ['acFull', $user.guid],
          ...$user.data.groups.map(group => ['group', group.guid])
        ]
      }, {
        'type': '&',
        'gt': ['mdate', $conversations.length ? Math.max(...$conversations.map(c => c.mdate)) : 0]
      }).then(newConversations => {
        $conversations = [...newConversations, ...$conversations.filter(c => !c.inArray(newConversations))];
      });
    }
    disconnected = false;
  };
  const onPubSubDisconnect = () => {
    disconnected = true;
  };

  $: filteredConversations = Object.fromEntries((() => {
    if (search === '' || !$settings) {
      return $conversations;
    }
    const searchLC = search.toLowerCase();
    const nicknameUserGUIDs = Object.entries($settings.decrypted.nicknames).filter(entry => {
      const [guid, nickname] = entry;
      return nickname.toLowerCase().indexOf(searchLC) !== -1;
    }).map(entry => parseFloat(entry[0]));
    return $conversations.filter(c => {
      for (let user of c.data.acFull) {
        if (user.isASleepingReference || ($user.is(user) && c.data.acFull.length > 1)) {
          continue;
        } else if (nicknameUserGUIDs.indexOf(user.guid) !== -1) {
          return true;
        } else if (!(user.guid in $settings.decrypted.nicknames) && user.data.name.toLowerCase().indexOf(searchLC) !== -1) {
          return true;
        }
      }
      return false;
    });
  })().map(conv => [conv.guid, true]));

  let previousUser = null;
  let previousUserGroupsLength = 0;
  $: if ($user && (!$user.is(previousUser) || $user.data.groups.length !== previousUserGroupsLength)) {
    subscribe();
    previousUser = $user;
    previousUserGroupsLength = $user.data.groups.length;
  }

  let previousConversationsLength = $conversations.length;
  $: if (previousConversationsLength !== $conversations.length) {
    handleScroll();
    previousConversationsLength = $conversations.length;
  }

  $: if (search !== null) {
    handleScroll();
  }

  onMount(() => {
    PubSub.on('connect', onPubSubConnect);
    PubSub.on('disconnect', onPubSubDisconnect);
  });

  onDestroy(() => {
    destroyed = true;
    if (subscription) {
      subscription.unsubscribe();
    }

    PubSub.off('connect', onPubSubConnect);
    PubSub.off('disconnect', onPubSubDisconnect);
  });

  function subscribe () {
    if (subscription) {
      subscription.unsubscribe();
    }

    loading = true;

    subscription = Nymph.getEntities({
      'class': Conversation.class,
      'sort': 'mdate',
      'reverse': true,
      'limit': CONVERSATION_PAGE_SIZE
    }, {
      'type': '|',
      'ref': [
        ['acFull', $user.guid],
        ...$user.data.groups.map(group => ['group', group.guid])
      ]
    }).subscribe(update => {
      if (destroyed) {
        return;
      }
      loading = false;
      if (update) {
        if (Array.isArray(update)) {
          $conversations = [];
          if (update.length < CONVERSATION_PAGE_SIZE) {
            reachedEarliestConversation = true;
          }
        } else {
          dispatch('tunnelgram-notification', update);
        }
        PubSub.updateArray($conversations, update);
        $conversations = $conversations;
        handleScroll();
      }
    }, ErrHandler);
  }

  async function handleScroll () {
    await tick();
    if (container && container.scrollTop > (container.scrollHeight - container.clientHeight - 150)) {
      loadEarlierConversations();
    }
  }

  async function loadEarlierConversations () {
    if (loadingEarlierConversations || reachedEarliestConversation) {
      return;
    }

    if (!$conversations.length) {
      return;
    }

    loadingEarlierConversations = true;

    try {
      const earlierConversations = await Nymph.getEntities({
        'class': Conversation.class,
        'sort': 'mdate',
        'reverse': true,
        'limit': CONVERSATION_PAGE_SIZE
      }, {
        'type': '|',
        'ref': [
          ['acFull', $user.guid],
          ...$user.data.groups.map(group => ['group', group.guid])
        ]
      }, {
        'type': '&',
        'lt': ['mdate', Math.min(...$conversations.map(c => c.mdate))]
      });

      if (earlierConversations && earlierConversations.length) {
        $conversations = [...$conversations, ...earlierConversations];
        if (earlierConversations.length < CONVERSATION_PAGE_SIZE) {
          reachedEarliestConversation = true;
        }
      } else {
        reachedEarliestConversation = true;
      }
    } catch (e) {
      ErrHandler(e);
    }

    loadingEarlierConversations = false;
  }
</script>

<div class="h-100" style="overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;" bind:this={container} on:scroll={handleScroll}>
  <div class="list-group">
    <a href="#/c" on:click={() => search = ''} class="list-group-item list-group-item-action rounded-0 {$conversation.guid == null ? 'active' : ''}">
      <h5 class="mb-0 d-flex w-100 align-items-center"><i class="fas fa-plus-circle mr-1"></i> New Conversation</h5>
    </a>
    {#if $conversations.length > 1}
      <div class="list-group-item d-flex p-0 border-0">
        <input type="text" class="form-control bg-secondary border-0 text-light" bind:value={search} name="search" placeholder="Search people" autocomplete="off" />
      </div>
    {/if}
    {#each $conversations as curConversation (curConversation.guid)}
      <a href="#/c/{curConversation.guid}" on:click={() => search = ''} class="list-group-item p-2 list-group-item-action rounded-0 flex-column align-items-start {curConversation.guid === $conversation.guid ? 'active' : ''} {filteredConversations[curConversation.guid] ? '' : 'd-none'}" style="cursor: pointer;">
        <Preview bind:conversation={curConversation} />
      </a>
    {/each}
    {#if !loading && !$conversations.length}
      <div class="list-group-item p-2 rounded-0 flex-column align-items-start bg-transparent border-0">
        {#if $conversations.length}
          No matching conversations.
        {:else}
          You have no conversations yet.
        {/if}
      </div>
    {/if}
    {#if loading || !reachedEarliestConversation}
      <div class="list-group-item p-2 rounded-0 d-flex align-items-center justify-content-center align-self-stretch bg-transparent border-0 {loadingEarlierConversations ? '' : 'visibility-hidden'}">
        <div class="col-auto">
          <LoadingIndicator width="50" height="50" />
        </div>
      </div>
    {/if}
  </div>
</div>
