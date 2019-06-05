<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;
use Respect\Validation\Exceptions\NestedValidationException;

class Readline extends \Nymph\Entity {
  const ETYPE = 'readline';
  const NOTIFICATIONS_ALL = 0;
  const NOTIFICATIONS_MENTIONS = 1;
  const NOTIFICATIONS_DIRECT = 2;
  const NOTIFICATIONS_NONE = 4;
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = [];
  protected $protectedData = ['readline', 'conversation'];
  protected $whitelistData = [];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->readline = null;
    $this->conversation = null;
    $this->notifications = self::NOTIFICATIONS_ALL;
    $this->acUser = Tilmeld::FULL_ACCESS;
    $this->acGroup = Tilmeld::NO_ACCESS;
    $this->acOther = Tilmeld::NO_ACCESS;
    parent::__construct($id);
  }

  public function save() {
    if (!isset($this->notifications)) {
      $this->notifications = self::NOTIFICATIONS_ALL;
    }

    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    try {
      v::notEmpty()
        ->attribute('readline', v::floatType())
        ->attribute('conversation', v::instance('Tunnelgram\Conversation'))
        ->attribute(
          'notifications',
          v::intType()->in(
            [
              self::NOTIFICATIONS_ALL,
              self::NOTIFICATIONS_MENTIONS,
              self::NOTIFICATIONS_DIRECT,
              self::NOTIFICATIONS_NONE
            ]
          )
        )
        ->setName('readline')
        ->assert($this->getValidatable());
    } catch (NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
