import {writable, get} from 'svelte/store';
import {User} from 'tilmeld-client';
import ErrHandler from './ErrHandler';

export const user = writable(false);
export const userAvatar = writable(null);
export const userIsTilmeldAdmin = writable(false);

// Get the current user.
User.current().then(userValue => {
  user.set(userValue);
}, ErrHandler);

// Handle logins and logouts.
User.on('login', userValue => {
  user.set(userValue);
});
User.on('logout', () => {
  user.set(null);
});

let previousUserValue = false;
user.subscribe(userValue => {
  if (userValue) {
    if (!previousUserValue) {
      // Get the user's avatar.
      userValue.getAvatar().then(userAvatarValue => {
        userAvatar.set(userAvatarValue);
      });
      // Is the user a Tilmeld admin?
      userValue.gatekeeper('tilmeld/admin').then(userIsTilmeldAdminValue => {
        userIsTilmeldAdmin.set(userIsTilmeldAdminValue);
      });
    }
  } else {
    userAvatar.set(null)
    userIsTilmeldAdmin.set(false);
  }
  previousUserValue = userValue;
});

export function logout () {
  if (get(user)) {
    get(user).logout();
  }
}
