import Navigo from 'navigo';

export const router = new Navigo('');
export const navigate = (...args) => {
  router.navigate(...args);
};

// Navigate links.
document.body.addEventListener('click', e => {
  if (!e.defaultPrevented) {
    let el = e.target;
    while (el) {
      if (el.tagName === 'A') {
        const location = el.getAttribute('href');
        const target = el.getAttribute('target') || '_self';
        if (target === '_self' && location.length && location[0] === '/') {
          e.preventDefault();
          router.navigate(location);
          break;
        }
      }
      el = el.parentNode;
    }
  }
});
