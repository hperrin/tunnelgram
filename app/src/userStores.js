import { writable, get } from 'svelte/store';
import { User } from 'tilmeld-client';
import { ready as authTokenHandlerReady } from './setup/authTokenHandler';
import ErrHandler from './ErrHandler';

let ready;

export const user = writable(false);
export const userAvatar = writable(null);
export const userIsTilmeldAdmin = writable(false);
export const userIsSponsor = writable(false);
export const userReadyPromise = new Promise((resolve) => (ready = resolve));

let subscription;

// Wait for auth token to be ready.
authTokenHandlerReady.then(() => {
  // Get the current user.
  User.current().then((userValue) => {
    user.set(userValue);
    if (subscription) {
      subscription.unsubscribe();
    }
    // PubSub subscription.
    if (userValue) {
      subscription = userValue.$subscribe((userValue) => {
        user.set(userValue);
      });
    }
    ready();
  }, ErrHandler);
});

// Handle logins and logouts.
User.on('login', (userValue) => {
  user.set(userValue);
  if (subscription) {
    subscription.unsubscribe();
  }
  // PubSub subscription.
  subscription = userValue.$subscribe((userValue) => {
    user.set(userValue);
  });
});
User.on('logout', async () => {
  if (subscription) {
    subscription.unsubscribe();
  }
  user.set(null);
});

let previousUserValue = false;
user.subscribe((userValue) => {
  if (userValue && userValue.guid) {
    if (!userValue.$is(previousUserValue)) {
      // Get the user's avatar.
      userValue.$getAvatar().then((userAvatarValue) => {
        userAvatar.set(userAvatarValue);
      });
      // Is the user a Tilmeld admin?
      userValue.$gatekeeper('tilmeld/admin').then((userIsTilmeldAdminValue) => {
        userIsTilmeldAdmin.set(userIsTilmeldAdminValue);
      });
      // Is the user a sponsor?
      userValue.$gatekeeper('tunnelgram/sponsor').then((userIsSponsorValue) => {
        userIsSponsor.set(userIsSponsorValue);
      });
    }
  } else {
    userAvatar.set(null);
    userIsTilmeldAdmin.set(false);
    userIsSponsor.set(false);
  }
  previousUserValue = userValue;
});

export function logout() {
  if (get(user)) {
    get(user).$logout();
  }
}
