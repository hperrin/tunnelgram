<?php

require __DIR__.'/vendor/autoload.php';

(function () {
  $classMap = [];
  foreach (array_merge(glob(__DIR__.'/entities/*.php'), glob(__DIR__.'/entities/**/*.php')) as $file) {
    $classMap[str_replace(DIRECTORY_SEPARATOR, '\\', substr($file, strlen(__DIR__.'/entities/'), -1*strlen('.php')))] = $file;
  }
  spl_autoload_register(function ($className) use ($classMap) {
    if (isset($classMap[$className])) {
      include $classMap[$className];
    }
  }, true, true);
})();
