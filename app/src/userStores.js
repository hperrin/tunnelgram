import { tick } from 'svelte';
import { writable, get } from 'svelte/store';
import { User } from 'tilmeld-client';
import ErrHandler from './ErrHandler';

let ready;

export const user = writable(false);
export const userAvatar = writable(null);
export const userIsTilmeldAdmin = writable(false);
export const userReadyPromise = new Promise(resolve => (ready = resolve));

let subscription;

// Get the current user.
User.current().then(userValue => {
  user.set(userValue);
  if (subscription) {
    subscription.unsubscribe();
  }
  // PubSub subscription.
  if (userValue) {
    subscription = userValue.subscribe(userValue => {
      user.set(userValue);
    });
  }
  ready();
}, ErrHandler);

// Handle logins and logouts.
User.on('login', userValue => {
  user.set(userValue);
  if (subscription) {
    subscription.unsubscribe();
  }
  // PubSub subscription.
  subscription = userValue.subscribe(userValue => {
    user.set(userValue);
  });
});
User.on('logout', async () => {
  // Svelte freaks out if $user isn't available while it's destroying everything.
  user.set(new User());
  // Let Svelte update the DOM.
  await tick();
  // Now set user to it's appropriate value.
  user.set(null);
  if (subscription) {
    subscription.unsubscribe();
  }
});

let previousUserValue = false;
user.subscribe(userValue => {
  if (userValue) {
    if (!previousUserValue) {
      // Get the user's avatar.
      userValue.$getAvatar().then(userAvatarValue => {
        userAvatar.set(userAvatarValue);
      });
      // Is the user a Tilmeld admin?
      userValue.$gatekeeper('tilmeld/admin').then(userIsTilmeldAdminValue => {
        userIsTilmeldAdmin.set(userIsTilmeldAdminValue);
      });
    }
  } else {
    userAvatar.set(null);
    userIsTilmeldAdmin.set(false);
  }
  previousUserValue = userValue;
});

export function logout() {
  if (get(user)) {
    get(user).$logout();
  }
}
