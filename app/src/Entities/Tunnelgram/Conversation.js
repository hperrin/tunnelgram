import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {Message} from './Message';
import {saveEntities, restoreEntities} from '../../Services/entityRefresh';
import {crypt} from '../../Services/EncryptionService';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Conversation extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.containsSleepingReference = false;
    this.pending = [];
    this.unreadCountPromise = null;
    this.unreadCountPromiseReadline = null;
    this.decrypted = {
      name: null
    };
    this.data.name = null;
    this.data.acFull = [];
  }

  // === Instance Methods ===

  init (entityData) {
    const savedEntities = saveEntities(this);
    super.init(entityData);
    this.containsSleepingReference = restoreEntities(this, savedEntities);

    if (entityData == null) {
      return this;
    }

    if (entityData.readline != null) {
      this.readline = entityData.readline;
    }

    // Decrypt the conversation name.
    if (currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
      if (this.data.name == null) {
        delete this.data.keys;
        this.save();
      } else {
        const key = crypt.decryptRSA(this.data.keys[currentUser.guid]).slice(0, 96);
        this.decrypted.name = crypt.decrypt(this.data.name, key);
      }
    }

    this.unreadCountPromise = null;

    return this;
  }

  async save () {
    if (this.decrypted.name != null) {
      // Encrypt the conversation name for all recipients (which should include the current user).
      const key = crypt.generateKey();
      this.data.name = crypt.encrypt(this.decrypted.name, key);

      const encryptPromises = [];
      for (let user of this.data.acFull) {
        const pad = crypt.generatePad();
        encryptPromises.push({user, promise: crypt.encryptRSAForUser(key + pad, user)});
      }
      this.data.keys = {};
      for (let entry of encryptPromises) {
        this.data.keys[entry.user.guid] = await entry.promise;
      }
    } else {
      this.data.name = null;
      delete this.data.keys;
    }

    return await super.save();
  }

  getName (settings) {
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
          let name = participant.data.name ? participant.data.name : 'Loading...';
          if (settings && participant.guid in settings.decrypted.nicknames) {
            name = settings.decrypted.nicknames[participant.guid];
          }
          names.push(name);
        }
      }
      return names.join(', ');
    }
  }

  async unreadCount () {
    if (this.readline == null) {
      return true;
    }

    if (this.data.lastMessage) {
      await this.data.lastMessage.ready();
      if (this.data.lastMessage.cdate <= this.readline) {
        return 0;
      }
    }

    if (!this.unreadCountPromise || this.unreadCountPromiseReadline < this.readline) {
      this.unreadCountPromiseReadline = this.readline;
      this.unreadCountPromise = Nymph.getEntities({
        'class': Message.class,
        'return': 'guid'
      }, {
        'type': '&',
        'ref': ['conversation', this.guid],
        'gt': ['cdate', this.readline]
      });
    }

    return ((await this.unreadCountPromise) || []).length;
  }

  saveReadline (...args) {
    if (this.readline < args[0]) {
      this.readline = args[0];
      this.unreadCountPromise = null;
    }
    return this.serverCall('saveReadline', args, true);
  }

  clearReadline (...args) {
    this.readline = null;
    this.unreadCountPromise = null;
    return this.serverCall('clearReadline', args, true);
  }

  findMatchingConversations(...args) {
    return this.serverCall('findMatchingConversations', args, true);
  }
}

// === Static Properties ===

// The name of the server class
Conversation.class = 'Tunnelgram\\Conversation';

Nymph.setEntityClass(Conversation.class, Conversation);

export default Conversation;
