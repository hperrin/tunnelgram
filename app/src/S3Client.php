<?php

use Aws\S3\S3Client;

$options = [
  'version' => 'latest',
  'region' => 'us-east-1'
];

$blobAccessKeyFile = getenv('BLOB_ACCESS_KEY_FILE');
if ($blobAccessKeyFile) {
  $key = trim(file_get_contents(getenv('BLOB_ACCESS_KEY_FILE')));
  $secret = trim(file_get_contents(getenv('BLOB_SECRET_KEY_FILE')));
  $options['credentials'] = [
    'key' => $key,
    'secret' => $secret
  ];
}

$blobHost = getenv('BLOB_HOST');
if ($blobHost) {
  $options['endpoint'] = 'http://'.$blobHost;
  $options['use_path_style_endpoint'] = true;
}

$s3 = new S3Client($options);

return $s3;
