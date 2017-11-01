<?php
$clientDir = file_exists('../../../../client/package.json')
    ? '../../../../client'
    : '../../../node_modules/nymph-client';

function is_secure() {
  // Always assume secure on production.
  if (getenv('NYMPH_PRODUCTION')) {
    return true;
  }
  if (isset($_SERVER['HTTPS'])) {
    return (strtolower($_SERVER['HTTPS']) == 'on' || $_SERVER['HTTPS'] == '1');
  }
  return (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == '443');
}
?><!DOCTYPE html>
<html>
<head>
  <title>Nymph Svelte Collab Todo App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="text/javascript">
    (function(){
      var s = document.createElement("script"); s.setAttribute("src", "https://www.promisejs.org/polyfills/promise-5.0.0.min.js");
      (typeof Promise !== "undefined" && typeof Promise.all === "function") || document.getElementsByTagName('head')[0].appendChild(s);
    })();
    NymphOptions = {
      restURL: '../../rest.php',
      pubsubURL: '<?php echo is_secure() ? 'wss' : 'ws'; ?>://<?php echo getenv('NYMPH_PRODUCTION') ? htmlspecialchars('nymph-pubsub-demo.herokuapp.com') : htmlspecialchars(explode(':', $_SERVER['HTTP_HOST'])[0]); ?>:<?php echo getenv('NYMPH_PRODUCTION') ? (is_secure() ? '443' : '80') : '8080'; ?>',
      rateLimit: 100
    };
  </script>
  <script src="<?php echo $clientDir; ?>/lib-umd/Nymph.js"></script>
  <script src="<?php echo $clientDir; ?>/lib-umd/Entity.js"></script>
  <script src="<?php echo $clientDir; ?>/lib-umd/PubSub.js"></script>
  <script src="../Todo.js"></script>

  <script src="//unpkg.com/prop-types@15.5.10/prop-types.js"></script>
  <script src="//unpkg.com/react@15.6.1/dist/react.js"></script>
  <script src="//unpkg.com/react-dom@15.6.1/dist/react-dom.js"></script>
  <script src="//unpkg.com/redux@3.7.1/dist/redux.js"></script>
  <script src="//unpkg.com/react-redux@5.0.5/dist/react-redux.js"></script>

  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
</head>
<body>
  <div class="container">
    <div class="page-header">
      <h2 style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap;">
        <span>
          Collaborative Todo List
        </span>
        <small>
          <span>React</span> |
          <a href="../angular1/" target="_self">Angular 1</a> |
          <a href="../svelte/" target="_self">Svelte</a>
        </small>
      </h2>
    </div>
    <p>
      Just FYI, this demo isn't done yet.
    </p>
    <div id="todoApp"></div>
  </div>
  <script src="build/TodoApp.js"></script>
</body>
</html>
