import './makeWindowCryptoAvailable';
import { RSAEncryptionService } from '../Services/RSAEncryptionService';

const crypt = new RSAEncryptionService();

onmessage = (e) => {
  const { counter, action, args } = e.data;
  if (!(action in crypt)) {
    return;
  }
  let result = crypt[action](...args);
  let transferrables;
  if (result instanceof Uint8Array) {
    transferrables = [result.buffer];
  }
  postMessage({ counter, result }, transferrables);
};
