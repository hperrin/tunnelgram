// JSEncrypt needs the crypto API in window.crypto.
self.window = {
  crypto: self.crypto,
};
