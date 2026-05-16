import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { Check, ExternalLink } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface ENDAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onReadNDA?: () => void;   // opens the full NDA page, preserving return context
  buyerName?: string;
  loading?: boolean;
}

export const ENDAModal = ({ isOpen, onClose, onConfirm, onReadNDA, buyerName, loading = false }: ENDAModalProps) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [agreements, setAgreements] = useState({
    nda: false,
    terms: false,
    commission: false,
  });

  const defaultBuyer = isAr ? 'المشتري' : 'Buyer';
  const displayName = buyerName || defaultBuyer;

  const t = {
    title:           isAr ? 'توقيع اتفاقية السرية الإلكترونية' : 'Sign E-NDA',
    intro:           isAr
      ? `عزيزي ${displayName}، للمتابعة يرجى الاطلاع على اتفاقية السرية والموافقة على البنود التالية.`
      : `Dear ${displayName}, to proceed please review the non-disclosure agreement and agree to the terms below.`,
    readNDA:         isAr ? 'قراءة اتفاقية السرية كاملة'       : 'Read full NDA',
    agree1:          isAr ? 'أوافق على بنود اتفاقية السرية الإلكترونية من جسور'    : 'I agree to the Jusoor E-NDA Terms',
    agree2:          isAr ? 'أقبل شروط وأحكام منصة جسور'                          : 'I accept Jusoor\'s platform Terms and Conditions',
    agree3:          isAr ? 'أوافق على دفع عمولة المنصة في حال إتمام الصفقة'       : 'I agree to pay the platform commission if a deal is finalized',
    confirm:         isAr ? 'قبول'                                                  : 'Accept',
    cancel:          isAr ? 'إلغاء'                                                : 'Cancel',
  };

  const allAgreed = agreements.nda && agreements.terms && agreements.commission;

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
          checked ? 'bg-[#008A66] border-[#008A66]' : 'border-gray-300 group-hover:border-[#008A66]'
        }`}
      >
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className="text-sm text-gray-700 leading-relaxed">{label}</span>
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
      <div className="space-y-6">

        {/* Short intro */}
        <p className="text-gray-600 text-sm leading-relaxed">{t.intro}</p>

        {/* Read full NDA link */}
        {onReadNDA && (
          <button
            onClick={onReadNDA}
            className="inline-flex items-center gap-1.5 text-[#008A66] hover:text-[#007053] text-sm font-bold underline underline-offset-2 transition-colors"
          >
            <ExternalLink size={14} />
            {t.readNDA}
          </button>
        )}

        {/* Checkboxes */}
        <div className="space-y-4 pt-2">
          <Checkbox
            checked={agreements.nda}
            onChange={() => setAgreements(a => ({ ...a, nda: !a.nda }))}
            label={t.agree1}
          />
          <Checkbox
            checked={agreements.terms}
            onChange={() => setAgreements(a => ({ ...a, terms: !a.terms }))}
            label={t.agree2}
          />
          <Checkbox
            checked={agreements.commission}
            onChange={() => setAgreements(a => ({ ...a, commission: !a.commission }))}
            label={t.agree3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button onClick={onConfirm} disabled={!allAgreed || loading} className="flex-1">
            {loading ? (isAr ? 'جاري التوقيع...' : 'Signing...') : t.confirm}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            {t.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
