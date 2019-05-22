export function urlBase64ToUint8Array(base64String) {
  const base64 = urlBase64ToBase64(base64String);
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function urlBase64ToBase64(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  return (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
}
