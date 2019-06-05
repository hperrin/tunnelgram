<?php namespace Tunnelgram;

use Tilmeld\Tilmeld;
use Nymph\Nymph;
use Respect\Validation\Validator as v;
use Respect\Validation\Exceptions\NestedValidationException;

class Settings extends \Nymph\Entity {
  const ETYPE = 'settings';
  protected $clientEnabledMethods = [];
  public static $clientEnabledStaticMethods = [];
  protected $protectedData = [];
  protected $whitelistData = ['key', 'nicknames'];
  protected $protectedTags = [];
  protected $whitelistTags = [];

  public function __construct($id = 0) {
    $this->nicknames = [];
    $this->acUser = Tilmeld::FULL_ACCESS;
    $this->acGroup = Tilmeld::NO_ACCESS;
    $this->acOther = Tilmeld::NO_ACCESS;
    parent::__construct($id);
  }

  public function save() {
    if (!Tilmeld::gatekeeper()) {
      // Only allow logged in users to save.
      return false;
    }

    $selector = ['&',
      'ref' => [
        ['user', Tilmeld::$currentUser]
      ]
    ];
    if (isset($this->guid)) {
      $selector['!guid'] = $this->guid;
    }
    $existing = Nymph::getEntities(
      [
        'class' => 'Tunnelgram\Settings'
      ],
      $selector
    );

    if ($existing) {
      // User can only have one settings entity.
      return false;
    }

    try {
      v::notEmpty()
        ->attribute(
          'key',
          v::stringType()->notEmpty()->prnt()->length(1, 1024)
        )
        ->attribute(
          'nicknames',
          v::arrayVal()->length(null, 1024)->each(
            v::stringType()->notEmpty()->prnt()->length(
              1,
              ceil(256 * 4 / 3) // Base64 of 256B
            ),
            v::intVal()
          )
        )
        ->setName('settings')
        ->assert($this->getValidatable());
    } catch (NestedValidationException $exception) {
      throw new \Exception($exception->getFullMessage());
    }
    return parent::save();
  }
}
