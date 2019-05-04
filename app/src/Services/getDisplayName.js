import {get} from 'svelte/store';
import {settings} from '../stores';

export function getDisplayName (user, prop, defaultValue = 'Loading...') {
  if (get(settings) != null && user.guid in get(settings).decrypted.nicknames) {
    return get(settings).decrypted.nicknames[user.guid];
  }
  return (prop in user.data && user.data[prop] != null) ? user.data[prop] : defaultValue;
}
