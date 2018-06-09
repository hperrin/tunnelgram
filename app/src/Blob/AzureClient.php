<?php

use MicrosoftAzure\Storage\Blob\BlobRestProxy;

$connectionString = getenv('BLOB_CONNECTION_STRING');

$blobClient = BlobRestProxy::createBlobService($connectionString);

return $blobClient;
