<script>
  import Create from './Create';
  import Messages from './Messages';
  import People from './People';
  import Settings from './Settings';
  import { conversation, view } from '../../stores';
</script>

{#if !$conversation.guid}
  <Create />
{:else if $view === 'conversation'}
  <Messages />
{:else if $view === 'people'}
  <People />
{:else if $view === 'settings'}
  <Settings />
{/if}
