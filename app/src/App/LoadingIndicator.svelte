<div
  style="display: flex; justify-content: center; align-items: center; position:
  relative; width: {width}px; height: {height}px;"
>
  {#if text || title}
    <div
      style="text-align: center; font-size: .9em; text-overflow: ellipsis;
      overflow: hidden; max-height: 80%; max-width: 80%;"
    >
      {#if title}
        <h3 style="white-space: pre-wrap;">{title}</h3>
      {/if}
      {#if text}
        <span style="white-space: pre-wrap;">{text}</span>
      {/if}
    </div>
  {/if}
  <svg
    class="lds-dual-ring"
    width="{width * 0.9}px"
    height="{height * 0.9}px"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid"
    style="position: absolute; background: none;">
    <circle
      cx="50"
      cy="50"
      fill="none"
      stroke-linecap="round"
      r="48"
      stroke-width="4"
      stroke="#337ab7"
      stroke-dasharray={progress != null
        ? progress * 301.593 + ' ' + (301.593 - progress * 301.593)
        : '75.398 75.398'}
      transform="rotate(99 50 50)">
      <animateTransform
        attributeName="transform"
        type="rotate"
        calcMode="linear"
        values="0 50 50;360 50 50"
        keyTimes="0;1"
        dur="2s"
        begin="0s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
</div>

<script>
  export let width;
  export let height;
  export let title = null;
  export let text = null;
  export let progress = null;
</script>
