import { User } from 'tilmeld-client';
import PrivateKey from '../Entities/Tunnelwire/PrivateKey';
import PublicKey from '../Entities/Tunnelwire/PublicKey';
import { AESEncryptionService } from './AESEncryptionService';
import { storage } from './StorageService';

const root = self || window;

class EncryptionService extends AESEncryptionService {
  constructor() {
    super();

    const that = this;
    this.storage = storage;
    this.key = null;
    this.iv = null;
    this.userPublicKeys = {};
    this.userPrivateKey = null;
    this.userPublicKey = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Async encryption/decryption for PKCS1 is provided through a web worker.
    this.rsaEncryptionWorker = {
      worker: new Worker('dist/Workers/RSAEncryption.js'),
      counter: 0,
      callbacks: {},
    };
    this.rsaEncryptionWorker.worker.onmessage = e => {
      const { counter, result } = e.data;
      this.rsaEncryptionWorker.callbacks[counter](result);
      delete this.rsaEncryptionWorker.callbacks[counter];
    };

    (async () => {
      await this.getUserPrivateKey();
      await this.getUserPublicKey();
      if (this.userPrivateKey != null && this.userPublicKey != null) {
        this.resolve();
      }
    })();

    // Load the private key when the user logs in.
    User.on('login', async () => {
      try {
        const privatePromise = PrivateKey.current();
        const publicPromise = PublicKey.current();
        let privateKey = await privatePromise;
        let publicKey = await publicPromise;

        if (privateKey && publicKey) {
          // The user has been here before, so get the private key from the entity.

          // Decrypt the private key.
          const encryptedPrivateKey = privateKey.get('text');
          const privateKeyString = await this.decrypt(
            encryptedPrivateKey,
            this.key + this.iv,
          );

          await this.setUserPrivateKey(privateKeyString);

          // And load the public key.
          const publicKeyString = publicKey.get('text');
          await this.setUserPublicKey(publicKeyString);
        } else if (!privateKey && !publicKey) {
          // The user just registered, so save the new private key.
          privateKey = new PrivateKey();

          // Encrypt the private key.
          const privateKeyString = this.userPrivateKey;
          const encryptedPrivateKeyString = await this.encrypt(
            privateKeyString,
            this.key + this.iv,
          );

          privateKey.set({ text: encryptedPrivateKeyString });
          const privateKeySave = privateKey.save();

          // And save the public key.
          const publicKey = new PublicKey();
          const publicKeyString = this.userPublicKey;
          publicKey.set({ text: publicKeyString });
          const publicKeySave = publicKey.save();

          try {
            await privateKeySave;
            await publicKeySave;
          } catch (e) {
            this.reject(
              'Error storing encryption keys! You need to manually store them. I will print them in the console.',
            );
            console.log('Encrypted Private Key: ', encryptedPrivateKeyString);
            console.log('Public Key: ', publicKeyString);
            return;
          }
        } else {
          this.reject(
            'Server provided inconsistent keys. Please refresh the page.',
          );
          return;
        }

        this.key = null;
        this.iv = null;
        this.resolve();
      } catch (e) {
        console.log('Error getting private key: ', e);
      }
    });

    // Unload the private key when the user logs out.
    User.on('logout', () => {
      this.unsetUserKeys();
    });

    const computeNewPassword = async password => {
      // Generate a hash of the password.
      const passwordBytes = this.encodeUtf8(password);
      const hashBytes = new Uint8Array(
        await root.crypto.subtle.digest('SHA-512', passwordBytes),
      );
      const hash = this.encodeHex(hashBytes);
      // The first 32 bytes (64 hex chars) is used as the key for AES, and not sent to the server.
      this.key = hash.substr(0, 64);
      // The next 16 bytes (32 hex chars) is used as the initialization vector for Output Feedback Mode, and not sent to the server.
      this.iv = hash.substr(64, 32);
      // The rest is used as the new password, and replaces the one the user entered.
      return hash.substr(96);
    };

    // Override register to set up new user encryption.
    const _register = User.prototype.register;
    User.prototype.register = async function(creds) {
      const { password } = creds;
      creds.password = await computeNewPassword(password);

      // Generate a Public/Private key pair.
      const keyPair = new JSEncrypt();
      const privateKey = keyPair.getPrivateKeyB64();
      await that.setUserPrivateKey(privateKey);
      const publicKey = keyPair.getPublicKeyB64();
      await that.setUserPublicKey(publicKey);

      return await _register.call(this, creds);
    };

    // Override loginUser to retrieve the key and change the password.
    const _loginUser = User.loginUser;
    User.loginUser = async function(creds) {
      const { password } = creds;
      creds.password = await computeNewPassword(password);

      return await _loginUser.call(this, creds);
    };

    // Override changePassword to re-encrypt the key and change the password.
    const _changePassword = User.prototype.changePassword;
    User.prototype.changePassword = async function(creds) {
      const { password, oldPassword } = creds;
      // Compute the old password first.
      creds.oldPassword = await computeNewPassword(oldPassword);
      // Compute the new password second, so that.key and that.iv are current.
      creds.password = await computeNewPassword(password);

      // Re-encrypt the private key.
      const privateKeyString = that.userPrivateKey;
      const privateKeyBytes = this.encodeUtf8(privateKeyString);
      const encryptedPrivateKeyBytes = await this.encryptBytes(
        privateKeyBytes,
        that.key + that.iv,
      );
      const encryptedPrivateKeyString = this.encodeBase64(
        encryptedPrivateKeyBytes,
      );

      creds.encryptedPrivateKeyString = encryptedPrivateKeyString;

      return await _changePassword.call(this, creds);
    };
  }

