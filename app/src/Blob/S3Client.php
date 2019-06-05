<?php

use Aws\S3\S3Client;

$options = [
  'version' => 'latest',
  'region' => 'us-east-1'
];

$blobAccessKey = getenv('BLOB_ACCESS_KEY') ?: getenv('BLOB_ACCESS_KEY_FILE');
if ($blobAccessKey) {
  $key = (
    getenv('BLOB_ACCESS_KEY')
      ?: trim(file_get_contents(getenv('BLOB_ACCESS_KEY_FILE')))
  );
  $secret = (
    getenv('BLOB_SECRET_KEY')
      ?: trim(file_get_contents(getenv('BLOB_SECRET_KEY_FILE')))
  );
  $options['credentials'] = [
    'key' => $key,
    'secret' => $secret
  ];
}

$blobScheme = getenv('BLOB_SCHEME') ?: 'http';
$blobHost = getenv('BLOB_HOST');
if ($blobHost) {
  $options['endpoint'] = $blobScheme.'://'.$blobHost;
  $options['use_path_style_endpoint'] = true;
}

$s3 = new S3Client($options);

return $s3;
