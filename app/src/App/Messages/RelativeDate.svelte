{text}

<script>
  import { onDestroy } from 'svelte';
  import { SimpleDateFormatter } from '../../Services/SimpleDateFormatter';

  export let message;
  let text;
  let interval;

  let previousMessageGuid = -1;
  $: if (previousMessageGuid !== message.guid) {
    previousMessageGuid = message.guid;
    if (interval) {
      window.clearInterval(interval);
    }
    interval = window.setInterval(updateTime, 10000);
    updateTime();
  }

  onDestroy(() => {
    if (interval) {
      window.clearInterval(interval);
    }
  });

  function updateTime() {
    let { cdate } = message;
    if (cdate == null) {
      text = 'Pending';
      return;
    }
    const now = +new Date() / 1000;
    const cdateFormatter = new SimpleDateFormatter(
      Math.min(cdate, +new Date() / 1000),
    );
    if (now - cdate > 10 * 30 * 24 * 60 * 60) {
      // More than 10 months ago.
      text = cdateFormatter.format('ymd', 'short');
    } else if (now - cdate > 6 * 24 * 60 * 60) {
      // More than 6 days ago.
      text = cdateFormatter.format('md', 'short');
    } else if (now - cdate > 24 * 60 * 60) {
      // More than 1 day ago.
      text = cdateFormatter.format('wh', 'short');
    } else {
      text = cdateFormatter.format('ago', 'long');
    }
  }
</script>
