#! /bin/bash

./composer.sh install
./npm.sh install
NODE_ENV=production ./npm.sh run build
NODE_ENV=production ./npm.sh prune --production
