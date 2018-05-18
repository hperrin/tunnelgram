import {Nymph, Entity} from 'nymph-client';

export class Conversation extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.done = false;
  }

  // === Instance Methods ===

  archive (...args) {
    return this.serverCall('archive', args);
  }

  share (...args) {
    return this.serverCall('share', args);
  }

  unshare (...args) {
    return this.serverCall('unshare', args);
  }
}

// === Static Properties ===

// The name of the server class
Conversation.class = 'ESText\\Conversation';

Nymph.setEntityClass(Conversation.class, Conversation);

export default Conversation;
