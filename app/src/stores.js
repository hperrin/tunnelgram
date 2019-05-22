import { writable } from 'svelte/store';
import PNotify from 'pnotify/dist/es/PNotify';
import Conversation from './Entities/Tunnelgram/Conversation';
import { crypt as cryptService } from './Services/EncryptionService';

export * from './userStores';

export const brand = writable('Tunnelgram');
export const brandWeb = writable('Tunnelgram.com');
export const conversations = writable([]);
conversations.subscribe(async convos => {
  if (convos) {
    let promises = [];
    for (let convo of convos) {
      if (!convo.cryptReady) {
        promises.push(convo.cryptReadyPromise);
      }
    }
    if (promises.length) {
      await Promise.all(promises);
      conversations.set(convos);
    }
  }
});
export const conversation = writable(new Conversation());
conversation.subscribe(async convo => {
  if (convo && !convo.cryptReady) {
    await convo.cryptReadyPromise;
    conversation.set(convo);
  }
});
export const loadingConversation = writable(null);
export const loadingUser = writable(null);
export const view = writable('conversation');
export const viewUser = writable(null);
export const viewUserIsSelf = writable(null);
export const convosOut = writable(true);
export const crypt = writable(cryptService);
export const settings = writable(null);
settings.subscribe(async sett => {
  if (sett && !sett.cryptReady) {
    await sett.cryptReadyPromise;
    settings.set(sett);
  }
});
export const disconnected = writable(!navigator.onLine);
export const requestNotificationPermission = writable(() => {
  // This is the deault permission asker for sending desktop notifications
  // when the page is open in the browser.
  PNotify.modules.Desktop.permission();
});
export const requestPersistentStorage = writable(() => {
  navigator.storage.persist();
});
export const beforeInstallPromptEvent = writable(null);
export const webPushSubscription = writable(null);
export const inPWA = writable(
  window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true,
);
export const inCordova = writable(window.inCordova);
