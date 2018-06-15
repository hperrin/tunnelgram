<?php namespace Tunnelgram;

use Nymph\Nymph;
use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class WebPushSubscription extends \Nymph\Entity {
  const ETYPE = 'web_push_subscription';
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = ['getVapidPublicKey'];
  protected $whitelistData = ['endpoint', 'keys'];
  protected $protectedData = ['uaString'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->endpoint = '';
    $this->keys = [];
    $this->acUser = Tilmeld::FULL_ACCESS;
    $this->acGroup = Tilmeld::NO_ACCESS;
    $this->acOther = Tilmeld::NO_ACCESS;
    parent::__construct($id);
  }

  public static function getVapidPublicKey() {
    if (!Tilmeld::gatekeeper()) {
      return false;
    }
    return getenv('WEB_PUSH_VAPID_PUBLIC_KEY');
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    if (!isset($this->guid)) {
      // Look for an entity with the same endpoint.
      $currentEntity = Nymph::getEntity([
        'class' => 'Tunnelgram\WebPushSubscription'
      ], ['&',
        'ref' => ['user', Tilmeld::$currentUser],
        'strict' => ['endpoint', $this->endpoint]
      ]);
      if ($currentEntity) {
        // Update the existing subscription...
        $keys = $this->keys;
        $this->guid = $currentEntity->guid;
        $this->tags = $currentEntity->tags;
        $this->cdate = $currentEntity->cdate;
        $this->mdate = $currentEntity->mdate;
        $this->putData($currentEntity->getData(), $currentEntity->getSData());
        // with the new keys.
        $this->keys = $keys;
      }

      // Save the UA string.
      $this->uaString = $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    try {
      v::notEmpty()
        ->attribute('uaString', v::stringType()->notEmpty()->length(0, 1024))
        ->attribute('endpoint', v::stringType()->notEmpty()->length(1, 1024))
        ->attribute(
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 1024),
                v::stringType()->in(['p256dh', 'auth'])
            )
        )
        ->setName('web push subscription')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }

    if (!isset($this->guid)) {
      // Allow no more than 15 subscriptions per user.
      $subscriptions = Nymph::getEntities([
        'class' => 'Tunnelgram\WebPushSubscription',
        'sort' => 'mdate',
        'return' => 'guid'
      ], ['&',
        'ref' => ['user', Tilmeld::$currentUser]
      ]);
      $count = count($subscriptions);
      // Delete all but 14. (This will be the 15th.)
      for ($i = 0; $i < $count - 14; $i++) {
        Nymph:deleteEntityByID(
            $subscriptions[$i],
            'Tunnelgram\WebPushSubscription'
        );
      }
    }

    return parent::save();
  }
}
