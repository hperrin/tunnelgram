import base64js from 'base64-js';

const root = (self || window);

export class AESEncryptionService {
  async decrypt (text, key) {
    // Decrypt the text.
    const encryptedBytes = this.decodeBase64(text);
    const bytes = await this.decryptBytes(encryptedBytes, key);
    return this.decodeUtf8(bytes);
  }

  async decryptBytes (bytes, key) {
    return await this.encryptBytes(bytes, key);
  }

  async encrypt (text, key) {
    // Encrypt the text.
    const bytes = this.encodeUtf8(text);
    const encryptedBytes = await this.encryptBytes(bytes, key);
    return this.encodeBase64(encryptedBytes);
  }

  async encryptBytes (bytes, key) {
    const cryptKey = key.substr(0, 64);
    const cryptIV = key.substr(64, 32);
    const keyBytes = this.decodeHex(cryptKey);
    const ivBytes = this.decodeHex(cryptIV);

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

  encodeUtf8 (text) {
    return new TextEncoder("utf-8").encode(text);
  }

  decodeUtf8 (bytes) {
    return new TextDecoder().decode(bytes);
  }

  encodeHex (bytes) {
    return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  decodeHex (text) {
    const result = new Uint8Array(text.length / 2);

    for (let i = 0; i < text.length; i += 2) {
      result[i / 2] = parseInt(text.substr(i, 2), 16);
    }

    return result;
  }

  generateKey () {
    let keyArray = new Uint8Array(48);
    (root.crypto || root.msCrypto).getRandomValues(keyArray);
    return this.encodeHex(keyArray);
  }

  generatePad () {
    let keyArray = new Uint8Array(8);
    (root.crypto || root.msCrypto).getRandomValues(keyArray);
    return this.encodeHex(keyArray);
  }

  xorHex (keyA, keyB) {
    let bytesA = this.decodeHex(keyA);
    let bytesB = this.decodeHex(keyB);

    const xoredBytes = this.xorBytes(bytesA, bytesB);

    return this.encodeHex(xoredBytes);
  }

  xorBase64ToHex (keyA, keyB) {
    // This isn't used anymore. It was improperly implemented, and is here for
    // decrypted messages from before May 17, 2019.
    let bytesA = this.decodeBase64(keyA);
    let bytesB = this.decodeBase64(keyB);

    const xoredBytes = this.xorBytes(bytesA, bytesB);

    return this.encodeHex(xoredBytes);
  }

  xorBytes (bytesA, bytesB) {
    return Uint8Array.from(bytesA.map((byte, i) => byte ^ bytesB[i]));
  }
}
