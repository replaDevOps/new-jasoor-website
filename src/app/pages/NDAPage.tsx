import React from 'react';
import { useApp } from '../../context/AppContext';
import { useQuery } from '@apollo/client';
import { GET_NDA_TERMS } from '../../graphql/queries/business';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NDAPageProps {
  onNavigate?: (page: string, id?: string | number) => void;
}

/**
 * Full NDA reading page.
 *
 * Accessed via the "Read full NDA" link in ENDAModal. Before navigating here,
 * BusinessDetails writes the return context to sessionStorage under the key
 * 'nda_return': { businessId, pendingAction }.
 *
 * The "Back to continue" button reads that context and navigates back to the
 * listing details page, which auto-reopens the NDA modal to complete signing.
 */
export const NDAPage = ({ onNavigate }: NDAPageProps) => {
  const { language, direction } = useApp();
  const isAr = language === 'ar';

  const { data: ndaData, loading: ndaLoading } = useQuery(GET_NDA_TERMS, {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const ndaTerms: any[] = ndaData?.getNDATerms ?? [];
  const ndaHtmlEn = ndaTerms.find((t: any) => t.ndaTerm?.content)?.ndaTerm?.content ?? '';
  const ndaHtmlAr = ndaTerms.find((t: any) => t.arabicNdaTerm?.content)?.arabicNdaTerm?.content ?? '';
  const ndaHtml = isAr ? ndaHtmlAr : ndaHtmlEn;

  const t = {
    title:        isAr ? 'اتفاقية عدم الإفصاح (E-NDA)'         : 'Non-Disclosure Agreement (E-NDA)',
    subtitle:     isAr ? 'منصة جسور للاستحواذ على الأعمال'       : 'Jusoor Business Acquisition Platform',
    loading:      isAr ? 'جارٍ تحميل نص الاتفاقية...'           : 'Loading agreement text...',
    back:         isAr ? 'العودة للمتابعة'                        : 'Back to continue',
    noContent:    isAr
      ? 'لا يتوفر نص الاتفاقية حالياً. يرجى التواصل مع الدعم.'
      : 'Agreement text is not available at this time. Please contact support.',
  };

  const handleBack = () => {
    try {
      const raw = sessionStorage.getItem('nda_return');
      if (raw) {
        const { businessId } = JSON.parse(raw);
        // Navigate back to the listing — BusinessDetails will see nda_return in
        // sessionStorage and auto-reopen the NDA modal.
        onNavigate?.('details', businessId);
        return;
      }
    } catch {
      // Corrupted sessionStorage entry — fall through to browse
    }
    onNavigate?.('browse');
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={direction}>
      {/* Header bar */}
      <div className="bg-[#0A1F13] text-white">
        <div className="container mx-auto px-4 md:px-6 py-5 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <BackIcon size={18} />
            {t.back}
          </button>
          <div className={`h-5 w-px bg-white/20 ${isAr ? 'mr-auto' : 'ml-auto'}`} />
          <div className="text-right">
            <p className="text-xs text-white/50">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-8">{t.title}</h1>

        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-10">
          {ndaLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">{t.loading}</span>
            </div>
          ) : ndaHtml ? (
            <div
              className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed"
              dir={isAr ? 'rtl' : 'ltr'}
              dangerouslySetInnerHTML={{ __html: ndaHtml }}
            />
          ) : (
            <p className="text-gray-500 text-sm text-center py-10">{t.noContent}</p>
          )}
        </div>

        {/* Back button at bottom */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#008A66] text-white font-bold rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
          >
            <BackIcon size={18} />
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
};
