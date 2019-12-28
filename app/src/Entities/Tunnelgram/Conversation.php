<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Tilmeld\Entities\User;
use Tilmeld\Entities\Group;
use Nymph\Nymph;
use Respect\Validation\Validator as v;
use Respect\Validation\Exceptions\NestedValidationException;
use Ramsey\Uuid\Uuid;

class Conversation extends \Nymph\Entity {
  use SendPushNotificationsTrait;
  const ETYPE = 'conversation';
  const MODE_CHAT = 0;
  const MODE_CHANNEL_PRIVATE = 1;
  const MODE_CHANNEL_PUBLIC = 2;
  protected $clientEnabledMethods = [
    'saveReadline',
    'findMatchingConversations',
    'getGroupUsers',
    'addChannelUser',
    'removeChannelUser',
    'clearReadline',
    'saveNotificationSetting',
    'join',
    'leave'
  ];
  protected $whitelistData = [
    'name',
    'keys',
    'acFull',
    'mode',
    'openJoining'
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

  /**
   * Store the readline for this session once it's read from the DB.
   * @var /Tunnelgram/Readline|null
   * @access private
   */
  private $curReadline;

  public function __construct($id = 0) {
    $this->name = null;
    $this->mode = self::MODE_CHAT;
    $this->acFull = [];
    $this->acGroup = Tilmeld::WRITE_ACCESS;
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

    $conversations = Nymph::getEntities(
      [
        'class' => 'Tunnelgram\Conversation'
      ],
      ['&',
        'ref' => $acFullRefs
      ]
    );

    $count = count($acFulls);

    $conversations = array_values(
      array_filter(
        $conversations,
        function ($conversation) use ($count) {
          return count($conversation->acFull) === $count;
        }
      )
    );

    return $conversations;
  }

  public function getGroupUsers($limit, $offset) {
    if (isset($this->guid) && $this->mode !== self::MODE_CHAT) {
      return $this->group->getUsers(false, $limit, $offset);
    }
    return null;
  }

  public function addChannelUser($user, $key = null) {
    $this->refresh();
    $user->refresh();

    if (!Tilmeld::$currentUser->inArray($this->acFull)) {
      throw new \Exception('You\'re not an admin of this channel.');
    }
    if ($this->mode === self::MODE_CHAT) {
      throw new \Exception('Chats don\'t support channel members.');
    }
    if ($user->inArray($this->acFull)) {
      throw new \Exception('That user is a channel admin.');
    }
    if ($this->mode === self::MODE_CHANNEL_PRIVATE
      && (!is_string($key) || empty($key))
    ) {
      throw new \Exception('Private channels require a key for each member.');
    }

    $user->addGroup($this->group);
    if (!$user->saveSkipAC()) {
      throw new \Exception('Couldn\'t add user to channel group.');
    }

    if ($this->mode === self::MODE_CHANNEL_PRIVATE) {
      $this->keys[$user->guid] = $key;
      if (!$this->save()) {
        throw new \Exception('Couldn\'t add user key.');
      }
    }

    // Send an informational message that the user has been added.
    $addedMessage = new Message();
    $addedMessage->conversation = $this;
    $addedMessage->informational = true;
    $addedMessage->text = 'added';
    $addedMessage->relatedUser = $user;
    $addedMessage->saveSkipAC();
  }

  public function removeChannelUser($user) {
    $this->refresh();
    $user->refresh();

    if (!Tilmeld::$currentUser->inArray($this->acFull)) {
      throw new \Exception('You\'re not an admin of this channel.');
    }
    if ($this->mode === self::MODE_CHAT) {
      throw new \Exception('Chats don\'t support channel members.');
    }
    if ($user->inArray($this->acFull)) {
      throw new \Exception('That user is a channel admin.');
    }

    $user->delGroup($this->group);
    if (!$user->saveSkipAC()) {
      throw new \Exception('Couldn\'t remove user from channel group.');
    }

    if ($this->mode === self::MODE_CHANNEL_PRIVATE) {
      if (key_exists($user->guid, $this->keys)) {
        unset($this->keys[$user->guid]);
        if (!$this->save()) {
          throw new \Exception('Couldn\'t remove user key.');
        }
      }
    }

    // Send an informational message that the user has been added.
    $addedMessage = new Message();
    $addedMessage->conversation = $this;
    $addedMessage->informational = true;
    $addedMessage->text = 'removed';
    $addedMessage->relatedUser = $user;
    $addedMessage->saveSkipAC();
  }

  public function join() {
    if ($this->mode === self::MODE_CHANNEL_PUBLIC && $this->openJoining) {
      $user = User::factory(Tilmeld::$currentUser->guid);

      $user->addGroup($this->group);
      if ($user->save()) {
        // Send an informational message that the user has joined.
        $leftMessage = new Message();
        $leftMessage->conversation = $this;
        $leftMessage->informational = true;
        $leftMessage->text = 'joined';
        $leftMessage->saveSkipAC();
      }
    }
  }

  public function leave() {
    if ($this->mode !== self::MODE_CHAT
      && !Tilmeld::$currentUser->inArray($this->acFull)
    ) {
      $this->handleDelete();
    } else {
      $this->delete();
    }
  }

  public function handleDelete() {
    $this->refresh();

    $acFullIndex = Tilmeld::$currentUser->arraySearch($this->acFull);

    if ($this->mode === self::MODE_CHAT) {
      // Is the user in the conversation?
      if ($acFullIndex === false) {
        throw new \Exception(
          'You can only remove yourself from chats you are in.'
        );
      }

      // Delete all the user's messages.
      do {
        $messages = Nymph::getEntities(
          [
            'class' => 'Tunnelgram\Message',
            'limit' => 60
          ],
          ['&',
            'ref' => [
              ['conversation', $this],
              ['user', Tilmeld::$currentUser]
            ],
            '!strict' => ['informational', true]
          ]
        );
        foreach ($messages as $message) {
          $message->delete();
        }
      } while (count($messages));
    }

    // Delete the user's readlines.
    $readlines = Nymph::getEntities(
      [
        'class' => 'Tunnelgram\Readline'
      ],
      ['&',
        'ref' => [
          ['conversation', $this],
          ['user', Tilmeld::$currentUser]
        ]
      ]
    );
    foreach ($readlines as $readline) {
      $readline->delete();
    }

    if ($acFullIndex !== false && count($this->acFull) === 1) {
      // If the user is the only user/admin, delete it.

      // Delete all the messages associated with it.
      do {
        $messages = Nymph::getEntities(
          [
            'class' => 'Tunnelgram\Message',
            'limit' => 60,
            'skip_ac' => true
          ],
          ['&',
            'ref' => ['conversation', $this]
          ]
        );
        foreach ($messages as $message) {
          // Make sure we have permission to delete.
          $message->user = Tilmeld::$currentUser;
          $message->acUser = Tilmeld::FULL_ACCESS;
          $message->delete();
        }
      } while (count($messages));

      // Delete all the readlines associated with it.
      do {
        $readlines = Nymph::getEntities(
          [
            'class' => 'Tunnelgram\Readline',
            'limit' => 60,
            'skip_ac' => true
          ],
          ['&',
            'ref' => [
              ['conversation', $this],
              ['user', Tilmeld::$currentUser]
            ]
          ]
        );
        foreach ($readlines as $readline) {
          // Make sure we have permission to delete.
          $readline->user = Tilmeld::$currentUser;
          $readline->acUser = Tilmeld::FULL_ACCESS;
          $readline->delete();
        }
      } while (count($readlines));

      if ($this->mode !== self::MODE_CHAT) {
        // Remove all the users from the group.
        do {
          $users = Nymph::getEntities(
            [
              'class' => '\Tilmeld\Entities\User',
              'limit' => 60,
              'skip_ac' => true
            ],
            ['&',
              'ref' => [
                ['groups', $this->group]
              ]
            ]
          );
          foreach ($users as $user) {
            // Make sure we have permission to delete.
            $user->delGroup($this->group);
            $user->saveSkipAC();
          }
        } while (count($users));

        // Check to make sure there are no users with this group anymore. If
        // there are, something went wrong and we don't want to delete it.
        $user = Nymph::getEntity(
          [
            'class' => '\Tilmeld\Entities\User'
          ],
          ['|',
            'ref' => [
              ['group', $this->group],
              ['groups', $this->group]
            ]
          ]
        );

        if (!$user) {
          // Bypass Tilmeld's hooks to delete the group.
          Nymph::$driver->_hookObject()->deleteEntityById(
            $this->group->guid,
            '\Tilmeld\Entities\Group'
          );
        }
      }

      return true;
    }

    // Send an informational message that the user has left.
    $leftMessage = new Message();
    $leftMessage->conversation = $this;
    $leftMessage->informational = true;
    $leftMessage->text = 'left';
    $leftMessage->saveSkipAC();

    // Remove the user's access if they started the conversation.
    if (Tilmeld::$currentUser->is($this->user)) {
      $this->acUser = Tilmeld::NO_ACCESS;
    }
    if (Tilmeld::$currentUser->group->is($this->group)) {
      $this->acGroup = Tilmeld::NO_ACCESS;
    }

    // Remove the user from the conversation.
    if ($acFullIndex !== false) {
      unset($this->acFull[$acFullIndex]);
      $this->acFull = array_values($this->acFull);

      $this->saveSkipAC();
    }
    if ($this->mode !== self::MODE_CHAT) {
      $user = User::factory(Tilmeld::$currentUser->guid);

      $user->delGroup($this->group);
      $user->save();
    }

    return false;
  }

  public function jsonSerialize($clientClassName = true) {
    if (!isset($this->mode)) {
      $this->mode = self::MODE_CHAT;
    }

    $object = parent::jsonSerialize($clientClassName);

    if ($this->curReadline) {
      $readline = $this->curReadline;
    } else {
      $readline = Nymph::getEntity(
        [
          'class' => 'Tunnelgram\Readline'
        ],
        ['&',
          'ref' => [
            ['user', Tilmeld::$currentUser],
            ['conversation', $this]
          ]
        ]
      );
    }

    if ($readline) {
      $object->readline = (float) $readline->readline;
      $object->notifications = (
        $readline->notifications ?? Readline::NOTIFICATIONS_ALL
      );
      $this->curReadline = $readline;
    } else {
      $object->readline = null;
      $object->notifications = Readline::NOTIFICATIONS_ALL;
    }

    if (Tilmeld::$currentUser !== null && isset($this->keys)) {
      $ownGuid = Tilmeld::$currentUser->guid;
      $newKeys = [];
      if (array_key_exists($ownGuid, $object->data['keys'])) {
        $newKeys[$ownGuid] = $object->data['keys'][$ownGuid];
      }
      $object->data['keys'] = $newKeys;
    }

    if (isset($object->data['lastMessage'])
      && Nymph::getEntity(
        [
          'class' => 'Tunnelgram\Message'
        ],
        ['&',
          'guid' => $this->lastMessage->guid
        ]
      ) === null
    ) {
      // If a user is added to a chat, they may not be able to see the last
      // message.
      unset($object->data['lastMessage']);
    }

    return $object;
  }

  public function jsonAcceptData($data) {
    $this->jsonAcceptSomething(
      function () use ($data) {
        parent::jsonAcceptData($data);
      }
    );
  }

  public function jsonAcceptPatch($patch) {
    $this->jsonAcceptSomething(
      function () use ($patch) {
        parent::jsonAcceptPatch($patch);
      }
    );
  }

  private function jsonAcceptSomething($callback) {
    if ($this->mode === self::MODE_CHANNEL_PRIVATE) {
      // Save the current keys, cause they have all channel members.
      $oldKeys = $this->keys;
    }

    $callback();

    if ($this->mode === self::MODE_CHANNEL_PRIVATE
      && in_array('keys', $this->whitelistData)
    ) {
      // When an admin updates the group, they will send only admin keys. We
      // need to update those and add back all the member keys.
      foreach ($this->keys as $guid => $value) {
        $oldKeys[$guid] = $value;
      }
      $this->keys = $oldKeys;
    }
  }

  public function putData($data, $sdata = []) {
    parent::putData($data, $sdata);
    if (!isset($this->mode)) {
      $this->mode = self::MODE_CHAT;
    }
  }

  public function clearReadline() {
    // This also clears notification settings.
    $readlines = Nymph::getEntities(
      [
        'class' => 'Tunnelgram\Readline'
      ],
      ['&',
        'ref' => [
          ['user', Tilmeld::$currentUser],
          ['conversation', $this]
        ]
      ]
    );

    foreach ($readlines as $readline) {
      $readline->delete();
    }
  }

  private function getReadline() {
    $readline = null;

    if ($this->curReadline) {
      $readline = $this->curReadline;
    } else {
      $readlines = Nymph::getEntities(
        [
          'class' => 'Tunnelgram\Readline'
        ],
        ['&',
          'ref' => [
            ['user', Tilmeld::$currentUser],
            ['conversation', $this]
          ]
        ]
      );

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
    }

    if (!$readline) {
      $readline = Readline::factory();
      $readline->conversation = $this;
    }

    $this->curReadline = $readline;

    return $readline;
  }

  public function saveReadline($newReadline) {
    if (!Tilmeld::checkPermissions($this, Tilmeld::WRITE_ACCESS)) {
      return false;
    }

    $readline = $this->getReadline();

    if (!isset($readline->readline) || $readline->readline < $newReadline) {
      $readline->readline = (float) $newReadline;
      $readline->save();
    }

    return $readline->readline;
  }

  public function saveNotificationSetting($setting) {
    if (!Tilmeld::checkPermissions($this, Tilmeld::WRITE_ACCESS)) {
      return false;
    }

    $readline = $this->getReadline();

    $readline->notifications = (int) $setting;
    $readline->save();

    return $readline->notifications;
  }

  public function updateDataProtection() {
    if (isset($this->guid)) {
      $this->whitelistData = array_diff($this->whitelistData, ['mode']);

      if (!Tilmeld::checkPermissions($this, Tilmeld::FULL_ACCESS)) {
        $this->whitelistData = array_diff(
          $this->whitelistData,
          ['keys', 'name']
        );
      }
    }
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    if (!isset($this->mode)) {
      $this->mode = self::MODE_CHAT;
    }

    $newConversation = false;
    if ($this->guid) {
      // Calculate removed or added users.
      $originalAcFull = $this->getOriginalAcValues()['acFull'];

      $newUsers = [];
      foreach ($this->acFull as $curUser) {
        if (!$curUser->inArray($originalAcFull)) {
          $newUsers[] = $curUser;
        }
      }

      $removedUsers = [];
      foreach ($originalAcFull as $curUser) {
        if (!$curUser->inArray($this->acFull)) {
          $removedUsers[] = $curUser;
        }
      }

      $removedCount = count($removedUsers);

      if ($removedCount
        && !Tilmeld::gatekeeper('system/admin')
        && (
          $removedCount > 1 ||
          !Tilmeld::$currentUser->is($removedUsers[0])
        )
      ) {
        throw new \Exception(
          'You can\'t remove others from a chat or channel admins.'
        );
      }

      foreach ($removedUsers as $curUser) {
        // Remove their key.
        if (isset($this->keys) && isset($this->keys[$curUser->guid])) {
          unset($this->keys[$curUser->guid]);
        }
      }

      foreach ($newUsers as $curUser) {
        // Send an informational message that the user has been added.
        $addedMessage = new Message();
        $addedMessage->conversation = $this;
        $addedMessage->informational = true;
        if ($this->mode === self::MODE_CHANNEL_PRIVATE) {
          $addedMessage->text = 'promoted';
        } else {
          $addedMessage->text = 'added';
        }
        $addedMessage->relatedUser = $curUser;
        $addedMessage->saveSkipAC();
      }
    } else {
      $newConversation = true;
      if (!Tilmeld::$currentUser->inArray($this->acFull)) {
        $this->acFull[] = Tilmeld::$currentUser;
      }
    }

    $recipientGuids = [];
    if (!$newConversation && $this->mode !== self::MODE_CHAT) {
      $users = $this->group->getUsers();
      foreach ($users as $user) {
        $recipientGuids[] = $user->guid;
      }
    } else {
      foreach ($this->acFull as $user) {
        $recipientGuids[] = $user->guid;
      }
    }

    // This is for old conversations that have a null lastMessage.
    if (!isset($this->lastMessage)) {
      unset($this->lastMessage);
    }

    if ($this->mode !== self::MODE_CHANNEL_PUBLIC) {
      unset($this->openJoining);
    }

    if ($this->mode === self::MODE_CHANNEL_PUBLIC) {
      unset($this->keys);
      $this->acOther = Tilmeld::READ_ACCESS;
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
            isset($this->name) ||
            $this->mode === self::MODE_CHANNEL_PRIVATE
          ) && $this->mode !== self::MODE_CHANNEL_PUBLIC
        )
        ->attribute(
          'name',
          v::when(
            v::nullType(),
            v::alwaysValid(),
            v::stringType()->notEmpty()->prnt()->length(
              1,
              ceil(128 * 1.4) // Base64 of 128B
            )
          )
        )
        ->attribute('lastMessage', v::instance('Tunnelgram\Message'), false)
        ->attribute(
          'openJoining',
          v::boolType(),
          $this->mode === self::MODE_CHANNEL_PUBLIC
        )
        ->setName('conversation')
        ->assert($this->getValidatable());
    } catch (NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }

