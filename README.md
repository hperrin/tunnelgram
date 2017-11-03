# Nymph App Template

A template for a Nymph app. Provides a Docker setup that runs MySQL, Nymph PubSub, a Nymph REST endpoint, and serves your static HTML/JS.

## Installation

1. Fork this repo.
2. Get [Docker](https://www.docker.com/community-edition), [Composer](https://getcomposer.org/download/), and [Node.js](https://nodejs.org/en/download/current/).
  * On Ubuntu, you can run `sudo apt-get install docker.io docker-compose composer nodejs npm && sudo usermod -a -G docker $USER`, then log out and log back in.
3. Clone your fork: `git clone git@github.com:yourusername/yourreponame.git && cd yourreponame`
4. Run the app: `./run.sh`
5. Go here [http://localhost:8080/](http://localhost:8080/)

## Adding a New Entity

To add a new entity, follow these steps:

* Duplicate both Todo.php and Todo.js in the entities folder, and rename/edit them.
* Run `npm run build` to build the UMD entity JS.
* In `index.html`, add a new script tag under `<script src="build/Todo.js"></script>` for your new entity.
