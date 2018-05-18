<?php namespace ESText;

use Nymph\Nymph;
use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class PrivateKey extends \Nymph\Entity {
  const ETYPE = 'private_key';
  protected $clientEnabledMethods = [];
  protected $clientEnabledStaticMethods = ['getCurrent'];
  protected $whitelistData = ['text'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->text = '';
    parent::__construct($id);
  }

  public static function getCurrent() {
    if (!Tilmeld::gatekeeper()) {
      return false;
    }
    $key = Nymph::getEntity(['class' => 'ESText\PrivateKey'], ['&',
      'ref' => ['user', Tilmeld::$currentUser]
    ]);
    if (!$key->guid) {
      return false;
    }
    return $key;
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }
    try {
      v::notEmpty()
        ->attribute('text', v::stringType()->notEmpty()->length(1, 2048))
        ->setName('private key')
        ->assert($this->getValidatable());
    } catch (\Respect\Validation\Exceptions\NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
