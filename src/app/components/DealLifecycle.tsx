/**
 * DealLifecycle.tsx — visible stage rail for a deal.
 *
 * Reads ONLY fields the existing deal queries already select (per yazid-preferences
 * coding standards, 4-step progress):
 *   - isDsaBuyer, isDsaSeller       → NDA Signed
 *   - isDocVedifiedBuyer, isDocVedifiedSeller → Documents Verified
 *   - isCommissionVerified          → Commission Paid
 *   - isBuyerCompleted, isSellerCompleted → Completed
 *
 * Optional (rendered if present, but not required):
 *   - status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
 *   - createdAt, completedAt
 *
 * The previous v1 version referenced `meetingStatus` / `meetingId` which
 * aren't selected by the deal queries — that dependency is gone.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';

export interface DealLike {
  id?: string | null;
  status?: string | null;
  isDsaBuyer?: boolean | null;
  isDsaSeller?: boolean | null;
  isDocVedifiedBuyer?: boolean | null;
  isDocVedifiedSeller?: boolean | null;
  isCommissionVerified?: boolean | null;
  isBuyerCompleted?: boolean | null;
  isSellerCompleted?: boolean | null;
}

interface Stage {
  key: string;
  titleAr: string;
  titleEn: string;
  done: boolean;
  // True iff this is the currently-active stage the user is waiting on.
  active?: boolean;
}

function computeStages(d: DealLike): Stage[] {
  const ndaDone = !!d.isDsaBuyer && !!d.isDsaSeller;
  const docsDone = !!d.isDocVedifiedBuyer && !!d.isDocVedifiedSeller;
  const commissionDone = !!d.isCommissionVerified;
  const completed = !!d.isBuyerCompleted && !!d.isSellerCompleted;

  const stages: Stage[] = [
    { key: 'nda', titleAr: 'توقيع اتفاقية السرية', titleEn: 'NDA signed', done: ndaDone },
    { key: 'docs', titleAr: 'التحقق من المستندات', titleEn: 'Documents verified', done: docsDone },
    { key: 'commission', titleAr: 'دفع العمولة', titleEn: 'Commission paid', done: commissionDone },
    { key: 'complete', titleAr: 'إتمام الصفقة', titleEn: 'Deal completed', done: completed },
  ];

  // Mark the first not-done stage as "active".
  const firstPending = stages.findIndex((s) => !s.done);
  if (firstPending >= 0) stages[firstPending].active = true;

  return stages;
}

interface Props {
  deal: DealLike;
  className?: string;
  compact?: boolean;
}

export const DealLifecycle: React.FC<Props> = ({ deal, className, compact }) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const stages = computeStages(deal);
  const cancelled = (deal.status ?? '').toUpperCase() === 'CANCELLED' ||
                    (deal.status ?? '').toUpperCase() === 'REJECTED';

  return (
    <div
      className={
        'bg-white border border-gray-100 rounded-[24px] ' +
        (compact ? 'p-3' : 'p-4 md:p-5') +
        ' ' +
        (className ?? '')
      }
      aria-label={isAr ? 'مراحل الصفقة' : 'Deal stages'}
    >
      <ol className="flex items-start justify-between gap-2 md:gap-3">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const done = stage.done;
          const active = stage.active && !cancelled;
          const color = cancelled
            ? 'bg-gray-200 text-gray-500'
            : done
            ? 'bg-[#008A66] text-white'
            : active
            ? 'bg-white text-[#008A66] border-2 border-[#008A66]'
            : 'bg-gray-100 text-gray-400 border border-gray-200';

          return (
            <li key={stage.key} className="flex-1 flex flex-col items-center relative">
              <div
                className={
                  'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm ' +
                  color
                }
              >
                {done ? '✓' : idx + 1}
              </div>
              <p
                className={
                  'mt-2 text-xs md:text-sm text-center font-medium ' +
                  (done ? 'text-[#004E39]' : active ? 'text-[#111827]' : 'text-gray-500')
                }
              >
                {isAr ? stage.titleAr : stage.titleEn}
              </p>
              {!isLast ? (
                <div
                  className={
                    'hidden md:block absolute top-4 md:top-5 h-[2px] ' +
                    (done ? 'bg-[#008A66]' : 'bg-gray-200')
                  }
                  style={{
                    insetInlineStart: isAr ? undefined : 'calc(50% + 1.25rem)',
                    insetInlineEnd: isAr ? 'calc(50% + 1.25rem)' : undefined,
                    width: 'calc(100% - 2.5rem)',
                  }}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {cancelled ? (
        <p className="mt-4 text-center text-sm text-red-700 font-medium">
          {isAr ? 'تم إلغاء/رفض هذه الصفقة.' : 'This deal was cancelled / rejected.'}
        </p>
      ) : null}
    </div>
  );
};

export default DealLifecycle;
