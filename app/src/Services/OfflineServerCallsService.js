import {Nymph} from 'nymph-client';
import {User} from 'tilmeld-client';

export class OfflineServerCallsService {
  constructor () {
    // If the browser supports service workers, we should cache some required
    // server calls (which happen over POST).
    if (navigator.serviceWorker) {
      const _current = User.current;

      User.current = function(...args) {
        return _current.apply(this, args).then(user => {
          if (window.localStorage) {
            // Save the current user to cache for offline retrieval.
            window.localStorage.setItem('tunnelgram-currentuser', JSON.stringify(user));
          }
          return Promise.resolve(user);
        }, err => {
          if (err.status === 0 && window.localStorage) {
            // Try to load the current user from cache.
            const userJson = window.localStorage.getItem('tunnelgram-currentuser');
            if (userJson != null) {
              const user = Nymph.initEntity(JSON.parse(userJson));
              return Promise.resolve(user);
            }
          }
          return Promise.reject(err);
        });
      };

      const _getClientConfig = User.getClientConfig;
      User.getClientConfig = function(...args) {
        return _getClientConfig.apply(this, args).then(config => {
          if (window.localStorage) {
            // Save the client config to cache for offline retrieval.
            window.localStorage.setItem('tunnelgram-clientconfig', JSON.stringify(config));
          }
          return Promise.resolve(config);
        }, err => {
          if (err.status === 0 && window.localStorage) {
            // Try to load the client config from cache.
            const configJson = window.localStorage.getItem('tunnelgram-clientconfig');
            if (configJson != null) {
              const config = JSON.parse(configJson);
              return Promise.resolve(config);
            }
          }
          return Promise.reject(err);
        });
      };
    }
  }
}

export default new OfflineServerCallsService();
