import { storage } from './StorageService';
import { Nymph } from 'nymph-client';

class EntityCacheService {
  constructor() {
    this.resolve;
    this.ready = new Promise((resolve) => (this.resolve = resolve));
    this.loadCache().then(() => {
      this.resolve();
      window.setTimeout(this.cleanup(), 5000);
    });
    this.pendingCache = {};
  }

  async loadCache() {
    try {
      this.cache = await storage.getItem('tgEntityCache');
      if (
        !this.cache ||
        this.cache.version !== EntityCacheService.CACHE_VERSION
      ) {
        this.cache = { version: EntityCacheService.CACHE_VERSION };
      }
    } catch (e) {
      this.cache = { version: EntityCacheService.CACHE_VERSION };
    }
  }

  async saveCache() {
    return await storage.setItem('tgEntityCache', this.cache);
  }

  // TODO: Is this causing the permanent unread problem.
  async getEntityData(guid) {
    await this.ready;

    if (this.pendingCache.hasOwnProperty(guid)) {
      await this.pendingCache[guid];
    }

    if (this.cache.hasOwnProperty(guid)) {
      if (this.cache[guid].retrieved < new Date() - this.cache[guid].expiry) {
        // Retrieved longer ago than the expiry.
        delete this.cache[guid];
        this.saveCache();
      } else {
        return JSON.parse(this.cache[guid].data);
      }
    }

    return null;
  }

  async setEntityData(guid, data) {
    // Save the data before awaiting so it doesn't get converted to real
    // entities.
    const saveData = JSON.stringify(data);

    await this.ready;

    // 10 days is the default expiry.
    let expiry = 1000 * 60 * 60 * 24 * 10;
    const entityClass = Nymph.getEntityClass(data.class);

    if (entityClass.CACHE_EXPIRY) {
      expiry = entityClass.CACHE_EXPIRY;
    }

    this.cache[guid] = {
      retrieved: new Date(),
      data: saveData,
      expiry,
    };
    if (this.pendingCache.hasOwnProperty(guid)) {
      this.pendingCache[guid].resolve(true);
      delete this.pendingCache[guid];
    }
    this.saveCache();
  }

  async deleteEntityData(guid) {
    await this.ready;

    delete this.cache[guid];
    delete this.pendingCache[guid];
    this.saveCache();
  }

  setPendingData(guid) {
    let resolve;
    const promise = new Promise((res) => (resolve = res));
    promise.resolve = resolve;
    this.pendingCache[guid] = promise;
  }

  cleanup() {
    for (let guid in this.cache) {
      if (this.cache[guid].retrieved < new Date() - this.cache[guid].expiry) {
        // Retrieved longer ago than the expiry.
        delete this.cache[guid];
      }
    }
    this.saveCache();
  }

  clear() {
    this.cache = { version: EntityCacheService.CACHE_VERSION };
    this.pendingCache = {};
    this.saveCache();
  }
}

EntityCacheService.CACHE_VERSION = 4;

const cache = new EntityCacheService();

// Override Nymph function to return entities that are cached.
const _getEntityData = Nymph.getEntityData;
Nymph.getEntityData = async (...args) => {
  if (args[0].return === 'guid') {
    return await _getEntityData.apply(Nymph, args);
  }

  // Determine if this is a request for a single entity.
  // Nymph.getEntityData(
  //   {'class': this.$sleepingReference[2]},
  //   {'type': '&', 'guid': this.$sleepingReference[1]}
  // )
  if (
    !(
      args.length === 2 &&
      Object.keys(args[0]).length === 1 &&
      args[0].hasOwnProperty('class') &&
      Object.keys(args[1]).length === 2 &&
      args[1].hasOwnProperty('type') &&
      args[1].type === '&' &&
      args[1].hasOwnProperty('guid') &&
      typeof args[1].guid === 'number'
    )
  ) {
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
    cache.setEntityData(result.entity.guid, result.entity);
  }

  return result;
};

const _getEntities = Nymph.getEntities;
Nymph.getEntities = (...args) => {
  const promise = _getEntities.apply(Nymph, args);

  if (args[0].return === 'guid') {
    return promise;
  }

  const _subscribe = promise.subscribe;

  // Have to use a promise, because of PubSub.
  promise.then((result) => {
    if (result && result.length) {
      for (let i = 0; i < result.length; i++) {
        const entity = result[i];
        cache.setEntityData(entity.guid, entity.toJSON());
      }
    }
    return result;
  });

  promise.subscribe = (callback, error) => {
    return _subscribe((update) => {
      if (Array.isArray(update)) {
        for (let i = 0; i < update.length; i++) {
          const entity = update[i];
          cache.setEntityData(entity.guid, entity.toJSON());
        }
      } else {
        if (update.added) {
          cache.setEntityData(update.added, update.data);
        }
        if (update.updated) {
          cache.setEntityData(update.updated, update.data);
        }
        if (update.removed) {
          cache.deleteEntityData(update.removed);
        }
      }
      callback(update);
    }, error);
  };

  return promise;
};

export { EntityCacheService, cache };
