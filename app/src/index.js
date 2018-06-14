import XMLHttpRequestWrapper from './Services/XMLHttpRequestWrapper';
import 'bootstrap';
import '@fortawesome/fontawesome';
import '@fortawesome/fontawesome-free-solid';
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
import UserStore from './UserStore';
import Conversation from './Entities/Conversation';
import Message from './Entities/Message';
import WebPushSubscription from './Entities/WebPushSubscription';
import Container from './Container.html';
import ErrHandler from './ErrHandler';

import './scss/styles.scss';

PNotify.defaults.styling = 'bootstrap4';
PNotify.defaults.icons = 'fontawesome5';
PNotify.modules.Buttons.defaults.sticker = false;

const sleepyUserCacheService = new SleepyCacheService(User);
const sleepyGroupCacheService = new SleepyCacheService(Group);
const sleepyConversationCacheService = new SleepyCacheService(Conversation);
const sleepyMessageCacheService = new SleepyCacheService(Message);
const router = new Navigo(null, true, '#!');

const store = new UserStore({
  conversations: [],
  conversation: new Conversation(),
  sort: 'mdate',
  view: 'conversation',
  convosOut: false,
  router: router,
  crypt: crypt,
  disconnected: !navigator.onLine,
  decryption: true,
  requestNotificationPermission: () => {
    PNotify.modules.Desktop.permission();
  },
  beforeInstallPromptEvent: null,
  inPWA: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
});

store.constructor.prototype.navigate = (...args) => {
  router.navigate(...args);
};

store.constructor.prototype.refreshAll = function () {
  const {conversation} = this.get();
  if (conversation.guid) {
    conversation.refresh().then(() => {
      this.set({conversation: new Conversation()});
      this.set({conversation});
    }, ErrHandler);
  }

  const {conversations} = this.get();
  for (let conversation of conversations) {
    conversation.refresh().then(() => {
      this.set({conversations});
    }, ErrHandler);
  }

  sleepyUserCacheService.clear();
  sleepyGroupCacheService.clear();
  sleepyConversationCacheService.clear();
  sleepyMessageCacheService.clear();
};

store.on('state', ({changed, current}) => {
  if (changed.conversation && current.conversation && current.conversation.guid) {
    const {conversation, conversations} = current;

    if (conversation.data.user.isASleepingReference) {
      conversation.readyAll(() => store.set({conversation}), ErrHandler, 1);
    }

    // Refresh conversations' readlines when current conversation changes.
    for (let curConv of conversations) {
      if (curConv != null && conversation != null) {
        if (conversation.guid === curConv.guid && curConv.readline < conversation.readline) {
          // They are the same entity, but different instances.
          curConv.readline = conversation.readline;
          store.set({conversations});
        } else if (conversation === curConv) {
          // They are the same instance, so just mark conversations as changed.
          store.set({conversations});
        }
      }
    }
  }

  if (changed.decryption) {
    crypt.decryption = current.decryption;
    store.refreshAll();
  }
});

PubSub.on('connect', () => store.set({disconnected: false}));
PubSub.on('disconnect', () => store.set({disconnected: true}));

// Register the caching and pushing ServiceWorker
(async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let registration;

  if (navigator.serviceWorker.controller) {
    registration = await navigator.serviceWorker.getRegistration('/');
    console.log('Service worker has been retrieved for scope: '+ registration.scope);
  } else {
    registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    console.log('Service worker has been registered for scope: '+ registration.scope);
  }

  // Support for push, notifications, and push payloads.
  const pushSupport = 'PushManager' in window;
  const notificationSupport = 'showNotification' in ServiceWorkerRegistration.prototype;
  const payloadSupport = 'getKey' in PushSubscription.prototype;

  // TODO(hperrin): Remove this after testing...
  const getCookieValue = a => {
    const b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
  };
  if (getCookieValue('EXPERIMENT_WEB_PUSH') !== 'true') {
    return;
  }
  // ... up to here.

  if (pushSupport && notificationSupport && payloadSupport) {
    const setupSubscription = async () => {
      // See if there is a subscription already.
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        return;
      }

      // The vapid key from the server.
      const vapidPublicKey = await WebPushSubscription.getVapidPublicKey();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Make the subscription.
      const subscription = JSON.parse(JSON.stringify(await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })));

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
      setupSubscription();
    }
  }
})();

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  store.set({beforeInstallPromptEvent: e});
});

const loader = document.getElementById('initialLoader');
if (loader) {
  loader.parentNode.removeChild(loader);
}

const app = new Container({
  target: document.querySelector('main'),
  data: {
    brand: 'Tunnelgram'
  },
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
  }
};

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
  'pwa-home': () => {
    if (store.get().user) {
      const conversation = new Conversation();
      store.set({
        conversation: conversation,
        view: 'conversation',
        convosOut: true
      });
    }
  },
  '*': () => {
    if (store.get().user) {
      router.navigate('/c');
    }
  }
}).resolve();

User.on('logout', () => {
  router.navigate('/');
});

// useful for debugging!
window.store = store;
window.Nymph = Nymph;
window.User = User;
window.Group = Group;
window.sleepyUserCacheService = sleepyUserCacheService;
window.sleepyGroupCacheService = sleepyGroupCacheService;
