import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {crypt} from '../Services/EncryptionService';
import base64js from 'base64-js';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Message extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.savePromise = null;
    this.decrypted = {
      text: '[Encrypted text]',
      images: [],
      video: null
    };
    this.data.text = null;
    this.data.images = [];
    this.data.video = null;
    this.data.keys = {};
  }

  // === Instance Methods ===

  init (...args) {
    super.init(...args);

    // Decrypt the message text, images, and/or video.
    if (currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
      const key = crypt.decryptRSA(this.data.keys[currentUser.guid]).slice(0, 96);
      if (this.data.text != null) {
        this.decrypted.text = crypt.decrypt(this.data.text, key);
        if (this.decrypted.text.match(/^1> (?:.|\n)*\n2> ./)) {
          const match = this.decrypted.text.match(/^1> ((?:.|\n)*)\n2> ((?:.|\n)*)$/);
          this.decrypted.text = match[1];
          this.decrypted.secretText = match[2];
        }
      } else if (this.data.images || this.data.video) {
        this.decrypted.text = null;
      }
      if (this.data.images && this.data.images.length) {
        this.decrypted.images = this.data.images.map(image => {
          // Don't fetch the full image until the user requests it.
          let fullSizePromise;
          const data = {
            promise: () => {
              if (!fullSizePromise) {
                fullSizePromise = new Promise((resolve, reject) => {
                  window.fetch(image.data.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'), {
                    mode: 'cors'
                  }).then(response => {
                    return response.arrayBuffer();
                  }).then(arrayBuffer => {
                    // This is purposefully returned as Uint8Array, not Base64.
                    return crypt.decryptBytesAsync(new Uint8Array(arrayBuffer), key);
                  }).then(result => {
                    resolve(result);
                  });
                });
              }
              return fullSizePromise;
            }
          }
          const thumbnail = new Promise((resolve, reject) => {
            window.fetch(image.thumbnail.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'), {
              mode: 'cors'
            }).then(response => {
              return response.arrayBuffer();
            }).then(arrayBuffer => {
              // This is purposefully returned as Uint8Array, not Base64.
              return crypt.decryptBytesAsync(new Uint8Array(arrayBuffer), key);
            }).then(result => {
              resolve(result);
            });
          });
          return {
            name: crypt.decrypt(image.name, key),
            dataType: crypt.decrypt(image.dataType, key),
            dataWidth: crypt.decrypt(image.dataWidth, key),
            dataHeight: crypt.decrypt(image.dataHeight, key),
            data,
            thumbnailType: crypt.decrypt(image.thumbnailType, key),
            thumbnailWidth: crypt.decrypt(image.thumbnailWidth, key),
            thumbnailHeight: crypt.decrypt(image.thumbnailHeight, key),
            thumbnail
          };
        });
      } else if (this.data.video != null) {
        // Don't fetch the full video until the user requests it.
        let fullSizePromise;
        const data = {
          promise: () => {
            if (!fullSizePromise) {
              fullSizePromise = new Promise((resolve, reject) => {
                window.fetch(this.data.video.data.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'), {
                  mode: 'cors'
                }).then(response => {
                  return response.arrayBuffer();
                }).then(arrayBuffer => {
                  // This is purposefully returned as Uint8Array, not Base64.
                  return crypt.decryptBytesAsync(new Uint8Array(arrayBuffer), key);
                }).then(result => {
                  resolve(result);
                });
              });
            }
            return fullSizePromise;
          }
        }
        const thumbnail = new Promise((resolve, reject) => {
          window.fetch(this.data.video.thumbnail.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'), {
            mode: 'cors'
          }).then(response => {
            return response.arrayBuffer();
          }).then(arrayBuffer => {
            // This is purposefully returned as Uint8Array, not Base64.
            return crypt.decryptBytesAsync(new Uint8Array(arrayBuffer), key);
          }).then(result => {
            resolve(result);
          });
        });
        this.decrypted.video = {
          name: crypt.decrypt(this.data.video.name, key),
          dataType: crypt.decrypt(this.data.video.dataType, key),
          dataWidth: crypt.decrypt(this.data.video.dataWidth, key),
          dataHeight: crypt.decrypt(this.data.video.dataHeight, key),
          dataDuration: crypt.decrypt(this.data.video.dataDuration, key),
          data,
          thumbnailType: crypt.decrypt(this.data.video.thumbnailType, key),
          thumbnailWidth: crypt.decrypt(this.data.video.thumbnailWidth, key),
          thumbnailHeight: crypt.decrypt(this.data.video.thumbnailHeight, key),
          thumbnail
        };
      }
    }

    return this;
  }

  save (skipEncryption) {
    this.savePromise = (async () => {
      if (!skipEncryption) {
        // Encrypt the message text for all recipients (which should include the current user).
        const key = crypt.generateKey();
        if (this.decrypted.text != null) {
          this.data.text = crypt.encrypt(this.decrypted.text, key);
          if (this.decrypted.text.match(/^1> (?:.|\n)*\n2> ./)) {
            const match = this.decrypted.text.match(/^1> ((?:.|\n)*)\n2> ((?:.|\n)*)$/);
            this.decrypted.text = match[1];
            this.decrypted.secretText = match[2];
          }
        }
        if (this.decrypted.images.length) {
          this.data.images = await Promise.all(this.decrypted.images.map(async image => ({
            name: crypt.encrypt(image.name, key),
            dataType: crypt.encrypt(image.dataType, key),
            dataWidth: crypt.encrypt(image.dataWidth, key),
            dataHeight: crypt.encrypt(image.dataHeight, key),
            // Image/video data is a Uint8Array, not a string.
            data: await crypt.encryptBytesToBase64Async(image.data, key),
            thumbnailType: crypt.encrypt(image.thumbnailType, key),
            thumbnailWidth: crypt.encrypt(image.thumbnailWidth, key),
            thumbnailHeight: crypt.encrypt(image.thumbnailHeight, key),
            // Image/video data is a Uint8Array, not a string.
            thumbnail: await crypt.encryptBytesToBase64Async(image.thumbnail, key)
          })));
        } else if (this.decrypted.video != null) {
          this.data.video = {
            name: crypt.encrypt(this.decrypted.video.name, key),
            dataType: crypt.encrypt(this.decrypted.video.dataType, key),
            dataWidth: crypt.encrypt(this.decrypted.video.dataWidth, key),
            dataHeight: crypt.encrypt(this.decrypted.video.dataHeight, key),
            dataDuration: crypt.encrypt(this.decrypted.video.dataDuration, key),
            // Image/video data is a Uint8Array, not a string.
            data: await crypt.encryptBytesToBase64Async(this.decrypted.video.data, key),
            thumbnailType: crypt.encrypt(this.decrypted.video.thumbnailType, key),
            thumbnailWidth: crypt.encrypt(this.decrypted.video.thumbnailWidth, key),
            thumbnailHeight: crypt.encrypt(this.decrypted.video.thumbnailHeight, key),
            // Image/video data is a Uint8Array, not a string.
            thumbnail: await crypt.encryptBytesToBase64Async(this.decrypted.video.thumbnail, key)
          };
        }

        const encryptPromises = [];
        for (let user of this.data.acRead) {
          const pad = crypt.generatePad();
          encryptPromises.push({user, promise: crypt.encryptRSAForUser(key + pad, user)});
        }
        this.data.keys = {};
        for (let entry of encryptPromises) {
          this.data.keys[entry.user.guid] = await entry.promise;
        }
      }

      return await super.save();
    })();
    return this.savePromise;
  }
}

// === Static Properties ===

// The name of the server class
Message.class = 'Tunnelgram\\Message';

Nymph.setEntityClass(Message.class, Message);

export default Message;
