#! /bin/bash

# You don't have to build production images manually. They are built and pushed
# to Docker Hub by Azure when the deploy-pubsub branch is written to.

cp -a ../../../app ./
rm -r app/node_modules
rm -r app/dist
rm app/ServiceWorker.js
rm app/ServiceWorker.js.map

docker build -t tunnelwire/tunnelgram:pubsub ./
