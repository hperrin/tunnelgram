<?php

use SciActive\Hook;

// Hook Nymph methods.
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
    if (is_callable($entity, 'handleDelete')) {
      if (!$entity->handleDelete()) {
        $array = false;
      }
    }
  };

  // Run after Tilmeld's permission check.
  Hook::addCallback('Nymph->deleteEntity', -80, $DeleteHook);
  Hook::addCallback('Nymph->deleteEntityByID', -80, $DeleteHook);
})();
