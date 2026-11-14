export function generatePin(): string {
  // Use cryptographically secure pseudo-random numbers when crypto is available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const pin = array[0] % 10000;
    return pin.toString().padStart(4, '0');
  }
  // Fallback
  const pin = Math.floor(Math.random() * 10000);
  return pin.toString().padStart(4, '0');
}
