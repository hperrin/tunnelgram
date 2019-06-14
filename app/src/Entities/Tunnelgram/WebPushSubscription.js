import { Nymph, Entity } from 'nymph-client';

export class WebPushSubscription extends Entity {
  constructor(id) {
    super(id);
    this.endpoint = '';
    this.keys = {};
  }

  static getVapidPublicKey(...args) {
    return WebPushSubscription.serverCallStatic('getVapidPublicKey', args);
  }
}

// The name of the server class
WebPushSubscription.class = 'Tunnelgram\\WebPushSubscription';

Nymph.setEntityClass(WebPushSubscription.class, WebPushSubscription);

export default WebPushSubscription;
