import localforage from 'localforage/src/localforage';

export class StorageService {
  constructor () {
    if (window.hasOwnProperty('inCordova') && window.inCordova) {
      this.cordovaNativeStorageAPI = true;
      this.storage = NativeStorage;
    } else {
      this.cordovaNativeStorageAPI = false;
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
    if (this.cordovaNativeStorageAPI) {
      return await (new Promise((resolve, reject) => this.storage.setItem(name, value, () => resolve(), e => reject(e))));
    } else {
      return await this.storage.setItem(name, value);
    }
  }

  async getItem (name) {
    if (this.cordovaNativeStorageAPI) {
      return await (new Promise((resolve, reject) => this.storage.getItem(name, value => resolve(value), e => reject(e))));
    } else {
      return await this.storage.getItem(name);
    }
  }

  async removeItem (name) {
    if (this.cordovaNativeStorageAPI) {
      return await (new Promise((resolve, reject) => this.storage.remove(name, () => resolve(), e => reject(e))));
    } else {
      return await this.storage.removeItem(name);
    }
  }
}
