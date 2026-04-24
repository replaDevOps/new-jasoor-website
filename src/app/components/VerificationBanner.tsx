// src/app/components/VerificationBanner.tsx
// Identity verification status banner for the dashboard.
// Shows one of: UNVERIFIED (upload CTA), PENDING (under review), VERIFIED (hidden
// or small success chip), REJECTED (re-upload CTA with admin notes if present).
//
// Drops into DashboardView at the top, above the statistics row.

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useVerificationGate } from '../../hooks/useVerificationGate';

interface Props {
  onNavigate?: (view: string, id?: string) => void;
  /** Optional admin-provided rejection note from the user's status payload. */
  rejectionNote?: string | null;
  /** Hide the banner entirely when verified. Default: true. */
  hideWhenVerified?: boolean;
}

export const VerificationBanner: React.FC<Props> = ({
  onNavigate,
  rejectionNote,
  hideWhenVerified = true,
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const { status, loading, needsUpload, pending, rejected } = useVerificationGate();

  if (loading) return null;
  if (status === 'VERIFIED' && hideWhenVerified) return null;

  const goUpload = () => onNavigate?.('settings', 'identity');

  // ---------- Rejected ----------
  if (rejected) {
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 grid place-items-center font-bold">!</div>
          <div className="flex-1">
            <p className="text-red-800 font-bold mb-1">
              {isAr ? 'تم رفض وثيقة الهوية' : 'ID verification rejected'}
            </p>
            <p className="text-sm text-red-700 mb-3">
              {rejectionNote ||
                (isAr
                  ? 'يرجى إعادة رفع وثيقة هوية واضحة وسارية.'
                  : 'Please upload a clear, valid ID document.')}
            </p>
            <button
              onClick={goUpload}
              className="bg-[#008A66] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#007053] transition-colors"
            >
              {isAr ? 'إعادة رفع الهوية' : 'Re-upload ID'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Pending admin review ----------
  if (pending) {
    return (
      <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 grid place-items-center font-bold">⏱</div>
          <div className="flex-1">
            <p className="text-amber-900 font-bold mb-1">
              {isAr ? 'قيد مراجعة الإدارة' : 'Under admin review'}
            </p>
            <p className="text-sm text-amber-800">
              {isAr
                ? 'تم استلام وثيقتك. سنعلمك فور اعتماد حسابك.'
                : 'We received your document. You will be notified once approved.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Unverified (default) ----------
  if (needsUpload) {
    return (
      <div className="rounded-[24px] border border-[#008A66]/20 bg-[#E6F3EF] p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#008A66] text-white grid place-items-center font-bold">✓</div>
          <div className="flex-1">
            <p className="text-[#004E39] font-bold mb-1">
              {isAr ? 'فعّل حسابك بتوثيق هويتك' : 'Verify your identity to unlock full access'}
            </p>
            <p className="text-sm text-[#0A3F2E] mb-3">
              {isAr
                ? 'التوثيق اختياري عند التسجيل، لكنه مطلوب قبل تقديم العروض أو طلب اجتماعات.'
                : 'Verification is optional at signup but required to make offers or request meetings.'}
            </p>
            <button
              onClick={goUpload}
              className="bg-[#008A66] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
            >
              {isAr ? 'رفع وثيقة الهوية' : 'Upload ID'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerificationBanner;
