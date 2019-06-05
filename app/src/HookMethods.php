<?php

use Ramsey\Uuid\Uuid;
use SciActive\Hook;

// Hook Nymph and Tilmeld methods.
(function () {
  // Handle entity deletes.
  $DeleteHook = function (&$array) {
    $entity = $array[0];
    if (is_int($entity)) {
      $entity = \Nymph\Nymph::getEntity(
        ['class' => $array[1] ?? '\Nymph\Entity'],
        ['&', 'guid' => $array[0]]
      );
    }
    if (!is_object($entity)) {
      $array = false;
      return;
    }
    // Run delete handler.
    if (is_callable([$entity, 'handleDelete'])) {
      if (!$entity->handleDelete()) {
        $array = false;
      }
    }
  };

  // Run after Tilmeld's permission check.
  Hook::addCallback('Nymph->deleteEntity', -80, $DeleteHook);
  Hook::addCallback('Nymph->deleteEntityByID', -80, $DeleteHook);

  // Handle password updates.
  $PasswordUpdateHookBefore = (
    function (&$array, $name, &$object, &$function, &$data) {
      if (array_key_exists('tunnelwireReset', $array[0])) {
        $data['tunnelwireReset'] = true;
        unset($array[0]['tunnelwireReset']);
        return;
      }
      $data['tunnelwireReset'] = false;

      if (!array_key_exists('encryptedPrivateKeyString', $array[0])) {
        $array = false;
        return;
      }

      $currentPrivateKey = \Tunnelwire\PrivateKey::current();
      if (!$currentPrivateKey) {
        $array = false;
        return;
      }

      $data['password'] = $array[0]['password'];
      $data['oldPassword'] = $array[0]['oldPassword'];
      $data['currentPrivateKey'] = $currentPrivateKey;
      $data['encryptedPrivateKeyString']
        = $array[0]['encryptedPrivateKeyString'];
      unset($array[0]['encryptedPrivateKeyString']);
    }
  );
  $PasswordUpdateHookAfter = (
    function (&$return, $name, &$object, &$function, &$data) {
      if (!$return[0]['result'] || $data['tunnelwireReset']) {
        return;
      }

      $data['currentPrivateKey']->text = $data['encryptedPrivateKeyString'];
      if (!$data['currentPrivateKey']->save()) {
        // Updating the private key didn't work, so reset the user's password.
        \Tilmeld\Tilmeld::$currentUser->changePassword(
          [
            'tunnelwireReset' => true,
            'password' => $data['oldPassword'],
            'oldPassword' => $data['password']
          ]
        );
        $return[0]['result'] = false;
        $return[0]['message'] = 'Couldn\'t update private key encryption.';
      }
    }
  );

  Hook::addCallback(
    'Tilmeld\Entities\User->changePassword',
    -50,
    $PasswordUpdateHookBefore
  );
  Hook::addCallback(
    'Tilmeld\Entities\User->changePassword',
    50,
    $PasswordUpdateHookAfter
  );

  // Upload new avatars.
  $AvatarUpdateHookBefore = (
    function (&$array, $name, &$object, &$function, &$data) {
      if (isset($object->avatar) && substr($object->avatar, 0, 5) === 'data:') {
        try {
          // First resize the avatar to 250x250.
          $handle = fopen($object->avatar, 'rb');
          $image = new Imagick();
          if (!$image->readImageFile($handle)) {
            throw new Exception();
          }
          if (!$image->cropThumbnailImage(250, 250)) {
            throw new Exception();
          }
          if (!$image->setImageFormat('jpeg')) {
            throw new Exception();
          }
          $newAvatar = $image->getImageBlob();
          if (empty($newAvatar)) {
            throw new Exception();
          }

          // Save any previous avatar for deletion.
          if (isset($object->guid)) {
            $user = \Tilmeld\Entities\User::factory($object->guid);
            if (isset($user->avatarId)) {
              $data['oldAvatarId'] = $user->avatarId;
            }
          }

          // Upload avatar to blob store.
          $object->avatarId = Uuid::uuid4()->toString();
          include_once(__DIR__.'/Blob/BlobClient.php');
          $client = new \Tunnelgram\BlobClient();
          $object->avatar = $client->upload(
            'tunnelgram-avatars',
            $object->avatarId,
            $newAvatar
          );
        } catch (\Exception $e) {
          $array = false;
        }
      }
    }
  );
  $AvatarUpdateHookAfter = (
    function (&$return, $name, &$object, &$function, &$data) {
      if (isset($data['oldAvatarId'])) {
        // Delete images from blob store.
        include_once(__DIR__.'/Blob/BlobClient.php');
        $client = new \Tunnelgram\BlobClient();
        $client->delete('tunnelgram-avatars', $data['oldAvatarId']);
      }
    }
  );

  Hook::addCallback(
    'Tilmeld\Entities\User->save',
    -50,
    $AvatarUpdateHookBefore
  );
  Hook::addCallback('Tilmeld\Entities\User->save', 50, $AvatarUpdateHookAfter);
})();
