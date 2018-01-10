<?php

error_reporting(E_ALL);

date_default_timezone_set('America/Los_Angeles');

require __DIR__.'/../vendor/autoload.php';
require __DIR__.'/../config.php';

//
// Enter the setup app.
//

$tilmeldURL = '../vendor/sciactive/tilmeld-server/';
$nodeModulesURL = '../node_modules/';
$restEndpoint = '../rest.php';
include $tilmeldURL.'/setup/setup.php';
