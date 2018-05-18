<?php
namespace MyApp;

use Respect\Validation\Validator as v;

/**
 * @property string $name The todo's text.
 * @property bool $done Whether it's done.
 */
class Todo extends \Nymph\Entity {
  const ETYPE = 'todo';
  protected $clientEnabledMethods = ['archive', 'share', 'unshare'];
  protected $whitelistData = ['name', 'done'];
  protected $protectedTags = ['archived'];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->done = false;
    parent::__construct($id);
  }

  public function archive() {
    if ($this->hasTag('archived')) {
      return true;
    }
    $this->addTag('archived');
    return $this->save();
  }

  public function share($username) {
    $user = \Tilmeld\Entities\User::factory($username);
    if (!$user->guid) {
      return false;
    }
    if (!$user->inArray($this->acWrite)) {
      $this->acWrite[] = $user;
    }
    return $this->save();
  }

  public function unshare($guid) {
    $user = \Tilmeld\Entities\User::factory($guid);
    if (!$user->guid) {
      return false;
    }
    while (($index = $user->arraySearch($this->acWrite)) !== false) {
      array_splice($this->acWrite, $index, 1);
    }
    return $this->save();
  }

  public function save() {
    if (!\Tilmeld\Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    try {
      v::notEmpty()
        ->attribute('name', v::stringType()->notEmpty()->prnt()->length(1, 2048))
        ->attribute('done', v::boolType())
        ->setName('todo')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
