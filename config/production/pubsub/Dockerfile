FROM php:7.2-cli

RUN apt-get update -y && \
  apt-get install -y libgmp-dev re2c libmhash-dev libmcrypt-dev file && \
  apt-get clean -y

RUN ln -s /usr/include/x86_64-linux-gnu/gmp.h /usr/local/include/

RUN docker-php-ext-install mysqli
RUN docker-php-ext-configure gmp
RUN docker-php-ext-install gmp

# Memory Limit
RUN echo "memory_limit=1024M" > $PHP_INI_DIR/conf.d/memory-limit.ini

# MySQLi Reconnect
RUN echo "[MySQLi]" > $PHP_INI_DIR/conf.d/mysqli-reconnect.ini
RUN echo "mysqli.reconnect=on" >> $PHP_INI_DIR/conf.d/mysqli-reconnect.ini

# SSH
ENV SSH_PASSWD "root:Docker!"
RUN apt-get update \
        && apt-get install -y --no-install-recommends dialog \
        && apt-get update \
    && apt-get install -y --no-install-recommends openssh-server \
    && echo "$SSH_PASSWD" | chpasswd

COPY sshd_config /etc/ssh/
COPY init.sh /usr/local/bin/

RUN chmod u+x /usr/local/bin/init.sh
EXPOSE 8000 2222
ENTRYPOINT ["init.sh"]

RUN apt-get clean -y
