<?php namespace Tunnelgram;

use MicrosoftAzure\Storage\Common\ServiceException;

class BlobClient {
  public function __construct() {
    $this->api = getenv('BLOB_API');
    if ($this->api === 's3') {
      $this->client = include(__DIR__.'/S3Client.php');
    } elseif ($this->api === 'azure') {
      $this->client = include(__DIR__.'/AzureClient.php');
    }
  }

  public function upload($bucket, $id, $file) {
    if ($this->api === 's3') {
      return $this->uploadS3($bucket, $id, $file);
    } elseif ($this->api === 'azure') {
      return $this->uploadAzure($bucket, $id, $file);
    }
  }

  private function uploadAzure($bucket, $id, $file) {
    $put = $this->client->createBlockBlob($bucket, $id, $file);
    return getenv('BLOB_URI').$bucket.'/'.$id;
  }

  private function uploadS3($bucket, $id, $file) {
    $put = $this->client->putObject([
      'ACL' => 'public-read',
      'Bucket' => $bucket,
      'Key' => $id,
      'Body' => $file
    ]);
    return $put['ObjectURL'];
  }
}
