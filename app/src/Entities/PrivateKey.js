import {Nymph, Entity} from 'nymph-client';

export class PrivateKey extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.text = '';
  }

  // === Static Methods ===

  static current (...args) {
    return PrivateKey.serverCallStatic('current', args);
  }
}

// === Static Properties ===

// The name of the server class
PrivateKey.class = 'Tunnelwire\\PrivateKey';

Nymph.setEntityClass(PrivateKey.class, PrivateKey);

export default PrivateKey;
