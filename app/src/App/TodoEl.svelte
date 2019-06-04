<div
  class="list-group-item font-weight-normal {todo.data.done ? 'list-group-item-success' : ''}"
>
  <span
    class="d-flex flex-md-row align-items-md-center flex-column
    align-items-start justify-content-between"
  >
    <span class="d-flex align-items-center" style="flex-grow: 1;">
      {#if !$archived}
        <input
          class="mr-2"
          type="checkbox"
          bind:checked={todo.data.done}
          on:change={save}
        />
      {/if}
      <input
        class="d-inline border-0 {todo.data.done ? 'text-muted' : ''}"
        style="flex-grow: 1; background: transparent; color: inherit;"
        type="text"
        bind:value={todo.data.name}
        on:change={save}
      />
    </span>
    {#if !isOwner}
      <span
        class="ml-md-2 {todo.data.done ? 'text-muted' : ''}"
        style="flex-shrink: 1;"
      >
        <span class="badge badge-primary">
          {todo.data.user.data.name || 'Loading...'}
        </span>
      </span>
    {/if}
    {#if todo.data.acWrite.length}
      <span
        class="ml-md-2 {todo.data.done ? 'text-muted' : ''}"
        style="flex-shrink: 1;"
      >
        <span class="badge badge-success">shared</span>
      </span>
    {/if}
    <span
      class="ml-md-2 {todo.data.done ? 'text-muted' : ''}"
      style="flex-shrink: 1;"
    >
      {createdDate}
    </span>
    <button
      type="button"
      on:click={() => (expanded = !expanded)}
      class="ml-md-2 btn btn-link btn-sm"
      style="flex-shrink: 1;"
    >
      <i class="fas fa-caret-{expanded ? 'up' : 'down'}" />
    </button>
  </span>
  {#if expanded}
    <div class="mt-2">
      <div>
        Owner:
        <span class="badge badge-primary">
          {todo.data.user.data.name || 'Loading...'}
        </span>
      </div>
      <div>
        Created:
        <span class="badge badge-secondary">{createdDate}</span>
      </div>
      <div>
        Modified:
        <span class="badge badge-secondary">{modifiedDate}</span>
      </div>
      <div>
        Shared with:
        <ul class="list-group">
          {#each todo.data.acWrite as curUser (curUser.guid)}
            <li class="list-group-item d-flex align-items-center">
              <span style="flex-grow: 1">
                {curUser.data.name || 'Loading...'}
              </span>
              {#if isOwner}
                <span>
                  <button
                    class="btn btn-sm btn-danger"
                    on:click={() => unshare(curUser.guid)}
                  >
                    &times;
                  </button>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
      {#if isOwner}
        <div class="my-2">Share</div>
        <form class="form-inline" on:submit|preventDefault={share}>
          <input
            type="text"
            bind:value={shareUsername}
            class="form-control"
            placeholder="username"
          />
          <button type="submit" class="btn btn-secondary ml-sm-2 mt-sm-0 mt-2">
            share
          </button>
        </form>
      {/if}
    </div>
  {/if}
</div>

<script>
  import Todo from '../Entities/MyApp/Todo';
  import ErrHandler from '../ErrHandler';
  import { user, archived } from '../stores';

  export let todo = new Todo();
  let shareUsername = '';
  let expanded = false;

  $: createdDate = formatDate(new Date(todo.cdate * 1000));
  $: modifiedDate = formatDate(new Date(todo.mdate * 1000));
  $: isOwner = $user.is(todo.data.user);
  $: {
    if (todo && todo.data.user.isASleepingReference) {
      todo.readyAll(1).then(() => {
        todo = todo;
      }, ErrHandler);
    }
  }

  function formatDate(date) {
    return `${date.getFullYear()}-${
      date.getMonth() + 1 < 10
        ? '0' + (date.getMonth() + 1)
        : date.getMonth() + 1
    }-${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()} ${
      date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
    }:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
  }

  function share() {
    todo.share(shareUsername).then(result => {
      if (result) {
        shareUsername = '';
      } else {
        alert('Invalid user.');
      }
    }, ErrHandler);
  }

  function unshare(guid) {
    todo.unshare(guid).then(result => {
      if (!result) {
        alert('Invalid user.');
      }
    }, ErrHandler);
  }

  function save() {
    todo.save().then(() => (todo = todo), ErrHandler);
  }
</script>
