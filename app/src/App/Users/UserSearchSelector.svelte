<div class="{className} position-relative" bind:this={container}>
  <input
    type="search"
    class="form-control w-100"
    id="username"
    bind:this={usernameElem}
    placeholder="Username or name"
    on:keydown={event => handleUserSearchKeyDown(event)}
    bind:value={username}
    {disabled}
    autocomplete="off"
    on:focus={() => (showUserSearchDropdown = true)}
  />
  {#if !disabled && (localUsers.length || serverUsersLoading)}
    <div
      class="dropdown-menu mt-0 {showUserSearchDropdown ? 'show' : ''}"
      bind:this={userSearchDropdown}
    >
      {#each localUsers as user (user.guid)}
        <a
          class="d-flex justify-content-between align-items-center dropdown-item"
          href="javascript:void(0)"
          on:click={() => dispatch('user-selected', user)}
          on:keydown={event => handleUserSearchResultKeyDown(event)}
        >
          <span>
            <span class="mr-2">
              <Avatar bind:user />
            </span>
            <DisplayName bind:user />
            ({user.username})
          </span>
        </a>
      {/each}
      {#if serverUsersLoading}
        <span class="dropdown-item-text d-flex justify-content-center">
          <LoadingIndicator width="18" height="18" />
        </span>
      {:else if serverUsers.length}
        <span class="dropdown-item-text d-flex justify-content-center my-2">
          Others
        </span>
        {#each serverUsers as user (user.guid)}
          <a
            class="d-flex justify-content-between align-items-center
            dropdown-item"
            href="javascript:void(0)"
            on:click={() => dispatch('user-selected', user)}
            on:keydown={event => handleUserSearchResultKeyDown(event)}
          >
            <span>
              <span class="mr-2">
                <Avatar bind:user />
              </span>
              <DisplayName bind:user />
              ({user.username})
            </span>
          </a>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { Nymph } from 'nymph-client';
  import { User } from 'tilmeld-client';
  import Avatar from './Avatar';
  import DisplayName from './DisplayName';
  import LoadingIndicator from '../LoadingIndicator';
  import { conversations, settings, user } from '../../stores';

  const dispatch = createEventDispatcher();

  export let className = '';
  export let disabled = false;
  let localUsers = [];
  let serverUsers = [];
  let serverUsersLoading = false;
  let username = '';
  let usernameElem;
  let userSearchDropdown;
  let showUserSearchDropdown = false;
  let userSearchTimer = null;
  let container;
  let destroyed = false;
  let bodyClickHandler = event => {
    let hide = false;
    let target = event.target;
    while (target.parentNode) {
      if (target === container) {
        break;
      }
      if (target === document.body) {
        hide = true;
        break;
      }
      target = target.parentNode;
    }
    if (hide) {
      showUserSearchDropdown = false;
    }
  };

  let previousUsername = username;
  $: if (previousUsername !== username) {
    previousUsername = username;
    const searchQuery = username.toLowerCase();
    localUsers = [];
    serverUsers = [];
    serverUsersLoading = false;
    if (searchQuery.length >= 2) {
      // Search for users in the conversations in cache.
      let startsWithUsers = [];
      let containUsers = [];
      $conversations.map(conversation => {
        conversation.acFull.map(searchUser => {
          if ($user.$is(searchUser) || searchUser.$isASleepingReference) {
            return;
          }
          let name = searchUser.name.toLowerCase();
          if (searchUser.guid in $settings.$decrypted.nicknames) {
            name = $settings.$decrypted.nicknames[
              searchUser.guid
            ].toLowerCase();
          }
          if (
            name.startsWith(searchQuery) ||
            searchUser.username.toLowerCase().startsWith(searchQuery)
          ) {
            if (!searchUser.$inArray(startsWithUsers)) {
              startsWithUsers.push(searchUser);
            }
          } else if (
            name.includes(searchQuery) ||
            searchUser.username.toLowerCase().includes(searchQuery)
          ) {
            if (!searchUser.$inArray(containUsers)) {
              containUsers.push(searchUser);
            }
          }
        });
      });
      localUsers = [...startsWithUsers, ...containUsers];
      serverUsersLoading = true;
      if (userSearchTimer) {
        window.clearTimeout(userSearchTimer);
      }
      userSearchTimer = window.setTimeout(async () => {
        const guids = [];
        for (let guid in $settings.$decrypted.nicknames) {
          if (
            $settings.$decrypted.nicknames[guid]
              .toLowerCase()
              .includes(searchQuery)
          ) {
            guids.push(guid);
          }
        }
        const nickPromise = guids.length
          ? Nymph.getEntities(
              {
                class: User.class,
              },
              {
                type: '|',
                guid: guids,
              },
            )
          : Promise.resolve([]);

        const firstArgs = [
          {
            class: User.class,
            limit: 10,
          },
          {
            type: '&',
            '!guid': [
              ...Object.keys($settings.$decrypted.nicknames),
              $user.guid,
              ...localUsers.map(user => user.guid),
            ],
          },
        ];
        const unPromise = Nymph.getEntities(...firstArgs, {
          type: '&',
          ilike: ['username', searchQuery + '%'],
        });
        const namePromise = Nymph.getEntities(...firstArgs, {
          type: '&',
          ilike: ['name', '%' + searchQuery + '%'],
        });

        const nickUsers = await nickPromise;
        const unUsers = await unPromise;
        const nameUsers = await namePromise;

        if (destroyed) {
          return;
        }

        for (let i = nickUsers.length - 1; i >= 0; i--) {
          if (nickUsers[i].$inArray(localUsers)) {
            nickUsers.splice(i, 1);
          }
        }
        for (let i = nameUsers.length - 1; i >= 0; i--) {
          if (nameUsers[i].$inArray(unUsers)) {
            nameUsers.splice(i, 1);
          }
        }

        serverUsersLoading = false;
        serverUsers = [...nickUsers, ...unUsers, ...nameUsers];
      }, 150);
    }
  }

  onMount(() => {
    document.body.addEventListener('click', bodyClickHandler);
  });

  onDestroy(() => {
    destroyed = true;
    document.body.removeEventListener('click', bodyClickHandler);
  });

  function handleUserSearchKeyDown(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
    } else if (event.keyCode === 40 && userSearchDropdown) {
      const firstResult = userSearchDropdown.querySelector('.dropdown-item');
      if (firstResult) {
        firstResult.focus();
        firstResult.scrollIntoView(false);
        event.preventDefault();
      }
    }
  }

  function handleUserSearchResultKeyDown(event) {
    if (event.keyCode === 38) {
      let previousEl = event.target.previousElementSibling;
      while (previousEl && !previousEl.classList.contains('dropdown-item')) {
        previousEl = event.target.previousElementSibling;
      }
      if (previousEl) {
        previousEl.focus();
        previousEl.scrollIntoView(false);
      } else {
        usernameElem.focus();
      }
      event.preventDefault();
    } else if (event.keyCode === 40) {
      let nextEl = event.target.nextElementSibling;
      while (nextEl && !nextEl.classList.contains('dropdown-item')) {
        nextEl = event.target.nextElementSibling;
      }
      if (nextEl) {
        nextEl.focus();
        nextEl.scrollIntoView(false);
        event.preventDefault();
      }
    }
  }

  export function clear() {
    username = '';
  }

  export function focus() {
    usernameElem.focus();
    showUserSearchDropdown = true;
  }
</script>
