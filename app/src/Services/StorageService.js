import localforage from 'localforage/src/localforage';

export class StorageService {
  constructor () {
    if ('inCordova' in window && window.inCordova) {
      this.cordovaAPI = true;
      let resolve;
      let reject;
      this.ready = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      this.storage = new cordova.plugins.SecureStorage(resolve, reject, 'tunnelgram');
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
    await this.ready;
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.set(() => resolve(), e => reject(e), name, value)));
    } else {
      return await this.storage.setItem(name, value);
    }
  }

  async getItem (name) {
    await this.ready;
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.get(value => resolve(value), e => reject(e), name)));
    } else {
      return await this.storage.getItem(name);
    }
  }

  async removeItem (name) {
    await this.ready;
    if (this.cordovaAPI) {
      return await (new Promise((resolve, reject) => this.storage.remove(() => resolve(), e => reject(e), name)));
    } else {
      return await this.storage.removeItem(name);
    }
  }
}

export const storage = new StorageService();
