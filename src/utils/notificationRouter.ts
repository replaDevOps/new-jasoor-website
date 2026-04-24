// src/utils/notificationRouter.ts  (v2 — only real views)
//
// v2 changes vs v1:
//   * Drops invented views ('payment', 'dealDetails', 'listingDetails') that
//     the custom SPA router in App.tsx does NOT recognize.
//   * Uses ONLY the documented existing views:
//       'dashboard' | 'offers' | 'meetings' | 'deals' | 'alerts' | 'settings'
//       + 'details' with id (for listing) per onNavigate('details', id).
//   * Exposes `routeNotification()` as the single entry-point used by AlertsView.

export type AppView =
  | 'dashboard'
  | 'offers'
  | 'meetings'
  | 'deals'
  | 'alerts'
  | 'settings'
  | 'details'     // business/listing details per existing router
  | 'signin';

export interface NotificationTarget {
  view: AppView;
  id?: string;
  label: { ar: string; en: string };
}

export type EntityType =
  | 'OFFER'
  | 'COUNTER_OFFER'
  | 'MEETING'
  | 'DEAL'
  | 'DOCUMENT'
  | 'PAYMENT'
  | 'VERIFICATION'
  | 'LISTING';

export type ActionType = 'VIEW' | 'RESPOND' | 'SCHEDULE' | 'PAY' | 'REVIEW' | 'FINALIZE' | 'UPLOAD';

export interface EntityNotification {
  entityType: EntityType;
  entityId?: string;
  actionType?: ActionType;
}

export function routeByEntity(n: EntityNotification): NotificationTarget {
  const { entityType, entityId, actionType } = n;
  switch (entityType) {
    case 'OFFER':
      return {
        view: 'offers', id: entityId,
        label: actionType === 'RESPOND'
          ? { ar: 'الرد على العرض', en: 'Respond to offer' }
          : { ar: 'عرض العرض', en: 'View offer' },
      };
    case 'COUNTER_OFFER':
      return {
        view: 'offers', id: entityId,
        label: { ar: 'الرد على العرض المضاد', en: 'Respond to counter-offer' },
      };
    case 'MEETING':
      return {
        view: 'meetings', id: entityId,
        label: actionType === 'SCHEDULE'
          ? { ar: 'جدولة الاجتماع', en: 'Schedule meeting' }
          : { ar: 'عرض الاجتماع', en: 'View meeting' },
      };
    // Payment and document-review surfaces live inside DealsView — route there
    // and let the view open the right deal/tab based on the id.
    case 'PAYMENT':
      return {
        view: 'deals', id: entityId,
        label: { ar: 'إتمام الدفع', en: 'Proceed to payment' },
      };
    case 'DOCUMENT':
      return {
        view: 'deals', id: entityId,
        label: { ar: 'مراجعة المستندات', en: 'Review documents' },
      };
    case 'DEAL':
      return {
        view: 'deals', id: entityId,
        label: actionType === 'FINALIZE'
          ? { ar: 'إنهاء الصفقة', en: 'Finalize deal' }
          : { ar: 'عرض الصفقة', en: 'View deal' },
      };
    // Identity upload + review live in Settings → Identity tab.
    case 'VERIFICATION':
      return {
        view: 'settings', id: 'identity',
        label: { ar: 'مراجعة التوثيق', en: 'Review verification' },
      };
    // Listing page is the existing 'details' view with the listing id.
    case 'LISTING':
      return {
        view: 'details', id: entityId,
        label: { ar: 'عرض الإعلان', en: 'View listing' },
      };
    default:
      return { view: 'alerts', label: { ar: 'عرض التفاصيل', en: 'View details' } };
  }
}

export type LegacyCode =
  | 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'COUNTER_OFFER_RECEIVED'
  | 'MEETING_REQUESTED' | 'MEETING_SCHEDULED' | 'MEETING_APPROVED'
  | 'PAYMENT_REQUIRED' | 'DOCUMENTS_UPLOADED' | 'DEAL_COMPLETED'
  | 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED';

const LEGACY_MAP: Record<LegacyCode, EntityNotification> = {
  OFFER_RECEIVED:         { entityType: 'OFFER',         actionType: 'RESPOND'  },
  OFFER_ACCEPTED:         { entityType: 'OFFER',         actionType: 'VIEW'     },
  OFFER_REJECTED:         { entityType: 'OFFER',         actionType: 'VIEW'     },
  COUNTER_OFFER_RECEIVED: { entityType: 'COUNTER_OFFER', actionType: 'RESPOND'  },
  MEETING_REQUESTED:      { entityType: 'MEETING',       actionType: 'SCHEDULE' },
  MEETING_SCHEDULED:      { entityType: 'MEETING',       actionType: 'VIEW'     },
  MEETING_APPROVED:       { entityType: 'MEETING',       actionType: 'VIEW'     },
  PAYMENT_REQUIRED:       { entityType: 'PAYMENT',       actionType: 'PAY'      },
  DOCUMENTS_UPLOADED:     { entityType: 'DOCUMENT',      actionType: 'REVIEW'   },
  DEAL_COMPLETED:         { entityType: 'DEAL',          actionType: 'VIEW'     },
  VERIFICATION_APPROVED:  { entityType: 'VERIFICATION',  actionType: 'VIEW'     },
  VERIFICATION_REJECTED:  { entityType: 'VERIFICATION',  actionType: 'UPLOAD'   },
};

export function routeByCode(code: string, entityId?: string): NotificationTarget {
  const mapped = LEGACY_MAP[code as LegacyCode];
  if (mapped) return routeByEntity({ ...mapped, entityId });
  return { view: 'alerts', label: { ar: 'عرض التفاصيل', en: 'View details' } };
}

export function routeNotification(n: {
  entityType?: EntityType;
  entityId?: string;
  actionType?: ActionType;
  type?: string;
}): NotificationTarget {
  if (n.entityType) return routeByEntity(n as EntityNotification);
  if (n.type) return routeByCode(n.type, n.entityId);
  return { view: 'alerts', label: { ar: 'عرض التفاصيل', en: 'View details' } };
}
