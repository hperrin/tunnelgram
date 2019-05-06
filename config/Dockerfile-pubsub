FROM php:7.2-cli

RUN apt-get update -y && \
  apt-get install -y libgmp-dev re2c libmhash-dev libmcrypt-dev file && \
  apt-get clean -y

RUN ln -s /usr/include/x86_64-linux-gnu/gmp.h /usr/local/include/

RUN docker-php-ext-install mysqli
RUN docker-php-ext-configure gmp
RUN docker-php-ext-install gmp
RUN docker-php-ext-install pcntl

RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o wait-for-it.sh
RUN chmod 755 wait-for-it.sh

# Memory Limit
RUN echo "memory_limit=1024M" > $PHP_INI_DIR/conf.d/memory-limit.ini

# MySQLi Reconnect
RUN echo "[MySQLi]" > $PHP_INI_DIR/conf.d/mysqli-reconnect.ini
RUN echo "mysqli.reconnect=on" >> $PHP_INI_DIR/conf.d/mysqli-reconnect.ini
