import aesjs from 'aes-js';
import base64js from 'base64-js';
import utf8 from 'utf8';

const root = (self || window);

export class AESEncryptionService {
  constructor () {
    this.decryption = true; // Turning this off causes the decrypt functions to just return what they are given.
  }

  decrypt (text, key) {
    if (!this.decryption) {
      return text;
    }

    // Decrypt the text.
    const encryptedBytes = this.decodeBase64(text);
    const bytes = this.decryptBytes(encryptedBytes, key);
    return utf8.decode(aesjs.utils.utf8.fromBytes(bytes));
  }

  decryptBytes (bytes, key) {
    if (!this.decryption) {
      return bytes;
    }

    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = aesjs.utils.hex.toBytes(cryptKey);
    const ivBytes = aesjs.utils.hex.toBytes(cryptIV);
    const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

    // Decrypt the bytes.
    return aesCtr.decrypt(bytes);
  }

  encrypt (text, key) {
    // Encrypt the text.
    const bytes = aesjs.utils.utf8.toBytes(utf8.encode(text));
    const encryptedBytes = this.encryptBytes(bytes, key);
    return this.encodeBase64(encryptedBytes);
  }

  encryptBytes (bytes, key) {
    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = aesjs.utils.hex.toBytes(cryptKey);
    const ivBytes = aesjs.utils.hex.toBytes(cryptIV);
    const aesCtr = new aesjs.ModeOfOperation.ofb(keyBytes, ivBytes);

    // Encrypt the bytes.
    return aesCtr.encrypt(bytes);
  }

  encryptBytesToBase64 (bytes, key) {
    return this.encodeBase64(this.encryptBytes(bytes, key));
  }

  encodeBase64 (bytes) {
    return base64js.fromByteArray(bytes);
  }

  decodeBase64 (text) {
    return base64js.toByteArray(text);
  }

  generateKey () {
    let keyArray = new Uint8Array(48);
    (root.crypto || root.msCrypto).getRandomValues(keyArray);
    return aesjs.utils.hex.fromBytes(keyArray);
  }

  generatePad () {
    let keyArray = new Uint8Array(8);
    (root.crypto || root.msCrypto).getRandomValues(keyArray);
    return aesjs.utils.hex.fromBytes(keyArray);
  }
}
