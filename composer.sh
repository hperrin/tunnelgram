#! /bin/bash

if which composer; then
  # We have composer, so run on the host.
  cd ./app/
  composer $*
  cd ..
else
  # No composer on the host, so run with Docker image.
  if docker run -it --rm -v $PWD/app:/app composer $*; then
    # Make sure the files are owned by the user.
    docker run -it --rm -v $PWD/app:/app alpine chown -R $(id -u):$(id -g) /app/vendor /app/composer.lock
  else
    echo "Failed to install PHP libraries."
    exit 1
  fi
fi
