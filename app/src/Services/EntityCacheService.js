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
      if (!this.cache || this.cache.version !== 2) {
        this.cache = {version: 2};
      }
    } catch (e) {
      this.cache = {version: 2};
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
      return JSON.parse(this.cache[guid].data);
    }
    return null;
  }

  setEntityData (guid, data) {
    this.cache[guid] ={
      retrieved: new Date(),
      lastAccessed: new Date(),
      data: JSON.stringify(data)
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

// Override Nymph function to return entities that are cached.
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

// Override Nymph functions to update cached entities.
const _serverCall = Nymph.serverCall;
Nymph.serverCall = async (...args) => {
  const result = await _serverCall.apply(Nymph, args);

  if ('entity' in result && result.entity.guid) {
    cache.setEntityData(result.entity.guid, result.entity.toJSON());
  }

  return result;
};

const _getEntities = Nymph.getEntities;
Nymph.getEntities = (...args) => {
  const promise = _getEntities.apply(Nymph, args);
  // Have to use a promise, because of PubSub.
  promise.then(result => {
    if (result && result.length) {
      for (let i = 0; i < result.length; i++) {
        const entity = result[i];
        cache.setEntityData(entity.guid, entity.toJSON());
      }
    }
    return result;
  });

  return promise;
};

export {EntityCacheService, cache};
