import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { DollarSign } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

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

  const t = {
    titleMakeOffer:    isAr ? 'تقديم عرض'              : 'Make an Offer',
    titleCounter:      isAr ? 'عرض مضاد'               : 'Counter Offer',
    labelMakeOffer:    isAr ? 'مبلغ العرض (ر.س)'       : 'Offer Amount (SAR)',
    labelCounter:      isAr ? 'مبلغ العرض المضاد (ر.س)': 'Counter Offer Amount (SAR)',
    commission:        isAr ? 'عمولة المنصة (2.5٪)'    : 'Platform Commission (2.5%)',
    totalValue:        isAr ? 'القيمة الإجمالية'        : 'Total Value',
    commissionNote:    isAr ? '* يشمل عمولة منصة جسور' : '* Includes Jusoor platform commission',
    submit:            isAr ? 'إرسال العرض'             : 'Submit Offer',
    send:              isAr ? 'إرسال'                   : 'Send',
    cancel:            isAr ? 'إلغاء'                   : 'Cancel',
    sar:               isAr ? 'ر.س'                     : 'SAR',
    placeholder:       isAr ? '٠٫٠٠'                   : '0.00',
  };

  const handleSubmit = () => {
    onSubmit(amount);
    onClose();
  };

  const commission = parseFloat(amount) * 0.025 || 0;
  const total = parseFloat(amount) + commission || 0;

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
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-colors dir-ltr text-left"
              placeholder={t.placeholder}
            />
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {type === 'make-offer' && (
          <div className="bg-[#E6F3EF] p-4 rounded-xl space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t.commission}</span>
              <span className="dir-ltr">{commission.toLocaleString()} {t.sar}</span>
            </div>
            <div className="flex justify-between font-bold text-[#008A66] pt-3 border-t border-[#008A66]/10">
              <span>{t.totalValue}</span>
              <span className="dir-ltr">{total.toLocaleString()} {t.sar}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.commissionNote}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} className="flex-1">
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
