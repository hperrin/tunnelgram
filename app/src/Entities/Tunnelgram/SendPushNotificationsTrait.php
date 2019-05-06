<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Nymph\Nymph;
use GuzzleHttp\Client as GuzzleClient;
use Http\Adapter\Guzzle6\Client as GuzzleAdapter;
use Http\Client\Common\HttpMethodsClient as HttpClient;
use Http\Message\MessageFactory\GuzzleMessageFactory;
use OneSignal\Config;
use OneSignal\OneSignal;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

trait SendPushNotificationsTrait {
  public function sendPushNotifications($recipientGuids, $options) {
    $pid = \pcntl_fork();
    if ($pid == -1) {
      php_error('Couldn\'t fork process for push notifications.');
      $this->sendAppPushNotifications($recipientGuids, $options);
      $this->sendWebPushNotifications($recipientGuids, $options);
    } else if ($pid) {
      // We are the parent.
      return;
    } else {
      // We are the child.

      // First, reconnect to the DB, since the connection doesn't survive the
      // process fork.
      Nymph::disconnect();
      Nymph::connect();

      // Send the push notifications.
      $this->sendAppPushNotifications($recipientGuids, $options);
      $this->sendWebPushNotifications($recipientGuids, $options);
      exit;
    }
  }

  public function sendAppPushNotifications($recipientGuids, $options) {
    $config = new Config();
    $config->setApplicationId(getenv('ONESIGNAL_APP_ID'));
    $config->setApplicationAuthKey(getenv('ONESIGNAL_REST_API_KEY')
      ?: trim(file_get_contents(getenv('ONESIGNAL_REST_API_KEY_FILE'))));
    // $config->setUserAuthKey('your_auth_key');

    $guzzle = new GuzzleClient([
      'timeout' => 5.0
    ]);

    $client = new HttpClient(
        new GuzzleAdapter($guzzle),
        new GuzzleMessageFactory()
    );
    $api = new OneSignal($config, $client);

    foreach ($recipientGuids as $guid) {
      if (!$this->checkNotificationsSettingForPush($guid, $options['conversationGuid'])) {
        // They're not having fun at this party.
        continue;
      }

      $pushSubscriptions = Nymph::getEntities([
        'class' => 'Tunnelgram\AppPushSubscription',
        'skip_ac' => true
      ], ['&',
        'ref' => ['user', $guid]
      ]);
      if ($pushSubscriptions) {
        // Construct the notification title for this user.
        $title = $options['conversationNamed'] ? (
            $options['type'] === 'newConversation'
              ? 'New conversation with '
              : 'Conversation with '
          ) : '';
        $title .= implode(
            ', ',
            array_filter($options['names'], function ($k) use ($guid) {
              return $k !== $guid;
            }, ARRAY_FILTER_USE_KEY)
        );

        // Construct the notification message.
        if ($options['type'] === 'newConversation') {
          $message = $options['senderName'].' started a conversation.';
        } elseif ($options['type'] === 'info') {
          $message = $options['senderName'].' updated the conversation.';
        } else {
          $message = $options['messageType'].' from '.$options['senderName'].'.';
        }

        // Send the notification to each subscription.
        foreach ($pushSubscriptions as $appPushSubscription) {
          $api->notifications->add([
            'headings' => [
              'en' => $title
            ],
            'contents' => [
              'en' => $message
            ],
            'data' => ['conversationGuid' => $options['conversationGuid']],
            'include_player_ids' => [$appPushSubscription->playerId],
            'android_visibility' => 0,
            'ios_badgeType' => 'Increase',
            'ios_badgeCount' => 1,
            // Not supported by OneSignal PHP client yet.
            // 'thread_id' => "tunnelgram_{$options['conversationGuid']}",
            'priority' => 10,
            'android_group' => "tunnelgram_{$options['conversationGuid']}",
            'adm_group' => "tunnelgram_{$options['conversationGuid']}"
          ]);
        }
      }
    }
  }

  public function sendWebPushNotifications($recipientGuids, $options) {
    $auth = [
      'VAPID' => [
        'subject' => Tilmeld::$config['app_url'],
        'publicKey' => getenv('WEB_PUSH_VAPID_PUBLIC_KEY'),
        'privateKey' => getenv('WEB_PUSH_VAPID_PRIVATE_KEY')
      ]
    ];
    $webPush = new WebPush($auth);
    // $webPush->setAutomaticPadding(false);
    foreach ($recipientGuids as $guid) {
      if (!$this->checkNotificationsSettingForPush($guid, $options['conversationGuid'])) {
        // They're not having fun at this party.
        continue;
      }

      $pushSubscriptions = Nymph::getEntities([
        'class' => 'Tunnelgram\WebPushSubscription',
        'skip_ac' => true
      ], ['&',
        'ref' => ['user', $guid]
      ]);
      foreach ($pushSubscriptions as $webPushSubscription) {
        $subscription = Subscription::create([
          'endpoint' => $webPushSubscription->endpoint,
          'keys' => [
            'p256dh' => $webPushSubscription->keys['p256dh'],
            'auth' => $webPushSubscription->keys['auth']
          ],
          'contentEncoding' => 'aesgcm'
        ]);

        $webPush->sendNotification($subscription);
      }
    }
    $webPush->flush();
  }

  private function checkNotificationsSettingForPush($userGuid, $conversationGuid) {
    // Check that they haven't turned notifications off.
    $readline = Nymph::getEntity([
      'class' => 'Tunnelgram\Readline',
      'skip_ac' => true
    ], ['&',
      'ref' => [
        ['user', $userGuid],
        ['conversation', $conversationGuid]
      ],
      'strict' => ['notifications', Readline::NOTIFICATIONS_NONE]
    ]);

    return !$readline;
  }
}
