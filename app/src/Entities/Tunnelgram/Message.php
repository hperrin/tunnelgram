<?php namespace Tunnelgram;

use Nymph\Nymph;
use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;
use Ramsey\Uuid\Uuid;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class Message extends \Nymph\Entity {
  const ETYPE = 'message';
  protected $clientEnabledMethods = [];
  protected $whitelistData = [
    'text',
    'images',
    'keys',
    'conversation',
    'acRead'
  ];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->text = null;
    $this->images = [];
    $this->keys = [];
    $this->conversation = null;
    parent::__construct($id);
  }

  public function handleDelete() {
    if ($this->is($this->conversation->lastMessage)) {
      $this->conversation->lastMessage = Nymph::getEntity([
        'class' => 'Tunnelgram\Message',
        'reverse' => true,
        'offset' => 1
      ], ['&',
        'ref' => ['conversation', $this->conversation]
      ]);
      $this->conversation->save();
    }
    return true;
  }

  public function jsonSerialize($clientClassName = true) {
    $object = parent::jsonSerialize($clientClassName);

    if (Tilmeld::$currentUser !== null) {
      $ownGuid = Tilmeld::$currentUser->guid;
      $newKeys = [];
      if (array_key_exists($ownGuid, $object->data['keys'])) {
        $newKeys[$ownGuid] = $object->data['keys'][$ownGuid];
      }
      $object->data['keys'] = $newKeys;
    }

    return $object;
  }

  public function sendPushNotifications($recipientGuids) {
    $auth = [
      'VAPID' => [
        'subject' => Tilmeld::$config['app_url'],
        'publicKey' => getenv('WEB_PUSH_VAPID_PUBLIC_KEY'),
        'privateKey' => getenv('WEB_PUSH_VAPID_PRIVATE_KEY')
      ]
    ];
    $webPush = new WebPush($auth);
    $webPush->setAutomaticPadding(false);
    foreach ($recipientGuids as $guid) {
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

        $webPush->sendNotification(
            $subscription,
            'New message from '.Tilmeld::$currentUser->name.'.'
        );
      }
    }
    $webPush->flush();
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    if (!$this->conversation->guid) {
      return false;
    }

    if (!Tilmeld::checkPermissions($this->conversation, Tilmeld::FULL_ACCESS)) {
      return false;
    }

    if (!isset($this->guid)) {
      foreach ($this->images as &$curImg) {
        $curImg['id'] = Uuid::uuid4()->toString();
      }
      unset($curImg);
    }

    $recipientGuids = [];
    foreach ($this->acRead as $user) {
      $recipientGuids[] = $user->guid;
    }

    try {
      // Validate.
      v::notEmpty()
        ->attribute(
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 2048),
                v::intVal()->in($recipientGuids)
            )
        )
        ->when(
            v::attribute('text', v::nullType()),
            v::attribute('images', v::notEmpty()),
            v::attribute(
                'text',
                v::stringType()->notEmpty()->prnt()->length(
                    1,
                    ceil(4096 * 4 / 3) // Base64 of 4KiB
                )
            )
        )
        ->attribute(
            'images',
            v::arrayVal()->length(null, 9)->each(
                v::arrayVal()->length(10, 10)->keySet(
                    v::key(
                        'id',
                        v::regex('/'.Uuid::VALID_PATTERN.'/')
                    ),
                    v::key(
                        'name',
                        v::stringType()->notEmpty()->prnt()->length(
                            1,
                            ceil(2048 * 4 / 3) // Base64 of 2KiB
                        )
                    ),
                    v::key(
                        'thumbnail',
                        v::stringType()->notEmpty()->prnt()->length(
                            1,
                            ceil(102400 * 4 / 3) // Base64 of 100KiB
                        )
                    ),
                    v::key(
                        'thumbnailType',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    ),
                    v::key(
                        'thumbnailWidth',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    ),
                    v::key(
                        'thumbnailHeight',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    ),
                    v::key(
                        'data',
                        v::stringType()->notEmpty()->prnt()->length(
                            1,
                            ceil(2097152 * 4 / 3) // Base64 of 2MiB
                        )
                    ),
                    v::key(
                        'dataType',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    ),
                    v::key(
                        'dataWidth',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    ),
                    v::key(
                        'dataHeight',
                        v::stringType()->notEmpty()->prnt()->length(1, 50)
                    )
                )
            )
        )
        ->attribute('conversation', v::instance('Tunnelgram\Conversation'))
        ->setName('message')
        ->assert($this->getValidatable());

      // Upload images to blob store.
      if (!isset($this->guid) && count($this->images)) {
        include(__DIR__.'/../../Blob/BlobClient.php');
        $client = new BlobClient();
        foreach ($this->images as &$curImg) {
          $curImg['thumbnail'] = $client->upload(
              'tunnelgram-thumbnails',
              $curImg['id'],
              base64_decode($curImg['thumbnail'])
          );
          $curImg['data'] = $client->upload(
              'tunnelgram-images',
              $curImg['id'],
              base64_decode($curImg['data'])
          );
        }
        unset($curImg);
      }
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    $ret = parent::save();

    $this->conversation->refresh();
    $this->conversation->lastMessage = $this;
    $this->conversation->save();

    // Send push notifications to the recipients after script execution.
    // register_shutdown_function(
    //     [$this, 'sendPushNotifications'],
    //     $recipientGuids
    // );
    $this->sendPushNotifications($recipientGuids);

    return $ret;
  }
}
