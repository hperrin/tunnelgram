import {Store} from 'svelte/store.js';
import {User} from 'tilmeld-client';
import ErrHandler from './ErrHandler';

export default class UserStore extends Store {
  constructor (...args) {
    super(...args);

    this.set({
      user: false,
      userAvatar: null,
      userIsTilmeldAdmin: false
    });

    // Get the current user.
    User.current().then(user => {
      this.set({user});
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
            // Get the user's avatar.
            current.user.getAvatar().then(userAvatar => {
              this.set({userAvatar});
            });
            // Is the user a Tilmeld admin?
            current.user.gatekeeper('tilmeld/admin').then(userIsTilmeldAdmin => {
              this.set({userIsTilmeldAdmin});
            });
          }
        } else {
          this.set({userAvatar: null, userIsTilmeldAdmin: false});
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
