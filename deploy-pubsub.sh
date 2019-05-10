#! /bin/bash

set -e

git checkout deploy-pubsub
git merge master
git push
git checkout master
