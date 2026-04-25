/**
 * VerificationBanner.tsx — top-of-dashboard card that surfaces the user's
 * verification state and routes them to the right next step.
 *
 *  State          Display                                    Primary CTA
 *  ---------------------------------------------------------------------------
 *  UNVERIFIED     "Verify your identity to unlock offers."   Verify now → Settings/ID
 *  PENDING        "Your document is under review..."         View details → Settings/ID
 *  REJECTED       "Your document was rejected: {note}"       Re-upload   → Settings/ID
 *  VERIFIED       (hidden — no banner needed)                —
 *  UNKNOWN/loading (hidden)                                  —
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useVerificationGate } from '../../hooks/useVerificationGate';

interface Props {
  /** Custom SPA router callback from App.tsx. */
  onNavigate?: (view: string, id?: string | null, tab?: string | null) => void;
  /** Optional className to control banner spacing from the parent. */
  className?: string;
}

export const VerificationBanner: React.FC<Props> = ({ onNavigate, className }) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const gate = useVerificationGate();

  if (gate.loading || gate.status === 'UNKNOWN' || gate.status === 'VERIFIED') {
    return null;
  }

  const goVerify = () => onNavigate?.('dashboard', null, 'settings');

  // --- UNVERIFIED -----------------------------------------------------------
  if (gate.status === 'UNVERIFIED') {
    return (
      <div
        className={
          'bg-[#E6F3EF] border border-[#008A66]/20 rounded-[24px] p-5 md:p-6 flex items-start gap-4 shadow-sm ' +
          (className ?? '')
        }
        role="status"
      >
        <div className="shrink-0 w-11 h-11 rounded-full bg-[#008A66]/10 flex items-center justify-center text-[#004E39] text-xl font-bold">
          ID
        </div>
        <div className="flex-1">
          <h3 className="text-[#004E39] font-bold text-lg mb-1">
            {isAr ? 'وثّق هويتك لتفعيل الحساب بالكامل' : 'Verify your identity to unlock full access'}
          </h3>
          <p className="text-[#111827] text-sm mb-3">
            {isAr
              ? 'يمكنك التصفح الآن، ولكن لتقديم عروض أو حجز اجتماعات أو إتمام الصفقات عليك رفع وثيقة الهوية أولاً. المراجعة تتم بواسطة فريق جسور.'
              : 'You can browse now, but you need to upload an identity document before you can make offers, book meetings, or progress deals. Review is handled by the Jusoor team.'}
          </p>
          <button
            onClick={goVerify}
            className="bg-[#008A66] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
          >
            {isAr ? 'ابدأ التوثيق' : 'Start verification'}
          </button>
        </div>
      </div>
    );
  }

  // --- PENDING_VERIFICATION -------------------------------------------------
  if (gate.status === 'PENDING_VERIFICATION') {
    return (
      <div
        className={
          'bg-amber-50 border border-amber-200 rounded-[24px] p-5 md:p-6 flex items-start gap-4 shadow-sm ' +
          (className ?? '')
        }
        role="status"
      >
        <div className="shrink-0 w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
          ⏳
        </div>
        <div className="flex-1">
          <h3 className="text-amber-900 font-bold text-lg mb-1">
            {isAr ? 'حسابك قيد المراجعة' : 'Your account is under review'}
          </h3>
          <p className="text-[#111827] text-sm mb-3">
            {isAr
              ? 'تم رفع وثيقتك بنجاح وسيتم الرد خلال فترة قصيرة. خلال المراجعة يمكنك التصفح ولكن لا يمكنك إتمام العمليات الحساسة.'
              : 'Your document has been submitted. You can continue browsing, but sensitive actions remain disabled until an admin completes the review.'}
          </p>
          <button
            onClick={goVerify}
            className="bg-white border border-amber-300 text-amber-900 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-100 transition-colors"
          >
            {isAr ? 'عرض التفاصيل' : 'View details'}
          </button>
        </div>
      </div>
    );
  }

  // --- REJECTED -------------------------------------------------------------
  if (gate.status === 'REJECTED') {
    return (
      <div
        className={
          'bg-red-50 border border-red-200 rounded-[24px] p-5 md:p-6 flex items-start gap-4 shadow-sm ' +
          (className ?? '')
        }
        role="alert"
      >
        <div className="shrink-0 w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
          !
        </div>
        <div className="flex-1">
          <h3 className="text-red-900 font-bold text-lg mb-1">
            {isAr ? 'تم رفض وثيقة الهوية' : 'Identity document rejected'}
          </h3>
          <p className="text-[#111827] text-sm mb-3">
            {gate.rejectionNote
              ? (isAr ? `السبب: ${gate.rejectionNote}` : `Reason: ${gate.rejectionNote}`)
              : isAr
                ? 'يرجى إعادة رفع صورة واضحة لوثيقة الهوية من الإعدادات.'
                : 'Please re-upload a clear image of your ID from Settings.'}
          </p>
          <button
            onClick={goVerify}
            className="bg-[#008A66] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
          >
            {isAr ? 'إعادة الرفع' : 'Re-upload document'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VerificationBanner;
