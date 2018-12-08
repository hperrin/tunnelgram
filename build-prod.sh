#! /bin/bash

set -e

./composer.sh install --ignore-platform-reqs
./npm.sh install
./npm.sh run build-prod
./npm.sh prune --production
