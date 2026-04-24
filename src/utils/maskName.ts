// src/utils/maskName.ts
// Counterparty privacy helper. Never exposes full name to the other party.
// Produces: "Yazid***"  (firstName + three asterisks)
//
// Rules:
// 1. If a `firstName` is present, use it.
// 2. If only `fullName` exists (legacy records), derive firstName = first whitespace-separated token.
// 3. Fallback to a localized anonymous label.
//
// Trust boundary: this is a DISPLAY helper. The real enforcement must also
// live in the GraphQL resolver for any query that returns a counterparty —
// see backend/privacy.md for the resolver-level masking contract.

export interface PersonLike {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string | null; // some legacy resolvers return `name`
}

export interface MaskOptions {
  /** Show the full real name. Use ONLY for admin views or the logged-in user themselves. */
  reveal?: boolean;
  /** Locale for the anonymous fallback label. */
  isAr?: boolean;
}

const ANON_LABEL = {
  ar: 'مستخدم مجهول',
  en: 'Anonymous user',
};

/**
 * Extract the first name token from any PersonLike shape.
 * Tolerant of legacy records that only have `fullName` or `name`.
 */
export function deriveFirstName(p?: PersonLike | null): string {
  if (!p) return '';
  if (p.firstName && p.firstName.trim()) return p.firstName.trim();
  const legacy = (p.fullName ?? p.name ?? '').trim();
  if (!legacy) return '';
  const [first] = legacy.split(/\s+/);
  return first ?? '';
}

/**
 * Return the display string for a counterparty.
 * Default: "FirstName***". With `reveal: true`, returns the best full name.
 */
export function maskName(p?: PersonLike | null, opts: MaskOptions = {}): string {
  const { reveal = false, isAr = false } = opts;
  const first = deriveFirstName(p);

  if (!first) {
    return isAr ? ANON_LABEL.ar : ANON_LABEL.en;
  }

  if (reveal) {
    const last = p?.lastName?.trim();
    if (last) return `${first} ${last}`;
    const legacy = (p?.fullName ?? p?.name ?? '').trim();
    return legacy || first;
  }

  return `${first}***`;
}

/**
 * Convenience: explicitly for counterparty displays (offers, meetings, deals, notifications).
 * Always masked. Alias kept for readability at call sites.
 */
export const maskCounterparty = (p?: PersonLike | null, isAr = false): string =>
  maskName(p, { reveal: false, isAr });
