import { Nymph, Entity } from 'nymph-client';

export class PrivateKey extends Entity {
  constructor(id) {
    super(id);
    this.text = '';
  }

  static current(...args) {
    return PrivateKey.serverCallStatic('current', args);
  }
}

// The name of the server class
PrivateKey.class = 'Tunnelwire\\PrivateKey';

Nymph.setEntityClass(PrivateKey.class, PrivateKey);

export default PrivateKey;
