<?php

if (php_sapi_name() != "cli") {
  die("You can only run create-buckets.php from the command line.");
}

require '/app/config.php';

$s3 = include('/app/src/Blob/S3Client.php');

try {
  $s3->createBucket([
    'ACL' => 'public-read',
    'Bucket' => 'tunnelgram-thumbnails'
  ]);
  $s3->putBucketPolicy([
    'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-thumbnails/*"]}]}',
    'Bucket' => 'tunnelgram-thumbnails'
  ]);
} catch (\Aws\S3\Exception\S3Exception $e) {
  if ($e->getStatusCode() === 409) {
    try {
      $s3->putBucketAcl([
        'ACL' => 'public-read',
        'Bucket' => 'tunnelgram-thumbnails'
      ]);
    } catch (\Aws\S3\Exception\S3Exception $e) {
      if ($e->getStatusCode() !== 501) {
        throw $e;
      }
    }
    $s3->putBucketPolicy([
      'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-thumbnails/*"]}]}',
      'Bucket' => 'tunnelgram-thumbnails'
    ]);
  } else {
    throw $e;
  }
}

try {
  $s3->createBucket([
    'ACL' => 'public-read',
    'Bucket' => 'tunnelgram-images'
  ]);
  $s3->putBucketPolicy([
    'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-images/*"]}]}',
    'Bucket' => 'tunnelgram-images'
  ]);
} catch (\Aws\S3\Exception\S3Exception $e) {
  if ($e->getStatusCode() === 409) {
    try {
      $s3->putBucketAcl([
        'ACL' => 'public-read',
        'Bucket' => 'tunnelgram-images'
      ]);
    } catch (\Aws\S3\Exception\S3Exception $e) {
      if ($e->getStatusCode() !== 501) {
        throw $e;
      }
    }
    $s3->putBucketPolicy([
      'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-images/*"]}]}',
      'Bucket' => 'tunnelgram-images'
    ]);
  } else {
    throw $e;
  }
}

try {
  $s3->createBucket([
    'ACL' => 'public-read',
    'Bucket' => 'tunnelgram-avatars'
  ]);
  $s3->putBucketPolicy([
    'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-avatars/*"]}]}',
    'Bucket' => 'tunnelgram-avatars'
  ]);
} catch (\Aws\S3\Exception\S3Exception $e) {
  if ($e->getStatusCode() === 409) {
    try {
      $s3->putBucketAcl([
        'ACL' => 'public-read',
        'Bucket' => 'tunnelgram-avatars'
      ]);
    } catch (\Aws\S3\Exception\S3Exception $e) {
      if ($e->getStatusCode() !== 501) {
        throw $e;
      }
    }
    $s3->putBucketPolicy([
      'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-avatars/*"]}]}',
      'Bucket' => 'tunnelgram-avatars'
    ]);
  } else {
    throw $e;
  }
}

try {
  $s3->createBucket([
    'ACL' => 'public-read',
    'Bucket' => 'tunnelgram-videos'
  ]);
  $s3->putBucketPolicy([
    'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-videos/*"]}]}',
    'Bucket' => 'tunnelgram-videos'
  ]);
} catch (\Aws\S3\Exception\S3Exception $e) {
  if ($e->getStatusCode() === 409) {
    try {
      $s3->putBucketAcl([
        'ACL' => 'public-read',
        'Bucket' => 'tunnelgram-videos'
      ]);
    } catch (\Aws\S3\Exception\S3Exception $e) {
      if ($e->getStatusCode() !== 501) {
        throw $e;
      }
    }
    $s3->putBucketPolicy([
      'Policy' => '{"Version":"2012-10-17","Statement":[{"Sid":"AddPerm","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::tunnelgram-videos/*"]}]}',
      'Bucket' => 'tunnelgram-videos'
    ]);
  } else {
    throw $e;
  }
}
