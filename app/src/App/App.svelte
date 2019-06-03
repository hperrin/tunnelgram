<div>
  {#if _loading}
    <div class="row align-items-center justify-content-center" style="height: 200px;">
      <div class="col-auto">
        <LoadingIndicator width="50px" height="50px" />
      </div>
    </div>
  {:else}
    <div class="row">
      <div class="col-sm-8 mb-3">
        <div class="list-group">
          {#if $todos.length}
            {#each $todos as todo (todo.guid)}
              <TodoEl bind:todo={todo}></TodoEl>
            {/each}
          {:else}
            <div class="alert alert-secondary">You have no todos yet.</div>
          {/if}
        </div>
      </div>
      <div class="col-sm-4 mb-3">
        <small class="alert alert-info d-block text-center">
          {#if $archived}
            <span>{$todos.length} archived todos</span>
          {:else}
            <span>
              {#if $todos.length == 0}
                <span>0 todos</span>
              {:else}
                <span>{remaining} of {$todos.length} remaining</span>
              {/if}
            </span>
          {/if}
          {#if $todos.length > 0}
            <span class="d-block mt-2">
              {#if $archived}
                <button type="button" class="btn btn-danger btn-sm" style="white-space: normal;" on:click={deleteTodos}>delete archived todos</button>
              {:else}
                <button type="button" class="btn btn-success btn-sm" style="white-space: normal;" on:click={archive}>archive completed todos</button>
              {/if}
            </span>
          {/if}
        </small>
        {#if $todos.length > 1}
          <div>
            Sort: <br>
            <label class="font-weight-normal">
              <input type="radio" bind:group={$sort} on:change={sortTodos} name="sort" value="name"> Alpha</label>
            &nbsp;&nbsp;&nbsp;
            <label class="font-weight-normal">
              <input type="radio" bind:group={$sort} on:change={sortTodos} name="sort" value="cdate"> Created</label>
          </div>
        {/if}
      </div>
    </div>
    {#if !$archived}
      <form class="d-flex my-3" on:submit|preventDefault={addTodo}>
        <input class="form-control mr-2" style="flex-grow: 1;" type="text" bind:value={todoText} placeholder="add new todo here">
        <input class="btn btn-primary" type="submit" value="add #{$todos.length + 1}">
      </form>
    {/if}
    <div class="user-count badge badge-secondary position-fixed" style="right: 5px; bottom: 5px;" title="How many open sessions you have.">
      Active Sessions: {userCount}
    </div>
  {/if}
</div>

<script>
  import {onDestroy} from 'svelte';
  import {Nymph, PubSub} from 'nymph-client';
  import Todo from '../Entities/MyApp/Todo';
  import LoadingIndicator from './LoadingIndicator';
  import TodoEl from './TodoEl';
  import ErrHandler from '../ErrHandler';
  import {todos, sort, archived, user} from '../stores';

  let userCount = null;
  let todoText = '';
  let subscription;
  let _loading = false;

  $: remaining = $todos.filter(todo => !todo.get().done).length;

  let previousUser;
  let previousArchived;
  $: {
    if ($user && (!$user.is(previousUser) || previousArchived !== $archived)) {
      subscribe();
    }
    previousUser = $user;
    previousArchived = $archived;
  }

  onDestroy(() => {
    if (subscription) {
      subscription.unsubscribe();
    }
  });

  function subscribe () {
    if (subscription) {
      subscription.unsubscribe();
    }

    _loading = true;

    subscription = Nymph.getEntities({
      'class': Todo.class
    }, {
      'type': $archived ? '&' : '!&',
      'tag': 'archived'
    }, {
      'type': '|',
      'ref': [ // Request per user to have per user userCount.
        ['user', $user.guid],
        ['acWrite', $user.guid]
      ]
    }).subscribe(update => {
      _loading = false;
      if (update) {
        PubSub.updateArray($todos, update);
        $todos = Nymph.sort($todos, $sort);
      }
    }, ErrHandler, count => {
      userCount = count;
    });
  }

  function addTodo () {
    if (todoText === undefined || todoText === '') {
      return;
    }
    const todo = new Todo();
    todo.set('name', todoText);
    todo.save().then(() => {
      todoText = '';
    }, ErrHandler);
  }

  function sortTodos () {
    $todos = Nymph.sort($todos, $sort);
  }

  function save (todo) {
    todo.save().then(null, ErrHandler);
  }

  function archive () {
    const oldTodos = [...$todos];
    for (let i = 0; i < oldTodos.length; i++) {
      const todo = oldTodos[i];
      if (todo.get().done) {
        todo.archive().then(success => {
          if (!success) {
            alert("Couldn't save changes to "+todo.get().name);
          }
        }, ErrHandler);
      }
    }
  }

  function deleteTodos () {
    Nymph.deleteEntities($todos);
  }
</script>
