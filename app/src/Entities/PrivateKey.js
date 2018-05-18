import {Nymph, Entity} from 'nymph-client';

export class PrivateKey extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.text = '';
  }

  // === Static Methods ===

  static getCurrent(...args) {
    return PrivateKey.serverCallStatic('getCurrent', args);
  }
}

// === Static Properties ===

// The name of the server class
PrivateKey.class = 'ESText\\PrivateKey';

Nymph.setEntityClass(PrivateKey.class, PrivateKey);

export default PrivateKey;
