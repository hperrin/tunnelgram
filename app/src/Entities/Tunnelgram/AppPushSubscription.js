import { Nymph, Entity } from 'nymph-client';

export class AppPushSubscription extends Entity {
  constructor(id) {
    super(id);
    this.playerId = '';
  }
}

// The name of the server class
AppPushSubscription.class = 'Tunnelgram\\AppPushSubscription';

Nymph.setEntityClass(AppPushSubscription.class, AppPushSubscription);

export default AppPushSubscription;
