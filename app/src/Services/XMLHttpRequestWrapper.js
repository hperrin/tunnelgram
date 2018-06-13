import {Nymph, PubSub} from 'nymph-client';
import {urlBase64ToBase64} from './urlBase64';

const _XMLHttpRequest = window.XMLHttpRequest;

export default class XMLHttpRequestWrapper {
  constructor (...args) {
    this.xhr = new _XMLHttpRequest(...args);
    return this;
  }

  static parseAndSaveCookieHeader (token) {
    XMLHttpRequestWrapper.setToken(token);
    XMLHttpRequestWrapper.tilmeldAuthToken = token;
    NativeStorage.setItem('tilmeldAuthToken', token);
  }

  static setToken (token) {
    if (token === '') {
      Nymph.setXsrfToken(null);
      if (PubSub.pubsubURL != null) {
        PubSub.setToken(null);
      }
    } else {
      const base64Url = token.split('.')[1];
      const base64 = urlBase64ToBase64(base64Url);
      const jwt = JSON.parse(atob(base64));
      Nymph.setXsrfToken(jwt.xsrfToken);
      if (PubSub.pubsubURL != null) {
        PubSub.setToken(token);
      }
    }
  }

  static async loadTokenFromStorage () {
    const token = await new Promise(resolve => NativeStorage.getItem('tilmeldAuthToken', token => resolve(token)));
    XMLHttpRequestWrapper.setToken(token);
    XMLHttpRequestWrapper.tilmeldAuthToken = token;
  }

  send (...args) {
    const _onreadystatechange = this.onreadystatechange;
    this.onreadystatechange = (...args) => {
      if (this.readyState === 4) {
        const authHeader = this.getResponseHeader('X-TILMELDAUTH');
        if (authHeader != null) {
          XMLHttpRequestWrapper.parseAndSaveCookieHeader(authHeader);
        }
      }
      return _onreadystatechange.apply(this, args);
    };

    if (XMLHttpRequestWrapper.tilmeldAuthToken != null) {
      this.xhr.setRequestHeader('X-TILMELDAUTH', XMLHttpRequestWrapper.tilmeldAuthToken);
    }

    return this.xhr.send(...args);
  }

  // The rest of the functions/properties.
  abort (...args) {
    return this.xhr.abort(...args);
  }
  getAllResponseHeaders (...args) {
    return this.xhr.getAllResponseHeaders(...args);
  }
  getResponseHeader (...args) {
    return this.xhr.getResponseHeader(...args);
  }
  open (...args) {
    return this.xhr.open(...args);
  }
  overrideMimeType (...args) {
    return this.xhr.overrideMimeType(...args);
  }
  setRequestHeader (...args) {
    return this.xhr.setRequestHeader(...args);
  }
  get onreadystatechange () {
    return this.xhr.onreadystatechange;
  }
  set onreadystatechange (value) {
    return this.xhr.onreadystatechange = value;
  }
  get readyState () {
    return this.xhr.readyState;
  }
  set readyState (value) {
    return this.xhr.readyState = value;
  }
  get response () {
    return this.xhr.response;
  }
  set response (value) {
    return this.xhr.response = value;
  }
  get responseText () {
    return this.xhr.responseText;
  }
  set responseText (value) {
    return this.xhr.responseText = value;
  }
  get responseType () {
    return this.xhr.responseType;
  }
  set responseType (value) {
    return this.xhr.responseType = value;
  }
  get responseURL () {
    return this.xhr.responseURL;
  }
  set responseURL (value) {
    return this.xhr.responseURL = value;
  }
  get responseXML () {
    return this.xhr.responseXML;
  }
  set responseXML (value) {
    return this.xhr.responseXML = value;
  }
  get status () {
    return this.xhr.status;
  }
  set status (value) {
    return this.xhr.status = value;
  }
  get statusText () {
    return this.xhr.statusText;
  }
  set statusText (value) {
    return this.xhr.statusText = value;
  }
  get timeout () {
    return this.xhr.timeout;
  }
  set timeout (value) {
    return this.xhr.timeout = value;
  }
  get upload () {
    return this.xhr.upload;
  }
  set upload (value) {
    return this.xhr.upload = value;
  }
  get withCredentials () {
    return this.xhr.withCredentials;
  }
  set withCredentials (value) {
    return this.xhr.withCredentials = value;
  }
}

XMLHttpRequestWrapper.tilmeldAuthToken = null;

// In Cordova, cookies don't persist, so we need to wrap XMLHttpRequest to look
// for Tilmeld auth token header and save it.
if (window.hasOwnProperty('inCordova') && window.inCordova) {
  window.XMLHttpRequest = XMLHttpRequestWrapper;
}
