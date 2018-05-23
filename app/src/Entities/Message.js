import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {crypt} from '../Services/EncryptionService';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Message extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.decrypted = {
      text: '[Encrypted text]'
    };
    this.data.text = null;
    this.data.keys = {};
  }

  // === Instance Methods ===

  init (...args) {
    super.init(...args);

    // Decrypt the message text.
    if (currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
      const key = crypt.decryptRSA(this.data.keys[currentUser.guid]);
      this.decrypted.text = crypt.decrypt(this.data.text, key);
    }

    return this;
  }

  async save () {
    // Encrypt the message text for all recipients (which should include the current user).
    const key = crypt.generateKey();
    this.data.text = crypt.encrypt(this.decrypted.text, key);

    const encryptPromises = [];
    for (let user of this.data.acRead) {
      encryptPromises.push({user, promise: crypt.encryptRSAForUser(key, user)});
    }
    this.data.keys = {};
    for (let entry of encryptPromises) {
      this.data.keys[entry.user.guid] = await entry.promise;
    }

    return super.save();
  }
}

// === Static Properties ===

// The name of the server class
Message.class = 'Tunnelgram\\Message';

Nymph.setEntityClass(Message.class, Message);

export default Message;
