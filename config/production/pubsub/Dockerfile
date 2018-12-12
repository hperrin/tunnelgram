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

# Azure Specific Stuff

COPY init_container.sh /bin/

RUN echo "root:Docker!" | chpasswd \
    && echo "cd /home" >> /etc/bash.bashrc \
    && chmod 777 /var/log \
    && chmod 777 /var/run \
    && chmod 777 /var/lock \
    && chmod 777 /bin/init_container.sh \
    && mkdir -p /home/LogFiles \
    && apt-get update \
        && apt-get install -y --no-install-recommends dialog \
        && apt-get update \
    && apt-get install -y --no-install-recommends openssh-server

RUN { \
                echo 'opcache.memory_consumption=128'; \
                echo 'opcache.interned_strings_buffer=8'; \
                echo 'opcache.max_accelerated_files=4000'; \
                echo 'opcache.revalidate_freq=60'; \
                echo 'opcache.fast_shutdown=1'; \
                echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

RUN { \
                echo 'error_log=/home/LogFiles/php-error.log'; \
                echo 'display_errors=Off'; \
                echo 'log_errors=On'; \
                echo 'display_startup_errors=Off'; \
                echo 'date.timezone=UTC'; \
    } > /usr/local/etc/php/conf.d/php.ini

COPY sshd_config /etc/ssh/

RUN apt-get clean -y

EXPOSE 2222 8080

ENV PORT 8080
ENV WEBSITE_ROLE_INSTANCE_ID localRoleInstance
ENV WEBSITE_INSTANCE_ID localInstance
ENV PATH ${PATH}:/home/app

WORKDIR /home/app

ENTRYPOINT ["/bin/init_container.sh"]
