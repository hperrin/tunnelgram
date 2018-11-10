<?php

use Nymph\Nymph;
use Tilmeld\Tilmeld;

error_reporting(E_ALL);

/*
 * When a client gets a push from the server, it can call pull.php with its
 * endpoint in order to retrieve message data.
 */

require __DIR__.'/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  die('Only post allowed.');
}

$endpoint = $_POST['endpoint'] ?? '';

if (empty($endpoint)) {
  die('Empty endpoint given.');
}

try {
  // Get the subscription.
  $webPushSubscription = Nymph::getEntity([
    'class' => 'Tunnelgram\WebPushSubscription',
    'skip_ac' => true
  ], ['&',
    'strict' => ['endpoint', $endpoint]
  ]);
  if (!isset($webPushSubscription)
      || !isset($webPushSubscription->guid)
      || !isset($webPushSubscription->user)
      || !isset($webPushSubscription->user->guid)
      || !$webPushSubscription->user->enabled
    ) {
    die('No valid endpoint given.');
  }

  // Fill the user session. (Don't log them in, because we don't want to deliver
  // an auth token.)
  Tilmeld::fillSession($webPushSubscription->user);

  // Update its user agent and last modified time.
  $webPushSubscription->uaString = $_SERVER['HTTP_USER_AGENT'] ?? '';
  $webPushSubscription->save();

  // Get all of the user's readlines.
  $readlines = Nymph::getEntities([
    'class' => 'Tunnelgram\Readline'
  ], ['&',
    'ref' => ['user', Tilmeld::$currentUser]
  ]);

  // foreach ($readlines as $readline) {
  //   $readline->delete();
  // }
  // die('remove all readlines success');

  // Get all the readlines for conversations with unread messages.
  $readlineConversationGuids = [];
  $unreadReadlines = array_values(array_filter(
      $readlines,
      function ($readline) use (&$readlineConversationGuids) {
        if (!isset($readline->conversation)
            || !isset($readline->conversation->lastMessage)
            || !isset($readline->conversation->lastMessage->guid)
          ) {
          return false;
        }
        $readlineConversationGuids[] = $readline->conversation->guid;

        return $readline->readline
          < $readline->conversation->lastMessage->cdate;
      }
  ));

  // Get all the conversations and their unread messages.
  $conversations = [];
  $data = array_map(function ($readline) use (&$conversations) {
    $conversations[] = $readline->conversation;
    return [
      'new' => false,
      'conversation' => $readline->conversation,
      'messages' => Nymph::getEntities([
        'class' => 'Tunnelgram\Message'
      ], ['&',
        'ref' => ['conversation', $readline->conversation],
        'gt' => ['cdate', $readline->readline],
        '!strict' => ['informational', true]
      ])
    ];
  }, $unreadReadlines);
  // Look for conversations that don't have a readline.
  $selector = ['&',
    'ref' => ['acFull', Tilmeld::$currentUser]
  ];
  if ($readlineConversationGuids) {
    $selector['!guid'] = $readlineConversationGuids;
  }
  $newConversations = Nymph::getEntities([
    'class' => 'Tunnelgram\Conversation'
  ], $selector);
  $newData = array_map(function ($conversation) use (&$conversations) {
    $conversations[] = $conversation;
    return [
      'new' => true,
      'conversation' => $conversation,
      'messages' => Nymph::getEntities([
        'class' => 'Tunnelgram\Message'
      ], ['&',
        'ref' => ['conversation', $conversation],
        '!strict' => ['informational', true]
      ])
    ];
  }, $newConversations);
  $data = array_merge($data, $newData);

  // This is for saving the users.
  $users = [];
  foreach ($conversations as $conversation) {
    foreach ($conversation->acFull as $user) {
      if (!isset($users[$user->guid])) {
        $users[$user->guid] = $user;
      }
    }
  }

  header('Content-Type: application/json');
  echo json_encode([
    'currentUserGuid' => Tilmeld::$currentUser->guid,
    'users' => $users,
    'data' => $data
  ]);
} catch (\Nymph\Exceptions\QueryFailedException $e) {
  echo $e->getMessage()."\n\n".$e->getQuery();
}
