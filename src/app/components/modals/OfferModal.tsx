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
  onSubmit: (amount: string) => void;
}

export const OfferModal = ({ isOpen, onClose, type, onSubmit }: OfferModalProps) => {
  const { language } = useApp();
  const [amount, setAmount] = useState('');
  const isAr = language === 'ar';

  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  // Live commission from backend — only fires for make-offer with a valid amount
  const { data: commissionData, loading: commissionLoading } = useQuery(PREVIEW_COMMISSION, {
    variables: { price: validAmount ? parsedAmount : 0 },
    skip: type !== 'make-offer' || !validAmount,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const commission: number = commissionData?.previewCommission ?? 0;
  const total = validAmount ? parsedAmount + commission : 0;

  const t = {
    titleMakeOffer:    isAr ? 'تقديم عرض'              : 'Make an Offer',
    titleCounter:      isAr ? 'عرض مضاد'               : 'Counter Offer',
    labelMakeOffer:    isAr ? 'مبلغ العرض (ر.س)'       : 'Offer Amount (SAR)',
    labelCounter:      isAr ? 'مبلغ العرض المضاد (ر.س)': 'Counter Offer Amount (SAR)',
    commission:        isAr ? 'عمولة المنصة'            : 'Platform Commission',
    totalValue:        isAr ? 'القيمة الإجمالية'        : 'Total Value',
    commissionNote:    isAr ? '* يشمل عمولة منصة جسور' : '* Includes Jusoor platform commission',
    calculating:       isAr ? 'جارٍ الحساب...'          : 'Calculating...',
    submit:            isAr ? 'إرسال العرض'             : 'Submit Offer',
    send:              isAr ? 'إرسال'                   : 'Send',
    cancel:            isAr ? 'إلغاء'                   : 'Cancel',
    sar:               isAr ? 'ر.س'                     : 'SAR',
    placeholder:       isAr ? '٠٫٠٠'                   : '0.00',
  };

  const handleSubmit = () => {
    onSubmit(amount);
    setAmount('');
    onClose();
  };

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
            />
          </div>
        </div>

        {type === 'make-offer' && validAmount && (
          <div className="bg-[#E6F3EF] p-4 rounded-xl space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t.commission}</span>
              <span className="dir-ltr">
                {commissionLoading
                  ? t.calculating
                  : `${commission.toLocaleString(isAr ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB')} ${t.sar}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#008A66] pt-3 border-t border-[#008A66]/10">
              <span>{t.totalValue}</span>
              <span className="dir-ltr">
                {commissionLoading
                  ? t.calculating
                  : `${total.toLocaleString(isAr ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB')} ${t.sar}`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.commissionNote}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} className="flex-1" disabled={!validAmount}>
            {type === 'make-offer' ? t.submit : t.send}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
