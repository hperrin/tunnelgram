import PNotify from 'pnotify/dist/es/PNotify';

export default function ErrHandler (errObj) {
  PNotify.error({
    title: 'Error',
    text: errObj.textStatus+(errObj.message ? '\n\n'+errObj.message : '')
  });
}
