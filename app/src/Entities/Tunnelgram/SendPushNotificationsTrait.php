<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Nymph\Nymph;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

trait SendPushNotificationsTrait {
  public function sendPushNotifications($recipientGuids) {
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
      if ($guid === Tilmeld::$currentUser->guid) {
        continue;
      }
      $webPushSubscriptions = Nymph::getEntities([
        'class' => 'Tunnelgram\WebPushSubscription',
        'skip_ac' => true
      ], ['&',
        'ref' => ['user', $guid]
      ]);
      foreach ($webPushSubscriptions as $webPushSubscription) {
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
}
