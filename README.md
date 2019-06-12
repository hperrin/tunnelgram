# Nymph App Template

This is a template for building an app with [Nymph](http://nymph.io/) and [Tilmeld](http://tilmeld.org/).

For development, it provides a Docker setup that runs a DB (MySQL, PostgreSQL, or SQLite3), Nginx, Postfix, and Nymph. It presents a usable app, built in Svelte, as a starting point.

## Installation

1. Get [Docker](https://docs.docker.com/install/#supported-platforms), [Docker Compose](https://docs.docker.com/compose/install/), and Degit
   ```shell
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   npm install -g degit
   ```
2. Copy this template:
   * for MySQL
     ```shell
     degit hperrin/nymph-template nymph-app
     ```
   * for Postgres
     ```shell
     degit hperrin/nymph-template#postgres nymph-app
     ```
   * for SQLite3
     ```shell
     degit hperrin/nymph-template#sqlite3 nymph-app
     ```
3. Run the app:
   ```shell
   cd nymph-app
   ./run.sh
   ```
4. Go to [http://localhost:8080/](http://localhost:8080/)

<small>On SQLite3, the very first time you create an entity (when you register the first user/create the first todo), the DB will become locked. You'll need to refresh the page, but then on it will be fine.</small>

### NPM and Composer

If [NPM](https://nodejs.org/en/download/current/) and/or [Composer](https://getcomposer.org/download/) are not installed, `npm.sh` and `composer.sh` will use a Docker container to run them.

You can run commands from the repository root (not the "app" directory) using `composer.sh` and `npm.sh`. For example:

```shell
./composer.sh require vendor/package
./npm.sh install --save package
./npm.sh run build
```

## Adding New Entities

1. Duplicate both Todo.php and Todo.js in the src/Entities folder, and rename/edit them.
2. Run `npm run build` or `npm run watch` in the "app" dir to rebuild the bundled JS.
3. If you need help, check out the [API docs](https://github.com/sciactive/nymph/wiki/API-Docs).
