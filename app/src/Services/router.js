import Navigo from 'navigo';

export const router = new Navigo(null, true, '#');
export const navigate = (...args) => {
  router.navigate(...args);
};
