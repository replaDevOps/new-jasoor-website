/**
 * Official Saudi Riyal currency symbol — Unicode U+20C1 (added in Unicode 16.0, 2024).
 * Use this constant everywhere instead of "SAR", "ر.س", or "$".
 */
export const SAR_SYMBOL = '⃁';

/**
 * Format a numeric value with the Saudi Riyal symbol.
 * Produces e.g. "1,500,000 ⃁"
 */
export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : (value ?? 0);
  return `${n.toLocaleString('en-US')} ${SAR_SYMBOL}`;
}
