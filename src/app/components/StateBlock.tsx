// src/app/components/StateBlock.tsx
// One component that renders loading / empty / error / restricted states
// so dashboard cards never show bare "---" or unexplained blanks.
//
// Usage:
//   <StateBlock
//     loading={loading}
//     error={error}
//     isEmpty={!data?.length}
//     emptyLabel={{ ar: 'لا توجد عروض بعد', en: 'No offers yet' }}
//     emptyCta={{ ar: 'تصفح الفرص', en: 'Browse opportunities',
//                 onClick: () => onNavigate?.('browse') }}
//   >
//     {/* your actual list */}
//   </StateBlock>

import React from 'react';
import { useApp } from '../../context/AppContext';

interface Bilingual { ar: string; en: string }
interface Cta extends Bilingual { onClick: () => void }

interface Props {
  loading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  restricted?: boolean;
  restrictedReason?: Bilingual;
  emptyLabel?: Bilingual;
  emptyCta?: Cta;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export const StateBlock: React.FC<Props> = ({
  loading,
  error,
  isEmpty,
  restricted,
  restrictedReason,
  emptyLabel,
  emptyCta,
  onRetry,
  children,
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-6" aria-busy="true">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-bold mb-3">
          {isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'An error occurred, please try again'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-[#008A66] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#007053]"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  if (restricted) {
    return (
      <div className="p-6 text-center border border-amber-200 bg-amber-50 rounded-[24px]">
        <p className="text-amber-800 font-bold">
          {restrictedReason
            ? isAr ? restrictedReason.ar : restrictedReason.en
            : isAr ? 'غير متاح لحسابك حالياً' : 'Not available for your account yet'}
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">
          {emptyLabel
            ? isAr ? emptyLabel.ar : emptyLabel.en
            : isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
        </p>
        {emptyCta && (
          <button
            onClick={emptyCta.onClick}
            className="bg-[#008A66] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
          >
            {isAr ? emptyCta.ar : emptyCta.en}
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default StateBlock;
