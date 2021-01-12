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
    this.userPublicKeysPkcs1 = {};
    this.userPrivateKey = null;
    this.userPublicKey = null;
    this.userPrivateKeyPem = null;
    this.userPublicKeyPem = null;
    this.userPrivateKeyPemPkcs1 = null;
    this.userPublicKeyPemPkcs1 = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Async encryption/decryption for PKCS1 is provided through a web worker.
    this.rsaEncryptionWorker = {
      worker: new Worker((window.inCordova ? '' : '/')+'dist/Workers/RSAEncryption.js'),
      counter: 0,
      callbacks: {},
    };
    this.rsaEncryptionWorker.worker.onmessage = e => {
      const { counter, result } = e.data;
      this.rsaEncryptionWorker.callbacks[counter](result);
      delete this.rsaEncryptionWorker.callbacks[counter];
    };

    (async () => {
      try {
        await Promise.all([this.getUserPrivateKey(), this.getUserPublicKey()]);
        if (this.userPrivateKey != null && this.userPublicKey != null) {
          this.resolve();
        }
      } catch (e) {
        if (e.name === 'EncryptionUpgradeNeededError') {
          // This process is only needed for as long as user tokens remain
          // valid after new encryption is implemented. After that time, any
          // user who hasn't upgraded their encryption will need to log in again
          // anyway.
          const privatePromise = PrivateKey.current();
          const publicPromise = PublicKey.current();
          let privateKey = await privatePromise;
          let publicKey = await publicPromise;

          if (privateKey.textOaep || publicKey.textOaep) {
            // The user has already upgraded encryption on another device, so
            // they need to log in again.
            const err = new Error(
              'Please log in again to enable new encryption.',
            );
            err.name = 'ReLogInNeededError';
            this.reject(err);
          } else {
            // The user has not upgraded encryption yet, so they must re-enter
            // their password (or create a new one) to upgrade.
            this.reject(e);
          }
        } else {
          this.reject(e);
        }
      }
    })();

    // Load the private key when the user logs in.
    User.on('login', async () => {
      try {
        const privatePromise = PrivateKey.current();
        const publicPromise = PublicKey.current();
        let privateEnt = await privatePromise;
        let publicEnt = await publicPromise;

        if (privateEnt && publicEnt) {
          // The user has been here before, so get the private key from the
          // entity.

          // Decrypt the PKCS1 private key.
          let privateKeyPemPkcs1 = null;
          if (privateEnt.text) {
            privateKeyPemPkcs1 = await this.decrypt(
              privateEnt.text,
              this.key + this.iv,
            );
          }

          // And load the PKCS1 public key.
          let publicKeyPemPkcs1 = null;
          if (publicEnt.text) {
            publicKeyPemPkcs1 = publicEnt.text;
          }

          let privateKey;
          let publicKey;
          let privateKeyPem;
          let publicKeyPem;

          if (privateEnt.textOaep && publicEnt.textOaep) {
            privateKeyPem = await this.decrypt(
              privateEnt.textOaep,
              this.key + this.iv,
            );
            publicKeyPem = publicEnt.textOaep;
            privateKey = await this.importPrivateKey(privateKeyPem);
            publicKey = await this.importPublicKey(publicKeyPem);
          } else {
            // The user needs to upgrade to the new encryption.
            ({
              privateKey,
              publicKey,
              privateKeyPem,
              publicKeyPem,
            } = await that.generateNewKeyPair());
            privateEnt.textOaep = await this.encrypt(
              privateKeyPem,
              this.key + this.iv,
            );
            publicEnt.textOaep = publicKeyPem;
            const keys = await PrivateKey.upgradeEncryption(privateEnt.textOaep, publicEnt.textOaep);
            if (keys) {
              privateEnt = keys.private;
              publicEnt = keys.public;
            }
          }

          await this.setUserPrivateKey(
            privateKey,
            privateKeyPem,
            privateKeyPemPkcs1,
          );
          await this.setUserPublicKey(
            publicKey,
            publicKeyPem,
            publicKeyPemPkcs1,
          );
        } else if (!privateEnt && !publicEnt) {
          // The user just registered, so save the new private key.
          privateEnt = new PrivateKey();

          // Encrypt the private key.
          const encryptedPrivateKeyPem = await this.encrypt(
            this.userPrivateKeyPem,
            this.key + this.iv,
          );

          privateEnt.textOaep = encryptedPrivateKeyPem;
          const privateSave = privateEnt.$save();

          // And save the public key.
          const publicEnt = new PublicKey();
          publicEnt.textOaep = this.userPublicKeyPem;
          const publicSave = publicEnt.$save();

          try {
            await privateSave;
            await publicSave;
          } catch (e) {
            this.reject(
              'Error storing encryption keys! You need to manually store them and contact an administrator. I will print them in the console, where you can copy them to somewhere safe.',
            );
            console.log('Encrypted Private Key: ', encryptedPrivateKeyPem);
            console.log('Public Key: ', this.userPublicKeyPem);
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
    const _register = User.prototype.$register;
    User.prototype.$register = async function(creds) {
      const { password } = creds;
      creds.password = await computeNewPassword(password);

      // Generate a Public/Private key pair.
      const {
        privateKey,
        publicKey,
        privateKeyPem,
        publicKeyPem,
      } = await that.generateNewKeyPair();

      await that.setUserPrivateKey(privateKey, privateKeyPem, null);
      await that.setUserPublicKey(publicKey, publicKeyPem, null);

      await _register.call(this, creds);
    };

    // Override loginUser to retrieve the key and change the password.
    const _loginUser = User.loginUser;
    User.loginUser = async function(creds) {
      const { password } = creds;
      creds.password = await computeNewPassword(password);

      return await _loginUser.call(this, creds);
    };

    // Override changePassword to re-encrypt the key and change the password.
    const _changePassword = User.prototype.$changePassword;
    User.prototype.$changePassword = async function(creds) {
      const { password, oldPassword } = creds;
      // Compute the old password first.
      creds.oldPassword = await computeNewPassword(oldPassword);
      // Compute the new password second, so that.key and that.iv are current.
      creds.password = await computeNewPassword(password);

      // Re-encrypt the private key.
      const privateKeyPem = that.userPrivateKeyPem;
      const privateKeyBytes = that.encodeUtf8(privateKeyPem);
      const encryptedPrivateKeyBytes = await that.encryptBytes(
        privateKeyBytes,
        that.key + that.iv,
      );
      const encryptedPrivateKeyString = that.encodeBase64(
        encryptedPrivateKeyBytes,
      );

      creds.encryptedPrivateKeyString = encryptedPrivateKeyString;

      return await _changePassword.call(this, creds);
    };
  }

  async generateNewKeyPair() {
    // Generate a Public/Private key pair.
    try {
      const keyPair = await root.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      );

      const exportedPrivateKey = new Uint8Array(
        await root.crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
      );

      const exportedPublicKey = new Uint8Array(
        await root.crypto.subtle.exportKey('spki', keyPair.publicKey),
      );

      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${this.encodeBase64(
        exportedPrivateKey,
      )}\n-----END PRIVATE KEY-----`;

      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${this.encodeBase64(
        exportedPublicKey,
      )}\n-----END PUBLIC KEY-----`;

      return {
        ...keyPair,
        privateKeyPem,
        publicKeyPem,
      };
    } catch (e) {
      console.log('Error creating RSA key pair: ', e);
      throw e;
    }
  }

  async importPrivateKey(privateKeyPem) {
    const privateKeyString = privateKeyPem
      .replace(/^-----BEGIN PRIVATE KEY-----\n/, '')
      .replace(/\n-----END PRIVATE KEY-----$/, '');
    const privateKeyBytes = this.decodeBase64(privateKeyString);

    return await root.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt'],
    );
  }

  async importPublicKey(publicKeyPem) {
    const publicKeyString = publicKeyPem
      .replace(/^-----BEGIN PUBLIC KEY-----\n/, '')
      .replace(/\n-----END PUBLIC KEY-----$/, '');
    const publicKeyBytes = this.decodeBase64(publicKeyString);

    return await root.crypto.subtle.importKey(
      'spki',
      publicKeyBytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );
  }

  async setUserPrivateKey(privateKey, privateKeyPem, privateKeyPemPkcs1) {
    this.userPrivateKey = privateKey;
    this.userPrivateKeyPem = privateKeyPem;
    this.userPrivateKeyPemPkcs1 = privateKeyPemPkcs1;
    await this.storage.setItem('twPrivateKeyPemOaep', privateKeyPem);
    await this.storage.setItem('twPrivateKeyPemPkcs1', privateKeyPemPkcs1);
  }

  async setUserPublicKey(publicKey, publicKeyPem, publicKeyPemPkcs1) {
    this.userPublicKey = publicKey;
    this.userPublicKeyPem = publicKeyPem;
    this.userPublicKeyPemPkcs1 = publicKeyPemPkcs1;
    await this.storage.setItem('twPublicKeyPemOaep', publicKeyPem);
    await this.storage.setItem('twPublicKeyPemPkcs1', publicKeyPemPkcs1);
  }

  async getUserPrivateKey() {
    const userPrivateKeyOld = await this.storage.getItem('twPrivateKey');
    if (userPrivateKeyOld) {
      const err = new Error('Please upgrade to the new encryption.');
      err.name = 'EncryptionUpgradeNeededError';
      err.privateKey = userPrivateKeyOld;
      throw err;
    }

    this.userPrivateKeyPem = await this.storage.getItem('twPrivateKeyPemOaep');

    if (!this.userPrivateKeyPem) {
      return null;
    }

    this.userPrivateKey = await this.importPrivateKey(this.userPrivateKeyPem);
    this.userPrivateKeyPemPkcs1 = await this.storage.getItem(
      'twPrivateKeyPemPkcs1',
    );

    return this.userPrivateKey;
  }

  async getUserPublicKey() {
    const userPublicKeyOld = await this.storage.getItem('twPublicKey');
    if (userPublicKeyOld) {
      const err = new Error('Please upgrade to the new encryption.');
      err.name = 'EncryptionUpgradeNeededError';
      throw err;
    }

    this.userPublicKeyPem = await this.storage.getItem('twPublicKeyPemOaep');

    if (!this.userPublicKeyPem) {
      return null;
    }

    this.userPublicKey = await this.importPublicKey(this.userPublicKeyPem);
    this.userPublicKeyPemPkcs1 = await this.storage.getItem(
      'twPublicKeyPemPkcs1',
    );

    return this.userPublicKey;
  }

  async unsetUserKeys() {
    await this.storage.removeItem('twPrivateKey');
    await this.storage.removeItem('twPublicKey');
    await this.storage.removeItem('twPrivateKeyPemOaep');
    await this.storage.removeItem('twPublicKeyPemOaep');
    await this.storage.removeItem('twPrivateKeyPemPkcs1');
    await this.storage.removeItem('twPublicKeyPemPkcs1');
    await this.callEncryptionWorker(this.rsaEncryptionWorker, 'resetRsa');
    this.userPrivateKey = null;
    this.userPublicKey = null;
    this.userPrivateKeyPem = null;
    this.userPublicKeyPem = null;
    this.userPrivateKeyPemPkcs1 = null;
    this.userPublicKeyPemPkcs1 = null;
    this.key = null;
    this.iv = null;
    this.resolve = null;
    this.reject = null;
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async decryptRSA(hex, privateKey) {
    if (privateKey == null) {
      if (!this.userPrivateKey) {
        throw new Error('Tried to decrypt RSA without private key!');
      }
      privateKey = this.userPrivateKey;
    }
    try {
      const buffer = await root.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        this.decodeHex(hex),
      );
      const result = this.encodeHex(new Uint8Array(buffer));
      return result;
    } catch (e) {
      if (e.code === 0) {
        return await this.decryptRSAPkcs1(hex);
      }
      throw e;
    }
  }

  async encryptRSA(hex, publicKey) {
    if (publicKey == null) {
      if (!this.userPublicKey) {
        throw new Error('Tried to encrypt RSA without public key!');
      }
      publicKey = this.userPublicKey;
    }
    const buffer = await root.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      this.decodeHex(hex),
    );
    const result = this.encodeHex(new Uint8Array(buffer));
    return result;
  }

  async decryptRSAPkcs1(hex, privateKey) {
    if (privateKey == null) {
      if (!this.userPrivateKeyPemPkcs1) {
        throw new Error('Tried to decrypt RSA without private key!');
      }
      privateKey = this.userPrivateKeyPemPkcs1;
    }
    const result = await this.callEncryptionWorker(
      this.rsaEncryptionWorker,
      'decryptRSA',
      [hex, privateKey],
    );
    return result;
  }

  async encryptRSAPkcs1(hex, publicKey) {
    if (publicKey == null) {
      if (!this.userPublicKeyPemPkcs1) {
        throw new Error('Tried to encrypt RSA without public key!');
      }
      publicKey = this.userPublicKeyPemPkcs1;
    }
    const result = await this.callEncryptionWorker(
      this.rsaEncryptionWorker,
      'encryptRSA',
      [hex, publicKey],
    );
    return result;
  }

  async encryptRSAForUser(hex, userOrGuid) {
    let guid = typeof userOrGuid === 'number' ? userOrGuid : userOrGuid.guid;
    if (guid in this.userPublicKeys) {
      return await this.encryptRSA(hex, this.userPublicKeys[guid]);
    } else if (guid in this.userPublicKeysPkcs1) {
      return await this.encryptRSAPkcs1(hex, this.userPublicKeysPkcs1[guid]);
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

        if (publicKeyEntity.textOaep) {
          const publicKey = await this.importPublicKey(
            publicKeyEntity.textOaep,
          );
          this.userPublicKeys[guid] = publicKey;
          return await this.encryptRSA(hex, publicKey);
        } else if (publicKeyEntity.text) {
          this.userPublicKeysPkcs1[guid] = publicKeyEntity.text;
          return await this.encryptRSAPkcs1(hex, publicKeyEntity.text);
        }

        return null;
      } catch (e) {
        return null;
      }
    }
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
        args: args || [],
      },
      transferrables,
    );

    return promise;
  }
}

const crypt = new EncryptionService();

export { EncryptionService, crypt };
