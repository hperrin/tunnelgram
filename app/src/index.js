import Container from './Container.html';
import UserStore from './UserStore';
import {Nymph} from 'nymph-client';

const store = new UserStore({
  todos: [],
  sort: 'name',
  archived: false
});

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
