import aesjs from 'aes-js';
import base64js from 'base64-js';
import utf8 from 'utf8';
import {AESEncryptionService} from '../Services/AESEncryptionService';

const crypt = new AESEncryptionService();

onmessage = (e) => {
  const {counter, action, args} = e.data;
  if (!(action in crypt)) {
    return;
  }
  let result = crypt[action](...args);
  let transferrables;
  if (result instanceof Uint8Array) {
    transferrables = [result.buffer];
  }
  postMessage({counter, result}, transferrables);
};
