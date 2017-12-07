<?php
namespace MyApp;

/**
 * @property string $name The todo's text.
 * @property bool $done Whether it's done.
 */
class Todo extends \Nymph\Entity {
  const ETYPE = 'todo';
  protected $clientEnabledMethods = ['archive'];
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

  public function save() {
    if (!\Tilmeld\Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    return parent::save();
  }
}
