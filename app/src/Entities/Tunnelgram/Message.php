<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class Message extends \Nymph\Entity {
  const ETYPE = 'message';
  protected $clientEnabledMethods = [];
  protected $whitelistData = ['text', 'keys', 'conversation', 'acRead'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->text = null;
    $this->keys = [];
    $this->conversation = null;
    parent::__construct($id);
  }

  public function handleDelete() {
    if ($this->is($this->conversation->lastMessage)) {
      $this->conversation->lastMessage = null;
      $this->conversation->save();
    }
    return true;
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
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 2048),
                v::intVal()->in($recipientGuids)
            )
        )
        ->attribute('text', v::stringType()->notEmpty()->prnt()->length(1, 4096))
        ->attribute('conversation', v::instance('Tunnelgram\Conversation'))
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
