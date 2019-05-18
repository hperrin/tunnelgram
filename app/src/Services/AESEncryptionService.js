import aesjs from 'aes-js';
import base64js from 'base64-js';

const root = (self || window);

export class AESEncryptionService {
  async decrypt (text, key) {
    // Decrypt the text.
    const encryptedBytes = this.decodeBase64(text);
    const bytes = await this.decryptBytes(encryptedBytes, key);
    return this.encodeUtf8(bytes);
  }

  async decryptBytes (bytes, key) {
    return await this.encryptBytes(bytes, key);
  }

  async encrypt (text, key) {
    // Encrypt the text.
    const bytes = this.decodeUtf8(text);
    const encryptedBytes = await this.encryptBytes(bytes, key);
    return this.encodeBase64(encryptedBytes);
  }

  async encryptBytes (bytes, key) {
    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = Uint8Array.from(aesjs.utils.hex.toBytes(cryptKey));
    const ivBytes = Uint8Array.from(aesjs.utils.hex.toBytes(cryptIV));

    const cryptoKey = await root.crypto.subtle.importKey(
      'raw',
      keyBytes,
      'AES-CBC',
      false,
      ['encrypt']
    );

    const length = bytes.length % 16 ? bytes.length + 16 - (bytes.length % 16) : bytes.length;
    const zeroBytes = Uint8Array.from((new Array(length)).map(() => 0));

    const cypherBytes = new Uint8Array(await root.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: ivBytes
      },
      cryptoKey,
      zeroBytes
    ));

    return this.xorBytes(bytes, cypherBytes);
  }

  async encryptBytesToBase64 (bytes, key) {
    return this.encodeBase64(await this.encryptBytes(bytes, key));
  }

  encodeBase64 (bytes) {
    return base64js.fromByteArray(bytes);
  }

  decodeBase64 (text) {
    return base64js.toByteArray(text);
  }

  encodeUtf8 (bytes) {
    const enc = new TextDecoder('utf-8');
    const text = enc.decode(bytes);
    return text;
  }

  decodeUtf8 (text) {
    const enc = new TextEncoder();
    const bytes = enc.encode(text);
    return bytes;
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

  xorHex (keyA, keyB) {
    let bytesA = aesjs.utils.hex.toBytes(keyA);
    let bytesB = aesjs.utils.hex.toBytes(keyB);

    const xoredBytes = this.xorBytes(bytesA, bytesB);

    return aesjs.utils.hex.fromBytes(xoredBytes);
  }

  xorBase64ToHex (keyA, keyB) {
    // This isn't used anymore. It was improperly implemented, and is here for
    // decrypted messages from before May 17, 2019.
    let bytesA = this.decodeBase64(keyA);
    let bytesB = this.decodeBase64(keyB);

    const xoredBytes = this.xorBytes(bytesA, bytesB);

    return aesjs.utils.hex.fromBytes(xoredBytes);
  }

  xorBytes (bytesA, bytesB) {
    return bytesA.map((byte, i) => byte ^ bytesB[i]);
  }
}
