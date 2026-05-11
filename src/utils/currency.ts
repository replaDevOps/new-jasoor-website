/**
 * Currency label helper — returns the correct text for the user's language.
 * English UI: "SAR"
 * Arabic UI:  "ريال"
 */
export function getCurrencyLabel(language: string): string {
  return language === 'ar' ? 'ريال' : 'SAR';
}

/**
 * Format a numeric value with the correct currency label and order for the given language.
 * Arabic: "ريال 50,000"  (label before number — standard Arabic monetary convention)
 * English: "50,000 SAR" (label after number)
 * Numbers always rendered in English digits (en-US locale).
 */
export function formatPrice(value: number | string | null | undefined, language: string): string {
  const n = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : (value ?? 0);
  const formatted = (n as number).toLocaleString('en-US');
  return language === 'ar' ? `ريال ${formatted}` : `${formatted} SAR`;
}
