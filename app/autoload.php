<?php

require __DIR__.'/vendor/autoload.php';

(function () {
  $classMap = [];
  $files = array_merge(
    glob(__DIR__.'/src/Entities/*.php'),
    glob(__DIR__.'/src/Entities/**/*.php')
  );
  foreach ($files as $file) {
    $classMap[
      str_replace(
        DIRECTORY_SEPARATOR,
        '\\',
        substr(
          $file,
          strlen(__DIR__.'/src/Entities/'),
          -1 * strlen('.php')
        )
      )
    ] = $file;
  }
  spl_autoload_register(
    function ($className) use ($classMap) {
      if (isset($classMap[$className])) {
        include $classMap[$className];
      }
    },
    true,
    true
  );
})();
