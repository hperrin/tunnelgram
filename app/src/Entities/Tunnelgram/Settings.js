import { Nymph, Entity } from 'nymph-client';
import { User } from 'tilmeld-client';
import { crypt } from '../../Services/EncryptionService';
import { ready as authTokenHandlerReady } from '../../setup/authTokenHandler';

let currentUser = null;

authTokenHandlerReady.then(() => {
  User.current().then((user) => (currentUser = user));
});
User.on('login', (user) => (currentUser = user));
User.on('logout', () => (currentUser = null));

export class Settings extends Entity {
  constructor(id) {
    super(id);
    this.$decrypted = {
      nicknames: {},
    };
    this.nicknames = {};

    this.$cryptReady = true;
    this.$cryptReadyPromise = Promise.resolve(true);
  }

  $init(entityData) {
    super.$init(entityData);

    if (entityData == null) {
      this.$cryptReady = true;
      return this;
    }

    this.$cryptReady = false;
    this.$cryptReadyPromise = (async () => {
      // Decrypt the nicknames.
      if (currentUser && this.key) {
        const key = await crypt.decryptRSA(this.key);
        for (let id in this.nicknames) {
          this.$decrypted.nicknames[id] = await crypt.decrypt(
            this.nicknames[id],
            key,
          );
        }
      }

      this.$cryptReady = true;
      return true;
    })();

    return this;
  }

  async $save() {
    // Encrypt the nicknames.
    const key = crypt.generateKey();
    this.nicknames = {};
    for (let id in this.$decrypted.nicknames) {
      this.nicknames[id] = await crypt.encrypt(
        this.$decrypted.nicknames[id],
        key,
      );
    }

    const encryptPromise = crypt.encryptRSAForUser(key, currentUser);

    this.key = await encryptPromise;

    return await super.$save();
  }

  static async current() {
    if (!currentUser) {
      return new Settings();
    }

    let existing;
    try {
      existing = await Nymph.getEntity(
        {
          class: Settings.class,
        },
        {
          type: '&',
          ref: ['user', currentUser.guid],
        },
      );
    } catch (err) {
      if (err.status != 404) {
        throw err;
      }
    }

    return existing || new Settings();
  }
}

// The name of the server class
Settings.class = 'Tunnelgram\\Settings';
// Cache expiry time. 2 days.
Settings.CACHE_EXPIRY = 1000 * 60 * 60 * 24 * 2;

Nymph.setEntityClass(Settings.class, Settings);

export default Settings;
