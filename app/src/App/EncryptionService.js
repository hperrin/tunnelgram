import PrivateKey from '../Entities/PrivateKey';
import PublicKey from '../Entities/PublicKey';
import sha512 from 'hash.js/lib/hash/sha/512';
import JSEncrypt from 'jsencrypt';
import aesjs from 'aes-js';

class EncryptionService {
  constructor () {
    this.storage = window.localStorage;
    this.decryptor = null;
  }

  setUserPrivateKey (privateKey) {
    this.storage.setItem('esPrivateKey', privateKey);
  }

  getUserPrivateKey () {
    return this.storage.getItem('esPrivateKey');
  }

  unsetUserPrivateKey () {
    this.storage.removeItem('esPrivateKey');
    this.decryptor = null;
  }

  decrypt (text) {
    // const testString = 'Hello, world.';
    // const encryptor = new JSEncrypt();
    // encryptor.setPublicKey(publicKey);
    if (!this.decryptor) {
      this.decryptor = new JSEncrypt();
      this.decryptor.setPrivateKey(this.getUserPrivateKey());
    }
    // const enc = encryptor.encrypt(testString);
    return this.decryptor.decrypt(text);
  }

  static userKeyPairWatch (User) {
    const _register = User.prototype.register;
    User.prototype.register = function (creds) {
      const {password} = creds;

      // Generate a hash of the password.
      const hash = sha512().update(password).digest('hex');
      // The first 32 bytes is used as the key for AES, and not sent to the server.
      const key = hash.substr(0, 32);
      const keyBytes = aesjs.utils.utf8.toBytes(key);
      // The rest is used as the new password, and replaces the one the user entered.
      const newPassword = hash.substr(32);

      // Generate a Public/Private key pair.
      // TODO(hperrin): change these to the B64 equivalents to reduce space after testing.
      const keyPair = new JSEncrypt({log: true});
      const privateKey = keyPair.getPrivateKey();
      crypt.setUserPrivateKey(privateKey);
      const publicKey = keyPair.getPublicKey();

      // Encrypt the private key.
      const privateKeyBytes = aesjs.utils.utf8.toBytes(privateKey);
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes);
      const encryptedPrivateKeyBytes = aesCtr.encrypt(privateKeyBytes);
      const encryptedPrivateKey = aesjs.utils.hex.fromBytes(encryptedPrivateKeyBytes);

      // Decrypt the private key.
      // const encryptedPrivateKeyBytesTest = aesjs.utils.hex.toBytes(encryptedPrivateKey);
      // const aesCtrTest = new aesjs.ModeOfOperation.ctr(keyBytes);
      // const privateKeyBytesTest = aesCtrTest.decrypt(encryptedPrivateKeyBytesTest);
      // const privateKeyTest = aesjs.utils.utf8.fromBytes(privateKeyBytesTest);


      console.log({
        password,
        hash,
        key,
        newPassword,
        privateKey,
        privateKeyTest,
        privateKeyTestEqual: privateKeyTest === privateKey,
        publicKey,
        encryptedPrivateKey
      });

      return Promise.reject({});
    };
  }
}

const crypt = new EncryptionService();

export {EncryptionService, crypt};
