/**
 * notificationRouter.ts — turn a notification into a concrete action.
 *
 * Jusoor's SPA router is custom (see App.tsx). Views it knows about:
 *   'home' | 'browse' | 'details' | 'signin' | 'signup' | 'forgot'
 *   | 'dashboard' | 'wizard' | 'articles' | 'article'
 *
 * Dashboard *tabs* (not views):
 *   'overview' | 'listings' | 'offers' | 'meetings' | 'deals' | 'alerts' | 'settings'
 *
 * We MUST NOT route to invented views like 'payment', 'dealDetails',
 * 'listingDetails' — those cause dead-end clicks. Deal-specific actions open
 * the 'deals' tab and let the user tap into the deal card; payment stages
 * live inside the deals tab.
 *
 * Input shape (flexible to survive backend drift):
 *   {
 *     id, type,                                  // 'NEW_OFFER', 'COUNTER_OFFER', ...
 *     entityType?, entityId?,                    // 'offer' | 'meeting' | 'deal' | 'business'
 *     actionType?,                               // 'VIEW' | 'RESPOND' | 'PAY' | ...
 *     // Legacy-compatible accessors:
 *     offerId?, meetingId?, dealId?, businessId?
 *   }
 */

export type OnNavigate = (
  view: string,
  id?: string | null,
  tab?: string | null,
) => void;

export interface NotificationLike {
  id?: string | null;
  type?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionType?: string | null;
  offerId?: string | null;
  meetingId?: string | null;
  dealId?: string | null;
  businessId?: string | null;
  // content / message are fine to include but we don't route on text:
  title?: string | null;
  body?: string | null;
}

export interface RoutedAction {
  /** What the CTA button should say. Bilingual. */
  label: { ar: string; en: string };
  /** Call this when the user clicks the CTA. */
  execute: (onNavigate: OnNavigate) => void;
  /** Route kind for analytics / logging. */
  kind:
    | 'offer'
    | 'meeting'
    | 'deal'
    | 'listing'
    | 'alerts'
    | 'settings'
    | 'noop';
}

function entityOf(n: NotificationLike): { type: string | null; id: string | null } {
  // Prefer the explicit entityType/entityId the backend now sends.
  if (n.entityType && n.entityId) {
    return { type: n.entityType.toLowerCase(), id: n.entityId };
  }
  // Fallback to the older shape where the ID is on a typed field.
  if (n.offerId) return { type: 'offer', id: n.offerId };
  if (n.meetingId) return { type: 'meeting', id: n.meetingId };
  if (n.dealId) return { type: 'deal', id: n.dealId };
  if (n.businessId) return { type: 'business', id: n.businessId };
  return { type: null, id: null };
}

/**
 * Given a notification, return the action that should be taken on click.
 * The UI wires this into a single button with `execute(onNavigate)`.
 */
