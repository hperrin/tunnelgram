import JSEncrypt from 'jsencrypt';

export class RSAEncryptionService {
  constructor() {
    this.resetRsa();
  }

  resetRsa() {
    this.decryptors = {};
    this.encryptors = {};
  }

  decryptRSA(text, privateKey) {
    let decryptor;
    if (this.decryptors.hasOwnProperty(privateKey)) {
      decryptor = this.decryptors[privateKey];
    } else {
      decryptor = new JSEncrypt();
      decryptor.setPrivateKey(privateKey);
      this.decryptors[privateKey] = decryptor;
    }
    return decryptor.decrypt(text);
  }

  encryptRSA(text, publicKey) {
    let encryptor;
    if (this.encryptors.hasOwnProperty(publicKey)) {
      encryptor = this.encryptors[publicKey];
    } else {
      encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);
      this.encryptors[publicKey] = encryptor;
    }
    return encryptor.encrypt(text);
  }
}
