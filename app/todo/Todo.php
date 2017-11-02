<?php
// This file is a demo class that extends the Entity class.

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
}
