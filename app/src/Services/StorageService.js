export class StorageService {
  constructor () {
    if (window.hasOwnProperty('inCordova') && window.inCordova) {
      this.async = true;
      this.storage = NativeStorage;
    } else {
      this.async = false;
      this.storage = window.localStorage;
    }
  }

  async setItem (name, value) {
    if (this.async) {
      return await (new Promise((resolve, reject) => this.storage.setItem(name, value, () => resolve(), e => reject(e))));
    } else {
      return this.storage.setItem(name, value);
    }
  }

  async getItem (name) {
    if (this.async) {
      return await (new Promise((resolve, reject) => this.storage.getItem(name, value => resolve(value), e => reject(e))));
    } else {
      return this.storage.getItem(name);
    }
  }

  async removeItem (name) {
    if (this.async) {
      return await (new Promise((resolve, reject) => this.storage.remove(name, () => resolve(), e => reject(e))));
    } else {
      return this.storage.removeItem(name);
    }
  }
}
