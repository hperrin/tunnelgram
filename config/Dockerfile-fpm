FROM php:7.2-fpm

RUN apt-get update -y && \
  apt-get install -y msmtp msmtp-mta && \
  apt-get install -y libgmp-dev re2c libmhash-dev libmcrypt-dev file && \
  apt-get install -y libmagickwand-dev && \
  apt-get clean -y

RUN ln -s /usr/include/x86_64-linux-gnu/gmp.h /usr/local/include/

RUN pecl install imagick && docker-php-ext-enable imagick
RUN docker-php-ext-install mysqli
RUN docker-php-ext-configure gmp
RUN docker-php-ext-install gmp
RUN docker-php-ext-install pcntl

COPY msmtprc /etc/msmtprc

# Memory Limit
RUN echo "memory_limit=1024M" > $PHP_INI_DIR/conf.d/memory-limit.ini

# MySQLi Reconnect
RUN echo "[MySQLi]" > $PHP_INI_DIR/conf.d/mysqli-reconnect.ini
RUN echo "mysqli.reconnect=on" >> $PHP_INI_DIR/conf.d/mysqli-reconnect.ini

# Post Max Size
RUN echo "post_max_size=80M" > $PHP_INI_DIR/conf.d/post-max-size.ini
