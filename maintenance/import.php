<?php

if (php_sapi_name() != "cli") {
  die("You can only run import.php from the command line.");
}

require '/var/www/html/config.php';

$files = glob(__DIR__.'/entities-export-*.nex');

if (!$files) {
  die("There are no Nymph export files to import.\n");
}

echo "Please choose a Nymph export file:\n\n";

foreach ($files as $key => $file) {
  echo ($key+1).": ".basename($file)."\n";
}

echo "\nType number of file and press [Enter]: ";
fscanf(STDIN, "%d\n", $number);
$number -= 1;
echo "\n";

if (!key_exists($number, $files)) {
  die("Invalid choice.\n");
}

try {
  echo "Importing Nymph data from ".basename($files[$number])."...\n";
  $result = \Nymph\Nymph::import($files[$number]);
} catch (\Nymph\Exceptions\QueryFailedException $e) {
  echo $e->getMessage()."\n".$e->getQuery()."\n\n";
}

echo "Done.\n";
