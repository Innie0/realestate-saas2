/**
 * US phone formatting for inputs and display: 5599360604 → (559) 936-0604.
 * Anything that isn't a US number (e.g. starts with + and another country code,
 * or too many digits) is left as typed.
 */

function usDigits(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('+') && !trimmed.startsWith('+1')) return null;
  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length > 10) return null;
  return digits;
}

/** Format while typing — builds up "(559", "(559) 936", "(559) 936-0604". */
export function formatPhoneInput(value: string): string {
  const digits = usDigits(value);
  if (digits === null) return value;
  if (digits.length === 0) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Format a saved number for showing; returns it unchanged unless it's a full US number. */
export function formatPhoneDisplay(value: string): string {
  const digits = usDigits(value);
  return digits && digits.length === 10 ? formatPhoneInput(digits) : value;
}
