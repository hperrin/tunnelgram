#! /bin/bash

if [ ! -d "web_data/vendor" ]; then
  cd ./web_data/
  composer install
  cd ..
fi

if [ ! -f "db_password.txt" ]; then
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_password.txt
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_root_password.txt
fi

docker-compose up
