#! /bin/bash

if which npm; then
  # We have npm, so run on the host.
  cd ./app/
  npm $*
  cd ..
else
  # No npm on the host, so run with Docker image.
  if docker run -it --rm -v $PWD/app:/app -w /app node npm $*; then
    # Make sure the files are owned by the user.
    docker run -it --rm -v $PWD/app:/app alpine chown -R $(id -u):$(id -g) /app/node_modules /app/build /app/package-lock.json
  else
    echo "Failed to install JavaScript libraries."
    exit 1
  fi
fi
