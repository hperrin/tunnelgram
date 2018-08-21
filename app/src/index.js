import './Services/XMLHttpRequestWrapper';
import './icons';
import Navigo from 'navigo';
import PNotify from 'pnotify/dist/es/PNotify';
import 'pnotify/dist/es/PNotifyMobile';
import 'pnotify/dist/es/PNotifyButtons';
import 'pnotify/dist/es/PNotifyDesktop';
import {Nymph, PubSub} from 'nymph-client';
import {User, Group} from 'tilmeld-client';
import './Services/OfflineServerCallsService';
import {crypt} from './Services/EncryptionService';
import {SleepyCacheService} from './Services/SleepyCacheService';
import {urlBase64ToUint8Array} from './Services/urlBase64';
import {VideoService} from './Services/VideoService';
import UserStore from './UserStore';
import Conversation from './Entities/Tunnelgram/Conversation';
import Message from './Entities/Tunnelgram/Message';
import WebPushSubscription from './Entities/Tunnelgram/WebPushSubscription';
import Readline from './Entities/Tunnelgram/Readline';
import Settings from './Entities/Tunnelgram/Settings';
import Container from './Container.html';
import ErrHandler from './ErrHandler';

import './scss/styles.scss';

// Register the ServiceWorker.
let swRegPromise = Promise.resolve(null);
if ('serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller) {
    swRegPromise = navigator.serviceWorker.getRegistration('/');
    swRegPromise.then(reg => {
      console.log('Service worker has been retrieved for scope: '+ reg.scope);
    });
  } else {
    swRegPromise = navigator.serviceWorker.register('/ServiceWorker.js', {
      scope: '/'
    });
    swRegPromise.then(reg => {
      console.log('Service worker has been registered for scope: '+ reg.scope);
    });
  }
}

// PNotify defaults.
PNotify.defaults.styling = 'bootstrap4';
PNotify.defaults.icons = 'fontawesome5';
PNotify.modules.Buttons.defaults.sticker = false;

// Sleepy caches.
const sleepyUserCacheService = new SleepyCacheService(User);
const sleepyGroupCacheService = new SleepyCacheService(Group);
const sleepyConversationCacheService = new SleepyCacheService(Conversation);
const sleepyMessageCacheService = new SleepyCacheService(Message);

// Router.
const router = new Navigo(null, true, '#');

// This stores the function to set up the Web Push Notification subscription.
let setupSubscription;

const store = new UserStore({
  brand: 'Tunnelgram',
  brandWeb: 'Tunnelgram.com',
  conversations: [],
  conversation: new Conversation(),
  view: 'conversation',
  convosOut: false,
  router: router,
  crypt: crypt,
  settings: null,
  disconnected: !navigator.onLine,
  decryption: true,
  requestNotificationPermission: () => {
    PNotify.modules.Desktop.permission();
  },
  requestPersistentStorage: () => {
    navigator.storage.persist();
  },
  beforeInstallPromptEvent: null,
  webPushSubscription: null,
  inPWA: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
});

store.constructor.prototype.navigate = (...args) => {
  router.navigate(...args);
};

store.constructor.prototype.refreshAll = function () {
  sleepyUserCacheService.clear();
  sleepyGroupCacheService.clear();
  sleepyConversationCacheService.clear();
  sleepyMessageCacheService.clear();

  const {settings} = store.get();
  if (settings != null) {
    settings.init(settings.toJSON());
  }

  const {conversation} = this.get();
  if (conversation.guid) {
    conversation.refresh().then(() => {
      this.set({conversation: new Conversation()});
      this.set({conversation});
    }, ErrHandler);
  }

  const {conversations} = this.get();
  const promises = [];
  for (let curConv of conversations) {
    promises.push(curConv.refresh());
  }
  Promise.all(promises).then(() => {
    this.set({conversations});
  }, ErrHandler);
};

store.constructor.prototype.getDisplayName = (user, prop, defaultValue = 'Loading...') => {
  const {settings} = store.get();
  if (settings != null && user.guid in settings.decrypted.nicknames) {
    return settings.decrypted.nicknames[user.guid];
  }
  return (prop in user.data && user.data[prop] != null) ? user.data[prop] : defaultValue;
};

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  store.set({beforeInstallPromptEvent: e});
});

