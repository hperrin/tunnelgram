import {Nymph, Entity} from 'nymph-client';

export class Message extends Entity {
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
Message.class = 'ESText\\Message';

Nymph.setEntityClass(Message.class, Message);

export default Message;
