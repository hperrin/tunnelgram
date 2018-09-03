import localforage from 'localforage/src/localforage';

export class StorageService {
  constructor () {
    if (window.inCordova) {
      this.cordovaAPI = true;
      this.storage = NativeStorage;
    } else {
      this.cordovaAPI = false;
      this.ready = Promise.resolve(true);
      localforage.config({
        name: 'Tunnelgram'
      });
      this.storage = localforage;

      // Check to see if the old API was used and migrate data.
      const localStorageCurrentUser = window.localStorage.getItem('tunnelgram-currentuser');
      if (localStorageCurrentUser) {
        this.setItem('tgCurrentUser', localStorageCurrentUser);
        this.setItem('tgClientConfig', window.localStorage.getItem('tunnelgram-clientconfig'));
        this.setItem('twPrivateKey', window.localStorage.getItem('esPrivateKey'));
        this.setItem('twPublicKey', window.localStorage.getItem('esPublicKey'));
        localStorage.removeItem('tunnelgram-currentuser');
        localStorage.removeItem('tunnelgram-clientconfig');
        localStorage.removeItem('esPrivateKey');
        localStorage.removeItem('esPublicKey');
      }
    }
  }

  async setItem (name, value) {
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.setItem(name, value, () => resolve(value), e => reject(e))));
    } else {
      return await this.storage.setItem(name, value);
    }
  }

  async getItem (name) {
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.getItem(name, value => resolve(value), e => e.code === 2 ? resolve(undefined) : reject(e))));
    } else {
      return await this.storage.getItem(name);
    }
  }

  async removeItem (name) {
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.remove(name, () => resolve(), () => resolve())));
    } else {
      return await this.storage.removeItem(name);
    }
  }

  async clear () {
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.clear(() => resolve(), e => reject(e))));
    } else {
      return await this.storage.clear();
    }
  }
}

export const storage = new StorageService();
