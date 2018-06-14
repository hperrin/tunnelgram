export default function getCookieValue(a) {
  const b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
  const v = b ? b.pop() : '';
  console.log({v});
  return v;
}
