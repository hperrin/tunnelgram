import Container from './Container.html';
import UserStore from './UserStore';
import {Nymph} from 'nymph-client';
import {User, Group} from 'tilmeld-client';
import {SleepyCacheService} from './Services/SleepyCacheService';

const sleepyUserCacheService = new SleepyCacheService(User);
const sleepyGroupCacheService = new SleepyCacheService(Group);

const store = new UserStore({
  todos: [],
  sort: 'name',
  archived: false
});

store.constructor.prototype.refreshAll = function () {
  sleepyUserCacheService.clear();
  sleepyGroupCacheService.clear();
};

const app = new Container({
  target: document.querySelector('main'),
  data: {
    brand: 'App Template'
  },
  store
});

// useful for debugging!
window.store = store;
window.Nymph = Nymph;
