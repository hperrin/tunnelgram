#! /bin/bash

az acr login --name tunnelwire

docker tag tunnelgram-pubsub:v1 tunnelwire.azurecr.io/tunnelgram-pubsub:v1
docker tag tunnelgram-fpm:v1 tunnelwire.azurecr.io/tunnelgram-fpm:v1
docker tag tunnelgram-web:v1 tunnelwire.azurecr.io/tunnelgram-web:v1

docker push tunnelwire.azurecr.io/tunnelgram-pubsub:v1
docker push tunnelwire.azurecr.io/tunnelgram-fpm:v1
docker push tunnelwire.azurecr.io/tunnelgram-web:v1
