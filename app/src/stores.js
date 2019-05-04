import {writable} from 'svelte/store';
import PNotify from 'pnotify/dist/es/PNotify';
import Conversation from './Entities/Tunnelgram/Conversation';
import {crypt as cryptService} from './Services/EncryptionService';

export * from './userStores';

export const brand = writable('Tunnelgram');
export const brandWeb = writable('Tunnelgram.com');
export const conversations = writable([]);
export const conversation = writable(new Conversation());
export const loadingConversation = writable(null);
export const loadingUser = writable(null);
export const view = writable('conversation');
export const viewUser = writable(null);
export const viewUserIsSelf = writable(null);
export const convosOut = writable(true);
export const crypt = writable(cryptService);
export const settings = writable(null);
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
export const inPWA = writable(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
export const inCordova = writable(window.inCordova);
