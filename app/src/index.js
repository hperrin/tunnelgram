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
import UserStore from './UserStore';
import Conversation from './Entities/Conversation';
import Message from './Entities/Message';
import Container from './Container.html';
import ErrHandler from './ErrHandler';

import './scss/styles.scss';

PNotify.defaults.styling = 'bootstrap4';
PNotify.defaults.icons = 'fontawesome5';
PNotify.modules.Buttons.defaults.sticker = false;

if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
  // Register the caching ServiceWorker
  navigator.serviceWorker.register('/service-worker.js', {
    scope: '/'
  }).then(function(reg) {
    console.log('Service worker has been registered for scope: '+ reg.scope);
  });
}

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
