<?php

error_reporting(E_ALL);

date_default_timezone_set('America/Los_Angeles');

require __DIR__.'/../vendor/autoload.php';
require __DIR__.'/../config.php';

//
// Enter the setup app.
//

$tilmeldURL = '../node_modules/tilmeld/';
$sciactiveBaseURL = '../node_modules/';
$restEndpoint = '../rest.php';
include '../vendor/sciactive/tilmeld/setup/setup.php';
