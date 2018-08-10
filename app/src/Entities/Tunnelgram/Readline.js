import {Nymph, Entity} from 'nymph-client';

export class Readline extends Entity {}

// === Static Properties ===

// The name of the server class
Readline.class = 'Tunnelgram\\Readline';

Nymph.setEntityClass(Readline.class, Readline);

export default Readline;