    if ($newConversation && $this->mode !== self::MODE_CHAT) {
      // Create a group for this channel's users.
      $userGroup = Group::factory();
      $userGroup->groupname = 'channel-users-'.Uuid::uuid4()->toString();
      $userGroup->name = $userGroup->groupname;
      $userGroup->parent = Nymph::getEntity(
        ['class' => '\Tilmeld\Entities\Group'],
        ['&',
          'strict' => ['groupname', 'channel-users']
        ]
      );
      if (!isset($userGroup->parent) || !isset($userGroup->group->guid)) {
        unset($userGroup->parent);
      }
      if (!$userGroup->saveSkipAC()) {
        throw new \Exception('Error creating user group for the channel.');
      }
      $this->group = $userGroup;
      foreach ($this->acFull as $user) {
        $user->refresh();
        $user->addGroup($userGroup);
        if (!$user->saveSkipAC()) {
          throw new \Exception('Error adding user to the channel group.');
        }
      }
    }

    $ret = parent::save();

    if ($ret && $newConversation && count($recipientGuids) > 1) {
      $showNameProp = count($this->acFull) > 2 ? 'nameFirst' : 'name';
      $names = [];
      foreach ($this->acFull as $curUser) {
        $names[$curUser->guid] = $curUser->$showNameProp;
      }
      // Send push notifications to the recipients after script execution.
      $this->sendPushNotifications(
        array_diff($recipientGuids, [Tilmeld::$currentUser->guid]),
        [
          'conversationGuid' => $this->guid,
          'conversationNamed' => isset($this->name),
          'senderName' => Tilmeld::$currentUser->name,
          'names' => $names,
          'type' => 'newConversation',
          'mode' => $this->mode
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
