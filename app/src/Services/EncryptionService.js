import {User} from 'tilmeld-client';
import PrivateKey from '../Entities/PrivateKey';
import PublicKey from '../Entities/PublicKey';
import sha512 from 'hash.js/lib/hash/sha/512';
import JSEncrypt from 'jsencrypt';
import aesjs from 'aes-js';
import base64js from 'base64-js';
import utf8 from 'utf8';

class EncryptionService {
  constructor () {
    this.storage = window.localStorage;
    this.decryptor = null;
    this.key = null;
    this.iv = null;
    this.encryptors = {};
    this.userPublicKeys = {};
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.decryption = true; // Turning this off causes the decrypt function to just return what it is given.

    if (this.getUserPrivateKey() != null && this.getUserPublicKey() != null) {
      this.resolve();
    }

    // Load the private key when the user logs in.
    User.on('login', async (user) => {
      try {
        const privatePromise = PrivateKey.current();
        const publicPromise = PublicKey.current();
        let privateKey = await privatePromise;
        let publicKey = await publicPromise;
        const keyBytes = aesjs.utils.hex.toBytes(crypt.key);
        const ivBytes = aesjs.utils.hex.toBytes(crypt.iv);
        const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

        if (privateKey && publicKey) {
          // The user has been here before, so get the private key from the entity.

          // Decrypt the private key.
          const encryptedPrivateKeyString = privateKey.get('text');
          const encryptedPrivateKeyBytes = base64js.toByteArray(encryptedPrivateKeyString);
          const privateKeyBytes = aesCtr.decrypt(encryptedPrivateKeyBytes);
          const privateKeyString = aesjs.utils.utf8.fromBytes(privateKeyBytes);

          this.setUserPrivateKey(privateKeyString);

          // And load the public key.
          const publicKeyString = publicKey.get('text');
          this.setUserPublicKey(publicKeyString);

          // TODO(hperrin): Should I have this for user trust?
          await (new Promise((resolve) => setTimeout(() => resolve(), 1000)));
        } else if (!privateKey && !publicKey) {
          // The user just registered, so save the new private key.
          privateKey = new PrivateKey();

          // Encrypt the private key.
          const privateKeyString = this.getUserPrivateKey();
          const privateKeyBytes = aesjs.utils.utf8.toBytes(privateKeyString);
          const encryptedPrivateKeyBytes = aesCtr.encrypt(privateKeyBytes);
          const encryptedPrivateKeyString = base64js.fromByteArray(encryptedPrivateKeyBytes);

          privateKey.set({text: encryptedPrivateKeyString});
          const privateKeySave = privateKey.save();

          // And save the public key.
          const publicKey = new PublicKey();
          const publicKeyString = this.getUserPublicKey();
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

          // TODO(hperrin): Should I have this for user trust?
          await (new Promise((resolve) => setTimeout(() => resolve(), 2000)));
        } else {
          this.reject('Server provided inconsistent keys. Please refresh the page.');
          return;
        }

        crypt.key = null;
        crypt.iv = null;
        this.resolve();
      } catch (e) {
        console.log('Error getting private key: ', e);
      }
    });

    // Unload the private key when the user logs out.
    User.on('logout', () => {
      crypt.unsetUserKeys();
    });

    const computeNewPassword = password => {
      // Generate a hash of the password.
      const hash = sha512().update(password).digest('hex');
      // The first 32 bytes (64 hex chars) is used as the key for AES, and not sent to the server.
      crypt.key = hash.substr(0, 64);
      // The next 16 bytes (32 hex chars) is used as the initialization vector for Output Feedback Mode, and not sent to the server.
      crypt.iv = hash.substr(64, 32);
      // The rest is used as the new password, and replaces the one the user entered.
      return hash.substr(96);
    };

    // Override register to set up new user encryption.
    const _register = User.prototype.register;
    User.prototype.register = function (creds) {
      const {password} = creds;
      creds.password = computeNewPassword(password);

      // Generate a Public/Private key pair.
      // TODO(hperrin): change these to the B64 equivalents to reduce space after testing.
      const keyPair = new JSEncrypt({log: true});
      const privateKey = keyPair.getPrivateKey();
      crypt.setUserPrivateKey(privateKey);
      const publicKey = keyPair.getPublicKey();
      crypt.setUserPublicKey(publicKey);

      return _register.call(this, creds);
    };

    // Override loginUser to retrieve the key and change the password.
    const _loginUser = User.loginUser;
    User.loginUser = function (creds) {
      const {password} = creds;
      creds.password = computeNewPassword(password);

      return _loginUser.call(this, creds);
    }

    // TODO(hperrin): Password changes.
  }

  setUserPrivateKey (privateKey) {
    this.storage.setItem('esPrivateKey', privateKey);
    // TODO(hperrin): remove this after testing.
    console.log('Private Key: ', privateKey);
  }

  setUserPublicKey (publicKey) {
    this.storage.setItem('esPublicKey', publicKey);
    // TODO(hperrin): remove this after testing.
    console.log('Public Key: ', publicKey);
  }

  getUserPrivateKey () {
    return this.storage.getItem('esPrivateKey');
  }

  getUserPublicKey () {
    return this.storage.getItem('esPublicKey');
  }

  unsetUserKeys () {
    this.storage.removeItem('esPrivateKey');
    this.storage.removeItem('esPublicKey');
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
    if (!this.decryptor) {
      this.decryptor = new JSEncrypt();
      this.decryptor.setPrivateKey(this.getUserPrivateKey());
    }
    return this.decryptor.decrypt(text);
  }

  encryptRSA (text, publicKey) {
    let encryptor;
    if (publicKey == null) {
      publicKey = this.getUserPublicKey();
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

  decrypt (text, key) {
    if (!this.decryption) {
      return text;
    }

    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = aesjs.utils.hex.toBytes(cryptKey);
    const ivBytes = aesjs.utils.hex.toBytes(cryptIV);
    const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

    // Decrypt the Text.
    const encryptedBytes = base64js.toByteArray(text);
    const bytes = aesCtr.decrypt(encryptedBytes);
    return utf8.decode(aesjs.utils.utf8.fromBytes(bytes));
  }

  encrypt (text, key) {
    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = aesjs.utils.hex.toBytes(cryptKey);
    const ivBytes = aesjs.utils.hex.toBytes(cryptIV);
    const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

    // Encrypt the Text.
    const bytes = aesjs.utils.utf8.toBytes(utf8.encode(text));
    const encryptedBytes = aesCtr.encrypt(bytes);
    return base64js.fromByteArray(encryptedBytes);
  }

  generateKey () {
    let keyArray = new Uint8Array(48);
    window.crypto.getRandomValues(keyArray);
    return aesjs.utils.hex.fromBytes(keyArray);
  }
}

const crypt = new EncryptionService();

export {EncryptionService, crypt};
