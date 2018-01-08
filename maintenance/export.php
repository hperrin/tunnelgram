<?php

if (php_sapi_name() != "cli") {
  die("You can only run export.php from the command line.");
}

require '/var/www/html/config.php';

$filename = 'entities-export-'.date('c').'.nex';

echo "Exporting Nymph data to $filename...\n";

\Nymph\Nymph::export(__DIR__."/$filename");

echo "Done.\n";
