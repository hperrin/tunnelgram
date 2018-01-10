# Nymph App Template

This is a template for you to use to build an app with [Nymph](http://nymph.io/) and [Tilmeld](http://tilmeld.org/).

It provides a Docker setup that runs MySQL, Postfix, Nymph PubSub, and Apache. It presents a usable app as a starting point. When you're ready to start developing, check out the [API docs](https://github.com/sciactive/nymph/wiki/API-Docs).

## Installation

1. Fork this repo.
2. Get [Docker](https://www.docker.com/community-edition). (On Ubuntu, see the next section.)
3. Clone your fork: `git clone git@github.com:yourusername/yourreponame.git && cd yourreponame`
4. Run the app: `./run.sh`
5. Go here [http://localhost:8080/](http://localhost:8080/)

### Getting Docker and Docker Compose on Ubuntu

The Docker package in Ubuntu requires the user to be added to the "docker" group after installation. To install, run this command:

```sh
sudo apt-get install docker.io && sudo usermod -a -G docker $USER
```

Then log out and log back in, so the group modification can take effect.

The Docker Compose version in the Ubuntu repositories isn't new enough, so you'll need to install Docker Compose manually. To install, run this command:

```sh
sudo wget -O /usr/local/bin/docker-compose https://github.com/docker/compose/releases/download/1.17.0/docker-compose-`uname -s`-`uname -m` && sudo chmod +x /usr/local/bin/docker-compose
```

### Regarding NPM and Composer

[NPM](https://nodejs.org/en/download/current/) and [Composer](https://getcomposer.org/download/) are used, but if they are not installed, the npm.sh and composer.sh scripts will use a Docker container to run them. If you plan on adding a lot of JavaScript and/or PHP libraries, you should probably just install them. On Ubuntu, you can run `sudo apt-get install nodejs npm composer`.

If you don't want to install them, you can run commands from the repository directory (not the "app" directory) using composer.sh and npm.sh. For example:

```sh
./composer.sh require vendor/package
./npm.sh install package
./npm.sh run build
```

## Adding a New Entity

To add a new entity, follow these steps:

* Duplicate both Todo.php and Todo.js in the entities folder, and rename/edit them.
* Run `npm run build` to build the UMD entity JS.
* In `index.html`, add a new script tag under `<script src="build/Todo.js"></script>` for your new entity.
