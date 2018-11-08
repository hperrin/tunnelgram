import {storage} from './StorageService';
import {Nymph} from 'nymph-client';

class EntityCacheService {
  constructor () {
    this.resolve;
    this.ready = new Promise(resolve => this.resolve = resolve);
    this.loadCache().then(() => {
      this.resolve();
      window.setTimeout(this.cleanup(), 5000);
    });
    this.pendingCache = {};
  }

  async loadCache () {
    try {
      this.cache = await storage.getItem('tgEntityCache');
      if (!this.cache) {
        this.cache = {};
      }
    } catch (e) {
      this.cache = {};
    }
  }

  async saveCache () {
    return await storage.setItem('tgEntityCache', this.cache);
  }

  async getEntityData (guid) {
    if (this.pendingCache.hasOwnProperty(guid)) {
      await this.pendingCache[guid];
    }
    if (this.cache.hasOwnProperty(guid)) {
      this.cache[guid].lastAccessed = new Date();
      this.saveCache();
      return JSON.parse(JSON.stringify(this.cache[guid].data));
    }
    return null;
  }

  setEntityData (guid, data) {
    this.cache[guid] ={
      retrieved: new Date(),
      lastAccessed: new Date(),
      data: JSON.parse(JSON.stringify(data))
    };
    if (this.pendingCache.hasOwnProperty(guid)) {
      this.pendingCache[guid].resolve(true);
      delete this.pendingCache[guid];
    }
    this.saveCache();
  }

  setPendingData (guid) {
    let resolve;
    const promise = new Promise(res => resolve = res);
    promise.resolve = resolve;
    this.pendingCache[guid] = promise;
  }

  cleanup () {
    for (let guid in this.cache) {
      if (
        // Retrieved more than a week ago.
        this.cache[guid].retrieved < (new Date() - 1000*60*60*24*7) ||
        // Last accessed more than two weeks ago.
        this.cache[guid].lastAccessed < (new Date() - 1000*60*60*24*14)
      ) {
        delete this.cache[guid];
      }
    }
    this.saveCache();
  }

  clear () {
    this.cache = {};
    this.pendingCache = {};
    this.saveCache();
  }
}

const cache = new EntityCacheService();

// Override Nymph functions to return entities that are cached.
const _getEntityData = Nymph.getEntityData;
Nymph.getEntityData = async (...args) => {
  // Determine if this is a request for a single entity.
  // Nymph.getEntityData(
  //   {'class': this.sleepingReference[2]},
  //   {'type': '&', 'guid': this.sleepingReference[1]}
  // )
  if (!(
    args.length === 2 &&
    Object.keys(args[0]).length === 1 &&
    args[0].hasOwnProperty('class') &&
    Object.keys(args[1]).length === 2 &&
    args[1].hasOwnProperty('type') &&
    args[1].type === '&' &&
    args[1].hasOwnProperty('guid') &&
    typeof args[1].guid === 'number'
  )) {
    return await _getEntityData.apply(Nymph, args);
  }

  const guid = args[1].guid;

  // Check for a cached entity.
  await cache.ready;
  let entityData = await cache.getEntityData(guid);
  if (entityData) {
    return entityData;
  }

  // Last resort to getting from the network.
  cache.setPendingData(guid);
  entityData = await _getEntityData.apply(Nymph, args);
  if (entityData) {
    cache.setEntityData(guid, entityData);
  }

  return entityData;
};

export {EntityCacheService, cache};
