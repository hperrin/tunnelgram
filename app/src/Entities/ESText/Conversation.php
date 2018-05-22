<?php namespace ESText;

use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  const ETYPE = 'conversation';
  protected $clientEnabledMethods = ['saveReadline'];
  protected $whitelistData = ['name', 'acFull'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->name = null;
    $this->lastMessage = null;
    $this->acFull = [];
    parent::__construct($id);
  }

  public function jsonSerialize($clientClassName = true) {
    $object = parent::jsonSerialize($clientClassName);

    $readline = \Nymph\Nymph::getEntity([
      'class' => 'ESText\Readline'
    ], ['&',
      'ref' => ['conversation', $this]
    ]);

    if ($readline) {
      $object->readline = (float) $readline->readline;
    } else {
      $object->readline = 0;
    }
    return $object;
  }

  public function saveReadline($newReadline) {
    $readline = \Nymph\Nymph::getEntity([
      'class' => 'ESText\Readline'
    ], ['&',
      'ref' => ['conversation', $this]
    ]);

    if ($readline) {
      if ($readline->readline < $newReadline) {
        $readline->readline = (float) $newReadline;
        $readline->save();
      }
    } else {
      $readline = Readline::factory();
      $readline->conversation = $this;
      $readline->readline = (float) $newReadline;
      $readline->save();
    }

    return $readline->readline;
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
