<?php

// Nymph's configuration.
$nymphConfig = [
  'MySQL' => [
    'host' => getenv('MYSQL_HOST'),
    'database' => getenv('MYSQL_DATABASE'),
    'user' => getenv('MYSQL_USER'),
    'password' => trim(file_get_contents(getenv('MYSQL_PASSWORD_FILE')))
  ]
];

\Nymph\Nymph::configure($nymphConfig);