export function routeNotification(n: NotificationLike): RoutedAction {
  const { type } = entityOf(n);
  const t = (n.type ?? '').toUpperCase();

  // --- OFFERS ---------------------------------------------------------------
  if (type === 'offer' || t.includes('OFFER')) {
    if (t.includes('COUNTER')) {
      return {
        kind: 'offer',
        label: { ar: 'الردّ على العرض المضاد', en: 'Respond to counter' },
        execute: (nav) => nav('dashboard', null, 'offers'),
      };
    }
    if (t.includes('ACCEPT')) {
      return {
        kind: 'offer',
        label: { ar: 'عرض العرض المقبول', en: 'View accepted offer' },
        execute: (nav) => nav('dashboard', null, 'offers'),
      };
    }
    if (t.includes('REJECT')) {
      return {
        kind: 'offer',
        label: { ar: 'عرض الحالة', en: 'View status' },
        execute: (nav) => nav('dashboard', null, 'offers'),
      };
    }
    return {
      kind: 'offer',
      label: { ar: 'عرض العرض', en: 'View offer' },
      execute: (nav) => nav('dashboard', null, 'offers'),
    };
  }

  // --- MEETINGS -------------------------------------------------------------
  if (type === 'meeting' || t.includes('MEETING')) {
    if (t.includes('REQUEST')) {
      return {
        kind: 'meeting',
        label: { ar: 'مراجعة طلب الاجتماع', en: 'Review meeting request' },
        execute: (nav) => nav('dashboard', null, 'meetings'),
      };
    }
    if (t.includes('SCHEDULED') || t.includes('READY') || t.includes('APPROVED')) {
      return {
        kind: 'meeting',
        label: { ar: 'فتح الاجتماع', en: 'Open meeting' },
        execute: (nav) => nav('dashboard', null, 'meetings'),
      };
    }
    if (t.includes('REJECT') || t.includes('CANCEL')) {
      return {
        kind: 'meeting',
        label: { ar: 'عرض الحالة', en: 'View status' },
        execute: (nav) => nav('dashboard', null, 'meetings'),
      };
    }
    return {
      kind: 'meeting',
      label: { ar: 'عرض الاجتماع', en: 'View meeting' },
      execute: (nav) => nav('dashboard', null, 'meetings'),
    };
  }

  // --- DEALS ---------------------------------------------------------------
  if (type === 'deal' || t.includes('DEAL') || t.includes('NDA') || t.includes('PAYMENT') || t.includes('DOCUMENT')) {
    if (t.includes('PAYMENT')) {
      return {
        kind: 'deal',
        label: { ar: 'إتمام الدفع', en: 'Proceed to payment' },
        execute: (nav) => nav('dashboard', null, 'deals'),
      };
    }
    if (t.includes('DOCUMENT')) {
      return {
        kind: 'deal',
        label: { ar: 'مراجعة المستندات', en: 'Review documents' },
        execute: (nav) => nav('dashboard', null, 'deals'),
      };
    }
    if (t.includes('NDA')) {
      return {
        kind: 'deal',
        label: { ar: 'توقيع اتفاقية السرية', en: 'Sign NDA' },
        execute: (nav) => nav('dashboard', null, 'deals'),
      };
    }
    if (t.includes('FINAL') || t.includes('COMPLETE')) {
      return {
        kind: 'deal',
        label: { ar: 'إنهاء الصفقة', en: 'Finalize deal' },
        execute: (nav) => nav('dashboard', null, 'deals'),
      };
    }
    return {
      kind: 'deal',
      label: { ar: 'عرض الصفقة', en: 'View deal' },
      execute: (nav) => nav('dashboard', null, 'deals'),
    };
  }

  // --- LISTINGS / BUSINESSES ------------------------------------------------
  if (type === 'business' || t.includes('LISTING') || t.includes('BUSINESS')) {
    const id = n.businessId ?? n.entityId ?? null;
    if (id) {
      return {
        kind: 'listing',
        label: { ar: 'عرض القائمة', en: 'View listing' },
        execute: (nav) => nav('details', id),
      };
    }
    return {
      kind: 'listing',
      label: { ar: 'قوائمي', en: 'My listings' },
      execute: (nav) => nav('dashboard', null, 'listings'),
    };
  }

  // --- VERIFICATION ---------------------------------------------------------
  if (t.includes('VERIFICATION') || t.includes('IDENTITY') || t.includes('KYC')) {
    return {
      kind: 'settings',
      label: { ar: 'إدارة التحقق', en: 'Manage verification' },
      execute: (nav) => nav('dashboard', null, 'settings'),
    };
  }

  // --- FALLBACK -------------------------------------------------------------
  return {
    kind: 'alerts',
    label: { ar: 'فتح التنبيهات', en: 'Open alerts' },
    execute: (nav) => nav('dashboard', null, 'alerts'),
  };
}

/** Convenience for render sites: pick the correct label string for the UI language. */
export function actionLabel(action: RoutedAction, isAr: boolean): string {
  return isAr ? action.label.ar : action.label.en;
}
