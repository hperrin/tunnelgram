<?php

use SciActive\Hook;

// Hook Nymph and Tilmeld methods.
(function() {
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
  $PasswordUpdateHookBefore = function (&$array, $name, &$object, &$function, &$data) {
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
    $data['encryptedPrivateKeyString'] = $array[0]['encryptedPrivateKeyString'];
    unset($array[0]['encryptedPrivateKeyString']);
  };
  $PasswordUpdateHookAfter = function (&$return, $name, &$object, &$function, &$data) {
    if (!$return[0]['result'] || $data['tunnelwireReset']) {
      return;
    }

    $data['currentPrivateKey']->text = $data['encryptedPrivateKeyString'];
    if (!$data['currentPrivateKey']->save()) {
      // Updating the private key didn't work, so reset the user's password.
      \Tilmeld\Tilmeld::$currentUser->changePassword([
        'tunnelwireReset' => true,
        'password' => $data['oldPassword'],
        'oldPassword' => $data['password']
      ]);
      $return[0]['result'] = false;
      $return[0]['message'] = 'Couldn\'t update private key encryption.';
    }
  };

  Hook::addCallback('Tilmeld\Entities\User->changePassword', -50, $PasswordUpdateHookBefore);
  Hook::addCallback('Tilmeld\Entities\User->changePassword', 50, $PasswordUpdateHookAfter);
})();
