import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {crypt} from '../Services/EncryptionService';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Conversation extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.decrypted = {
      name: null
    };
    this.data.name = null;
    this.data.acFull = [];
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

    // Decrypt the conversation name.
    if (currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
      const key = crypt.decryptRSA(this.data.keys[currentUser.guid]);
      this.decrypted.name = crypt.decrypt(this.data.name, key);
    }

    return this;
  }

  async save () {
    if (this.decrypted.name != null) {
      // Encrypt the conversation name for all recipients (which should include the current user).
      const key = crypt.generateKey();
      this.data.name = crypt.encrypt(this.decrypted.name, key);

      const encryptPromises = [];
      for (let user of this.data.acFull) {
        encryptPromises.push({user, promise: crypt.encryptRSAForUser(key, user)});
      }
      this.data.keys = {};
      for (let entry of encryptPromises) {
        this.data.keys[entry.user.guid] = await entry.promise;
      }
    } else {
      this.data.name = null;
      delete this.data.keys;
    }

    return super.save();
  }

  getName (currentUser) {
    if (this.guid == null) {
      return 'New Conversation';
    } else if (this.decrypted.name != null) {
      return this.decrypted.name;
    } else if (this.data.acFull.length === 1) {
      return 'Just You';
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
Conversation.class = 'Tunnelgram\\Conversation';

Nymph.setEntityClass(Conversation.class, Conversation);

export default Conversation;
