<script>
  import Conversation from '../../Entities/Tunnelgram/Conversation';
  import {SimpleDateFormatter} from '../../Services/SimpleDateFormatter';
  import {settings} from '../../stores';

  export let conversation;
  let showModeHelp = false;
</script>

<div class="d-flex flex-column justify-content-center align-items-center" style="min-height: 150px;">
  <h1>{conversation && conversation.getName($settings)}</h1>
  <p>
    Started {new SimpleDateFormatter(conversation.cdate).format('wymdhms', 'long')}
  </p>
  <p>
    {Conversation.MODE_NAME[conversation.data.mode]}
    <button class="btn btn-sm btn-link" on:click={() => showModeHelp = !showModeHelp}>(?)</button>
  </p>
  {#if showModeHelp}
    <p class="alert alert-info m-3">
      {Conversation.MODE_DESCRIPTION[conversation.data.mode]}
    </p>
  {/if}
</div>
