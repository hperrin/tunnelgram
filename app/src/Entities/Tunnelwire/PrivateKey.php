<?php namespace Tunnelwire;

use Nymph\Nymph;
use Tilmeld\Tilmeld;
use Respect\Validation\Validator as v;

class PrivateKey extends \Nymph\Entity {
  const ETYPE = 'private_key';
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = ['current'];
  protected $whitelistData = ['text'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->text = '';
    $this->acUser = \Tilmeld\Tilmeld::FULL_ACCESS;
    $this->acGroup = \Tilmeld\Tilmeld::NO_ACCESS;
    $this->acOther = \Tilmeld\Tilmeld::NO_ACCESS;
    parent::__construct($id);
  }

  public static function current() {
    if (!Tilmeld::gatekeeper()) {
      return false;
    }
    $key = Nymph::getEntity(['class' => 'Tunnelwire\PrivateKey'], ['&',
      'ref' => ['user', Tilmeld::$currentUser]
    ]);
    if (!isset($key) || !$key->guid) {
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
