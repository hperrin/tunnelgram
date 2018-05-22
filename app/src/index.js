import {Nymph} from 'nymph-client';
import {User, Group} from 'tilmeld-client';
import {crypt} from './Services/EncryptionService.js';
import {SleepyCacheService} from './Services/SleepyCacheService.js';
import UserStore from './UserStore';
import Conversation from './Entities/Conversation.js';
import Container from './Container.html';

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

const app = new Container({
  target: document.querySelector('main'),
  data: {
    brand: 'ESText'
  },
  store
});

// useful for debugging!
window.store = store;
window.Nymph = Nymph;
window.sleepyUserCacheService = sleepyUserCacheService;
window.sleepyGroupCacheService = sleepyGroupCacheService;
