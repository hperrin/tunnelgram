<?php

// You can set this to your own time zone.
date_default_timezone_set('America/Los_Angeles');

/*
 * You don't need to edit below here. It is set up to work inside your Docker
 * container.
 */

require __DIR__.'/vendor/autoload.php';

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

// Nymph PubSub's configuration.
\Nymph\PubSub\Server::configure(
    ['entries' => ['ws://'.getenv('PUBSUB_HOST').'/']]
);

// uMailPHP's configuration.
\uMailPHP\Mail::configure([
  'site_name' => 'Nymph App Template',
  'site_link' => 'http://localhost:8080/',
  'master_address' => 'noreply@example.com',
  'testing_mode' => true,
  'testing_email' => 'hperrin@localhost', // TODO(hperrin): what should this be?
]);


// Tilmeld's configuration.
\Tilmeld\Tilmeld::configure([
  'setup_url' => 'http://localhost:8080/user/',
  'email_usernames' => true,
  'verify_redirect' => 'http://localhost:8080/',
]);
