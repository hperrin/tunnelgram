<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Nymph\Nymph;
use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  use SendPushNotificationsTrait;
  const ETYPE = 'conversation';
  protected $clientEnabledMethods = ['saveReadline', 'findMatchingConversations'];
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

  public function findMatchingConversations() {
    $acFullRefs = [];
    $acFulls = $this->acFull;
    if (!Tilmeld::$currentUser->inArray($acFulls)) {
      $acFulls[] = Tilmeld::$currentUser;
    }

    foreach ($acFulls as $curUser) {
      $acFullRefs[] = ['acFull', $curUser];
    }

    $conversations = Nymph::getEntities([
      'class' => 'Tunnelgram\Conversation'
    ], ['&',
      'ref' => $acFullRefs
    ]);

    $count = count($acFulls);

    $conversations = array_values(array_filter(
        $conversations,
        function($conversation) use ($count) {
          return count($conversation->acFull) === $count;
        }
    ));

    return $conversations;
  }

  public function handleDelete() {
    // Delete all the user's messages.
    $this->refresh();
    $messages = Nymph::getEntities([
      'class' => 'Tunnelgram\Message',
      'return' => 'guid'
    ], ['&',
      'ref' => [
        ['conversation', $this],
        ['user', Tilmeld::$currentUser]
      ]
    ]);
    foreach ($messages as $guid) {
      Nymph::deleteEntityById($guid, 'Tunnelgram\Message');
    }
    // Delete any readlines.
    $readlines = Nymph::getEntities([
      'class' => 'Tunnelgram\Readline',
      'return' => 'guid'
    ], ['&',
      'ref' => [
        ['conversation', $this],
        ['user', Tilmeld::$currentUser]
      ]
    ]);
    foreach ($readlines as $guid) {
      Nymph::deleteEntityById($guid, 'Tunnelgram\Readline');
    }

    if (count($this->acFull) === 1) {
      // If the user is the only user, delete it.
      return true;
    }

    // Remove the user from the conversation.
    $index = Tilmeld::$currentUser->arraySearch($this->acFull);
    if ($index === false) {
      return false;
    }
    unset($this->acFull[$index]);
    $this->acFull = array_values($this->acFull);

    if (Tilmeld::$currentUser->is($this->user)) {
      $this->user = $this->acFull[0];
      $this->group = $this->acFull[0]->group;
    }

    $this->saveSkipAC();
    return false;
  }

  public function jsonSerialize($clientClassName = true) {
    $object = parent::jsonSerialize($clientClassName);

    $readline = Nymph::getEntity([
      'class' => 'Tunnelgram\Readline'
    ], ['&',
      'ref' => [
        ['user', Tilmeld::$currentUser],
        ['conversation', $this]
      ]
    ]);

    if ($readline) {
      $object->readline = (float) $readline->readline;
    } else {
      $object->readline = null;
    }
    return $object;
  }

  public function saveReadline($newReadline) {
    if (!Tilmeld::$currentUser->inArray($this->acFull)) {
      // For the admin user.
      return false;
    }

    $readline = Nymph::getEntity([
      'class' => 'Tunnelgram\Readline'
    ], ['&',
      'ref' => [
        ['user', Tilmeld::$currentUser],
        ['conversation', $this]
      ]
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
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    $newConversation = false;
    if (!$this->guid) {
      $newConversation = true;
      if (!Tilmeld::$currentUser->inArray($this->acFull)) {
        $this->acFull[] = Tilmeld::$currentUser;
      }
    }

    $recipientGuids = [];
    foreach ($this->acFull as $user) {
      $recipientGuids[] = $user->guid;
    }

    try {
      v::notEmpty()
        ->attribute(
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 1024),
                v::intVal()->in($recipientGuids)
            ),
            false
        )
        ->attribute('name', v::when(
            v::nullType(),
            v::alwaysValid(),
            v::stringType()->notEmpty()->prnt()->length(
                1,
                ceil(256 * 4 / 3) // Base64 of 256B
            )
        ))
        ->attribute('lastMessage', v::when(v::nullType(), v::alwaysValid(), v::instance('Tunnelgram\Message')))
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    $ret = parent::save();

    if ($ret && $newConversation) {
      // Send push notifications to the recipients after script execution.
      register_shutdown_function(
          [$this, 'sendPushNotifications'],
          $recipientGuids
      );
    }

    return $ret;
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
