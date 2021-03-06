{#if message.informational}
  <div class="d-flex align-items-center w-100 mb-2 text-muted">
    {#if isMessageUserReady}
      <a
        class="mx-2"
        style="line-height: 1;"
        href="/u/{messageUser.username}"
        title={displayName}>
        <Avatar user={messageUser} size={avatarSize} />
      </a>
      <small title={createdDateLong}>
        {#if message.text === 'joined'}
          <DisplayName bind:user={messageUser} />
          joined
        {:else if message.text === 'left'}
          <DisplayName bind:user={messageUser} />
          left
        {:else if message.text === 'added'}
          <DisplayName bind:user={messageUser} />
          added
          <DisplayName bind:user={message.relatedUser} />
        {:else if message.text === 'removed'}
          <DisplayName bind:user={messageUser} />
          removed
          <DisplayName bind:user={message.relatedUser} />
        {:else if message.text === 'promoted'}
          <DisplayName bind:user={messageUser} />
          promoted
          <DisplayName bind:user={message.relatedUser} />
        {:else}{message.text}{/if}
      </small>
    {/if}
  </div>
{:else}
  {#if isChannel && prevMessageUserIsDifferent && isMessageUserReady}
    <div class="d-flex align-items-center w-100 my-2 text-muted">
      <a
        class="mx-2"
        style="line-height: 1;"
        href="/u/{messageUser.username}"
        title={displayName}>
        <Avatar user={messageUser} size={avatarSize} />
      </a>
      <small>
        <DisplayName bind:user={messageUser} />
      </small>
    </div>
  {/if}
  <div
    class="d-flex align-items-center w-100 mb-2 {isOwner && !isChannel
      ? 'flex-row-reverse'
      : ''}"
    style="opacity: {pending ? '.6' : '1'};"
  >
    {#if !isOwner && !isChannel}
      {#if nextMessageUserIsDifferent && isMessageUserReady}
        <a
          class="d-inline-flex ml-2 my-0 align-items-center align-self-end"
          href="/u/{messageUser.username}"
          title={displayName}>
          <Avatar user={messageUser} size={avatarSize} />
        </a>
      {:else}
        <div class="d-inline-block ml-2 my-0">
          <div style="height: {avatarSize}px; width: {avatarSize}px;" />
        </div>
      {/if}
    {/if}
    {#if isChannel}
      <div class="d-inline-block my-0" style="width: {avatarSize / 2}px;" />
    {/if}
    <div
      class="{stageClass}
      {flipFirst || flipSecond
        ? 'raise-to-top perspective-stage'
        : ''}"
      style={shouldEmbiggen ? 'max-width: 100%;' : 'max-width: 85%;'}
    >
      <div
        class="{isChannel
          ? 'card border-left border-right-0 border-top-0 border-bottom-0 bg-transparent ' +
            (isOwner ? 'border-primary' : 'border-info')
          : shouldEmbiggen
          ? ''
          : 'card rounded ' +
            (isOwner
              ? 'align-self-end border-primary bg-primary-light'
              : 'border-info bg-info-light') +
            ' ' +
            shadowClass}
        mx-2 my-0 {flipper
          ? 'flipper'
          : ''}
        {flipFirst ? 'flip-first' : ''}
        {flipSecond
          ? 'flip-second'
          : ''}"
        style={shouldEmbiggen ? 'font-size: 0;' : 'min-width: 10rem;'}
        tabindex="0"
        role="button"
        on:animationend={handleFlipAnimationEnd}
        on:dblclick={toggleActions}
        title={createdDateLong}
        bind:this={messageContainer}
      >
        {#if shouldEmbiggen}
          <div
            class="d-inline-block"
            on:click={() => (flipFirst = !!flipper)}
            style="font-size: 1.1rem"
          >
            {#if message.$decrypted.text != null}
              <span class="h1">
                {flipped
                  ? message.$decrypted.secretText
                  : message.$decrypted.text}
              </span>
            {:else if message.$decrypted.images.length}
              <div class={shadowClass}>
                <ImageGrid resources={message.$decrypted.images} />
              </div>
            {:else if message.$decrypted.video != null}
              <div class={shadowClass}>
                <Video resource={message.$decrypted.video} />
              </div>
            {/if}
          </div>
        {:else}
          {#if message.$decrypted.images.length && (!flipper || flipped)}
            <div class="card-header p-0 w-100 d-flex justify-content-center">
              <ImageGrid resources={message.$decrypted.images} />
            </div>
          {:else if message.$decrypted.video != null && (!flipper || flipped)}
            <div class="card-header p-0 w-100 d-flex justify-content-center">
              <Video resource={message.$decrypted.video} />
            </div>
          {/if}
          {#if flipped ? formattedSecretText != null : formattedText != null}
            <div
              class="card-body py-1 px-2 m-0"
              on:click={() => (flipFirst = !!flipper)}
            >
              <div class="message card-text markdown-body">
                {@html flipped ? formattedSecretText : formattedText}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
    {#if showActions && isOwner}
      <button
        type="button"
        class="btn btn-sm btn-danger mx-2"
        on:click={deleteMessage}
        title="Delete message">
        <i class="fas fa-trash-alt" />
      </button>
      {#if pending && saveFailed}
        <button
          type="button"
          class="btn btn-sm btn-success mx-2"
          on:click={retrySave}
          title="Retry sending">
          <i class="fas fa-sync" />
        </button>
      {/if}
      {#if !pending}
        <div class="mr-2 my-0">
          <small class="text-muted">{createdDateShort}</small>
        </div>
      {/if}
    {/if}
    {#if pending}
      <small class="text-muted">
        {#if saveFailed}
          <span title="Failed to send message">
            <i class="fas fa-exclamation-circle" />
          </span>
        {:else}
          <span title="Sending message...">
            <i class="fas fa-sync fa-spin" />
          </span>
        {/if}
      </small>
    {/if}
  </div>
{/if}

<script>
  import { onDestroy, tick, createEventDispatcher } from 'svelte';
  import TinyGesture from 'tinygesture';
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import ImageGrid from './Media/ImageGrid';
  import Video from './Media/Video';
  import Avatar from '../Users/Avatar';
  import DisplayName from '../Users/DisplayName';
  import { navigate } from '../../Services/router';
  import { SimpleDateFormatter } from '../../Services/SimpleDateFormatter';
  import ShowdownPromise from '../../Services/ShowdownPromise';
  import ErrHandler from '../../ErrHandler';
  import { user, settings } from '../../stores';

  const dispatch = createEventDispatcher();
  const bareEmojiRegex = /^(?:\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74)\uDB40\uDC7F|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]\uFE0F|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83D\uDC69\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83D\uDC69\u200D[\u2695\u2696\u2708])\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC68(?:\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F)$/;

  export let message = null;
  export let nextMessageUserIsDifferent = true;
  export let prevMessageUserIsDifferent = true;
  export let pending = false;
  let showActions = false;
  let formattedText = null;
  let formattedSecretText = null;
  let saveFailed = null;
  let flipped = false;
  let flipSecond;
  let flipFirst;
  let destroyed;
  let createdDateLong;
  let createdDateShort;

  $: isOwner = pending || $user.$is(message.user);
  $: messageUser = pending ? $user : message.user;
  $: isChannel = message.$mode !== Conversation.MODE_CHAT;
  $: avatarSize = isChannel ? 24 : 18;
  $: isMessageUserReady =
    pending || (message.user != null && message.user.username != null);
  $: shouldEmbiggen = (() => {
    if (isChannel) {
      return false;
    }
    // Bare emojis should be embiggened. https://mathiasbynens.be/notes/es-unicode-property-escapes#emoji
    if (
      message.$decrypted.text != null &&
      !message.$decrypted.images.length &&
      message.$decrypted.video == null &&
      message.$decrypted.text.match(bareEmojiRegex)
    ) {
      return (
        message.$decrypted.secretText == null ||
        !!message.$decrypted.secretText.match(bareEmojiRegex)
      );
    }
    if (
      message.$decrypted.text == null &&
      (message.$decrypted.images.length || message.$decrypted.video != null)
    ) {
      return true;
    }
    return false;
  })();
  $: flipper = message.$decrypted.secretText != null;
  $: displayName =
    messageUser == null
      ? ''
      : $settings != null && messageUser.guid in $settings.$decrypted.nicknames
      ? $settings.$decrypted.nicknames[messageUser.guid]
      : messageUser.name;
  $: shadowClass = [
    'shadow-none elevate-0 perspective-stage',
    'shadow-sm',
    'shadow elevate-2 perspective-stage',
    'shadow-lg elevate-3 perspective-stage',
  ][flipped ? message.$secretTextElevation : message.$textElevation];
  $: stageClass = ['', '', 'p-1', 'p-2'][
    flipped ? message.$secretTextElevation : message.$textElevation
  ];

  $: if (
    message &&
    !pending &&
    message.$containsSleepingReference &&
    !message.$tgCalledReadyAll
  ) {
    // Ready the message's referenced entities.
    message.$tgCalledReadyAll = true;
    message.$readyAll(1).then(() => {
      message.$containsSleepingReference = false;
      message.$tgCalledReadyAll = false;
      if (!destroyed) {
        message = message;
      }
    }, ErrHandler);
  }

  let messageContainer;
  let messageContainerGesture;
  // Initialize swipe gestures.
  $: if (messageContainer && !messageContainerGesture) {
    messageContainerGesture = new TinyGesture(messageContainer);
    messageContainerGesture.on('longpress', () => {
      toggleActions();
    });
  } else if (!messageContainer && messageContainerGesture) {
    messageContainerGesture.destroy();
    messageContainerGesture = null;
  }

  let previousMessageGuid = -1;
  $: if (previousMessageGuid !== message.guid) {
    previousMessageGuid = message.guid;
    setFormattedText();

    createdDateLong =
      message.cdate == null
        ? 'Pending'
        : new SimpleDateFormatter(message.cdate).format('wymdhms', 'long');
    createdDateShort =
      message.cdate == null
        ? 'Pending'
        : new SimpleDateFormatter(message.cdate).format('wymdhms', 'short');

    if (pending) {
      handlePending();
    }
  }

  onDestroy(() => {
    destroyed = true;
  });

  async function setFormattedText() {
    // If showdown isn't available, wait until it is.
    const showdown = await ShowdownPromise;
    // Use showdown to convert the markdown to HTML.
    const html = showdown.makeHtml(message.$decrypted.text);
    const secretHtml =
      message.$decrypted.secretText != null
        ? showdown.makeHtml(message.$decrypted.secretText)
        : null;
    formattedText = html == null ? null : html.replace(/\n$/, '');
    formattedSecretText =
      secretHtml == null ? null : secretHtml.replace(/\n$/, '');
    await tick();
    dispatch('rendered');
  }

  async function deleteMessage() {
    if (pending) {
      message.$cancelSave();
    } else {
      if (await message.$delete()) {
        dispatch('deleted');
      }
    }
  }

  function handlePending() {
    if (message.$savePromise) {
      const myMessage = message;
      message.$savePromise.catch(() => {
        if (message !== myMessage) {
          return;
        }
        saveFailed = true;
        showActions = true;
      });
    }
  }

  function retrySave() {
    message.$retrySave();
    saveFailed = null;
    showActions = false;
    handlePending();
  }

  function handleFlipAnimationEnd() {
    if (flipFirst) {
      flipSecond = true;
      flipped = !flipped;
      flipFirst = false;
    } else {
      flipSecond = false;
      flipFirst = false;
    }
  }

  function toggleActions() {
    showActions = !showActions;
  }
</script>

<style>
  .message > :global(p:last-child),
  .message > :global(h1:last-child),
  .message > :global(h2:last-child),
  .message > :global(h3:last-child),
  .message > :global(h4:last-child),
  .message > :global(h5:last-child),
  .message > :global(h6:last-child) {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: 0;
  }

  .perspective-stage {
    perspective: 1000px;
  }

  .raise-to-top {
    z-index: 20;
  }

  .elevate-0 {
    transform: scale(0.96);
  }
  .elevate-2 {
    transform: scale(1.04);
  }
  .elevate-3 {
    transform: scale(1.08);
  }

  .flip-first {
    animation: flip-first 0.25s linear both;
  }
  .flip-second {
    animation: flip-second 0.25s linear both;
  }
  @keyframes flip-first {
    0% {
      transform: translateZ(0) rotateY(0);
    }
    100% {
      transform: translateZ(300px) rotateY(90deg);
    }
  }
  @keyframes flip-second {
    0% {
      transform: translateZ(300px) rotateY(-90deg);
    }
    100% {
      transform: translateZ(0) rotateY(0);
    }
  }
</style>
