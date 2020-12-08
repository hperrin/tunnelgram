<?php

error_reporting(E_ALL);

// Allow from any origin.
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Access-Control headers are received during OPTIONS requests.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, HEAD, OPTIONS");
  }

  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
    header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
  }
}

/*
 * You don't need to edit below here. It is set up to work inside your Docker
 * container.
 */

require_once __DIR__.'/config.php';

$NymphREST = new \Nymph\REST();

try {
  $NymphREST->respond();
} catch (\Nymph\Exceptions\QueryFailedException $e) {
  echo $e->getMessage()."\n\n".$e->getQuery();
}
