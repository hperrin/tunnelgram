import Navigo from 'navigo';

export const router = new Navigo(
  window.inCordova
    ? location.href
    : (
      window.location.hostname === 'tunnelgram.com'
        ? 'https://tunnelgram.com/'
        : 'http://' + window.location.hostname + ':8080/'
    ),
  window.inCordova // Use hash when in Cordova.
);
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
          router.navigate(location.substring(1));
          break;
        }
      }
      el = el.parentNode;
    }
  }
});
