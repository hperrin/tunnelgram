import Container from './Container';
import * as stores from './stores';
import { Nymph } from 'nymph-client';
import { User, Group } from 'tilmeld-client';
import { SleepyCacheService } from './Services/SleepyCacheService';

import 'pform/css/pform.css';
import 'pform/css/pform-bootstrap.css';

const sleepyUserCacheService = new SleepyCacheService(User);
const sleepyGroupCacheService = new SleepyCacheService(Group);

export function refreshAll() {
  sleepyUserCacheService.clear();
  sleepyGroupCacheService.clear();
}

const app = new Container({
  target: document.querySelector('main'),
  props: {
    brand: 'App Template',
  },
});

// useful for debugging!
window.app = app;
window.stores = stores;
window.Nymph = Nymph;
window.refreshAll = refreshAll;
