<svelte:window on:resize={rescrollToBottom} />
<div class="position-absolute h-100 w-100 pt-3" style="overflow-y: auto; -webkit-overflow-scrolling: touch; overflow-x: hidden;" bind:this={container} on:scroll={setIsAtBottom} on:scroll={handleScroll}>
  {#if loading}
    <div class="d-flex align-items-center justify-content-center" style="height: 100%;">
      <div style="background-image: url(images/android-chrome-192x192.png); background-size: cover; position: absolute; width: 88px; height: 88px;"></div>
      <LoadingIndicator width="200" height="200" />
    </div>
  {:else}
    {#if reachedEarliestMessage}
      <ConversationHeader bind:conversation />
    {:else}
      <div class="d-flex align-items-center justify-content-center {loadingEarlierMessages ? '' : 'visibility-hidden'}" style="height: 150px;">
        <div class="col-auto">
          <LoadingIndicator width="50" height="50" />
        </div>
      </div>
    {/if}
    <div class="d-flex flex-column-reverse" bind:this={messageContainer}>
      {#each messages as message, i (message.guid)}
        <div class="d-flex flex-column align-items-start message-box" data-cdate={'' + message.cdate}>
          <MessageItem
            bind:message
            on:rendered={rescrollToBottom}
            on:deleted={() => removeMessage(message)}
            nextMessageUserIsDifferent={i === 0 || messages[i - 1].data.user.guid !== message.data.user.guid}
            prevMessageUserIsDifferent={i === messages.length - 1 || messages[i + 1].data.user.guid !== message.data.user.guid}
            showTime={i < (messages.length - 1) && showTime(messages[i + 1].cdate, message.cdate)}
          ></MessageItem>
          {#if showReadline && i !== 0 && messages[i - 1].cdate > initialReadline && message.cdate <= initialReadline}
            <div class="d-flex align-items-center w-100 mb-2 readline" bind:this={readlineEl}>
              <hr class="mx-2 flex-grow-1">
              <small class="text-muted">new messages</small>
              <hr class="mx-2 flex-grow-1">
            </div>
          {/if}
        </div>
      {/each}
    </div>
    <div class="d-flex flex-column align-items-start">
      {#each conversation.pending as message}
        <MessageItem
          bind:message
          on:rendered={rescrollToBottom}
          pending="true"
          nextMessageUserIsDifferent={false}
          prevMessageUserIsDifferent={false}
          showTime={messages.length && showTime(messages[0].cdate)}
        ></MessageItem>
      {/each}
    </div>
  {/if}
</div>

<script>
  import {onMount, onDestroy, afterUpdate, tick} from 'svelte';
  import {Nymph, PubSub} from 'nymph-client';
  import Message from '../../Entities/Tunnelgram/Message';
  import ConversationHeader from '../Conversations/Header';
  import LoadingIndicator from '../LoadingIndicator';
  import MessageItem from './Item';
  import ErrHandler from '../../ErrHandler';
  import {user} from '../../stores';

  const MESSAGE_PAGE_SIZE = 20;

  export let conversation;
  let messages = [];
  let container;
  let messageContainer;
  let readlineEl;
  let loading;
  let disconnected = false;
  let isAtBottom = true;
  let showReadline = null;
  let initialReadline = null;
  let loadingEarlierMessages = false;
  let reachedEarliestMessage = false;
  let scrollToDistanceFromBottom = null;
  let scrollWaitBottom;
  let scrollWaitReadline;
  let updateReadlineRaf;
  let destroyed = false;
  let subscription;
  const onPubSubConnect = () => {
    if (disconnected) {
      Nymph.getEntities({
        'class': Message.class,
        'sort': 'cdate',
        'reverse': true
      }, {
        'type': '&',
        'ref': ['conversation', conversation.guid],
        'gt': ['cdate', messages.length ? messages[messages.length - 1].cdate : 0]
      }).then(newMessages => {
        messages = [...newMessages, ...messages];
      });
    }
    disconnected = false;
  };
  const onPubSubDisconnect = () => {
    disconnected = true;
  };

  let previousConversationGuid = null;
  $: if (previousConversationGuid !== conversation.guid) {
    previousConversationGuid = conversation.guid;
    messages = [];
    isAtBottom = true;
    initialReadline = conversation.readline;
    showReadline = null;
    loadingEarlierMessages = false;
    reachedEarliestMessage = false;
    scrollToDistanceFromBottom = null;
    scrollWaitBottom = true;
    scrollWaitReadline = false;
    subscribe();
  }

  $: if (showReadline === null && initialReadline !== 0 && messages.length) {
    showReadline = initialReadline > 0 && initialReadline < messages[0].cdate;
    scrollWaitReadline = showReadline;
  }

  $: if (readlineEl && scrollWaitReadline) {
    scrollWaitReadline = false;
    scrollWaitBottom = false;
    container.scrollTop = Math.max(0, readlineEl.offsetTop - (container.clientHeight * .6));
    setIsAtBottom();
    updateReadline();
  }

  onMount(() => {
    PubSub.on('connect', onPubSubConnect);
    PubSub.on('disconnect', onPubSubDisconnect);
  });

  let previousScrollToDistanceFromBottom = scrollToDistanceFromBottom;
  afterUpdate(() => {
    // Rescroll to bottom when things change if the page is visible.
    if (!document.hidden && container.scrollTop < (container.scrollHeight - container.offsetHeight)) {
      rescrollToBottom();
    }

    if (previousScrollToDistanceFromBottom !== scrollToDistanceFromBottom && scrollToDistanceFromBottom != null) {
      window.requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - scrollToDistanceFromBottom;
        scrollToDistanceFromBottom = null;
      });
    }

    previousScrollToDistanceFromBottom = scrollToDistanceFromBottom;
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
    const queryConversationGuid = conversation.guid;

    subscription = Nymph.getEntities({
      'class': Message.class,
      'sort': 'cdate',
      'reverse': true,
      'limit': MESSAGE_PAGE_SIZE
    }, {
      'type': '&',
      'ref': ['conversation', conversation.guid]
    }).subscribe(update => {
      if (destroyed || queryConversationGuid !== conversation.guid) {
        return;
      }
      if (update) {
        if (Array.isArray(update)) {
          if (update.length < MESSAGE_PAGE_SIZE) {
            reachedEarliestMessage = true;
          }
        }
        PubSub.updateArray(messages, update);
        messages = messages;
        loading = false;
        createNewReadlineIfNeeded();

        if (update.added) {
          // Remove the message from pending messages.
          const ent = update.data;
          for (let i = 0; i < conversation.pending.length; i++) {
            const cur = conversation.pending[i];
            if (ent.guid === cur.guid) {
              conversation.pending.splice(i, 1);
              conversation = conversation;
              break;
            }
          }
        }

        rescrollToBottom();
        handleScroll();
      } else {
        loading = false;
      }
    }, err => {
      ErrHandler(err);
      loading = false;
    });
  }

  async function handleScroll () {
    await tick();

    if (container) {
      if (container.scrollTop < 250) {
        loadEarlierMessages();
      }

      updateReadline();
    }
  }

  function setIsAtBottom () {
    isAtBottom = container.scrollTop >= (container.scrollHeight - container.offsetHeight);
  }

  function showTime (time1, time2) {
    if (time2 === undefined) {
      time2 = (+new Date()) / 1000;
    }
    const now = (+new Date()) / 1000;
    if (now - time1 > 6 * 24 * 60 * 60) {
      // More than 6 days ago.
      return (time2 - time1 > 24 * 60 * 60); // 24 hours
    } else if (now - time1 > 24 * 60 * 60) {
      // More than 1 day ago.
      return (time2 - time1 > 4 * 60 * 60); // 4 hours
    } else {
      return (time2 - time1 > 40 * 60); // 40 minutes
    }
  }

  async function loadEarlierMessages () {
    if (loadingEarlierMessages || reachedEarliestMessage || scrollToDistanceFromBottom || scrollWaitReadline || scrollWaitBottom) {
      return;
    }

    if (!messages.length) {
      return;
    }

    loadingEarlierMessages = true;

    try {
      const earlierMessages = await Nymph.getEntities({
        'class': Message.class,
        'sort': 'cdate',
        'reverse': true,
        'limit': MESSAGE_PAGE_SIZE
      }, {
        'type': '&',
        'ref': ['conversation', conversation.guid],
        'lt': ['cdate', messages[messages.length - 1].cdate]
      });

      if (!loadingEarlierMessages) {
        return;
      }

      if (earlierMessages && earlierMessages.length) {
        messages = [...messages, ...earlierMessages];
        scrollToDistanceFromBottom = container.scrollHeight - container.scrollTop;
      } else {
        reachedEarliestMessage = true;
      }
    } catch (e) {
      ErrHandler(e);
    }

    loadingEarlierMessages = false;
  }

  function updateReadline () {
    // Don't update the readline if the user doesn't have the page open.
    if (document.hidden) {
      return;
    }
    // Update readline on next animation frame (so that the DOM can be updated).
    if (updateReadlineRaf) {
      window.cancelAnimationFrame(updateReadlineRaf);
    }
    updateReadlineRaf = window.requestAnimationFrame(async () => {
      updateReadlineRaf = null;
      if (!messageContainer) {
        return;
      }
      if (conversation.readline !== null) {
        const messageBoxes = messageContainer.querySelectorAll('.message-box[data-cdate]');
        const messageBoxesInViewport = Array.from(messageBoxes).filter(el => {
          const containerTop = container.scrollTop;
          const containerBottom = containerTop + container.clientHeight;
          const elBottom = el.offsetTop + el.offsetHeight;
          return (elBottom + 10 >= containerTop) && (elBottom - 10 <= containerBottom); // 10 pixel buffer.
        });
        if (messageBoxesInViewport.length) {
          const latestReadMessageBox = messageBoxesInViewport[0];
          const updateReadline = JSON.parse(latestReadMessageBox.dataset.cdate);
          if (updateReadline > conversation.readline) {
            await conversation.saveReadline(updateReadline);
            conversation = conversation;
          }
        }
      }
    });
  }

  async function createNewReadlineIfNeeded () {
    if (conversation.readline == null && messages.length) {
      const updateReadline = messages[0].cdate;
      initialReadline = updateReadline;
      await conversation.saveReadline(updateReadline);
      conversation = conversation;
    }
  }

  export async function scrollToBottom () {
    scrollWaitBottom = true;

    await tick();

    if (scrollWaitBottom && !scrollWaitReadline) {
      container.scrollTop = container.scrollHeight;
      isAtBottom = true;
      updateReadline();
    }
    scrollWaitBottom = false;
  }

  function rescrollToBottom () {
    // Scroll to the bottom if the user was at the bottom.
    if (isAtBottom) {
      scrollToBottom();
    }
  }

  function removeMessage (message) {
    const idx = message.arraySearch(messages);
    if (idx !== false) {
      messages.splice(idx, 1);
      messages = messages;
    }
  }
</script>
