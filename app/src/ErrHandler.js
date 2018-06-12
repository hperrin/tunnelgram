import PNotify from 'pnotify/dist/es/PNotify';

export default function ErrHandler (errObj) {
  if (errObj.status === 0 && !navigator.onLine) {
    //  Don't show errors for failed fetches because of being offline.
    return;
  }
  PNotify.error({
    title: 'Error',
    text: errObj.textStatus+(errObj.message ? '\n\n'+errObj.message : '')
  });
}
