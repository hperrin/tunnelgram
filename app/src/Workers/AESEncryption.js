import { AESEncryptionService } from '../Services/AESEncryptionService';

const crypt = new AESEncryptionService();

onmessage = async (e) => {
  const { counter, action, args } = e.data;
  if (!(action in crypt)) {
    return;
  }
  let result = await crypt[action](...args);
  let transferrables;
  if (result instanceof Uint8Array) {
    transferrables = [result.buffer];
  }
  postMessage({ counter, result }, transferrables);
};
