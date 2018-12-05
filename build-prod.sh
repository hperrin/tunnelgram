#! /bin/bash

./composer.sh install
./npm.sh install
./npm.sh run build-prod
./npm.sh prune --production