  async setUserPrivateKey(privateKey) {
    this.userPrivateKey = privateKey;
    await this.storage.setItem('twPrivateKey', privateKey);
  }

  async setUserPublicKey(publicKey) {
    this.userPublicKey = publicKey;
    await this.storage.setItem('twPublicKey', publicKey);
  }

  async getUserPrivateKey() {
    this.userPrivateKey = await this.storage.getItem('twPrivateKey');
    return this.userPrivateKey;
  }

  async getUserPublicKey() {
    this.userPublicKey = await this.storage.getItem('twPublicKey');
    return this.userPublicKey;
  }

  async unsetUserKeys() {
    await this.storage.removeItem('twPrivateKey');
    await this.storage.removeItem('twPublicKey');
    await this.callEncryptionWorker(this.rsaEncryptionWorker, 'resetRsa');
    this.key = null;
    this.iv = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async decryptRSA(text, privateKey) {
    if (privateKey == null) {
      if (!this.userPrivateKey) {
        throw new Error('Tried to decrypt RSA without private key!');
      }
      privateKey = this.userPrivateKey;
    }
    const result = await this.callEncryptionWorker(
      this.rsaEncryptionWorker,
      'decryptRSA',
      [text, privateKey],
    );
    return result;
  }

  async encryptRSA(text, publicKey) {
    if (publicKey == null) {
      if (!this.userPublicKey) {
        throw new Error('Tried to encrypt RSA without public key!');
      }
      publicKey = this.userPublicKey;
    }
    const result = await this.callEncryptionWorker(
      this.rsaEncryptionWorker,
      'encryptRSA',
      [text, publicKey],
    );
    return result;
  }

  async encryptRSAForUser(text, userOrGuid) {
    let publicKey;
    let guid = typeof userOrGuid === 'number' ? userOrGuid : userOrGuid.guid;
    if (guid in this.userPublicKeys) {
      publicKey = this.userPublicKeys[guid];
    } else {
      try {
        const publicKeyEntity = await Nymph.getEntity(
          {
            class: PublicKey.class,
          },
          {
            type: '&',
            ref: ['user', guid],
          },
        );
        publicKey = publicKeyEntity.get('text');
        this.userPublicKeys[guid] = publicKey;
      } catch (e) {
        return null;
      }
    }
    return await this.encryptRSA(text, publicKey);
  }

  callEncryptionWorker(worker, action, args, transferrables) {
    const counter = worker.counter++;

    let resolve;
    const promise = new Promise(r => (resolve = r));

    worker.callbacks[counter] = result => {
      resolve(result);
    };

    worker.worker.postMessage(
      {
        counter,
        action,
        args,
      },
      transferrables,
    );

    return promise;
  }
}

const crypt = new EncryptionService();

export { EncryptionService, crypt };
