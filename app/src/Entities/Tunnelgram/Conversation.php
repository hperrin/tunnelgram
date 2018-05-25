<?php namespace Tunnelgram;

use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  const ETYPE = 'conversation';
  protected $clientEnabledMethods = ['saveReadline'];
  protected $whitelistData = ['name', 'keys', 'acFull'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  /**
   * This is explicitly used only during the deletion proccess.
   *
   * @var bool
   * @access private
   */
  private $skipAcWhenSaving = false;

  public function __construct($id = 0) {
    $this->name = null;
    $this->lastMessage = null;
    $this->acFull = [];
    parent::__construct($id);
  }

  public function handleDelete() {
    // Delete all the user's messages.
    $this->refresh();
    $messages = \Nymph\Nymph::getEntities([
      'class' => 'Tunnelgram\Message',
      'return' => 'guid'
    ], ['&',
      'ref' => [
        ['conversation', $this],
        ['user', \Tilmeld\Tilmeld::$currentUser]
      ]
    ]);
    foreach ($messages as $guid) {
      \Nymph\Nymph::deleteEntityById($guid, 'Tunnelgram\Message');
    }
    // Delete any readlines.
    $readlines = \Nymph\Nymph::getEntities([
      'class' => 'Tunnelgram\Readline',
      'return' => 'guid'
    ], ['&',
      'ref' => [
        ['conversation', $this],
        ['user', \Tilmeld\Tilmeld::$currentUser]
      ]
    ]);
    foreach ($readlines as $guid) {
      \Nymph\Nymph::deleteEntityById($guid, 'Tunnelgram\Readline');
    }

    if (count($this->acFull) === 1) {
      // If the user is the only user, delete it.
      return true;
    }

    // Remove the user from the conversation.
    $index = \Tilmeld\Tilmeld::$currentUser->arraySearch($this->acFull);
    if ($index === false) {
      return false;
    }
    unset($this->acFull[$index]);
    $this->acFull = array_values($this->acFull);

    if (\Tilmeld\Tilmeld::$currentUser->is($this->user)) {
      $this->user = $this->acFull[0];
      $this->group = $this->acFull[0]->group;
    }

    $this->saveSkipAC();
    return false;
  }

  public function jsonSerialize($clientClassName = true) {
    $object = parent::jsonSerialize($clientClassName);

    $readline = \Nymph\Nymph::getEntity([
      'class' => 'Tunnelgram\Readline'
    ], ['&',
      'ref' => ['conversation', $this]
    ]);

    if ($readline) {
      $object->readline = (float) $readline->readline;
    } else {
      $object->readline = null;
    }
    return $object;
  }

  public function saveReadline($newReadline) {
    $readline = \Nymph\Nymph::getEntity([
      'class' => 'Tunnelgram\Readline'
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

    if (!$this->guid) {
      if (!\Tilmeld\Tilmeld::$currentUser->inArray($this->acFull)) {
        $this->acFull[] = \Tilmeld\Tilmeld::$currentUser;
      }
    }

    try {
      $recipientGuids = [];
      foreach ($this->acFull as $user) {
        $recipientGuids[] = $user->guid;
      }

      v::notEmpty()
        ->attribute(
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 1024),
                v::intVal()->in($recipientGuids)
            ),
            false
        )
        ->attribute('name', v::when(v::nullType(), v::alwaysValid(), v::stringType()->notEmpty()->prnt()->length(1, 2048)))
        ->attribute('lastMessage', v::when(v::nullType(), v::alwaysValid(), v::instance('Tunnelgram\Message')))
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }

  /*
   * This should *never* be accessible on the client.
   */
  public function saveSkipAC() {
    $this->skipAcWhenSaving = true;
    return $this->save();
  }

  public function tilmeldSaveSkipAC() {
    if ($this->skipAcWhenSaving) {
      $this->skipAcWhenSaving = false;
      return true;
    }
    return false;
  }
}
