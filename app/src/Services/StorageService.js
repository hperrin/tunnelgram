import localforage from 'localforage/src/localforage';

export class StorageService {
  constructor() {
    if (window.inCordova) {
      this.storage = new window.CapStorage();
    } else {
      localforage.config({
        name: 'Tunnelgram',
      });
      this.storage = localforage;

      // Check to see if the old API was used and migrate data.
      const localStorageCurrentUser = window.localStorage.getItem(
        'tunnelgram-currentuser',
      );
      if (localStorageCurrentUser) {
        this.setItem('tgCurrentUser', localStorageCurrentUser);
        this.setItem(
          'tgClientConfig',
          window.localStorage.getItem('tunnelgram-clientconfig'),
        );
        this.setItem(
          'twPrivateKey',
          window.localStorage.getItem('esPrivateKey'),
        );
        this.setItem('twPublicKey', window.localStorage.getItem('esPublicKey'));
        localStorage.removeItem('tunnelgram-currentuser');
        localStorage.removeItem('tunnelgram-clientconfig');
        localStorage.removeItem('esPrivateKey');
        localStorage.removeItem('esPublicKey');
      }
    }
  }

  async setItem(name, value) {
    return await this.storage.setItem(name, value);
  }

  async getItem(name) {
    return await this.storage.getItem(name);
  }

  async removeItem(name) {
    return await this.storage.removeItem(name);
  }

  async clear() {
    return await this.storage.clear();
  }
}

export const storage = new StorageService();
