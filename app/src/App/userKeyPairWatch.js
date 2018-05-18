import PrivateKey from '../Entities/PrivateKey';
import PublicKey from '../Entities/PublicKey';
import sha512 from 'hash.js/lib/hash/sha/512';
import keypair from 'keypair';
import JSEncrypt from 'jsencrypt';

export default function userKeyPairWatch (User) {
  const _register = User.prototype.register;
  User.prototype.register = function (creds) {
    const testString = 'Hello, world.';

    const {password} = creds;

    // The first hash is used as the key for AES.
    const key = sha512().update(password).digest('hex');

    // The second hash goes to the server as the user's password.
    const newPassword = sha512().update(key).digest('hex');

    // Generate a Public/Private key pair.
    const pair = keypair();
    const privateKey = pair.private;
    const publicKey = pair.public;

    const crypt = new JSEncrypt();

    crypt.setKey(privateKey);
    crypt.setKey(publicKey);

    const enc = crypt.encrypt(testString);
    const dec = crypt.decrypt(enc);

    console.log({
      password,
      key,
      newPassword,
      privateKey,
      publicKey,
      testString,
      enc,
      dec
    });

    return Promise.reject({});
  };
}
