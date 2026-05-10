import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useQuery } from '@apollo/client';
import { GET_NDA_TERMS } from '../../../graphql/queries/business';

interface ENDAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  buyerName?: string;
}

export const ENDAModal = ({ isOpen, onClose, onConfirm, buyerName }: ENDAModalProps) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [agreements, setAgreements] = useState({
    nda: false,
    terms: false,
    commission: false,
  });

  // Load admin-managed E-NDA text. All fields are stored as { content: "<html>" }.
  const { data: ndaData, loading: ndaLoading } = useQuery(GET_NDA_TERMS, {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });
  const ndaTerms: any[] = ndaData?.getNDATerms ?? [];
  // Find the record that has English content, and the one that has Arabic content.
  const ndaHtmlEn = ndaTerms.find((t: any) => t.ndaTerm?.content)?.ndaTerm?.content ?? '';
  const ndaHtmlAr = ndaTerms.find((t: any) => t.arabicNdaTerm?.content)?.arabicNdaTerm?.content ?? '';
  const ndaHtml = isAr ? ndaHtmlAr : ndaHtmlEn;

  const defaultBuyer = isAr ? 'المشتري' : 'Buyer';
  const displayName = buyerName || defaultBuyer;

  const t = {
    title:            isAr ? 'توقيع اتفاقية السرية الإلكترونية' : 'Sign E-NDA',
    intro:            isAr
      ? `للمتابعة، يرجى الموافقة على البنود التالية، عزيزي ${displayName}...`
      : `To proceed, please agree to the following terms, dear ${displayName}...`,
    // Hardcoded fallback sections shown only when no admin content is available yet
    section1Title:    isAr ? '١. السرية والخصوصية'              : '1. Confidentiality',
    section1Body:     isAr
      ? 'يلتزم الطرف الثاني (المشتري) بالحفاظ على سرية المعلومات المقدمة من الطرف الأول (البائع) وعدم الإفصاح عنها لأي طرف ثالث دون موافقة خطية مسبقة.'
      : 'The Second Party (Buyer) is committed to maintaining the confidentiality of the information provided by the First Party (Seller) and not disclosing it to any third party without written consent.',
    section2Title:    isAr ? '٢. عمولة المنصة'                  : '2. Platform Commission',
    section2Body:     isAr
      ? 'يوافق المشتري على دفع عمولة منصة جسور المعتمدة في حال إتمام الصفقة، وفقًا لشرائح العمولة السارية على المنصة وقت إبرام الاتفاقية.'
      : 'The Buyer agrees to pay the applicable Jusoor platform commission in case the deal is finalized, as per the active commission brackets at the time this agreement is signed.',
    section3Title:    isAr ? '٣. شروط وأحكام جسور'              : '3. Jusoor Terms & Conditions',
    section3Body:     isAr
      ? 'بقبول هذه الاتفاقية، تقر بأنك قرأت ووافقت على جميع شروط وأحكام استخدام منصة جسور.'
      : 'By accepting this agreement, you acknowledge that you have read and agreed to all terms and conditions of using Jusoor platform.',
    agree1:           isAr ? 'أوافق على بنود اتفاقية السرية الإلكترونية من جسور'    : 'I agree to the Jusoor E-NDA Terms',
    agree2:           isAr ? 'أقبل شروط وأحكام منصة جسور'                          : 'I accept Jusoor\'s platform Terms and Conditions',
    agree3:           isAr ? 'أوافق على دفع عمولة المنصة في حال إتمام الصفقة'       : 'I agree to pay the platform commission if a deal is finalized',
    confirm:          isAr ? 'تأكيد وتوقيع'                                         : 'Confirm & Sign',
    cancel:           isAr ? 'إلغاء'                                                : 'Cancel',
    loading:          isAr ? 'جارٍ تحميل بنود الاتفاقية...'                         : 'Loading agreement terms...',
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
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="lg">
      <div className="space-y-6">
        <p className="text-gray-600 text-sm">{t.intro}</p>

        {/* NDA Contract Text — admin-managed via E-NDA editor, falls back to static copy */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-56 overflow-y-auto custom-scrollbar text-sm leading-relaxed text-gray-700" dir={isAr ? 'rtl' : 'ltr'}>
          {ndaLoading ? (
            <p className="text-gray-400 text-center pt-10">{t.loading}</p>
          ) : ndaHtml ? (
            // Admin rich-text content (ReactQuill HTML) — safe source is admin-only editor
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: ndaHtml }}
            />
          ) : (
            // Fallback: hardcoded static sections when no admin content is available
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.section1Title}</h4>
                <p>{t.section1Body}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.section2Title}</h4>
                <p>{t.section2Body}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.section3Title}</h4>
                <p>{t.section3Body}</p>
              </div>
            </div>
          )}
        </div>

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
          <Button onClick={onConfirm} disabled={!allAgreed} className="flex-1">
            {t.confirm}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
