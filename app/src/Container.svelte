{#if !cryptoAvailable}
  <div class="container">
    <div class="lead py-3">
      Your browser doesn't support the Crypto API, and therefore can't do secure
      encryption. Unfortunately, this means {$brand} will not work on this browser.
    </div>
    <div class="lead py-3">
      You should update your browser to the latest version in order to use {$brand}.
    </div>
  </div>
{:else}
  <div class="d-flex flex-column flex-grow-1" style="min-height: 100%;">
    {#if $user === false}
      <div
        class="d-flex justify-content-center align-items-center flex-grow-1"
        style="height: 100%;"
      >
        <div
          style="background-image: url(images/android-chrome-192x192.png);
          background-size: cover; position: absolute; width: 120px; height:
          120px;"
        />
        <LoadingIndicator width="300" height="300" />
      </div>
    {/if}
    {#if $user === null}
      <nav
        class="navbar navbar-expand-lg navbar-dark bg-dark"
        style="height: max-content;"
      >
        <div class="container-fluid">
          <span class="navbar-brand align-items-center">
            <span>{$brand}</span>
          </span>
        </div>
      </nav>
      <div class="bg-light text-dark">
        <div class="container mt-3">
          <div class="row">
            <div
              class="login-container col-md-4 order-md-2 mb-3 d-flex
              justify-content-center align-items-start flex-grow-1"
            >
              <div class="card" style="width: 100%;">
                <div class="card-body pb-0">
                  <Login
                    layout="small"
                    classInput="form-control w-100"
                    classSelect="form-control w-100"
                    classTextarea="form-control w-100"
                    classSubmit="btn btn-primary w-100"
                    classButtonGroup="btn-group d-flex"
                    classButton="btn btn-secondary"
                    classButtonToggle="flex-grow-1"
                    classButtonActive="active"
                    disableActiveButton={false}
                  />
                </div>
              </div>
            </div>
            <div class="col-md-8 order-md-1 mb-3">
              <FrontPage />
            </div>
          </div>
          <div class="text-center mb-3">
            &copy; Copyright 2018-2019 Hunter Perrin. All rights reserved.
            <a
              href="https://privacypolicies.com/privacy/view/9a6babae40ff5a59c22da2ce37c7f2da">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    {/if}
    {#if $user && $user.guid}
      <div
        class="container-fluid d-flex flex-column flex-grow-1 p-0 m-0"
        style="height: 0;"
      >
        {#await crypt.ready}
          <div
            class="d-flex flex-column align-items-center justify-content-center"
            style="height: 200px;"
          >
            <LoadingIndicator width="100" height="100" />
            <h3>Setting up encryption...</h3>
          </div>
          <div class="text-center text-muted">
            <small>
              Stuck?
              <a href="javascript:void(0)" on:click={logout}>Log Out</a>
            </small>
          </div>
        {:then unused}
          <App />
        {:catch cryptError}
          <div class="container alert alert-primary">
            {#if cryptError.name === 'ReLogInNeededError'}
              You've upgraded your encryption on another device, so you'll need
              to log out here and log back in to enable the new encryption.
            {:else if cryptError.name === 'EncryptionUpgradeNeededError'}
              <div>
                {$brand} has a new encryption method. In order to upgrade, you'll
                need to log out and log back in. Your private key will be printed
                below. If you don't remember your password, ask an administrator
                how you can reset your account with this key. Copy it verbatim from
                below to a safe place before logging out.
              </div>
              <div>
                <textarea
                  bind:this={privateKeyElem}
                  on:click={copyPrivateKey}
                  readonly
                  style="width: 100%; height: 150px;">{cryptError.privateKey}
                </textarea>
              </div>
              <div>
                This is a great time to try out a password manager, like
                <a href="https://bitwarden.com/" target="_blank">BitWarden.</a>
              </div>
            {:else}
              Error during encryption setup: {cryptError}
            {/if}
            <div>
              <a href="javascript:void(0)" on:click={logout}>Log Out</a>
            </div>
          </div>
        {/await}
      </div>
    {/if}
  </div>
{/if}

<script>
  import { User } from 'tilmeld-client';
  import { info } from '@pnotify/core';
  import Login from 'tilmeld-components/src/Login';
  import LoadingIndicator from './App/LoadingIndicator';
  import FrontPage from './App/FrontPage';
  import App from './App/App';
  import { crypt } from './Services/EncryptionService';
  import { logout, brand, user } from './stores';

  let privateKeyElem;

  const cryptoAvailable = (() => {
    return !!(window.crypto || window.msCrypto).getRandomValues;
  })();

  function copyPrivateKey() {
    privateKeyElem.select();
    document.execCommand('copy');
    info({
      text: 'Copied to Clipboard',
    });
  }
</script>

<style>
  .login-container :global(.login-dialog-container, .login-dialog) {
    width: 100%;
  }
</style>
