import {Store} from 'svelte/store.js';
import {User} from 'tilmeld-client';
import ErrHandler from './ErrHandler';

export default class UserStore extends Store {
  constructor (...args) {
    super(...args);

    let ready;

    this.set({
      user: false,
      userIsTilmeldAdmin: false,
      ready: new Promise(resolve => ready = resolve)
    });

    // Get the current user.
    User.current().then(user => {
      this.set({user});
      ready();
    }, ErrHandler);

    // Handle logins and logouts.
    User.on('login', user => {
      this.set({user});
    });
    User.on('logout', () => {
      this.set({user: null});
    });

    this.on('state', ({changed, current, previous}) => {
      if (changed.user) {
        if (current.user) {
          if (!previous.user) {
            // Is the user a Tilmeld admin?
            current.user.gatekeeper('tilmeld/admin').then(userIsTilmeldAdmin => {
              this.set({userIsTilmeldAdmin});
            });
          }
        } else {
          this.set({userIsTilmeldAdmin: false});
        }
      }
    });
  }

  logout () {
    if (this.get().user) {
      this.get().user.logout();
    }
  }
}
