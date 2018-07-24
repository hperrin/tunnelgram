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
    this.decrypted = {
      text: '[Encrypted text]',
      images: []
    };
    this.data.text = null;
    this.data.images = [];
    this.data.keys = {};
  }

  // === Instance Methods ===

  init (...args) {
    super.init(...args);

    // Decrypt the message text and images.
    if (currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
      const key = crypt.decryptRSA(this.data.keys[currentUser.guid]).slice(0, 96);
      if (this.data.text != null) {
        this.decrypted.text = crypt.decrypt(this.data.text, key);
        if (this.decrypted.text.match(/^1> (?:.|\n)*\n2> ./)) {
          const match = this.decrypted.text.match(/^1> ((?:.|\n)*)\n2> ((?:.|\n)*)$/);
          this.decrypted.text = match[1];
          this.decrypted.secretText = match[2];
        }
      } else if (this.data.images) {
        this.decrypted.text = null;
      }
      if (this.data.images) {
        this.decrypted.images = this.data.images.map(image => {
          // Don't request the full image until the user requests it.
          let fullSizePromise;
          const data = {
            promise () {
              if (!fullSizePromise) {
                fullSizePromise = new Promise((resolve, reject) => {
                  window.fetch(image.data.replace(/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'), {
                    mode: 'cors'
                  }).then(response => {
                    return response.arrayBuffer();
                  }).then(arrayBuffer => {
                    resolve(crypt.decrypt(base64js.fromByteArray(new Uint8Array(arrayBuffer)), key));
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
              resolve(crypt.decrypt(base64js.fromByteArray(new Uint8Array(arrayBuffer)), key));
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
      }
    }

    return this;
  }

  async save () {
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
      this.data.images = this.decrypted.images.map(image => ({
        name: crypt.encrypt(image.name, key),
        dataType: crypt.encrypt(image.dataType, key),
        dataWidth: crypt.encrypt(image.dataWidth, key),
        dataHeight: crypt.encrypt(image.dataHeight, key),
        data: crypt.encrypt(image.data, key),
        thumbnailType: crypt.encrypt(image.thumbnailType, key),
        thumbnailWidth: crypt.encrypt(image.thumbnailWidth, key),
        thumbnailHeight: crypt.encrypt(image.thumbnailHeight, key),
        thumbnail: crypt.encrypt(image.thumbnail, key)
      }));
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

    return super.save();
  }
}

// === Static Properties ===

// The name of the server class
Message.class = 'Tunnelgram\\Message';

Nymph.setEntityClass(Message.class, Message);

export default Message;
