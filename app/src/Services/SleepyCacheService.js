import {Nymph} from 'nymph-client';

export class SleepyCacheService {
  constructor (entityClass) {
    const that = this;
    this._getEntityData = Nymph.getEntityData;
    this.entityDataCache = {};

    Nymph.getEntityData = function (...args) {
      if (args[0].class === entityClass.class && args[1].type === '&' && typeof args[1].guid === 'number') {
        if (!that.entityDataCache[args[1].guid] || that.entityDataCache[args[1].guid].expire <= (new Date())) {
          that.entityDataCache[args[1].guid] = {
            promise: that._getEntityData.call(this, ...args),
            expire: (new Date()) + 1000 * 60 * 60 * 2 // Expire after 2 hours.
          };
        }
        return that.entityDataCache[args[1].guid].promise;
      }
      return that._getEntityData.call(this, ...args);
    };
  }

  destroy () {
    Nymph.getEntityData = this._getEntityData;
  }

  clear () {
    this.entityDataCache = {};
  }
};
