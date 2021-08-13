import { Plugins } from '@capacitor/core';

const { Storage } = Plugins;

export default class CapStorage {
  async setItem(name, value) {
    return await Storage.set({
      key: name,
      value: JSON.stringify(value)
    });
  }

  async getItem(name) {
    const ret = await Storage.get({ key: name });
    return JSON.parse(ret.value);
  }

  async removeItem(name) {
    await Storage.remove({ key: name });
  }

  async clear() {
    await Storage.clear();
  }
}