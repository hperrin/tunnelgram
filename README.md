# Nymph App Template

This is a template for building an app with [Nymph](http://nymph.io/) and [Tilmeld](http://tilmeld.org/).

For development, it provides a Docker setup that runs a DB (MySQL, PostgreSQL, or SQLite3), Nginx, Postfix, and Nymph. It presents a usable app, built in Svelte, as a starting point.

## Installation

1. Get [Docker](https://www.docker.com/community-edition). (On Ubuntu, see the next section.)
2. Copy this template:
  * `npm install -g degit`
  * `degit hperrin/nymph-template nymph-app` (for MySQL)
    * `degit hperrin/nymph-template#postgres nymph-app` (for Postgres)
    * `degit hperrin/nymph-template#sqlite3 nymph-app` (for SQLite3)
  * `cd nymph-app`
3. Run the app: `./run.sh`
4. Go here [http://localhost:8080/](http://localhost:8080/)

<small>On SQLite3, the very first time you create an entity (when you register the first user/create the first todo), the DB will become locked. You'll need to refresh the page, but then on it will be fine.</small>

### Docker on Ubuntu 18.04

```sh
sudo apt-get install docker.io docker-compose && sudo usermod -a -G docker $USER
```

Then restart, so the group modification takes effect.

### Docker on Ubuntu 17.10 and earlier

```sh
sudo apt-get install docker.io && sudo usermod -a -G docker $USER
sudo wget -O /usr/local/bin/docker-compose https://github.com/docker/compose/releases/download/1.21.0/docker-compose-`uname -s`-`uname -m`
sudo chmod +x /usr/local/bin/docker-compose
```

Then restart, so the group modification takes effect.

### NPM and Composer

If [NPM](https://nodejs.org/en/download/current/) and/or [Composer](https://getcomposer.org/download/) are not installed, `npm.sh` and `composer.sh` will use a Docker container to run them.

You can run commands from the repository root (not the "app" directory) using `composer.sh` and `npm.sh`. For example:

```sh
./composer.sh require vendor/package
./npm.sh install --save package
./npm.sh run build
```

## Adding New Entities

1. Duplicate both Todo.php and Todo.js in the src/Entities folder, and rename/edit them.
2. Run `npm run build` or `npm run watch` in the "app" dir to rebuild the bundled JS.
3. If you need help, check out the [API docs](https://github.com/sciactive/nymph/wiki/API-Docs).
