import { Nymph } from 'nymph-client';
import { User } from 'tilmeld-client';
import { storage } from './StorageService';

export class OfflineServerCallsService {
  constructor() {
    // If the browser supports service workers, we should cache some required
    // server calls (which happen over POST).
    if (navigator.serviceWorker) {
      User.on('login', user => {
        storage.setItem('tgCurrentUser', JSON.stringify(user));
      });
      User.on('logout', () => {
        storage.removeItem('tgCurrentUser');
        storage.removeItem('tgGatekeeper');
        storage.removeItem('tgClientConfig');
      });

      const _current = User.current;

      User.current = function(...args) {
        return _current.apply(this, args).then(
          user => {
            // Save the current user to cache for offline retrieval.
            storage.setItem('tgCurrentUser', JSON.stringify(user));
            return Promise.resolve(user);
          },
          async err => {
            if (err.status === 0) {
              // Try to load the current user from cache.
              return storage.getItem('tgCurrentUser').then(userJson => {
                if (userJson != null) {
                  const user = Nymph.initEntity(JSON.parse(userJson));
                  return Promise.resolve(user);
                }
                return Promise.reject(err);
              });
            }
            return Promise.reject(err);
          },
        );
      };

      const _gatekeeper = User.prototype.gatekeeper;
      User.prototype.gatekeeper = function(...args) {
        // This one is more complicated, as it can be called with arguments.
        let user = this;
        return _gatekeeper.apply(this, args).then(
          gkResponse => {
            // Save the response to cache for offline retrieval.
            storage.getItem('tgGatekeeper').then(gkResponseJson => {
              let gkResponseObj =
                gkResponseJson == null ? {} : JSON.parse(gkResponseJson);
              gkResponseObj[user.guid + JSON.stringify(args)] = gkResponse;
              storage.setItem('tgGatekeeper', JSON.stringify(gkResponseObj));
            });
            return Promise.resolve(gkResponse);
          },
          err => {
            if (err.status === 0) {
              // Try to load the response from cache.
              return storage.getItem('tgGatekeeper').then(gkResponseJson => {
                if (gkResponseJson != null) {
                  const gkResponseObj = JSON.parse(gkResponseJson);
                  if (user.guid + JSON.stringify(args) in gkResponseObj) {
                    return Promise.resolve(
                      gkResponseObj[user.guid + JSON.stringify(args)],
                    );
                  }
                  return Promise.reject(err);
                }
                return Promise.reject(err);
              });
            }
            return Promise.reject(err);
          },
        );
      };

      const _getClientConfig = User.getClientConfig;
      User.getClientConfig = function(...args) {
        return _getClientConfig.apply(this, args).then(
          config => {
            // Save the client config to cache for offline retrieval.
            storage.setItem('tgClientConfig', JSON.stringify(config));
            return Promise.resolve(config);
          },
          err => {
            if (err.status === 0) {
              // Try to load the client config from cache.
              return storage.getItem('tgClientConfig').then(configJson => {
                if (configJson != null) {
                  const config = JSON.parse(configJson);
                  return Promise.resolve(config);
                }
                return Promise.reject(err);
              });
            }
            return Promise.reject(err);
          },
        );
      };
    }
  }
}

export default new OfflineServerCallsService();
