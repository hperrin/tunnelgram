{#await subscriptionsPromise}
  <div
    class="d-flex align-items-center justify-content-center"
    style="height: 200px;"
  >
    <div class="col-auto">
      <LoadingIndicator width="50" height="50" />
    </div>
  </div>
{:then unused}
  {#if !subscriptions || !subscriptions.length}
    <div class="mt-3">You've got no {name} push subscriptions.</div>
  {:else}
    <div class="list-group mt-3 text-body">
      {#each subscriptions as subscription (subscription.guid)}
        <div class="list-group-item flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between align-items-start">
            <h5 class="mb-1">
              {#if showBrowser}
                {subscription.$agent.browser.name || ''}
                {subscription.$agent.browser.version || ''}
              {:else}
                {subscription.$agent.os.name || ''}
                {subscription.$agent.os.version || ''}
              {/if}
            </h5>
            <button
              type="button"
              class="btn btn-sm btn-danger rounded-circle"
              on:click={() => remove(subscription)}
              disabled={subscription.$deleting}
            >
              <i
                class="fas fa-times text-white d-inline-block"
                style="width: 1em; height: 1em;"
              />
            </button>
          </div>
          <p class="mb-1 d-flex flex-column">
            {#if showBrowser}
              <span>
                {subscription.$agent.os.name || ''}
                {subscription.$agent.os.version || ''}
              </span>
            {/if}
            <span>
              {subscription.$agent.device.vendor || ''}
              {subscription.$agent.device.model || ''}
            </span>
          </p>
          <small
            title={new SimpleDateFormatter(subscription.cdate).format('wymdhms', 'short')}
          >
            Created: {new SimpleDateFormatter(subscription.cdate).format('ago', 'long')}
          </small>
          /
          <small
            title={new SimpleDateFormatter(subscription.mdate).format('wymdhms', 'short')}
          >
            Last used: {new SimpleDateFormatter(subscription.mdate).format('ago', 'long')}
          </small>
        </div>
      {/each}
    </div>
  {/if}
{:catch err}
  <div class="mt-3">An error occurred: {JSON.stringify(err)}</div>
{/await}

<script>
  import { Nymph } from 'nymph-client';
  import UAParser from 'ua-parser-js';
  import LoadingIndicator from '../LoadingIndicator';
  import { SimpleDateFormatter } from '../../Services/SimpleDateFormatter';
  import ErrHandler from '../../ErrHandler';
  import { user } from '../../stores';

  export let name;
  export let entity;
  export let showBrowser;
  let subscriptions;
  let subscriptionsPromise = Nymph.getEntities(
    {
      class: entity.class,
      sort: 'mdate',
      reverse: true,
    },
    {
      type: '&',
      ref: ['user', $user.guid],
    },
  )
    .then(
      subs =>
        (subscriptions =
          subs.forEach(s => (s.$agent = UAParser(s.uaString))) || subs),
    )
    .catch(ErrHandler);

  function remove(subscription) {
    subscription.$deleting = true;
    subscriptions = subscriptions;
    subscription.$delete().then(
      () => {
        const idx = subscription.$arraySearch(subscriptions);
        if (idx !== false) {
          subscriptions.splice(idx, 1);
          subscriptions = subscriptions;
        }
      },
      err => {
        subscription.$deleting = false;
        subscriptions = subscriptions;
        ErrHandler(err);
      },
    );
  }
</script>
