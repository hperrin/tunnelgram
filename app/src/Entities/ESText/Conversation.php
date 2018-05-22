<?php namespace ESText;

use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  const ETYPE = 'conversation';
  protected $clientEnabledMethods = [];
  protected $whitelistData = ['name', 'acFull'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->name = null;
    $this->lastMessage = null;
    $this->acFull = [];
    parent::__construct($id);
  }

  public function save() {
    if (!\Tilmeld\Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    try {
      v::notEmpty()
        ->attribute('name', v::when(v::nullType(), v::alwaysValid(), v::stringType()->notEmpty()->prnt()->length(1, 2048)))
        ->attribute('lastMessage', v::when(v::nullType(), v::alwaysValid(), v::instance('ESText\Message')))
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
