export default function ErrHandler (errObj) {
  alert('Error: '+errObj.textStatus+(errObj.message ? '\n\n'+errObj.message : ''));
}
