<?php

error_reporting(E_ALL);

/*
 * You don't need to edit below here. It is set up to work inside your Docker
 * container.
 */

require __DIR__.'/config.php';

$NymphREST = new \Nymph\REST();

try {
  $NymphREST->respond();
} catch (\Nymph\Exceptions\QueryFailedException $e) {
  echo $e->getMessage()."\n\n".$e->getQuery();
}
