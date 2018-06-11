# Tunnelgram

An end to end encrypted messenger that doesn't suck.

## Advantages of Tunnelgram Over Other Encrypted Messengers

* Every message is encrypted end to end. There is no way to send an unencrypted message.
* Users can login on **multiple systems**, read all of their messages, and send new messages. In this way, it works just like any other messenger.

## Support Tunnelgram

[![Become a patron on Patreon](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/tunnelgram)

# The Tunnelwire Encryption Scheme

How is Tunnelgram able to show all your messages on any client just like a regular messaging app if it's all end to end encrypted?

It uses the **Tunnelwire Encryption Scheme**. I invented this scheme in 2013, and Tunnelgram is the first application to use it.

The Tunnelwire Encryption Scheme has some requirements that can't be met by other messengers.

1. The server must never know your password.
2. The server must never know your private key.

With these two key principals, Tunnelgram can use the Tunnelwire Encryption Scheme to securely send encrypted messages between any number of parties.

## How the Tunnelwire Encryption Scheme Works

### Upon Registration

1. The client hashes the password that the user entered.
2. It removes some bytes from the hash (the first 32 bytes for Tunnelgram). These become an encryption key.
3. The rest of the bytes are sent to server as the user's password.
4. The client generates an RSA key pair.
5. It encrypts the private key with the key it took from the password hash.
6. It sends the clear text public key and the encrypted private key to server for storage.

### Upon Login

1. When a user logs in, the client takes steps 1-3 of the registration process.
2. Now that the user is authenticated with the server, the client downloads their encrypted private key and clear text public key.
3. It then uses the key taken from the password hash to decrypt the private key.

* The server never knows their actual password, so it can't decrypt their private key.
* Therefore, the server also never knows their private key.

## How Tunnelgram Uses the Tunnelwire Encryption Scheme to Send Messages

### Upon Message Send

1. The client downloads the public keys of all of the recipients.
2. The client generates a random, secure key, and encrypted the clear text message with it.
3. The client encrypts the random key with each of the recipients' public keys, and the user's public key.
4. The client sends the encrypted message, and all of the encrypted copies of the key to the server.

### Upon Message Receipt

1. The client retrieves their copy of the encrypted message key.
2. It uses the user's private key to decrypt the message key.
3. It uses the message key to decrypt the message.

# Developing for Tunnelgram

If you'd like to work on Tunnelgram, follow these steps to get it up and running on your system:

1. Install [Docker](https://store.docker.com/search?type=edition&offering=community). You also need Docker Compose, which is included in the Community Edition.
2. Now run these commands:
  ```sh
  git clone https://github.com/hperrin/tunnelgram.git
  cd tunnelgram
  ./run.sh
  ```
3. Go to http://localhost:8080/

To rebuild on file changes, in the `app` directory:

```sh
npm run watch
```

# What's Next

Some other things I'd like to do to make Tunnelgram even more secure:

* Digital signatures.
  * Sign messages on send.
  * Save other user's public keys, and verify signatures with the stored keys.
* Key fingerprints.
  * Provide key fingerprints so user's can verify another user's public key when starting a conversation for the first time.
* User blocking.

# About Tunnelgram

Tunnelgram is written by me, Hunter Perrin. I wrote Tunnelgram because I wanted a better end to end encrypted messenger. I don't like Facebook or Google having all of my messages, especially the private ones.

None of my friends would use other end to end encrypted messengers, because they're either not easy to setup or not convenient to use.

For example, when you get a new phone, all of your encrypted conversations on Telegram or Facebook Messenger are inaccessible. Or if you're talking with someone on your phone in an encrypted chat, then you start using the web client on your desktop, you can't continue those chats.

This puts up a pretty huge barrier to adopting an encrypted messenger. The goal of Tunnelgram is to break down that barrier, so anyone can use an encrypted messenger easily.

If you'd like to find me:

* Follow me on Twitter at https://twitter.com/SciActive
* Email me at hunter@sciactive.com.
* Find me on GitHub at https://github.com/hperrin and https://github.com/sciactive.
* Or send me a message on https://tunnelgram.com at the username hperrin.
