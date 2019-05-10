#! /bin/bash

set -e

git checkout deploy-web
git merge master
git push
git checkout master
