import { Nymph, Entity } from 'nymph-client';

export class PublicKey extends Entity {
  constructor(id) {
    super(id);
    this.data.text = '';
  }

  static current(...args) {
    return PublicKey.serverCallStatic('current', args);
  }
}

// The name of the server class
PublicKey.class = 'Tunnelwire\\PublicKey';

Nymph.setEntityClass(PublicKey.class, PublicKey);

export default PublicKey;
