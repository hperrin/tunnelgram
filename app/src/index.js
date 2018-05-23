import {Nymph} from 'nymph-client';
import {User, Group} from 'tilmeld-client';
import {crypt} from './Services/EncryptionService.js';
import {SleepyCacheService} from './Services/SleepyCacheService.js';
import UserStore from './UserStore';
import Conversation from './Entities/Conversation.js';
import Container from './Container.html';
import ErrHandler from './ErrHandler';

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

// useful for debugging!
window.store = store;
window.Nymph = Nymph;
window.sleepyUserCacheService = sleepyUserCacheService;
window.sleepyGroupCacheService = sleepyGroupCacheService;
