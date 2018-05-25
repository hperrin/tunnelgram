import Navigo from 'navigo';
import PNotify from 'pnotify/dist/es/PNotify';
import 'pnotify/dist/es/PNotifyMobile';
import 'pnotify/dist/es/PNotifyButtons';
import 'pnotify/dist/es/PNotifyDesktop';
import {Nymph} from 'nymph-client';
import {User, Group} from 'tilmeld-client';
import {crypt} from './Services/EncryptionService.js';
import {SleepyCacheService} from './Services/SleepyCacheService.js';
import UserStore from './UserStore';
import Conversation from './Entities/Conversation.js';
import Container from './Container.html';
import ErrHandler from './ErrHandler';

PNotify.defaults.styling = 'bootstrap4';
PNotify.defaults.icons = 'fontawesome5';
PNotify.modules.Buttons.defaults.sticker = false;
PNotify.modules.Desktop.permission();

const sleepyUserCacheService = new SleepyCacheService(User);
const sleepyGroupCacheService = new SleepyCacheService(Group);
const sleepyConversationCacheService = new SleepyCacheService(Conversation);

const store = new UserStore({
  conversations: [],
  conversation: new Conversation(),
  sort: 'mdate',
  view: 'conversation',
  crypt: crypt,
  decryption: true
});

const router = new Navigo(null, true, '#!');

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
};

store.on('state', ({changed, current}) => {
  if (changed.conversation && current.conversation && current.conversation.guid) {
    const {conversation} = current;
    if (conversation.data.user.isASleepingReference) {
      conversation.readyAll(() => store.set({conversation}), ErrHandler, 1);
    }
  }

  if (changed.decryption) {
    crypt.decryption = current.decryption;
    store.refreshAll();
  }
});

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
  if (conversation) {
    store.set({
      conversation: conversation,
      view: params.view || 'conversation',
      convosOut: false
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
        convosOut: false
      });
    }, ErrHandler);
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
window.sleepyUserCacheService = sleepyUserCacheService;
window.sleepyGroupCacheService = sleepyGroupCacheService;
