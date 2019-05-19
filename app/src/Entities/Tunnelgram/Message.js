import {Nymph, Entity} from 'nymph-client';
import {User} from 'tilmeld-client';
import {Conversation} from './Conversation';
import {saveEntities, restoreEntities} from '../../Services/entityRefresh';
import {crypt} from '../../Services/EncryptionService';

let currentUser = null;

User.current().then(user => currentUser = user);
User.on('login', user => currentUser = user);
User.on('logout', () => currentUser = null);

export class Message extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.containsSleepingReference = false;
    this.savePromise = null;
    this.textElevation = 1;
    this.secretTextElevation = 1;
    this.mode = null;
    this.encryption = false;
    this.decrypted = {
      text: '[Encrypted text]',
      images: [],
      video: null
    };
    this.data.text = null;
    this.data.images = [];
    this.data.video = null;
    this.data.keys = {};

    this.cryptReady = true;
    this.cryptReadyPromise = Promise.resolve(true);
  }

  // === Instance Methods ===

  init (entityData, ...args) {
    const savedEntities = saveEntities(this);
    super.init(entityData, ...args);
    this.containsSleepingReference = restoreEntities(this, savedEntities);

    if (entityData.encryption != null) {
      this.encryption = entityData.encryption;
    }
    if (entityData.mode != null) {
      this.mode = entityData.mode;
    }

    this.cryptReady = false;
    this.cryptReadyPromise = (async () => {
      let decrypt = async input => input;
      let decryptBytes = async input => input;
      if (entityData.encryption && currentUser && this.data.keys && this.data.keys.hasOwnProperty(currentUser.guid)) {
        let key = crypt.decryptRSA(this.data.keys[currentUser.guid]).slice(0, 96);
        if (this.mode === Conversation.MODE_CHANNEL_PRIVATE) {
          // key is the conversation key (See Message.php/jsonSerialize). XOR it
          // with the plaintext key to get the encryption key.
          if (this.cdate < 1558141377) {
            // Keys before this time were decoded as base64.
            key = crypt.xorBase64ToHex(key, this.data.key);
          } else {
            key = crypt.xorHex(key, this.data.key);
          }
        }
        decrypt = input => crypt.decrypt(input, key);
        decryptBytes = input => crypt.decryptBytes(input, key);
      }

      // Decrypt the message text, images, and/or video.
      if (this.data.text != null) {
        let match;

        this.decrypted.text = await decrypt(this.data.text);
        if (this.decrypted.text.match(/^1> (?:.|\n)*\n2> ./)) {
          match = this.decrypted.text.match(/^1> ((?:.|\n)*)\n2> ((?:.|\n)*)$/);
          this.decrypted.text = match[1];
          this.decrypted.secretText = match[2];
        }

        const elevationRegEx = /(?:\n|^)e> ([0-3])(?:\n|$)/m;
        match = this.decrypted.text.match(elevationRegEx);
        this.textElevation = match ? parseFloat(match[1]) : 1;
        this.decrypted.text = this.decrypted.text.replace(elevationRegEx, '');
        if (this.decrypted.secretText != null) {
          match = this.decrypted.secretText.match(elevationRegEx);
          this.secretTextElevation = match ? parseFloat(match[1]) : 1;
          this.decrypted.secretText = this.decrypted.secretText.replace(elevationRegEx, '');
        }
      } else if (this.data.images || this.data.video) {
        this.decrypted.text = null;
      }

      const blobReplace = [/^http:\/\/blob:9000\//, 'http://'+window.location.host.replace(/:\d+$/, '')+':8082/'];
      if (this.data.images && this.data.images.length) {
        this.decrypted.images = await Promise.all(this.data.images.map(async image => {
          // Don't fetch the full image until the user requests it.
          let fullSizePromise;
          const data = {
            promise: () => {
              if (!fullSizePromise) {
                fullSizePromise = new Promise(resolve => {
                  window.fetch(image.data.replace(...blobReplace), {
                    mode: 'cors'
                  }).then(response => {
                    return response.arrayBuffer();
                  }).then(arrayBuffer => {
                    // This is purposefully returned as Uint8Array, not Base64.
                    return decryptBytes(new Uint8Array(arrayBuffer));
                  }).then(result => {
                    resolve(result);
                  });
                });
              }
              return fullSizePromise;
            }
          };
          const thumbnail = image.thumbnail === null ? data.promise() : new Promise(resolve => {
            window.fetch(image.thumbnail.replace(...blobReplace), {
              mode: 'cors'
            }).then(response => {
              return response.arrayBuffer();
            }).then(arrayBuffer => {
              // This is purposefully returned as Uint8Array, not Base64.
              return decryptBytes(new Uint8Array(arrayBuffer));
            }).then(result => {
              resolve(result);
            });
          });
          return {
            name: await decrypt(image.name),
            dataType: await decrypt(image.dataType),
            dataWidth: await decrypt(image.dataWidth),
            dataHeight: await decrypt(image.dataHeight),
            data,
            thumbnailType: await decrypt(image.thumbnailType),
            thumbnailWidth: await decrypt(image.thumbnailWidth),
            thumbnailHeight: await decrypt(image.thumbnailHeight),
            thumbnail
          };
        }));
      } else if (this.data.video != null) {
        // Don't fetch the full video until the user requests it.
        let fullSizePromise;
        const data = {
          promise: () => {
            if (!fullSizePromise) {
              fullSizePromise = new Promise(resolve => {
                window.fetch(this.data.video.data.replace(...blobReplace), {
                  mode: 'cors'
                }).then(response => {
                  return response.arrayBuffer();
                }).then(arrayBuffer => {
                  // This is purposefully returned as Uint8Array, not Base64.
                  return decryptBytes(new Uint8Array(arrayBuffer));
                }).then(result => {
                  resolve(result);
                });
              });
            }
            return fullSizePromise;
          }
        };
        const thumbnail = new Promise(resolve => {
          window.fetch(this.data.video.thumbnail.replace(...blobReplace), {
            mode: 'cors'
          }).then(response => {
            return response.arrayBuffer();
          }).then(arrayBuffer => {
            // This is purposefully returned as Uint8Array, not Base64.
            return decryptBytes(new Uint8Array(arrayBuffer));
          }).then(result => {
            resolve(result);
          });
        });
        this.decrypted.video = {
          name: await decrypt(this.data.video.name),
          dataType: await decrypt(this.data.video.dataType),
          dataWidth: await decrypt(this.data.video.dataWidth),
          dataHeight: await decrypt(this.data.video.dataHeight),
          dataDuration: await decrypt(this.data.video.dataDuration),
          data,
          thumbnailType: await decrypt(this.data.video.thumbnailType),
          thumbnailWidth: await decrypt(this.data.video.thumbnailWidth),
          thumbnailHeight: await decrypt(this.data.video.thumbnailHeight),
          thumbnail
        };
      }

      this.cryptReady = true;
      return true;
    })();

    return this;
  }

  toJSON() {
    const obj = super.toJSON();

    obj.mode = this.mode;
    obj.encryption = this.encryption;

    return obj;
  }

  save (skipEncryption) {
    this.savePromise = (async () => {
      if (this.data.conversation.isSleepingReference) {
        await this.data.conversation.ready();
      }

      this.mode = this.data.conversation.data.mode;

      if (!skipEncryption) {
        let key = null;
        let encrypt = (input, key) => crypt.encrypt(input, key);
        let encryptBytesToBase64 = (input, key) => crypt.encryptBytesToBase64(input, key);
        if (this.mode === Conversation.MODE_CHAT) {
          key = crypt.generateKey();
        } else if (this.mode === Conversation.MODE_CHANNEL_PRIVATE) {
          // Store a plaintext key.
          this.data.key = crypt.generateKey();
          // Get the channel key.
          const channelKey = crypt.decryptRSA(this.data.conversation.data.keys[currentUser.guid]).slice(0, 96);
          // The encryption key is the result of XORing the two.
          key = crypt.xorHex(channelKey, this.data.key);
        } else {
          encrypt = async (input, key) => input;
          encryptBytesToBase64 = async (input, key) => crypt.encodeBase64(input);
        }

        // Encrypt the message text.
        if (this.decrypted.text != null) {
          this.data.text = await encrypt(this.decrypted.text, key);
          if (this.decrypted.text.match(/^1> (?:.|\n)*\n2> ./)) {
            const match = this.decrypted.text.match(/^1> ((?:.|\n)*)\n2> ((?:.|\n)*)$/);
            this.decrypted.text = match[1];
            this.decrypted.secretText = match[2];
          }
        }
        if (this.decrypted.images && this.decrypted.images.length) {
          this.data.images = await Promise.all(this.decrypted.images.map(async image => ({
            name: await encrypt(image.name, key),
            dataType: await encrypt(image.dataType, key),
            dataWidth: await encrypt(image.dataWidth, key),
            dataHeight: await encrypt(image.dataHeight, key),
            // Image/video data is a Uint8Array, not a string.
            data: await encryptBytesToBase64(image.data, key),
            thumbnailType: await encrypt(image.thumbnailType, key),
            thumbnailWidth: await encrypt(image.thumbnailWidth, key),
            thumbnailHeight: await encrypt(image.thumbnailHeight, key),
            // Image/video data is a Uint8Array, not a string.
            thumbnail: image.thumbnailType === 'image/gif' ? null : await encryptBytesToBase64(image.thumbnail, key)
          })));
        } else if (this.decrypted.video != null) {
          this.data.video = {
            name: await encrypt(this.decrypted.video.name, key),
            dataType: await encrypt(this.decrypted.video.dataType, key),
            dataWidth: await encrypt(this.decrypted.video.dataWidth, key),
            dataHeight: await encrypt(this.decrypted.video.dataHeight, key),
            dataDuration: await encrypt(this.decrypted.video.dataDuration, key),
            // Image/video data is a Uint8Array, not a string.
            data: await encryptBytesToBase64(this.decrypted.video.data, key),
            thumbnailType: await encrypt(this.decrypted.video.thumbnailType, key),
            thumbnailWidth: await encrypt(this.decrypted.video.thumbnailWidth, key),
            thumbnailHeight: await encrypt(this.decrypted.video.thumbnailHeight, key),
            // Image/video data is a Uint8Array, not a string.
            thumbnail: await encryptBytesToBase64(this.decrypted.video.thumbnail, key)
          };
        }

        if (this.mode === Conversation.MODE_CHAT) {
          // Encrypt the key for all the conversation users.
          const encryptPromises = [];
          for (let user of this.data.conversation.data.acFull) {
            const pad = crypt.generatePad();
            encryptPromises.push({user, promise: crypt.encryptRSAForUser(key + pad, user)});
          }
          this.data.keys = {};
          for (let entry of encryptPromises) {
            this.data.keys[entry.user.guid] = await entry.promise;
          }
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
