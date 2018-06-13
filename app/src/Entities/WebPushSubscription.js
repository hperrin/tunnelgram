import {Nymph, Entity} from 'nymph-client';

export class WebPushSubscription extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.endpoint = '';
    this.data.keys = {};
  }

  // === Static Methods ===

  static getVapidPublicKey (...args) {
    return WebPushSubscription.serverCallStatic('getVapidPublicKey', args);
  }
}

// === Static Properties ===

// The name of the server class
WebPushSubscription.class = 'Tunnelgram\\WebPushSubscription';

Nymph.setEntityClass(WebPushSubscription.class, WebPushSubscription);

export default WebPushSubscription;
