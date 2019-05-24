<script>
  import { onDestroy, afterUpdate, tick } from 'svelte';
  import { Nymph, PubSub } from 'nymph-client';
  import Message from '../../Entities/Tunnelgram/Message';
  import ConversationHeader from '../Conversations/Header';
  import LoadingIndicator from '../LoadingIndicator';
  import RelativeDate from './RelativeDate';
  import MessageItem from './Item';
  import ErrHandler from '../../ErrHandler';
  import { user, disconnected } from '../../stores';

  const MESSAGE_PAGE_SIZE = 20;

  export let conversation;
  let messages = [];
  let container;
  let messageContainer;
  let readlineEl;
  let loading;
  let isAtBottom = true;
  let showReadline = null;
  let initialReadline = null;
  let loadingEarlierMessages = false;
  let reachedEarliestMessage = false;
  let scrollToDistanceFromBottom = null;
  let scrollWaitBottom = false;
  let scrollWaitReadline = false;
  let updateReadlineRaf;
  let destroyed = false;
  let subscription;

  let previousConversationGuid = -1;
  $: if (previousConversationGuid !== conversation.guid) {
    previousConversationGuid = conversation.guid;
    messages = [];
    isAtBottom = true;
    initialReadline = conversation.readline;
    showReadline = null;
    loadingEarlierMessages = false;
    reachedEarliestMessage = false;
    scrollToDistanceFromBottom = null;
    previousScrollToDistanceFromBottom = null;
    scrollWaitBottom = false;
    scrollWaitReadline = false;
    if (conversation.guid) {
      subscribe();
    } else if (subscription) {
      subscription.unsubscribe();
    }
  }

  let previousDisconnected = $disconnected;
  $: if (previousDisconnected !== $disconnected) {
    previousDisconnected = $disconnected;
    if (!$disconnected) {
      Nymph.getEntities(
        {
          class: Message.class,
          sort: 'cdate',
          reverse: true,
        },
        {
          type: '&',
          ref: ['conversation', conversation.guid],
          gt: ['cdate', messages.length ? messages[0].cdate : 0],
        },
      ).then(async newMessages => {
        await Promise.all(
          newMessages.filter(m => !m.cryptReady).map(m => m.cryptReadyPromise),
        );
        messages = [...newMessages, ...messages];
      });
    }
  }

  $: if (showReadline === null && initialReadline !== 0 && messages.length) {
    showReadline = initialReadline > 0 && initialReadline < messages[0].cdate;
    scrollWaitReadline = showReadline;
  }

  let previousScrollToDistanceFromBottom = scrollToDistanceFromBottom;
  afterUpdate(() => {
    // Rescroll to bottom when things change if the page is visible.
    if (
      !document.hidden &&
      container &&
      Math.ceil(container.scrollTop) <
        container.scrollHeight - container.offsetHeight
    ) {
      rescrollToBottom();
    }

    if (readlineEl && scrollWaitReadline) {
      scrollWaitReadline = false;
      scrollWaitBottom = false;
      container.scrollTop = Math.max(
        0,
        readlineEl.offsetTop - container.clientHeight * 0.6,
      );
      setIsAtBottom();
      updateReadline();
    }

    if (
      previousScrollToDistanceFromBottom !== scrollToDistanceFromBottom &&
      scrollToDistanceFromBottom != null
    ) {
      window.requestAnimationFrame(() => {
        if (container) {
          container.scrollTop =
            container.scrollHeight - scrollToDistanceFromBottom;
          scrollToDistanceFromBottom = null;
        }
      });
    }

    previousScrollToDistanceFromBottom = scrollToDistanceFromBottom;
  });

  onDestroy(() => {
    destroyed = true;
    if (subscription) {
      subscription.unsubscribe();
    }
  });

  function subscribe() {
    if (subscription) {
      subscription.unsubscribe();
    }

    loading = true;
    const queryConversationGuid = conversation.guid;

    subscription = Nymph.getEntities(
      {
        class: Message.class,
        sort: 'cdate',
        reverse: true,
        limit: MESSAGE_PAGE_SIZE,
      },
      {
        type: '&',
        ref: ['conversation', conversation.guid],
      },
    ).subscribe(
      async update => {
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
          await Promise.all(
            messages.filter(m => !m.cryptReady).map(m => m.cryptReadyPromise),
          );
          if (destroyed || queryConversationGuid !== conversation.guid) {
            return;
          }
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
      },
      err => {
        ErrHandler(err);
        loading = false;
      },
    );
  }

  async function handleScroll() {
    await tick();

    if (container) {
      if (container.scrollTop < 250) {
        loadEarlierMessages();
      }

      updateReadline();
    }
  }

  function setIsAtBottom() {
    if (container) {
      isAtBottom =
        Math.ceil(container.scrollTop) >=
        container.scrollHeight - container.offsetHeight;
    }
  }

  function showTime(time1, time2) {
    if (time2 == null) {
      time2 = +new Date() / 1000;
    }
    const now = +new Date() / 1000;
    if (now - time1 > 6 * 24 * 60 * 60) {
      // More than 6 days ago.
      return time2 - time1 > 24 * 60 * 60; // 24 hours
    } else if (now - time1 > 24 * 60 * 60) {
      // More than 1 day ago.
      return time2 - time1 > 4 * 60 * 60; // 4 hours
    } else {
      return time2 - time1 > 40 * 60; // 40 minutes
    }
  }

  async function loadEarlierMessages() {
    if (
      loadingEarlierMessages ||
      reachedEarliestMessage ||
      scrollToDistanceFromBottom ||
      scrollWaitReadline ||
      scrollWaitBottom
    ) {
      return;
    }

    if (!messages.length) {
      return;
    }

    loadingEarlierMessages = true;

    try {
      const earlierMessages = await Nymph.getEntities(
        {
          class: Message.class,
          sort: 'cdate',
          reverse: true,
          limit: MESSAGE_PAGE_SIZE,
        },
        {
          type: '&',
          ref: ['conversation', conversation.guid],
          lt: ['cdate', messages[messages.length - 1].cdate],
        },
      );

      if (!loadingEarlierMessages) {
        return;
      }

      if (earlierMessages && earlierMessages.length) {
        await Promise.all(
          earlierMessages
            .filter(m => !m.cryptReady)
            .map(m => m.cryptReadyPromise),
        );
        messages = [...messages, ...earlierMessages];
        if (container) {
          scrollToDistanceFromBottom =
            container.scrollHeight - container.scrollTop;
        }
      } else {
        reachedEarliestMessage = true;
      }
    } catch (e) {
      ErrHandler(e);
    }

    loadingEarlierMessages = false;
  }

  function updateReadline() {
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
      if (conversation.readline !== null && container) {
        const messageBoxes = messageContainer.querySelectorAll(
          '.message-box[data-cdate]',
        );
        const messageBoxesInViewport = Array.from(messageBoxes).filter(el => {
          const containerTop = container.scrollTop;
          const containerBottom = containerTop + container.clientHeight;
          const elBottom = el.offsetTop + el.offsetHeight;
          return (
            elBottom + 10 >= containerTop && elBottom - 10 <= containerBottom
          ); // 10 pixel buffer.
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

  async function createNewReadlineIfNeeded() {
    if (conversation.readline == null && messages.length) {
      const updateReadline = messages[0].cdate;
      initialReadline = updateReadline;
      await conversation.saveReadline(updateReadline);
      conversation = conversation;
    }
  }

  export async function scrollToBottom() {
    if (scrollWaitBottom) {
      return;
    }

    scrollWaitBottom = true;

    await tick();

    if (scrollWaitBottom) {
      if (!scrollWaitReadline && container) {
        container.scrollTop = container.scrollHeight;
        isAtBottom = true;
        updateReadline();
      }
      scrollWaitBottom = false;
    }
  }

  function rescrollToBottom() {
    // Scroll to the bottom if the user was at the bottom.
    if (isAtBottom) {
      scrollToBottom();
    }
  }

  function removeMessage(message) {
    const idx = message.arraySearch(messages);
    if (idx !== false) {
      messages.splice(idx, 1);
      messages = messages;
    }
  }
</script>

<svelte:window on:resize={rescrollToBottom} />
<div
  class="position-absolute h-100 w-100 pt-3"
  style="overflow-y: auto; -webkit-overflow-scrolling: touch; overflow-x:
  hidden;"
  bind:this={container}
  on:scroll={setIsAtBottom}
  on:scroll={handleScroll}>
  {#if loading}
    <div
      class="d-flex align-items-center justify-content-center"
      style="height: 100%;">
      <div
        style="background-image: url(images/android-chrome-192x192.png);
        background-size: cover; position: absolute; width: 88px; height: 88px;" />
      <LoadingIndicator width="200" height="200" />
    </div>
  {:else}
    {#if reachedEarliestMessage}
      <ConversationHeader bind:conversation />
    {:else}
      <div
        class="d-flex align-items-center justify-content-center {loadingEarlierMessages ? '' : 'visibility-hidden'}"
        style="height: 150px;">
        <div class="col-auto">
          <LoadingIndicator width="50" height="50" />
        </div>
      </div>
    {/if}
    <div class="d-flex flex-column-reverse" bind:this={messageContainer}>
      {#each messages as message, i (message.guid)}
        <div
          class="d-flex flex-column align-items-start message-box"
          data-cdate={'' + message.cdate}>
          {#if i < messages.length - 1 && showTime(messages[i + 1].cdate, message.cdate)}
            <small class="d-flex justify-content-center w-100 mb-2 text-muted">
              <RelativeDate bind:message />
            </small>
          {/if}
          <MessageItem
            bind:message
            on:rendered={rescrollToBottom}
            on:deleted={() => removeMessage(message)}
            nextMessageUserIsDifferent={i === 0 || messages[i - 1].data.user.guid !== message.data.user.guid}
            prevMessageUserIsDifferent={i === messages.length - 1 || messages[i + 1].data.user.guid !== message.data.user.guid} />
          {#if showReadline && i !== 0 && messages[i - 1].cdate > initialReadline && message.cdate <= initialReadline}
            <div
              class="d-flex align-items-center w-100 mb-2 readline"
              bind:this={readlineEl}>
              <hr class="mx-2 flex-grow-1" />
              <small class="text-muted">new messages</small>
              <hr class="mx-2 flex-grow-1" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
    <div class="d-flex flex-column align-items-start">
      {#each conversation.pending as message, i}
        {#if message.cryptReady}
          {#if i === 0 && messages.length && showTime(messages[0].cdate)}
            <small class="d-flex justify-content-center w-100 mb-2 text-muted">
              <RelativeDate bind:message />
            </small>
          {/if}
          <MessageItem
            bind:message
            on:rendered={rescrollToBottom}
            pending="true"
            nextMessageUserIsDifferent={false}
            prevMessageUserIsDifferent={false} />
        {/if}
      {/each}
    </div>
  {/if}
</div>
