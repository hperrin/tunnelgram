import {User} from 'tilmeld-client';
import PrivateKey from '../Entities/Tunnelwire/PrivateKey';
import PublicKey from '../Entities/Tunnelwire/PublicKey';
import {AESEncryptionService} from './AESEncryptionService';
import {StorageService} from './StorageService';
import sha512 from 'hash.js/lib/hash/sha/512';
import JSEncrypt from 'jsencrypt';
import aesjs from 'aes-js';
import base64js from 'base64-js';
import utf8 from 'utf8';

class EncryptionService extends AESEncryptionService {
  constructor () {
    super();

    const that = this;
    this.storage = new StorageService();
    this.decryptor = null;
    this.key = null;
    this.iv = null;
    this.encryptors = {};
    this.userPublicKeys = {};
    this.userPrivateKey = null;
    this.userPublicKey = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Async encryption/decryption is provided through a service worker.
    this.aesEncryptionWorker = new Worker('/dist/Workers/AESEncryption.js');
    this.aesEncryptionWorkerCounter = 0;
    this.aesEncryptionWorkerCallbacks = {};
    this.aesEncryptionWorker.onmessage = (e) => {
      const {counter, result} = e.data;
      this.aesEncryptionWorkerCallbacks[counter](result);
      delete this.aesEncryptionWorkerCallbacks[counter];
    };

    (async () => {
      this.userPrivateKey = await this.getUserPrivateKey();
      this.userPublicKey = await this.getUserPublicKey();
      if (this.userPrivateKey != null && this.userPublicKey != null) {
        this.resolve();
      }
    })();

    // Load the private key when the user logs in.
    User.on('login', async (user) => {
      try {
        const privatePromise = PrivateKey.current();
        const publicPromise = PublicKey.current();
        let privateKey = await privatePromise;
        let publicKey = await publicPromise;
        const keyBytes = aesjs.utils.hex.toBytes(this.key);
        const ivBytes = aesjs.utils.hex.toBytes(this.iv);
        const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

        if (privateKey && publicKey) {
          // The user has been here before, so get the private key from the entity.

          // Decrypt the private key.
          const encryptedPrivateKeyString = privateKey.get('text');
          const encryptedPrivateKeyBytes = base64js.toByteArray(encryptedPrivateKeyString);
          const privateKeyBytes = aesCtr.decrypt(encryptedPrivateKeyBytes);
          const privateKeyString = aesjs.utils.utf8.fromBytes(privateKeyBytes);

          await this.setUserPrivateKey(privateKeyString);

          // And load the public key.
          const publicKeyString = publicKey.get('text');
          await this.setUserPublicKey(publicKeyString);
        } else if (!privateKey && !publicKey) {
          // The user just registered, so save the new private key.
          privateKey = new PrivateKey();

          // Encrypt the private key.
          const privateKeyString = this.userPrivateKey;
          const privateKeyBytes = aesjs.utils.utf8.toBytes(privateKeyString);
          const encryptedPrivateKeyBytes = aesCtr.encrypt(privateKeyBytes);
          const encryptedPrivateKeyString = base64js.fromByteArray(encryptedPrivateKeyBytes);

          privateKey.set({text: encryptedPrivateKeyString});
          const privateKeySave = privateKey.save();

          // And save the public key.
          const publicKey = new PublicKey();
          const publicKeyString = this.userPublicKey;
          publicKey.set({text: publicKeyString});
          const publicKeySave = publicKey.save();

          try {
            await privateKeySave;
            await publicKeySave;
          } catch (e) {
            this.reject('Error storing encryption keys! You need to manually store them. I will print them in the console.');
            console.log('Encrypted Private Key: ', encryptedPrivateKeyString);
            console.log('Public Key: ', publicKeyString);
            return;
          }
        } else {
          this.reject('Server provided inconsistent keys. Please refresh the page.');
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

    const computeNewPassword = password => {
      // Generate a hash of the password.
      const hash = sha512().update(password).digest('hex');
      // The first 32 bytes (64 hex chars) is used as the key for AES, and not sent to the server.
      this.key = hash.substr(0, 64);
      // The next 16 bytes (32 hex chars) is used as the initialization vector for Output Feedback Mode, and not sent to the server.
      this.iv = hash.substr(64, 32);
      // The rest is used as the new password, and replaces the one the user entered.
      return hash.substr(96);
    };

    // Override register to set up new user encryption.
    const _register = User.prototype.register;
    User.prototype.register = async function (creds) {
      const {password} = creds;
      creds.password = computeNewPassword(password);

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
    User.loginUser = function (creds) {
      const {password} = creds;
      creds.password = computeNewPassword(password);

      return _loginUser.call(this, creds);
    }

    // Override changePassword to re-encrypt the key and change the password.
    const _changePassword = User.prototype.changePassword;
    User.prototype.changePassword = function (creds) {
      const {password, oldPassword} = creds;
      // Compute the old password first.
      creds.oldPassword = computeNewPassword(oldPassword);
      // Compute the new password second, so that.key and that.iv are current.
      creds.password = computeNewPassword(password);

      // Re-encrypt the private key.
      const keyBytes = aesjs.utils.hex.toBytes(that.key);
      const ivBytes = aesjs.utils.hex.toBytes(that.iv);
      const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);
      const privateKeyString = that.userPrivateKey;
      const privateKeyBytes = aesjs.utils.utf8.toBytes(privateKeyString);
      const encryptedPrivateKeyBytes = aesCtr.encrypt(privateKeyBytes);
      const encryptedPrivateKeyString = base64js.fromByteArray(encryptedPrivateKeyBytes);

      creds.encryptedPrivateKeyString = encryptedPrivateKeyString;

      return _changePassword.call(this, creds);
    }
  }

  async setUserPrivateKey (privateKey) {
    this.userPrivateKey = privateKey;
    await this.storage.setItem('twPrivateKey', privateKey);
  }

  async setUserPublicKey (publicKey) {
    this.userPublicKey = publicKey;
    await this.storage.setItem('twPublicKey', publicKey);
  }

  async getUserPrivateKey () {
    return await this.storage.getItem('twPrivateKey');
  }

  async getUserPublicKey () {
    return await this.storage.getItem('twPublicKey');
  }

  async unsetUserKeys () {
    await this.storage.removeItem('twPrivateKey');
    await this.storage.removeItem('twPublicKey');
    this.decryptor = null;
    this.key = null;
    this.iv = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  decryptRSA (text) {
    if (!this.userPrivateKey) {
      throw new Error('Tried to decrypt RSA without private key!');
    }
    if (!this.decryptor) {
      this.decryptor = new JSEncrypt();
      this.decryptor.setPrivateKey(this.userPrivateKey);
    }
    return this.decryptor.decrypt(text);
  }

  encryptRSA (text, publicKey) {
    let encryptor;
    if (publicKey == null) {
      publicKey = this.userPublicKey;
    }
    if (this.encryptors.hasOwnProperty(publicKey)) {
      encryptor = this.encryptors[publicKey];
    } else {
      encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);
      this.encryptors[publicKey] = encryptor;
    }
    return encryptor.encrypt(text);
  }

  async encryptRSAForUser(text, user) {
    let publicKey;
    if (this.userPublicKeys.hasOwnProperty(user.guid)) {
      publicKey = this.userPublicKeys[user.guid];
    } else {
      try {
        const publicKeyEntity = await Nymph.getEntity(
          {'class': PublicKey.class},
          {
            'type': '&',
            'ref': ['user', user.guid]
          }
        );
        publicKey = publicKeyEntity.get('text');
        this.userPublicKeys[user.guid] = publicKey;
      } catch (e) {
        return null;
      }
    }
    return this.encryptRSA(text, publicKey);
  }

  async decryptAsync (text, key) {
    if (!this.decryption) {
      return text;
    }

    return await this.callAESEncryptionWorker('decrypt', [text, key]);
  }

  async encryptAsync (text, key) {
    return await this.callAESEncryptionWorker('encrypt', [text, key]);
  }

  async decryptBytesAsync (bytes, key) {
    if (!this.decryption) {
      return bytes;
    }

    const returnBytes = await this.callAESEncryptionWorker('decryptBytes', [bytes, key], [bytes.buffer]);

    return returnBytes;
  }

  async encryptBytesAsync (bytes, key) {
    return await this.callAESEncryptionWorker('encryptBytes', [bytes, key], [bytes.buffer]);
  }

  async encryptBytesToBase64Async (bytes, key) {
    return await this.callAESEncryptionWorker('encryptBytesToBase64', [bytes, key], [bytes.buffer]);
  }

  callAESEncryptionWorker (action, args, transferrables) {
    this.aesEncryptionWorkerCounter++;
    const counter = this.aesEncryptionWorkerCounter;

    let resolve;
    const promise = new Promise(r => resolve = r);

    this.aesEncryptionWorkerCallbacks[counter] = result => {
      resolve(result);
    };

    this.aesEncryptionWorker.postMessage({
      counter,
      action,
      args
    }, transferrables);

    return promise;
  }
}

const crypt = new EncryptionService();

export {EncryptionService, crypt};
