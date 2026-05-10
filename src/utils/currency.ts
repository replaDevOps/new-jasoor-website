/**
 * Currency label helper — returns the correct text for the user's language.
 * English UI: "SAR"
 * Arabic UI:  "ريال"
 */
export function getCurrencyLabel(language: string): string {
  return language === 'ar' ? 'ريال' : 'SAR';
}

/**
 * Format a numeric value with the correct currency label for the given language.
 * Produces e.g. "1,500,000 SAR" or "1,500,000 ريال"
 */
export function formatPrice(value: number | string | null | undefined, language: string): string {
  const n = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : (value ?? 0);
  return `${n.toLocaleString('en-US')} ${getCurrencyLabel(language)}`;
}
