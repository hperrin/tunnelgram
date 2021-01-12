import { Nymph, PubSub } from 'nymph-client';
import { User } from 'tilmeld-client';
import { urlBase64ToBase64 } from '../Services/urlBase64';
import { storage } from '../Services/StorageService';

// In Cordova, cookies don't persist, so we need to use a Tilmeld auth header
// instead, and persist it in local storage.

let authToken = null;

function setToken(token) {
  if (token === '' || token == null) {
    authToken = null;

    Nymph.setXsrfToken(null);
    if (PubSub.pubsubURL != null) {
      PubSub.setToken(null);
    }
  } else {
    const base64Url = token.split('.')[1];
    const base64 = urlBase64ToBase64(base64Url);
    const jwt = JSON.parse(atob(base64));

    authToken = token;

    Nymph.setXsrfToken(jwt.xsrfToken);
    if (PubSub.pubsubURL != null) {
      PubSub.setToken(token);
    }
  }
}

function saveToken(token) {
  if (authToken !== token) {
    setToken(token);
    storage.setItem('tilmeldAuthToken', token);
  }
}

async function loadTokenFromStorage() {
  const token = await storage.getItem('tilmeldAuthToken');
  if (token) {
    setToken(token);
  }
  return true;
}

let ready;

if (window.inCordova) {
  Nymph.on('request', (_url, options) => {
    if (authToken) {
      options.headers['X-TILMELDAUTH'] = authToken;
    }
  });
  Nymph.on('response', response => {
    if (response.headers.has('X-TILMELDAUTH')) {
      saveToken(response.headers.get('X-TILMELDAUTH'));
    }
  });
  ready = loadTokenFromStorage();
} else {
  ready = Promise.resolve(true);
}

export { ready };
