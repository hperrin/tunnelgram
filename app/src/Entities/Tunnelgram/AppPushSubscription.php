<?php namespace Tunnelgram;

use Nymph\Nymph;
use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class AppPushSubscription extends \Nymph\Entity {
  const ETYPE = 'app_push_subscription';
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = [];
  protected $whitelistData = ['playerId'];
  protected $protectedData = ['uaString'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->playerId = '';
    $this->acUser = Tilmeld::FULL_ACCESS;
    $this->acGroup = Tilmeld::NO_ACCESS;
    $this->acOther = Tilmeld::NO_ACCESS;
    parent::__construct($id);
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    if (!isset($this->guid)) {
      // Look for an entity with the same playerId.
      $currentEntity = Nymph::getEntity([
        'class' => 'Tunnelgram\AppPushSubscription'
      ], ['&',
        'ref' => ['user', Tilmeld::$currentUser],
        'strict' => ['playerId', $this->playerId]
      ]);
      if ($currentEntity) {
        // Update the existing subscription.
        $this->guid = $currentEntity->guid;
        $this->tags = $currentEntity->tags;
        $this->cdate = $currentEntity->cdate;
        $this->mdate = $currentEntity->mdate;
        $this->putData($currentEntity->getData(), $currentEntity->getSData());
      }

      // Save the UA string.
      $this->uaString = $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    try {
      v::notEmpty()
        ->attribute('uaString', v::stringType()->notEmpty()->length(0, 1024))
        ->attribute('playerId', v::stringType()->notEmpty()->length(1, 1024))
        ->setName('app push subscription')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }

    if (!isset($this->guid)) {
      // Allow no more than 15 subscriptions per user.
      $subscriptions = Nymph::getEntities([
        'class' => 'Tunnelgram\AppPushSubscription',
        'sort' => 'mdate',
        'return' => 'guid'
      ], ['&',
        'ref' => ['user', Tilmeld::$currentUser]
      ]);
      $count = count($subscriptions);
      // Delete all but 14. (This will be the 15th.)
      if ($count > 14) {
        for ($i = 0; $i < $count - 14; $i++) {
          Nymph:deleteEntityByID(
              $subscriptions[$i],
              'Tunnelgram\AppPushSubscription'
          );
        }
      }
    }

    return parent::save();
  }
}
