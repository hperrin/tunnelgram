#!/bin/bash
set -e

echo "Starting SSH ..."
service ssh start

php /home/site/wwwroot/pubsub.php
