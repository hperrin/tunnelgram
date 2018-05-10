import Container from './Container.html';
import UserStore from './UserStore';

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

window.store = store; // useful for debugging!
