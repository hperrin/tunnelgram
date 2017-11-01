<?php

error_reporting(E_ALL);

require __DIR__.'/vendor/autoload.php';
require __DIR__.'/config.php';

date_default_timezone_set('America/Los_Angeles');

$config = [];

\Nymph\Nymph::connect();

require 'todo/Todo.php';

if (in_array('-d', $argv)) {
  function shutdown() {
    posix_kill(posix_getpid(), SIGHUP);
  }

  // Switch over to daemon mode.
  if ($pid = pcntl_fork()) {
    return;
  }

  register_shutdown_function('shutdown');
} else {
  error_reporting(E_ALL);
}

$server = new \Nymph\PubSub\Server($config);
$server->run();
