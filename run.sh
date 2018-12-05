#! /bin/bash

set -e

if [ ! -d "app/vendor" ]; then
  ./composer.sh install
fi

if [ ! -d "app/node_modules" ]; then
  ./npm.sh install
fi

if [ ! -d "app/dist" ]; then
  ./npm.sh run build
fi

if [ ! -f "db_password.txt" ]; then
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_password.txt
  dd if=/dev/urandom bs=64 count=1 | base64 > ./db_root_password.txt
fi

if [ ! -d "db_data" ]; then
  mkdir db_data
fi

if [ ! -d "db_blob" ]; then
  mkdir db_blob
fi

if [ ! -f "db_blob_access_key.txt" ]; then
  dd if=/dev/urandom bs=15 count=1 | base64 | sed -e 's/\//0/' > ./db_blob_access_key.txt
  dd if=/dev/urandom bs=30 count=1 | base64 | sed -e 's/\//0/' > ./db_blob_secret_key.txt
fi

if [ ! -d "mail" ]; then
  mkdir mail
fi

if [ ! -f "tilmeld_secret.txt" ]; then
  dd if=/dev/urandom bs=32 count=1 | base64 > ./tilmeld_secret.txt
fi

if [ ! -f "onesignal_rest_api_key.txt" ]; then
  echo "In order to test app push notifications, you need to put your OneSignal REST API Key in onesignal_rest_api_key.txt."
  touch ./onesignal_rest_api_key.txt
fi

docker-compose up
