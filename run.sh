#! /bin/bash

if [ ! -d "app/vendor" ]; then
  cd ./app/
  composer install
  cd ..
fi

if [ ! -d "app/node_modules" ]; then
  cd ./app/
  npm install
  cd ..
fi

if [ ! -f "db_password.txt" ]; then
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_password.txt
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_root_password.txt
fi

if [ ! -d "db_data" ]; then
  mkdir db_data
fi

docker-compose up
