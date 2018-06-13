<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class Readline extends \Nymph\Entity {
  const ETYPE = 'readline';
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = [];
  protected $whitelistData = [];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->readline = null;
    $this->conversation = null;
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
    try {
      v::notEmpty()
        ->attribute('readline', v::floatType())
        ->attribute('conversation', v::instance('Tunnelgram\Conversation'))
        ->setName('readline')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
