import Container from './Container.html';
import UserStore from './UserStore';
import {Nymph} from 'nymph-client';
import {crypt} from './Services/EncryptionService.js';

const store = new UserStore({
  todos: [],
  sort: 'name',
  archived: false,
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
