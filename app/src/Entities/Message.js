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
    this.data.text = {};
  }

  // === Instance Methods ===

  init (...args) {
    super.init(...args);

    // Decrypt the message text.
    this.decrypted.text = '[Encrypted text]';
    if (!currentUser) {
      return;
    }
    this.decrypted.text = crypt.decrypt(this.data.text[currentUser.guid]);

    return this;
  }

  async save () {
    // Encrypt the message text for all recipients (which should include the current user).
    const encryptPromises = [];
    for (let user of this.data.acRead) {
      encryptPromises.push({user, promise: crypt.encryptForUser(this.decrypted.text, user)});
    }
    for (let entry of encryptPromises) {
      this.data.text[entry.user.guid] = await entry.promise;
    }
    return super.save();
  }
}

// === Static Properties ===

// The name of the server class
Message.class = 'ESText\\Message';

Nymph.setEntityClass(Message.class, Message);

export default Message;
