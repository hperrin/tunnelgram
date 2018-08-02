import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {crypt} from '../Services/EncryptionService';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Settings extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.decrypted = {
      nicknames: {}
    };
    this.data.nicknames = {};
  }

  // === Instance Methods ===

  init (entityData) {
    super.init(entityData);

    if (entityData == null) {
      return this;
    }

    // Decrypt the nicknames.
    if (currentUser && this.data.key) {
      const key = crypt.decryptRSA(this.data.key);
      for (let id in this.data.nicknames) {
        this.decrypted.nicknames[id] = crypt.decrypt(this.data.nicknames[id], key);
      }
    }

    return this;
  }

  async save () {
    // Encrypt the nicknames.
    const key = crypt.generateKey();
    this.data.nicknames = {};
    for (let id in this.decrypted.nicknames) {
      this.data.nicknames[id] = crypt.encrypt(this.decrypted.nicknames[id], key);
    }

    const encryptPromise = crypt.encryptRSAForUser(key, currentUser);

    this.data.key = await encryptPromise;

    return await super.save();
  }

  // === Static Methods ===

  static async current () {
    let existing;
    try {
      existing = await Nymph.getEntity({
        'class': Settings.class
      }, {
        'type': '&',
        'ref': ['user', currentUser.guid]
      });
    } catch (err) {
      if (err.status != 404) {
        throw err;
      }
    }

    return existing || (new Settings());
  }
}

// === Static Properties ===

// The name of the server class
Settings.class = 'Tunnelgram\\Settings';

Nymph.setEntityClass(Settings.class, Settings);

export default Settings;
