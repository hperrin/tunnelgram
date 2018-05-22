<?php namespace ESText;

use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class Message extends \Nymph\Entity {
  const ETYPE = 'message';
  protected $clientEnabledMethods = [];
  protected $whitelistData = ['text', 'conversation', 'acRead'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->text = [];
    $this->conversation = null;
    parent::__construct($id);
  }

  public function delete() {
    if ($this->is($this->conversation->lastMessage)) {
      $ret = parent::delete();
      if ($ret) {
        $this->conversation->lastMessage = null;
        $this->conversation->save();
      }
      return $ret;
    } else {
      return parent::delete();
    }
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

    try {
      $recipientGuids = [];
      foreach ($this->acRead as $user) {
        $recipientGuids[] = $user->guid;
      }

      v::notEmpty()
        ->attribute(
            'text',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 4096),
                v::intVal()->in($recipientGuids)
            )
        )
        ->attribute('conversation', v::instance('ESText\Conversation'))
        ->setName('message')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    $ret = parent::save();

    $this->conversation->refresh();
    $this->conversation->lastMessage = $this;
    $this->conversation->save();

    return $ret;
  }
}
