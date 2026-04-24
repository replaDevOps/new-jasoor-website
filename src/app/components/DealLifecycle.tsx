// src/app/components/DealLifecycle.tsx  (v2 — uses only documented fields)
//
// v2 changes vs v1:
//   * Drops dependency on `deal.meetingStatus` / `deal.meetingId` which the
//     existing GraphQL queries may not select.
//   * Stage detection uses ONLY the deal flags documented in yazid-preferences:
//       isDsaBuyer, isDsaSeller, isDocVedifiedBuyer, isDocVedifiedSeller,
//       isCommissionVerified, isBuyerCompleted, isSellerCompleted, status.
//   * Meetings are a separate module; this stepper no longer pretends to know
//     about meeting state.

import React from 'react';
import { useApp } from '../../context/AppContext';

export type DealStage =
  | 'OFFER_ACCEPTED'
  | 'NDA_SIGNED'
  | 'PAYMENT_PENDING'
  | 'DOCUMENTS_UPLOADED'
  | 'UNDER_JUSOOR_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface DealFlags {
  status?: string;
  isDsaBuyer?: boolean;
  isDsaSeller?: boolean;
  isDocVedifiedBuyer?: boolean;
  isDocVedifiedSeller?: boolean;
  isCommissionVerified?: boolean;
  isBuyerCompleted?: boolean;
  isSellerCompleted?: boolean;
}

const LINEAR: DealStage[] = [
  'OFFER_ACCEPTED',
  'NDA_SIGNED',
  'PAYMENT_PENDING',
  'DOCUMENTS_UPLOADED',
  'UNDER_JUSOOR_REVIEW',
  'COMPLETED',
];

const LABELS: Record<DealStage, { ar: string; en: string }> = {
  OFFER_ACCEPTED:      { ar: 'تم قبول العرض',       en: 'Offer accepted' },
  NDA_SIGNED:          { ar: 'توقيع اتفاقية السرية', en: 'NDA signed' },
  PAYMENT_PENDING:     { ar: 'بانتظار الدفع',        en: 'Payment pending' },
  DOCUMENTS_UPLOADED:  { ar: 'تم رفع المستندات',     en: 'Documents uploaded' },
  UNDER_JUSOOR_REVIEW: { ar: 'قيد مراجعة جسور',      en: 'Under Jusoor review' },
  COMPLETED:           { ar: 'تمت الصفقة',           en: 'Completed' },
  REJECTED:            { ar: 'مرفوض',                en: 'Rejected' },
  CANCELLED:           { ar: 'ملغية',                en: 'Cancelled' },
};

export function computeCurrentStage(d: DealFlags): DealStage {
  if (d.status === 'REJECTED')  return 'REJECTED';
  if (d.status === 'CANCELLED') return 'CANCELLED';
  if (d.isBuyerCompleted && d.isSellerCompleted) return 'COMPLETED';
  if (d.isDocVedifiedBuyer && d.isDocVedifiedSeller) return 'UNDER_JUSOOR_REVIEW';
  if (d.isCommissionVerified) return 'DOCUMENTS_UPLOADED';
  if (d.isDsaBuyer && d.isDsaSeller) return 'PAYMENT_PENDING';
  return 'OFFER_ACCEPTED';
}

interface Props {
  deal: DealFlags;
  compact?: boolean;
}

export const DealLifecycle: React.FC<Props> = ({ deal, compact = false }) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const current = computeCurrentStage(deal);

  if (current === 'REJECTED' || current === 'CANCELLED') {
    return (
      <span className="inline-block bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
        {isAr ? LABELS[current].ar : LABELS[current].en}
      </span>
    );
  }

  const currentIndex = LINEAR.indexOf(current);

  return (
    <ol className={`flex ${compact ? 'gap-1' : 'gap-2'} items-center flex-wrap`} dir={isAr ? 'rtl' : 'ltr'}>
      {LINEAR.map((stage, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
        const color =
          state === 'done'   ? 'bg-[#10B981] text-white' :
          state === 'active' ? 'bg-[#008A66] text-white' :
                               'bg-gray-100 text-gray-500';
        return (
          <li key={stage} className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
              {isAr ? LABELS[stage].ar : LABELS[stage].en}
            </span>
            {i < LINEAR.length - 1 && !compact && (
              <span className="text-gray-300">{isAr ? '←' : '→'}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default DealLifecycle;
