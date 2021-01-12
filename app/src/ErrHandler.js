import { error } from '@pnotify/core';

export default function ErrHandler(errObj) {
  if (errObj.status === 0 && !navigator.onLine) {
    //  Don't show errors for failed fetches because of being offline.
    return;
  }
  error({
    title: 'Error',
    text: errObj.textStatus + (errObj.message ? '\n\n' + errObj.message : ''),
  });
}
