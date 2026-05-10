import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { useApp } from '../../../context/AppContext';
import { useQuery } from '@apollo/client';
import { PREVIEW_COMMISSION } from '../../../graphql/queries/dashboard';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'make-offer' | 'counter-offer';
  // Fix 1: onSubmit is async — modal does NOT close itself, parent controls lifetime
  onSubmit: (amount: string) => Promise<void>;
}

export const OfferModal = ({ isOpen, onClose, type, onSubmit }: OfferModalProps) => {
  const { language } = useApp();
  const [amount, setAmount] = useState('');
  // Fix 1: loading state — disables submit and shows feedback while mutation runs
  const [submitting, setSubmitting] = useState(false);
  const isAr = language === 'ar';

  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  // Fix 2: destructure error so commission preview failure is surfaced
  const { data: commissionData, loading: commissionLoading, error: commissionError } = useQuery(PREVIEW_COMMISSION, {
    variables: { price: validAmount ? parsedAmount : 0 },
    skip: type !== 'make-offer' || !validAmount,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // Fix 2: never display 0 when the preview query itself failed
  const commissionFailed = !!commissionError && !commissionLoading;
  const commission: number = commissionFailed ? 0 : (commissionData?.previewCommission ?? 0);
  const total = validAmount && !commissionFailed ? parsedAmount + commission : 0;

  const t = {
    titleMakeOffer:    isAr ? 'تقديم عرض'                       : 'Make an Offer',
    titleCounter:      isAr ? 'عرض مضاد'                        : 'Counter Offer',
    labelMakeOffer:    isAr ? 'مبلغ العرض'                       : 'Offer Amount',
    labelCounter:      isAr ? 'مبلغ العرض المضاد'                : 'Counter Offer Amount',
    commission:        isAr ? 'عمولة المنصة'                     : 'Platform Commission',
    totalValue:        isAr ? 'القيمة الإجمالية'                 : 'Total Value',
    commissionNote:    isAr ? '* يشمل عمولة منصة جسور'          : '* Includes Jusoor platform commission',
    // Fix 2: shown when preview query fails
    commissionNA:      isAr ? 'غير متاح'                         : 'N/A',
    commissionNANote:  isAr ? '* ستُحسب العمولة عند الإرسال'    : '* Commission will be calculated on submit',
    calculating:       isAr ? 'جارٍ الحساب...'                  : 'Calculating...',
    submit:            isAr ? 'إرسال العرض'                      : 'Submit Offer',
    submitting:        isAr ? 'جارٍ الإرسال...'                 : 'Submitting...',
    send:              isAr ? 'إرسال'                            : 'Send',
    cancel:            isAr ? 'إلغاء'                            : 'Cancel',
    sar:               '⃁',
    placeholder:       isAr ? '٠٫٠٠'                            : '0.00',
  };

  // Fix 1: async submit — does NOT call onClose(); parent closes on success
  const handleSubmit = async () => {
    if (!validAmount || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(amount);
      // Parent (BusinessDetails.handleOfferSubmit) calls setModalOpen(null) on success.
      // On error it shows a toast and leaves the modal open so the user can retry.
      // Amount is preserved intentionally so the user does not have to retype it.
    } finally {
      setSubmitting(false);
    }
  };

  const localeKey = isAr ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'make-offer' ? t.titleMakeOffer : t.titleCounter}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {type === 'make-offer' ? t.labelMakeOffer : t.labelCounter}
          </label>
          <div className="flex items-stretch bg-gray-50 border border-gray-200 rounded-xl overflow-hidden transition-all focus-within:border-[#008A66] focus-within:ring-4 focus-within:ring-[#008A66]/10">
            <span className="flex items-center px-3 bg-gray-100 border-r border-gray-200 text-gray-500 font-bold text-sm shrink-0 dir-ltr">
              {t.sar}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent py-3 px-4 text-lg font-bold focus:outline-none dir-ltr text-left"
              placeholder={t.placeholder}
              disabled={submitting}
            />
          </div>
        </div>

        {type === 'make-offer' && validAmount && (
          <div className={`p-4 rounded-xl space-y-3 ${commissionFailed ? 'bg-amber-50' : 'bg-[#E6F3EF]'}`}>
            {/* Commission row */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t.commission}</span>
              <span className="dir-ltr font-medium">
                {commissionLoading
                  ? t.calculating
                  : commissionFailed
                    ? <span className="text-amber-700 font-bold">{t.commissionNA}</span>
                    : `${commission.toLocaleString(localeKey)} ${t.sar}`}
              </span>
            </div>
            {/* Total row */}
            <div className={`flex justify-between font-bold pt-3 border-t ${commissionFailed ? 'border-amber-200 text-amber-700' : 'border-[#008A66]/10 text-[#008A66]'}`}>
              <span>{t.totalValue}</span>
              <span className="dir-ltr">
                {commissionLoading
                  ? t.calculating
                  : commissionFailed
                    ? '—'
                    : `${total.toLocaleString(localeKey)} ${t.sar}`}
              </span>
            </div>
            {/* Note */}
            <p className="text-xs text-gray-500 mt-2">
              {commissionFailed ? t.commissionNANote : t.commissionNote}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {/* Fix 1: disabled while submitting; shows spinner text */}
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!validAmount || submitting}
          >
            <span className="flex items-center justify-center gap-2">
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {submitting
                ? t.submitting
                : type === 'make-offer' ? t.submit : t.send}
            </span>
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
