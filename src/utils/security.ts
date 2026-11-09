export function generatePin(): string {
  // Generate a random number from 0 to 9999
  const pin = Math.floor(Math.random() * 10000);
  // Pad with leading zeros to ensure it's exactly 4 digits
  return pin.toString().padStart(4, '0');
}
