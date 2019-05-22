import { Nymph, Entity } from 'nymph-client';

export class Readline extends Entity {}

// === Static Properties ===

// The name of the server class
Readline.class = 'Tunnelgram\\Readline';
// Cache expiry time. 3 hours.
Readline.CACHE_EXPIRY = 1000 * 60 * 60 * 3;

Nymph.setEntityClass(Readline.class, Readline);

export default Readline;
