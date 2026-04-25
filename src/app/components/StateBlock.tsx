/**
 * StateBlock.tsx — single component for loading / empty / error / success
 * states. Wrap any list or stat card in this to avoid the "---" blanks the
 * audit flagged.
 *
 * Usage:
 *
 *   <StateBlock
 *     loading={loading}
 *     error={error}
 *     isEmpty={!items?.length}
 *     emptyTitle={isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
 *     emptyHint={isAr ? 'ستظهر العروض الجديدة هنا.' : 'New offers will show up here.'}
 *     action={<button ...>Browse businesses</button>}
 *   >
 *     {items.map(i => <OfferCard key={i.id} offer={i} />)}
 *   </StateBlock>
 */

import React, { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';

interface Props {
  loading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  children?: ReactNode;

  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorTitle?: string;
  errorHint?: string;

  /** Optional CTA (rendered under emptyHint). Buttons/links only. */
  action?: ReactNode;

  className?: string;
  /** Compact variant for stat cards. */
  compact?: boolean;
}

export const StateBlock: React.FC<Props> = ({
  loading,
  error,
  isEmpty,
  children,
  loadingLabel,
  emptyTitle,
  emptyHint,
  errorTitle,
  errorHint,
  action,
  className,
  compact,
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';

  if (loading) {
    return (
      <div
        className={
          (compact
            ? 'min-h-[80px] flex items-center justify-center'
            : 'min-h-[200px] flex flex-col items-center justify-center') +
          ' bg-gray-50 rounded-[24px] border border-gray-100 ' +
          (className ?? '')
        }
      >
        <span className="inline-block w-5 h-5 rounded-full border-2 border-[#008A66] border-t-transparent animate-spin" />
        <p className="text-gray-600 text-sm mt-3">
          {loadingLabel ?? (isAr ? 'جارٍ التحميل...' : 'Loading...')}
        </p>
      </div>
    );
  }

  if (error) {
    const message =
      (error as { message?: string } | null)?.message ??
      (isAr ? 'تعذّر جلب البيانات، يرجى المحاولة مرة أخرى.' : 'Could not load data. Try again.');
    return (
      <div
        className={
          (compact ? 'p-4' : 'p-6') +
          ' bg-red-50 border border-red-200 rounded-[24px] ' +
          (className ?? '')
        }
        role="alert"
      >
        <h4 className="text-red-900 font-bold text-base mb-1">
          {errorTitle ?? (isAr ? 'حدث خطأ' : 'Something went wrong')}
        </h4>
        <p className="text-red-800 text-sm">{errorHint ?? message}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={
          (compact
            ? 'p-4 text-center'
            : 'p-8 md:p-10 text-center') +
          ' bg-gray-50 rounded-[24px] border border-dashed border-gray-200 ' +
          (className ?? '')
        }
      >
        <h4 className="text-[#111827] font-bold text-base mb-1">
          {emptyTitle ?? (isAr ? 'لا توجد بيانات بعد' : 'Nothing here yet')}
        </h4>
        {emptyHint ? (
          <p className="text-gray-600 text-sm max-w-md mx-auto">{emptyHint}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    );
  }

  return <>{children}</>;
};

export default StateBlock;
