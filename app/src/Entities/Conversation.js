import {Nymph, Entity} from 'nymph-client';

export class Conversation extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.name = null;
    this.data.acFull = [];

    // TODO(hperrin): Encrypt conversation names.
  }

  // === Instance Methods ===

  init (entityData) {
    super.init(entityData);
    if (entityData == null) {
      return this;
    }
    if (entityData.readline != null) {
      this.readline = entityData.readline;
    }
    return this;
  }

  getName (currentUser) {
    if (this.guid == null) {
      return 'New Conversation';
    } else if (this.data.name != null) {
      return this.data.name;
    } else {
      const names = [];
      for (let i = 0; i < this.data.acFull.length; i++) {
        const participant = this.data.acFull[i];
        if (!currentUser.is(participant)) {
          names.push(participant.data.name ? participant.data.name : 'Loading...');
        }
      }
      return names.join(', ');
    }
  }

  saveReadline (...args) {
    return this.serverCall('saveReadline', args);
  }
}

// === Static Properties ===

// The name of the server class
Conversation.class = 'ESText\\Conversation';

Nymph.setEntityClass(Conversation.class, Conversation);

export default Conversation;
