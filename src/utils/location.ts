import { SAUDI_REGIONS } from '../data/saudiRegions';

/**
 * Resolve a city/district slug to a display name.
 * Searches SAUDI_REGIONS for a matching region or city entry.
 * Fallback: formats the slug (replaces underscores, title-cases) so users
 * never see a raw slug like "riyadh_city" even if it's missing from the data.
 */
export function resolveLocation(
  slug: string | null | undefined,
  lang: 'ar' | 'en'
): string {
  if (!slug) return '';

  for (const region of SAUDI_REGIONS) {
    if (region.slug === slug) return lang === 'ar' ? region.ar : region.en;
    const city = (region.cities as Array<{ slug: string; en: string; ar: string }> | undefined)?.find(
      (c) => c.slug === slug
    );
    if (city) return lang === 'ar' ? city.ar : city.en;
  }

  // Clean fallback: "riyadh_city" → "Riyadh City"
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve a business location preferring district over city (more specific).
 * Returns the best available display name in the given language.
 */
export function resolveBusinessLocation(
  district: string | null | undefined,
  city: string | null | undefined,
  lang: 'ar' | 'en'
): string {
  return (
    resolveLocation(district, lang) ||
    resolveLocation(city, lang) ||
    ''
  );
}
