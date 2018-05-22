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
  sort: 'cdate',
  view: 'conversation',
  crypt: crypt
});

store.on('state', ({changed, current}) => {
  if (!changed.conversation || !current.conversation || !current.conversation.guid) {
    return;
  }
  const {conversation} = current;
  if (conversation.data.user.isASleepingReference) {
    conversation.readyAll(() => store.set({conversation}), ErrHandler, 1);
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
