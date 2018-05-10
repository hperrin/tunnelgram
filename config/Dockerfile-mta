FROM tozd/postfix:latest

RUN echo "root:nymph_template_password" | chpasswd

COPY postfix-main.cf /etc/postfix/main.cf
COPY mailname /etc/mailname
