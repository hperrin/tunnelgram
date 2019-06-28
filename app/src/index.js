import './setup/authTokenHandler';
import './setup/icons';
import './setup/pnotify';
import { Nymph } from 'nymph-client';
import { User, Group } from 'tilmeld-client';
import { router } from './Services/router';
import './Services/OfflineServerCallsService';
import { cache } from './Services/EntityCacheService';
import { crypt } from './Services/EncryptionService';
import { storage } from './Services/StorageService';
import { urlBase64ToUint8Array } from './Services/urlBase64';
import { VideoService } from './Services/VideoService';
import Conversation from './Entities/Tunnelgram/Conversation';
import Message from './Entities/Tunnelgram/Message';
import AppPushSubscription from './Entities/Tunnelgram/AppPushSubscription';
import WebPushSubscription from './Entities/Tunnelgram/WebPushSubscription';
import Readline from './Entities/Tunnelgram/Readline';
import Settings from './Entities/Tunnelgram/Settings';
import Container from './Container';
import ErrHandler from './ErrHandler';

import { get } from 'svelte/store';
import * as stores from './stores';

import './scss/styles.scss';

// Register the ServiceWorker.
let swRegPromise = Promise.resolve(null);
if ('serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller) {
    swRegPromise = navigator.serviceWorker.getRegistration('/');
    swRegPromise.then(reg => {
      console.log('Service worker has been retrieved for scope: ' + reg.scope);
    });
  } else {
    swRegPromise = navigator.serviceWorker.register('/ServiceWorker.js', {
      scope: '/',
    });
    swRegPromise.then(reg => {
      console.log('Service worker has been registered for scope: ' + reg.scope);
    });
  }
}

// This stores the function to set up the Web Push Notification subscription.
let setupSubscription;

export function refreshAll() {
  cache.clear();

  const settings = get(stores.settings);
  if (settings != null) {
    settings.$init(settings.toJSON());
  }

  const conversation = get(stores.conversation);
  if (conversation.guid) {
    const newConv = new Conversation();
    newConv.$init(conversation.toJSON());
    stores.conversation.set(new Conversation());
    stores.conversation.set(newConv);
  }

  const conversations = get(stores.conversations);
  for (let i in conversations) {
    const newConv = new Conversation();
    newConv.$init(conversations[i].toJSON());
    conversations[i] = newConv;
  }
  stores.conversations.set(conversations);
}

let forwardCount = 0;
function navigateToContinueUrl() {
  const route = router.lastRouteResolved();
  if (route && route.url !== '/' && route.url !== '') {
    forwardCount++;
    if (forwardCount > 15) {
      console.log(route);
      debugger;
      return;
    }
    const url = route.url + (route.query !== '' ? '?' + route.query : '');
    router.navigate('/?continue=' + encodeURIComponent(url));
  }
}

window.addEventListener('beforeinstallprompt', e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  stores.beforeInstallPromptEvent.set(e);
});