PubSub.on('connect', () => store.set({disconnected: false}));
PubSub.on('disconnect', () => store.set({disconnected: true}));

// Everything is this function requires the logged in user status to be known.
(async () => {
  await store.get().ready;

  store.on('state', ({changed, current, previous}) => {
    let {conversation, conversations} = current;

    if (changed.conversation && !changed.conversations && conversation && conversation.guid) {
      // Refresh conversations' readlines when current conversation changes.
      for (let curConv of conversations) {
        if (curConv != null && conversation != null && conversation === curConv) {
          // They are the same instance, so mark conversations as changed.
          store.set({conversations});
          break;
          // If they are the same entity, but different instances, the next code
          // block will update conversations.
        }
      }
    }

    // 'conversation' and the corresponding entity in 'conversations' should be
    // the same instance, so check to make sure they are.
    if ((changed.conversations || changed.conversation) && conversation && conversation.guid) {
      const idx = conversation.arraySearch(conversations);

      if (idx !== false && conversation !== conversations[idx]) {
        // Check both of their modified dates. Whichever is most recent wins.
        if (conversations[idx].mdate > conversation.mdate) {
          conversation = conversations[idx];
          store.set({conversation});
        } else {
          conversations[idx] = conversation;
          store.set({conversations});
        }
      }
    }

    if (changed.conversations && conversations.length === 0) {
      router.navigate('/c');
    }

    if (changed.decryption) {
      crypt.decryption = current.decryption;
      store.refreshAll();
    }

    if (changed.user) {
      if (current.user) {
        const route = router.lastRouteResolved();
        const queryMatch = route.query.match(/(?:^|&)continue=([^&]+)(?:&|$)/);
        if (queryMatch) {
          router.navigate(decodeURIComponent(queryMatch[1]));
        }

        if (setupSubscription) {
          setupSubscription();
        }

        // If the user logs in, get their settings.
        if (current.settings == null || !current.user.is(previous.user)) {
          store.set({settings: null});
          crypt.ready.then(() => {
            Settings.current().then(settings => {
              store.set({settings});
            });
          });
        }
      } else if (current.user === null) {
        // If the user logs out, clear everything.
        store.set({
          user: null,
          conversations: [],
          conversation: new Conversation(),
          settings: null
        });
        store.refreshAll();
        // And navigate to the home screen.
        router.navigate('/');
      }
    }
  });

  if (store.get().user != null) {
    // Get the current settings.
    crypt.ready.then(() => {
      Settings.current().then(settings => {
        store.set({settings});
      });
    });
  }

  (async () => {
    if ((await swRegPromise) == null) {
      return;
    }

    // Support for push, notifications, and push payloads.
    const pushSupport = 'PushManager' in window;
    const notificationSupport = 'showNotification' in ServiceWorkerRegistration.prototype;
    // Maybe I'll use these if I can figure out how to get payloads to work.
    // const payloadSupport = 'getKey' in PushSubscription.prototype;
    // const aesgcmSupport = PushManager.supportedContentEncodings.indexOf('aesgcm') > -1;

    if (pushSupport && notificationSupport) {
      setupSubscription = async () => {
        const getSubscription = () => {
          return navigator.serviceWorker.ready.then(registration => {
            return registration.pushManager.getSubscription();
          });
        };

        const subscribeFromWorker = subscriptionOptions => {
          return new Promise((resolve, reject) => {
            if (!navigator.serviceWorker.controller) {
              reject(new Error('There is no service worker.'));
              return;
            }

            navigator.serviceWorker.controller.postMessage({
              command: 'subscribe',
              subscriptionOptions: subscriptionOptions
            });

            const messageListenerFunction = event => {
              navigator.serviceWorker.removeEventListener('message', messageListenerFunction);
              switch (event.data.command) {
                case 'subscribe-success':
                  resolve(getSubscription());
                  break;
                case 'subscribe-failure':
                  reject(new Error('Subscription failed: ' + event.data.message));
                  break;
                default:
                  reject(new Error('Invalid command: ' + event.data.command));
                  break;
              }
            };

            navigator.serviceWorker.addEventListener('message', messageListenerFunction);
          });
        };


        // See if there is a subscription already.
        const existingSubscription = await getSubscription();

        if (existingSubscription) {
          store.set({webPushSubscription: existingSubscription});
          return;
        }

        // The vapid key from the server.
        const vapidPublicKey = await WebPushSubscription.getVapidPublicKey();
        if (!vapidPublicKey) {
          return;
        }
        const convertedVapidKey = Array.from(urlBase64ToUint8Array(vapidPublicKey));

        // Make the subscription.
        const subscription = JSON.parse(JSON.stringify(await subscribeFromWorker({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        })));

        store.set({webPushSubscription: subscription});

        // And push it up to the server.
        const webPushSubscription = new WebPushSubscription();
        webPushSubscription.set({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        });
        webPushSubscription.save().catch(ErrHandler);
      };

      // Set notification permission asker.
      store.set({requestNotificationPermission: async () => {
        const permissionResult = await new Promise(async resolve => {
          const promise = Notification.requestPermission(value => resolve(value));
          if (promise) {
            resolve(await promise);
          }
        });

        if (permissionResult === 'denied' || permissionResult === 'default') {
          return;
        }

        setupSubscription();
      }});

      if (Notification.permission === 'granted') {
        if (store.get().user) {
          setupSubscription();
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
    data: {},
    store
  });

  const conversationHandler = params => {
    const {conversations} = store.get();
    const guid = parseFloat(params.id);
    let conversation = null;
    for (let cur of conversations) {
      if (cur.guid === guid) {
        conversation = cur;
        break;
      }
    }
    store.set({loadingConversation: true});
    if (conversation) {
      store.set({
        conversation: conversation,
        view: params.view || 'conversation',
        convosOut: false,
        loadingConversation: false
      });
    } else {
      crypt.ready.then(() => {
        Nymph.getEntity({
          'class': Conversation.class
        }, {
          'type': '&',
          'guid': guid
        }).then(conversation => {
          store.set({
            conversation: conversation,
            view: params.view || 'conversation',
            convosOut: false,
            loadingConversation: false
          });
        }, (err) => {
          ErrHandler(err);
          store.set({loadingConversation: false});
          router.navigate('/');
        });
      });
    }
  };

  const userHandler = params => {
    const {username} = params;
    const {user} = store.get();
    store.set({loadingUser: true});
    if (user.data.username === username) {
      store.set({
        viewUser: user,
        viewUserIsSelf: true,
        view: 'user',
        convosOut: false,
        loadingUser: false
      });
    } else {
      crypt.ready.then(() => {
        User.byUsername(username).then(viewUser => {
          store.set({
            viewUser,
            viewUserIsSelf: false,
            view: 'user',
            convosOut: false,
            loadingUser: false
          });
        }, (err) => {
          ErrHandler(err);
          store.set({loadingUser: false});
          router.navigate('/');
        });
      });
    }
  };

  let forwardCount = 0;
  router.hooks({
    before: (done, params) => {
      if (!store.get().user) {
        const route = router.lastRouteResolved();
        if (route.url !== '/' && route.url !== '') {
          forwardCount++;
          if (forwardCount > 15) {
            debugger;
          }
          const url = route.url + (route.query !== '' ? '?'+route.query : '');
          router.navigate('/?continue='+encodeURIComponent(url));
        }
        done(false);
      } else {
        done();
      }
    }
  });

  router.on({
    'c/:id': {uses: conversationHandler},
    'c/:id/:view': {uses: conversationHandler},
    'c': () => {
      const conversation = new Conversation();
      store.set({
        conversation: conversation,
        view: 'conversation',
        convosOut: false
      });
    },
    'u/:username': {uses: userHandler},
    'pwa-home': () => {
      store.set({
        convosOut: true
      });
    },
    '*': () => {
      if (store.get().user) {
        router.navigate('/pwa-home');
      }
    }
  }).resolve();
})();

// useful for debugging!
window.store = store;
window.router = router;
window.Nymph = Nymph;
window.User = User;
window.Group = Group;
window.sleepyUserCacheService = sleepyUserCacheService;
window.sleepyGroupCacheService = sleepyGroupCacheService;
window.VideoService = VideoService;
