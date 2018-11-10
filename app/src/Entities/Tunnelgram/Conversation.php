<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Nymph\Nymph;
use Respect\Validation\Validator as v;

class Conversation extends \Nymph\Entity {
  use SendPushNotificationsTrait;
  const ETYPE = 'conversation';
  const MODE_CONVERSATION = 0;
  const MODE_CHANNEL_PRIVATE = 1;
  const MODE_CHANNEL_PUBLIC = 2;
  protected $clientEnabledMethods = ['saveReadline', 'findMatchingConversations', 'clearReadline'];
  protected $whitelistData = [
    'name',
    'keys',
    'acFull'
  ];
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
    $this->mode = Conversation::MODE_CONVERSATION;
    $this->lastMessage = null;
    $this->acFull = [];
    parent::__construct($id);
    if (!isset($this->guid)) {
      $this->whitelistData[] = 'mode';
    }
  }

  public function findMatchingConversations() {
    if (!Tilmeld::$currentUser) {
      return [];
    }
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

      // Delete all the informational messages associated with it.
      $infoMessages = Nymph::getEntities([
        'class' => 'Tunnelgram\Message',
        'return' => 'guid'
      ], ['&',
        'ref' => ['conversation', $this],
        'strict' => ['informational', true]
      ]);
      foreach ($infoMessages as $guid) {
        // Gotta bypass Tilmeld's hooks to delete informational messages.
        Nymph::$driver->_hookObject()->deleteEntityById($guid, 'Tunnelgram\Message');
      }

      return true;
    }

    // Send an informational message that the user has left.
    $leftMessage = new Message();
    $leftMessage->conversation = $this;
    $leftMessage->informational = true;
    $leftMessage->text = 'left';
    $leftMessage->saveSkipAC();

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
    if (!isset($this->mode)) {
      $this->mode = Conversation::MODE_CONVERSATION;
    }

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

    if (Tilmeld::$currentUser !== null && $this->keys) {
      $ownGuid = Tilmeld::$currentUser->guid;
      $newKeys = [];
      if (array_key_exists($ownGuid, $object->data['keys'])) {
        $newKeys[$ownGuid] = $object->data['keys'][$ownGuid];
      }
      $object->data['keys'] = $newKeys;
    }

    return $object;
  }

  public function putData($data, $sdata = []) {
    parent::putData($data, $sdata);
    if (!isset($this->mode)) {
      $this->mode = Conversation::MODE_CONVERSATION;
    }
  }

  public function clearReadline() {
    $readlines = Nymph::getEntities([
      'class' => 'Tunnelgram\Readline'
    ], ['&',
      'ref' => [
        ['user', Tilmeld::$currentUser],
        ['conversation', $this]
      ]
    ]);

    foreach ($readlines as $readline) {
      $readline->delete();
    }
  }

  public function saveReadline($newReadline) {
    if (!Tilmeld::$currentUser->inArray($this->acFull)) {
      // For the admin user.
      return false;
    }

    $readlines = Nymph::getEntities([
      'class' => 'Tunnelgram\Readline'
    ], ['&',
      'ref' => [
        ['user', Tilmeld::$currentUser],
        ['conversation', $this]
      ]
    ]);

    $readline = null;
    $count = count($readlines);
    if ($count) {
      $readline = $readlines[0];
    }
    if ($count > 1) {
      // Only 1 readline per user per conversation.
      for ($i = 1; $i < $count; $i++) {
        $readlines[$i]->delete();
      }
    }

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

    if (!isset($this->mode)) {
      $this->mode = Conversation::MODE_CONVERSATION;
    }

    try {
      v::notEmpty()
        ->attribute('mode', v::intType()->between(0, 2))
        ->attribute(
            'keys',
            v::arrayVal()->each(
                v::stringType()->notEmpty()->prnt()->length(1, 1024),
                v::intVal()->in($recipientGuids)
            ),
            (
              $this->name !== null &&
              $this->mode !== Conversation::MODE_CHANNEL_PUBLIC
            )
        )
        ->attribute('name', v::when(
            v::nullType(),
            v::alwaysValid(),
            v::stringType()->notEmpty()->prnt()->length(
                1,
                ceil(256 * 4 / 3) // Base64 of 256B
            )
        ))
        ->attribute('lastMessage', v::when(
            v::nullType(),
            v::alwaysValid(),
            v::instance('Tunnelgram\Message')
        ))
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    $ret = parent::save();

    if ($ret && $newConversation && count($recipientGuids) > 1) {
      $showNameProp = count($this->acFull) > 2 ? 'nameFirst' : 'name';
      $names = [];
      foreach ($this->acFull as $curUser) {
        $names[$curUser->guid] = $curUser->$showNameProp;
      }
      // Send push notifications to the recipients after script execution.
      register_shutdown_function(
          [$this, 'sendPushNotifications'],
          array_diff($recipientGuids, [Tilmeld::$currentUser->guid]),
          [
            'conversationGuid' => $this->guid,
            'conversationNamed' => isset($this->name),
            'senderName' => Tilmeld::$currentUser->name,
            'names' => $names,
            'type' => 'newConversation'
          ]
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
