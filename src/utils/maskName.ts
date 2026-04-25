/**
 * maskName.ts — counterparty display masking (frontend)
 *
 * IMPORTANT: This is a UX convenience, NOT a security boundary. The backend
 * MUST also mask counterparty identity in resolvers (see privacy.resolvers.ts).
 * If the server ships a clear-text name, this file hides it in the UI but it
 * is still visible in the Network tab. Do not rely on it alone.
 *
 * Product rule:
 *   Full name: "Yazid Alharbi"
 *   Masked:    "Yazid***"
 *
 * Inputs this accepts, in priority order:
 *   { firstName, lastName }           ← new model
 *   { fullName }                      ← legacy model (split on first space)
 *   string                            ← convenience
 */

export interface NamedPerson {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}

export interface MaskOptions {
  /** If the viewer IS this user, return the unmasked name. */
  viewerId?: string | null;
  /** If true, force unmask (admin views, server-confirmed same-user, etc.). */
  forceReveal?: boolean;
  /** Fallback string when there is nothing to render. */
  fallback?: string;
}

/** Pick a displayable first name from any supported shape. */
export function pickFirstName(person: NamedPerson | string | null | undefined): string {
  if (!person) return '';
  if (typeof person === 'string') {
    const first = person.trim().split(/\s+/)[0] ?? '';
    return first;
  }
  if (person.firstName && person.firstName.trim()) return person.firstName.trim();
  if (person.fullName && person.fullName.trim()) {
    return person.fullName.trim().split(/\s+/)[0] ?? '';
  }
  return '';
}

/** Pick a displayable last name from any supported shape. */
export function pickLastName(person: NamedPerson | string | null | undefined): string {
  if (!person) return '';
  if (typeof person === 'string') {
    const parts = person.trim().split(/\s+/);
    return parts.slice(1).join(' ');
  }
  if (person.lastName && person.lastName.trim()) return person.lastName.trim();
  if (person.fullName && person.fullName.trim()) {
    const parts = person.fullName.trim().split(/\s+/);
    return parts.slice(1).join(' ');
  }
  return '';
}

/** Return the full, unmasked display name. */
export function fullDisplayName(person: NamedPerson | string | null | undefined): string {
  const f = pickFirstName(person);
  const l = pickLastName(person);
  return [f, l].filter(Boolean).join(' ');
}

/**
 * Mask a counterparty for display.
 *
 *   maskName({ firstName: 'Yazid', lastName: 'Alharbi' })   → "Yazid***"
 *   maskName({ fullName: 'Yazid Alharbi' })                 → "Yazid***"
 *   maskName({ fullName: 'Yazid' })                         → "Yazid***"
 *   maskName(null, { fallback: 'User' })                    → "User"
 *
 *   // Self-view bypasses masking:
 *   maskName(me, { viewerId: me.id })                       → "Yazid Alharbi"
 */
export function maskName(
  person: NamedPerson | string | null | undefined,
  options: MaskOptions = {},
): string {
  const { viewerId, forceReveal, fallback = '—' } = options;

  if (!person) return fallback;

  // Self-view: the viewer is looking at their own record.
  if (typeof person !== 'string' && viewerId && person.id && person.id === viewerId) {
    const full = fullDisplayName(person);
    return full || fallback;
  }

  if (forceReveal) {
    const full = fullDisplayName(person);
    return full || fallback;
  }

  const first = pickFirstName(person);
  if (!first) return fallback;
  return `${first}***`;
}

/**
 * Convenience for components that render a counterparty with optional listing
 * context:
 *
 *   maskCounterparty(offer.fromUser, { viewerId: myId })
 *     → "Yazid***"
 */
export function maskCounterparty(
  person: NamedPerson | string | null | undefined,
  options: MaskOptions = {},
): string {
  return maskName(person, options);
}

/**
 * Compact initial for avatars / compact lists (no surname exposure):
 *   initial({ firstName: 'Yazid' })   → "Y"
 *   initial({ fullName: 'Yazid A.' }) → "Y"
 */
export function initial(person: NamedPerson | string | null | undefined): string {
  const first = pickFirstName(person);
  return first ? first.charAt(0).toUpperCase() : '?';
}
