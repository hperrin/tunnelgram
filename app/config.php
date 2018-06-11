<?php

// You can set this to your own time zone.
date_default_timezone_set('America/Los_Angeles');

$host = $_SERVER['HTTP_HOST'] ?? 'localhost:8080';

/*
 * You don't need to edit below here. It is set up to work inside your Docker
 * container.
 */

require __DIR__.'/autoload.php';

// Nymph's configuration.
$nymphConfig = [
  'MySQL' => [
    'host' => getenv('MYSQL_HOST'),
    'database' => getenv('MYSQL_DATABASE'),
    'user' => getenv('MYSQL_USER'),
    'password' => getenv('MYSQL_PASSWORD') ?: trim(file_get_contents(getenv('MYSQL_PASSWORD_FILE')))
  ]
];

if (getenv('MYSQL_CA_CERT')) {
  $conn = mysqli_init();
  mysqli_ssl_set(
      $conn,
      null,
      null,
      getenv('MYSQL_CA_CERT'),
      null,
      null
  );
  mysqli_real_connect(
      $conn,
      $nymphConfig['MySQL']['host'],
      $nymphConfig['MySQL']['user'],
      $nymphConfig['MySQL']['password'],
      $nymphConfig['MySQL']['database'],
      3306,
      MYSQLI_CLIENT_SSL,
      MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT
  );
  $nymphConfig['MySQL']['link'] = $conn;
}

\Nymph\Nymph::configure($nymphConfig);

// Nymph PubSub's configuration.
\Nymph\PubSub\Server::configure(
    ['entries' => [(getenv('PUBSUB_SCHEME') ?: 'ws').'://'.getenv('PUBSUB_HOST').'/']]
);

// uMailPHP's configuration.
\uMailPHP\Mail::configure([
  'site_name' => 'Tunnelgram',
  'site_link' => 'http://'.$host.'/',
  'master_address' => 'noreply@tunnelgram.com',
  'testing_mode' => true,
  'testing_email' => 'hperrin@tunnelgram.com', // TODO(hperrin): what should this be?
]);


// Tilmeld's configuration.
\Tilmeld\Tilmeld::configure([
  'app_url' => 'http://'.$host.'/',
  'setup_url' => 'http://'.$host.'/user/',
  'email_usernames' => false,
  'enable_user_search' => true,
  'user_fields' => ['name', 'phone'],
  'reg_fields' => ['name'],
  'verify_email' => false,
  'pw_recovery' => false,
  'verify_redirect' => 'http://'.$host.'/',
  'jwt_secret' => base64_decode(
      getenv('TILMELD_SECRET') ?: file_get_contents(getenv('TILMELD_SECRET_FILE'))
  )
]);

require __DIR__.'/src/HookMethods.php';
