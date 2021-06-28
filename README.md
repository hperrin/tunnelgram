# Tunnelgram

<big>Easy, secure, end to end encrypted (E2EE) messenger.</big><br/>

- Every message in a _chat_ or _private channel_ is encrypted from sender to recipient. There is no way to send an unencrypted message in them and Tunnelgram's servers cannot decrypt them.
- You can log in on **multiple clients** at the same time, read all of your conversations and messages, and send new messages.
  - The original sign-up device is _not required_, and _not used as a proxy_.
- Your account is not tied to a phone number or specific device. You log in with a username and password.
  - Changing your phone doesn't require any [complicated](https://support.signal.org/hc/en-us/articles/360007062012) [steps](https://faq.whatsapp.com/en/android/28000018/?category=5245246). Just log in on your new phone.
- If you lose your device, you **don't lose your messages, photos, videos, or conversations**. No backups necessary.
- Unlike _chats_ (and unlike group messages in any other E2EE messenger), new users in _private channels_, which are end to end encrypted, can see the entire message history of the channel.
- Tunnelgram also has public channels, which are not end to end encrypted (since they are meant to be readable by everyone).

It's as easy to use as any non-E2EE messenger.

## Support Tunnelgram

[![Become a patron on Patreon](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/tunnelgram)

### Sponsor(s)!

Note: Tunnelgram is no longer accepting sponsors.

<img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/mrgnw.jpg" title="Morgan Williams"
/> <img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/PinakyBhattacharyya.jpg" title="Pinaky Bhattacharyya"
/> <img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/davidhalvorsen.png" title="David Halvorsen"
/> <img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/MatthewCourtney.jpg" title="Matthew Courtney"
/> <img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/JennaGreshik.jpg" title="Jenna Greshik"
/> <img style="border-radius: 50%;" width="75" height="75"
  src="https://github.com/hperrin/tunnelgram/raw/master/sponsors/MohamedJebali.jpg" title="Mohamed Jebali"
/>

# The Tunnelwire Encryption Scheme

How is Tunnelgram able to show all your messages on multiple clients just like a regular messaging app if it's all end to end encrypted?

It uses the **Tunnelwire Encryption Scheme**! I developed this scheme in 2013, and Tunnelgram is the first application to use it.

The Tunnelwire Encryption Scheme has a couple key requirements that secure your data.

1. The server must never know your password.
2. The server must never know your private key.

With these two principles, Tunnelgram uses the Tunnelwire Encryption Scheme to transfer end to end encrypted messages between multiple parties.

## How the Tunnelwire Encryption Scheme Works

### Upon Registration

When a user registers, the client must:

1. Hash the password that the user entered, using a cryptographically secure, one way hashing algorithm. _Tunnelgram uses one iteration of SHA-512._
2. Derive an encryption key and a remainder from the hash. Neither the key nor the password should be practically derivable from just the remainder. There are multiple ways to do this:

- Remove some portion from the hash as the key. The remaining portion becomes the remainder. _Tunnelgram removes the first 32 bytes for a key and the next 16 bytes for an initialization vector._
- Use any portion of the hash as the key, then re-hash any portion of the hash to create the remainder.
- Or use a combination of these techniques in any amount of iterations. This can add computational overhead which will make brute forcing a password harder, should the remainder become known to an attacker.

3. Send the remainder to the server as the user's password.
4. Generate a public/private key pair. _Tunnelgram generates a 4096 bit RSA-OAEP key pair._
5. Encrypt the private key with the encryption key it derived from the password hash using a symmetric encryption algorithm. _Tunnelgram uses AES-256 (14 rounds) in Output Feedback mode, with the additional bytes from the hash as the initialization vector._
6. Send the encrypted private key and clear text public key to the server.

> :information_source: Some notes:
>
> - If you allow your users to use a weak password, then you might as well not encrypt anything, cause it's not secure.
> - Even though the password your server receives is already hashed, you should still hash it before you store it. Be overly cautious and keep your users secure.
> - If you just split apart your users' passwords and use one portion to encrypt and the other to authenticate, then you might as well just have them enter two passwords, cause that's essentially what you're doing. (Yeah, there are products that do this.)
> - Provide 2 factor auth. It is way more secure than just a password, and you can use it along with Tunnelwire.

### Upon Login

When a user logs in, the client must:

1. Complete steps 1-3 of the registration process in order to authenticate the user.
2. Retrieve the user's encrypted private key and clear text public key from the server.
3. Use the key taken from the password hash to decrypt the private key.

> :information_source: The server never knows their actual password, so it can't decrypt their private key. Therefore, the server also never knows their private key. Boom, Tunnelwire.

## Using the Tunnelwire Encryption Scheme in Your Own Project

The Tunnelwire Encryption Scheme is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode) and the implementation is licensed under the [Apache License 2.0
](http://www.apache.org/licenses/LICENSE-2.0). You are free to use the scheme and implementation in your own software, provided you abide by the terms of the licenses.

In order to comply with the CC-BY license, you must attribute the creator, Hunter Perrin, along with a license notice, and a link to the Tunnelwire Encryption Scheme.

You may use the following:

```
HTML:
This software uses an encryption scheme based on the <a href="https://github.com/hperrin/tunnelgram#the-tunnelwire-encryption-scheme">Tunnelwire Encryption Scheme</a> by Hunter Perrin, which is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 license</a>.

Or Markdown:
This software uses an encryption scheme based on the [Tunnelwire Encryption Scheme](https://github.com/hperrin/tunnelgram#the-tunnelwire-encryption-scheme) by Hunter Perrin, which is licensed under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).

Or text:
This software uses an encryption scheme based on the Tunnelwire Encryption Scheme (https://github.com/hperrin/tunnelgram#the-tunnelwire-encryption-scheme) by Hunter Perrin, which is licensed under the CC BY 4.0 license (https://creativecommons.org/licenses/by/4.0/).
```

# How Tunnelgram Uses the Tunnelwire Encryption Scheme to Send Messages

## Upon Message Send

In a chat, the client:

1. Generates a random, cryptographically secure 32 byte message key and 16 byte initialization vector, and encrypts the message with it using AES-256 (14 rounds) in Output Feedback mode.
2. Retrieves the public keys of all of the recipients.
3. Encrypts the message key and initialization vector with each of the recipients' public keys and the user's public key using RSA.
4. Sends the encrypted message and all of the encrypted copies of the message key to the server.

In a private channel, the client:

1. Generates a random, cryptographically secure 32 byte message key and 16 byte initialization vector.
2. XORs it with the channel key, which is already encrypted and sent to every channel member, and encrypts the message with the result using AES-256 (14 rounds) in Output Feedback mode.
3. Sends the encrypted message and the plaintext message key and initialization vector to the server.

## Upon Message Receipt

In a chat, the client:

1. Retrieves their copy of the encrypted message key and initialization vector.
2. Uses the user's private key to decrypt the message key and initialization vector.
3. Uses the message key and initialization vector to decrypt the message.

In a private channel, the client:

1. Retrieved the plaintext message key and initialization vector.
2. Retrieves their copy of the encrypted channel key.
3. Uses the user's private key to decrypt the channel key and initialization vector.
4. XORs the channel key and message key, and uses the result to decrypt the message.

# How Tunnelgram Sends Images

Images are fairly easy. An HTML canvas element is used to size the image down until it is under 2MB, which is small enough to decrypt quickly and big enough to hold a good quality image. The message key is used to encrypt the image data in a web worker. A thumbnail is generated in the same way as well, and encrypted with the same key.

# How Tunnelgram Sends Videos

Videos are much harder. The closest thing to a universal format is H.264 video and AAC or MP3 audio in an MP4 container. VP9 and Vorbis in a WebM container would be perfect, if Apple supported it. Since many people use iPhones, that won't work. Android will record an MP4, so it can just be encrypted and sent, as long as it's under the arbitrary 20MB limit. I've found this limit is a good tradeoff in video quality/length to decryption time. But iPhones record H.264/AAC in a QuickTime container that can't be played on Android devices. Other devices may record in completely different formats/containers. Or the user may add a video well above the 20MB limit.

A normal messenger app handles this easily. It remuxes or transcodes the video on the server side. Bing bang boom, super compatible video, easy peasy. Tunnelgram can't do that, because _the video is encrypted before it's sent to the server_. The video needs to be made compatible before it's encrypted on the client. So Tunnelgram uses a custom version of FFMPEG compiled to WebAssembly called [FFMPEG.js](https://github.com/hperrin/ffmpeg.js). It loads the video into an ArrayBuffer and passes it to a Web Worker, which downloads and compiles the FFMPEG code in the browser then uses it to remux/transcode the video. For transcoding, it will use 1.5x the original bitrate or the maximum bitrate it can to get a video under 20MB. It uses a two pass transcoding strategy to get the best quality it can at this small file size.

Using this strategy, Tunnelgram can send a video from any client device that can be viewed on any other device, regardless of the type or size of the original video.

# Developing for Tunnelgram

If you'd like to work on Tunnelgram, follow these steps to get it up and running on your system:

1. Get [Docker](https://docs.docker.com/install/#supported-platforms) and [Docker Compose](https://docs.docker.com/compose/install/)
   ```shell
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
2. Run these commands to checkout the repo and start the containers:
   ```sh
   git clone https://github.com/hperrin/tunnelgram.git
   cd tunnelgram
   ./run.sh
   ```
3. Run these commands to create the buckets in the blob store:
   ```sh
   docker ps
   # Look for the FPM container's name (probably tunnelgram_fpm_1) and use it in the next command.
   docker exec -it tunnelgram_fpm_1 /bin/bash
   cd /maintenance/
   php create-buckets.php
   exit
   ```
4. You're ready! Go to http://localhost:8080/

To rebuild on file changes, in the `app` directory:

```sh
npm run watch
```

# What's Next

Some other things I'd like to do to make Tunnelgram even more secure:

- Digital signatures.
  - Sign messages on send.
  - Save other user's public keys, and verify signatures with the stored keys.
- Key fingerprints.
  - Provide key fingerprints so user's can verify another user's public key when starting a conversation for the first time.
- User blocking.

# About Tunnelgram

Tunnelgram is written by me, Hunter Perrin. I wrote Tunnelgram because I wanted a better end to end encrypted messenger. I don't like Facebook or Google having all of my messages, especially the private ones.

None of my friends would use other end to end encrypted messengers, because they're either not easy to setup or not convenient to use.

For example, when you get a new phone, all of your encrypted conversations on Telegram or Facebook Messenger are inaccessible. Or if you're talking with someone on your phone in an encrypted chat, then you start using the web client on your desktop, you can't continue that same encrypted chat.

This is a huge barrier to average users adopting an encrypted messenger. The goal of Tunnelgram is to break down that barrier, so anyone can use an encrypted messenger easily.

If you'd like to find me:

- Follow me on Twitter at https://twitter.com/SciActive
- Email me at hunter@sciactive.com.
- Find me on GitHub at https://github.com/hperrin and https://github.com/sciactive.