// Everything is this function requires the logged in user status to be known.
(async () => {
  await stores.userReadyPromise;

  const conversationHandler = params => {
    if (!get(stores.user)) {
      return;
    }

    const guid = params && params.id ? parseFloat(params.id) : null;
    const view = (params && params.view) || 'conversation';
    const conversation = get(stores.conversation);
    const conversations = get(stores.conversations);
    let conv = null;

    if (guid === null) {
      conv = new Conversation();
    } else if (conversation.guid === guid) {
      conv = conversation;
    } else {
      for (let cur of conversations) {
        if (cur.guid === guid) {
          conv = cur;
          break;
        }
      }
    }

    if (conv) {
      stores.conversation.set(conv);
      stores.view.set(view);
      stores.convosOut.set(false);
    } else {
      stores.loadingConversation.set(true);
      crypt.ready.then(() => {
        Nymph.getEntity(
          {
            class: Conversation.class,
          },
          {
            type: '&',
            guid: guid,
          },
        ).then(
          conv => {
            stores.conversation.set(conv);
            stores.view.set(view);
            stores.convosOut.set(false);
            stores.loadingConversation.set(false);
          },
          err => {
            ErrHandler(err);
            stores.loadingConversation.set(false);
            router.navigate('/');
          },
        );
      });
    }
  };

  const userHandler = params => {
    const { username } = params;
    const user = get(stores.user);

    if (!user) {
      return;
    }

    stores.loadingUser.set(true);
    if (user.username === username) {
      stores.viewUser.set(user);
      stores.viewUserIsSelf.set(true);
      stores.view.set('user');
      stores.convosOut.set(false);
      stores.loadingUser.set(false);
    } else {
      crypt.ready.then(() => {
        User.byUsername(username).then(
          viewUser => {
            stores.viewUser.set(viewUser);
            stores.viewUserIsSelf.set(false);
            stores.view.set('user');
            stores.convosOut.set(false);
            stores.loadingUser.set(false);
          },
          err => {
            ErrHandler(err);
            stores.loadingUser.set(false);
            router.navigate('/');
          },
        );
      });
    }
  };

  router.hooks({
    before: (done, params) => {
      if (get(stores.user) === null) {
        done();
        navigateToContinueUrl();
      } else {
        done();
      }
    },
  });

  router
    .on(() => {
      stores.convosOut.set(true);
    })
    .on({
      c: { uses: conversationHandler },
      'c/:id': { uses: conversationHandler },
      'c/:id/:view': { uses: conversationHandler },
      'u/:username': { uses: userHandler },
      pushSubscriptions: () => {
        if (!get(stores.user)) {
          return;
        }

        stores.view.set('pushSubscriptions');
        stores.convosOut.set(false);
        stores.loadingConversation.set(false);
        stores.loadingUser.set(false);
      },
      'pwa-home': () => {
        router.navigate('/');
      },
    })
    .notFound(() => {
      router.navigate('/');
    })
    .resolve();

  stores.conversation.subscribe(conversation => {
    if (conversation && conversation.guid) {
      const conversations = get(stores.conversations);
      // Refresh conversations' readlines when current conversation changes.
      for (let i in conversations) {
        if (
          conversation === conversations[i] ||
          conversation.$is(conversations[i])
        ) {
          conversations[i] = conversation;
          stores.conversations.set(conversations);
          break;
        }
      }
    }
  });

  let previousUser = null;
  stores.user.subscribe(user => {
    if (previousUser !== user) {
      if (user != null) {
        // This is needed because the current user is added to acFull.
        stores.conversation.set(new Conversation());

        // Check for a continue route and navigate to it.
        const route = router.lastRouteResolved();
        if (route) {
          const queryMatch = route.query.match(
            /(?:^|&)continue=([^&]+)(?:&|$)/,
          );
          if (queryMatch) {
            router.navigate(decodeURIComponent(queryMatch[1]));
          }
        }

        if (setupSubscription) {
          setupSubscription();
        }

        // Get their settings.
        crypt.ready.then(() => {
          Settings.current().then(settings => {
            stores.settings.set(settings);
          });
        });
      } else if (previousUser != null && user == null) {
        // If the user logs out, clear everything.
        storage.clear();
        stores.conversations.set([]);
        stores.conversation.set(new Conversation());
        stores.settings.set(null);
        refreshAll();
        // And navigate to a continue URL, since the user doesn't have access.
        navigateToContinueUrl();
      }

      previousUser = user;
    }
  });

  (async () => {
    if (window.inCordova) {
      // Cordova OneSignal Push Subscriptions

      // When user consents to notifications, tell OneSignal.
      stores.requestNotificationPermission.set(() =>
        window.plugins.OneSignal.provideUserConsent(true),
      );

      // This won't resolve until the user allows notifications and OneSignal
      // registers the device and returns a player ID. This should only happen
      // after the user has logged in, so we can safely save it to the server.
      let playerId = await window.appPushPlayerIdPromise;
      if (playerId == null) {
        return;
      }

      // Push the playerId up to the server. (It will be updated if it already
      // exists.)
      const appPushSubscription = new AppPushSubscription();
      appPushSubscription.playerId = playerId;
      appPushSubscription.$save().catch(ErrHandler);
    } else {
      // Web Push Subscriptions
      if ((await swRegPromise) == null) {
        return;
      }

      // Support for push, notifications, and push payloads.
      const pushSupport = 'PushManager' in window;
      const notificationSupport =
        'showNotification' in ServiceWorkerRegistration.prototype;
      // Maybe I'll use these if I can figure out how to get payloads to work.
      // const payloadSupport = 'getKey' in PushSubscription.prototype;
      // const aesgcmSupport = PushManager.supportedContentEncodings.indexOf('aesgcm') > -1;

      if (pushSupport && notificationSupport) {
        setupSubscription = async () => {
          const registration = await swRegPromise;

          const getSubscription = async () => {
            return registration.pushManager.getSubscription();
          };

          const subscribeFromWorkerOrSelf = subscriptionOptions => {
            return new Promise((resolve, reject) => {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  command: 'subscribe',
                  subscriptionOptions: subscriptionOptions,
                });

                const messageListenerFunction = event => {
                  navigator.serviceWorker.removeEventListener(
                    'message',
                    messageListenerFunction,
                  );
                  switch (event.data.command) {
                    case 'subscribe-success':
                      resolve(getSubscription());
                      break;
                    case 'subscribe-failure':
                      reject(
                        'Subscription from worker failed: ' +
                          event.data.message,
                      );
                      break;
                    default:
                      reject('Invalid command: ' + event.data.command);
                      break;
                  }
                };

                navigator.serviceWorker.addEventListener(
                  'message',
                  messageListenerFunction,
                );
              } else {
                if (
                  subscriptionOptions.hasOwnProperty('applicationServerKey')
                ) {
                  subscriptionOptions.applicationServerKey = new Uint8Array(
                    subscriptionOptions.applicationServerKey,
                  );
                }

                registration.pushManager
                  .subscribe(subscriptionOptions)
                  .then(subscription => {
                    resolve(subscription);
                  })
                  .catch(error => {
                    reject('Subscription from self failed: ' + error.message);
                  });
              }
            });
          };

          // See if there is a subscription already.
          let subscription = await getSubscription();

          if (subscription) {
            stores.webPushSubscription.set(subscription);

            try {
              const webPushSubscriptionServerCheck = await Nymph.getEntity(
                {
                  class: WebPushSubscription.class,
                },
                {
                  type: '&',
                  strict: ['endpoint', subscription.endpoint],
                },
              );

              if (webPushSubscriptionServerCheck != null) {
                return;
              }
            } catch (e) {
              if (e.status !== 404) {
                throw e;
              }
            }
          } else {
            // The vapid key from the server.
            const vapidPublicKey = await WebPushSubscription.getVapidPublicKey();
            if (!vapidPublicKey) {
              return;
            }
            const convertedVapidKey = Array.from(
              urlBase64ToUint8Array(vapidPublicKey),
            );

            // Make the subscription.
            try {
              subscription = await subscribeFromWorkerOrSelf({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
              });
            } catch (e) {
              console.log('Push subscription failed: ' + e);
              return;
            }

            stores.webPushSubscription.set(subscription);
          }

          // And push it up to the server.
          const webPushSubscription = new WebPushSubscription();
          const subscriptionData = JSON.parse(JSON.stringify(subscription));
          webPushSubscription.endpoint = subscriptionData.endpoint;
          webPushSubscription.keys = {
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
          };
          webPushSubscription.$save().catch(ErrHandler);
        };

        // Set notification permission asker.
        stores.requestNotificationPermission.set(async () => {
          const permissionResult = await new Promise(async resolve => {
            const promise = Notification.requestPermission(value =>
              resolve(value),
            );
            if (promise) {
              resolve(await promise);
            }
          });

          if (permissionResult === 'denied' || permissionResult === 'default') {
            return;
          }

          setupSubscription();
        });

        if (Notification.permission === 'granted') {
          if (get(stores.user)) {
            setupSubscription();
          }
        }
      }
    }
  })();

  const loader = document.getElementById('initialLoader');
  if (loader) {
    loader.parentNode.removeChild(loader);
  }

  const app = new Container({
    target: document.querySelector('main'),
    props: {},
  });

  window.app = app;
})();

// Required for Cordova.
window.router = router;
// Useful for debugging.
window.stores = stores;
window.storeGet = get;
window.Nymph = Nymph;
window.User = User;
window.Group = Group;
window.Conversation = Conversation;
window.Message = Message;
window.AppPushSubscription = AppPushSubscription;
window.WebPushSubscription = WebPushSubscription;
window.Readline = Readline;
window.Settings = Settings;
window.VideoService = VideoService;
window.storage = storage;
window.cache = cache;
window.refreshAll = refreshAll;
