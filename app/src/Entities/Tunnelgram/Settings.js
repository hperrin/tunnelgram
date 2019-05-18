import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {crypt} from '../../Services/EncryptionService';

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

    this.cryptReady = true;
    this.cryptReadyPromise = Promise.resolve(true);
  }

  // === Instance Methods ===

  init (entityData) {
    super.init(entityData);

    if (entityData == null) {
      return this;
    }

    this.cryptReady = false;
    this.cryptReadyPromise = (async () => {
        // Decrypt the nicknames.
      if (currentUser && this.data.key) {
        const key = crypt.decryptRSA(this.data.key);
        for (let id in this.data.nicknames) {
          this.decrypted.nicknames[id] = await crypt.decrypt(this.data.nicknames[id], key);
        }
      }

      this.cryptReady = true;
      return true;
    })();

    return this;
  }

  async save () {
    // Encrypt the nicknames.
    const key = crypt.generateKey();
    this.data.nicknames = {};
    for (let id in this.decrypted.nicknames) {
      this.data.nicknames[id] = await crypt.encrypt(this.decrypted.nicknames[id], key);
    }

    const encryptPromise = crypt.encryptRSAForUser(key, currentUser);

    this.data.key = await encryptPromise;

    return await super.save();
  }

  // === Static Methods ===

  static async current () {
    if (!currentUser) {
      return new Settings();
    }

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
// Cache expiry time. 2 days.
Settings.CACHE_EXPIRY = 1000*60*60*24*2;

Nymph.setEntityClass(Settings.class, Settings);

export default Settings;
