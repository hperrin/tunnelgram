{#if $user === false}
  <div class="container" style="height: 100vh;">
    <div
      class="row align-items-center justify-content-center"
      style="height: 100vh;"
    >
      <div class="col-auto">
        <LoadingIndicator width="200px" height="200px" />
      </div>
    </div>
  </div>
{/if}
{#if $user !== false}
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <span class="navbar-brand mb-0 h1">{brand}</span>
      {#if $user}
        <button
          class="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon" />
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav mr-auto">
            <NavBar />
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle p-0"
                href="javascript:void(0)"
                id="userDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <img
                  class="rounded-circle"
                  src={$userAvatar ? $userAvatar : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoAgMAAADxkFD+AAAACVBMVEXMzMyWlpa3t7fI5tFIAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAF0lEQVQYlWNgGOagiQPOdGQZQHdQGQAArI4A0FwgBeUAAAAASUVORK5CYII='}
                  alt={$user.data.nameFirst}
                />
              </a>
              <div
                class="dropdown-menu dropdown-menu-right"
                aria-labelledby="userDropdown"
              >
                <h6 class="dropdown-header">{$user.data.name}</h6>
                <a
                  class="dropdown-item"
                  href="javascript:void(0)"
                  data-toggle="modal"
                  data-target="#accountInfoModal"
                >
                  Account Info
                </a>
                <div class="dropdown-divider" />
                <a
                  class="dropdown-item"
                  href="javascript:void(0)"
                  on:click={logout}
                >
                  Log Out
                </a>
                {#if $userIsTilmeldAdmin}
                  <div class="dropdown-divider" />
                  <h6 class="dropdown-header">Admin</h6>
                  <a class="dropdown-item" href="/user/" target="_blank">
                    User Admin App
                  </a>
                {/if}
              </div>
            </li>
          </ul>
        </div>
      {/if}
    </div>
  </nav>
{/if}
{#if $user === null}
  <div class="container mt-3">
    <div class="row">
      <div class="col-sm-4 order-sm-2">
        <Login
          layout="small"
          classInput="form-control"
          classSelect="form-control"
          classTextarea="form-control"
          classSubmit="btn btn-primary"
          classButtonGroup="btn-group d-flex"
          classButton="btn btn-secondary"
          classButtonToggle="flex-grow-1"
          classButtonActive="active"
          disableActiveButton={false}
        />
      </div>
      <div class="col-sm-8 order-sm-1">
        <FrontPage {brand} />
      </div>
    </div>
  </div>
{/if}
{#if $user}
  <div class="container mt-3">
    <App />
  </div>
  <div
    class="modal fade"
    id="accountInfoModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="accountInfoModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="accountInfoModalLabel">Account info</h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="accountDetailsEmail">Email address</label>
            <input
              type="email"
              class="form-control"
              id="accountDetailsEmail"
              bind:value={$user.data.username}
              placeholder="Enter email"
            />
          </div>
          <div class="form-group">
            <label for="accountDetailsFirstName">First name</label>
            <input
              type="text"
              class="form-control"
              id="accountDetailsFirstName"
              bind:value={$user.data.nameFirst}
              placeholder="Enter name"
            />
          </div>
          <div class="form-group">
            <label for="accountDetailsLastName">Last name</label>
            <input
              type="text"
              class="form-control"
              id="accountDetailsLastName"
              bind:value={$user.data.nameLast}
              placeholder="Enter name"
            />
          </div>
          <div class="form-group">
            <label for="accountDetailsPhone">Phone</label>
            <input
              type="tel"
              class="form-control"
              id="accountDetailsPhone"
              bind:value={$user.data.phone}
              placeholder="Enter phone number"
            />
          </div>
          {#if clientConfig.timezones}
            <div class="form-group">
              <label for="accountDetailsTimezone">Timezone</label>
              <select
                class="form-control"
                id="accountDetailsTimezone"
                bind:value={$user.data.timezone}
              >
                <option value="">--Default--</option>
                {#each clientConfig.timezones as tz}
                  <option value={tz}>{tz}</option>
                {/each}
              </select>
            </div>
          {/if}
          <div class="form-group">
            <span>Password</span>
            <ChangePassword
              layout="compact"
              classInput="form-control"
              classSubmit="btn btn-primary"
              classButton="btn btn-secondary"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary"
            data-dismiss="modal"
            on:click={saveUser}
          >
            Save changes
          </button>
          <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  import { onMount } from 'svelte';
  import { User } from 'tilmeld-client';
  import Login from 'tilmeld-components/src/Login';
  import ChangePassword from 'tilmeld-components/src/ChangePassword';
  import App from './App/App';
  import LoadingIndicator from './App/LoadingIndicator';
  import NavBar from './App/NavBar';
  import FrontPage from './App/FrontPage';
  import ErrHandler from './ErrHandler';
  import { user, userAvatar, userIsTilmeldAdmin, logout } from './stores';

  export let brand;
  let clientConfig = {};

  onMount(() => {
    // Get the client config (for timezones).
    User.getClientConfig().then(config => {
      clientConfig = config;
    });
  });

  function saveUser() {
    $user.save().then(userValue => {
      $user = userValue;
    }, ErrHandler);
  }

  function navbar(node) {
    const navbar = new NavBar({ target: node });
    return {
      update(data) {
        navbar.update(data);
      },
      destroy() {
        navbar.destroy();
      },
    };
  }
</script>
