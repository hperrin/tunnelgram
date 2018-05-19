<?php namespace ESText;

use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  const ETYPE = 'conversation';
  protected $clientEnabledMethods = [];
  protected $whitelistData = ['acFull'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->name = null;
    parent::__construct($id);
  }

  public function archive() {
    if ($this->hasTag('archived')) {
      return true;
    }
    $this->addTag('archived');
    return $this->save();
  }

  public function save() {
    if (!\Tilmeld\Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    try {
      v::notEmpty()
        ->attribute('name', v::when(v::nullType(), v::alwaysValid(), v::stringType()->notEmpty()->prnt()->length(1, 2048)))
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
