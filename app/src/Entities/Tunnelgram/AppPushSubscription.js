import {Nymph, Entity} from 'nymph-client';

export class AppPushSubscription extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.playerId = '';
  }
}

// === Static Properties ===

// The name of the server class
AppPushSubscription.class = 'Tunnelgram\\AppPushSubscription';

Nymph.setEntityClass(AppPushSubscription.class, AppPushSubscription);

export default AppPushSubscription;
