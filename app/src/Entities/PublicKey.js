import {Nymph, Entity} from 'nymph-client';

export class PublicKey extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.text = '';
  }

  // === Static Methods ===

  static current(...args) {
    return PublicKey.serverCallStatic('current', args);
  }
}

// === Static Properties ===

// The name of the server class
PublicKey.class = 'ESText\\PublicKey';

Nymph.setEntityClass(PublicKey.class, PublicKey);

export default PublicKey;
