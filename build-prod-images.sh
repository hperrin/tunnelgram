#! /bin/bash

docker-compose build

docker build -f prodimages/Dockerfile-pubsub -t tunnelgram-pubsub:v1 ./
docker build -f prodimages/Dockerfile-fpm -t tunnelgram-fpm:v1 ./
docker build -f prodimages/Dockerfile-web -t tunnelgram-web:v1 ./
