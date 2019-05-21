<script>
  import {onDestroy} from 'svelte';
  import MessageList from '../Messages/List';
  import PostBar from '../Messages/PostBar';
  import JoinBar from '../Messages/JoinBar';
  import {storage} from '../../Services/StorageService';
  import {conversation} from '../../stores';

  let showDropbox = false;
  let messageList;
  let postBar;
  let timeout;
  let postBarStorage = null;

  $: showPostBar = $conversation.guid && $conversation.isUserJoined() && postBarStorage && $conversation.guid in postBarStorage;

  $: if ($conversation.guid && $conversation.isUserJoined() && postBarStorage && !($conversation.guid in postBarStorage)) {
    postBarStorage[$conversation.guid] = {
      text: '',
      images: [],
      video: null
    };
  }

  $: if (postBarStorage) {
    storage.setItem('tgPostBarStorage', postBarStorage);
  }

  (async () => {
    postBarStorage = await storage.getItem('tgPostBarStorage');
    if (!postBarStorage) {
      postBarStorage = {};
    }
  })();

  onDestroy(() => {
    if (timeout) {
      window.clearTimeout(timeout);
    }
  });

  function clearDropboxTimeout () {
    if (timeout) {
      window.clearTimeout(timeout);
      timeout = null;
    }
  }

  function showTimedDropbox () {
    clearDropboxTimeout();

    showDropbox = true;

    if (postBar) {
      timeout = window.setTimeout(() => {
        showDropbox = false;
        timeout = null;
      }, 2000);
    }
  }

  function handleDrag (event, showDropboxValue) {
    event.stopPropagation();
    event.preventDefault();

    if (postBar) {
      showDropbox = showDropboxValue;
    }
  }

  function handleDrop (event) {
    event.stopPropagation();
    event.preventDefault();

    showDropbox = false;
    if (postBar) {
      postBar.handleFiles(event.dataTransfer.files);
    }
  }
</script>

<div class="d-flex flex-column h-100 position-relative" on:dragover={event => handleDrag(event, true)}>
  {#if showDropbox}
    <div class="position-absolute w-100 h-100" style="z-index: 200;" on:dragleave={event => handleDrag(event, false)} on:drop={event => handleDrop(event)}></div>
    <div class="d-flex justify-content-center align-items-center position-absolute w-100 h-100 bg-white" style="opacity: .9; z-index: 100;">
      <div class="d-flex flex-column justify-content-center align-items-center">
        <span class="fa-layers fa-fw fa-5x">
          <i class="fas fa-file"></i>
          <i class="fa-inverse fas fa-plus" data-fa-transform="shrink-10"></i>
        </span>

        <div class="h1 mt-2">
          Drop files to upload to conversation.
        </div>
      </div>
    </div>
  {/if}
  <div class="flex-grow-1 position-relative">
    <MessageList bind:conversation={$conversation} bind:this={messageList} />
  </div>
  {#if showPostBar}
    <PostBar
      bind:this={postBar}
      bind:conversation={$conversation}
      bind:text={postBarStorage[$conversation.guid].text}
      bind:images={postBarStorage[$conversation.guid].images}
      bind:video={postBarStorage[$conversation.guid].video}
      on:scrollToBottom={() => messageList.scrollToBottom()}
    />
  {:else}
    <JoinBar bind:conversation={$conversation} />
  {/if}
</div>
