import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollText, ShieldAlert, Scale, FileCheck } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_TERMS } from '../../graphql/queries/business';

export const Terms = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language } = useApp();
  const isAr = language === 'ar';

  // R-09 FIX: load real terms from API (getTerms returns [Terms!]! array)
  const { data, loading } = useQuery(GET_TERMS, { errorPolicy: 'all' });
  const apiTerms: any[] = data?.getTerms ?? [];

  // Static fallback sections shown while loading or if API has no data yet
  const staticSections = [
    {
      title: isAr ? '1. مقدمة' : '1. Introduction',
      content: isAr
        ? 'مرحباً بكم في منصة جسور. تحكم هذه الشروط والأحكام استخدامك للموقع والخدمات المقدمة من خلاله. بإنشاء حساب أو استخدام المنصة، فإنك توافق على الالتزام بهذه الشروط.'
        : 'Welcome to Jusoor platform. These terms and conditions govern your use of the website and services provided through it. By creating an account or using the platform, you agree to be bound by these terms.',
    },
    {
      title: isAr ? '2. أهلية الاستخدام' : '2. Eligibility',
      content: isAr
        ? 'يجب أن يكون عمرك 18 عاماً على الأقل لاستخدام هذه المنصة. يجب أن تكون جميع المعلومات المقدمة عند التسجيل دقيقة وحديثة. تحتفظ جسور بالحق في تعليق أو إنهاء حسابك إذا تم اكتشاف أي معلومات خاطئة.'
        : 'You must be at least 18 years old to use this platform. All information provided upon registration must be accurate and current. Jusoor reserves the right to suspend or terminate your account if any false information is discovered.',
    },
    {
      title: isAr ? '3. قوائم الأعمال والتحقق' : '3. Business Listings & Verification',
      content: isAr
        ? 'تخضع جميع القوائم المدرجة لعملية تحقق صارمة. نحن نتحقق من السجل التجاري والهوية لضمان الموثوقية. ومع ذلك، لا تضمن جسور نجاح أي صفقة تجارية، ويتحمل المستخدمون مسؤولية العناية الواجبة الخاصة بهم.'
        : 'All listings are subject to a strict verification process. We verify the Commercial Registration and identity to ensure authenticity. However, Jusoor does not guarantee the success of any business transaction, and users are responsible for their own due diligence.',
    },
    {
      title: isAr ? '4. الرسوم والمدفوعات' : '4. Fees & Payments',
      content: isAr
        ? 'قد تفرض جسور رسوماً على خدمات معينة مثل إدراج الأعمال المميزة أو إتمام الصفقات. سيتم الإفصاح عن جميع الرسوم بوضوح قبل الدفع. جميع المدفوعات غير قابلة للاسترداد ما لم ينص على خلاف ذلك.'
        : 'Jusoor may charge fees for certain services such as premium listings or closing deals. All fees will be clearly disclosed prior to payment. All payments are non-refundable unless stated otherwise.',
    },
    {
      title: isAr ? '5. الملكية الفكرية' : '5. Intellectual Property',
      content: isAr
        ? 'جميع المحتويات والعلامات التجارية والشعارات الموجودة على المنصة هي ملك لشركة جسور أو مرخصيها. يمنع نسخ أو إعادة توزيع أي جزء من الموقع دون إذن كتابي مسبق.'
        : 'All content, trademarks, and logos on the platform are the property of Jusoor or its licensors. Copying or redistributing any part of the site without prior written permission is prohibited.',
    },
    {
      title: isAr ? '6. إخلاء المسؤولية' : '6. Disclaimer',
      content: isAr
        ? 'يتم توفير الخدمات "كما هي" دون أي ضمانات. لا تتحمل جسور المسؤولية عن أي خسائر مالية أو أضرار ناتجة عن استخدام المنصة أو الاعتماد على المعلومات الواردة فيها.'
        : 'Services are provided "as is" without any warranties. Jusoor is not liable for any financial losses or damages resulting from the use of the platform or reliance on the information contained therein.',
    },
  ];

  // All term fields are stored as { content: "<html>" } by the admin ReactQuill editor.
  const extractHtml = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.content ?? '';
  };

  // Map API terms array → display sections
  const apiSections = apiTerms.map((item: any) => ({
    html: isAr
      ? extractHtml(item.arabicTerm) || extractHtml(item.term)
      : extractHtml(item.term),
  }));

  const useApi = apiSections.length > 0;

  const t = {
    title: isAr ? 'الشروط والأحكام' : 'Terms of Use',
    lastUpdated: isAr ? 'آخر تحديث: 01 مارس 2026' : 'Last Updated: March 1, 2026',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir={direction}>
      {/* Header */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#008A66]/10 text-[#008A66] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ScrollText size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.title}</h1>
            <p className="text-gray-300 font-medium">{t.lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">

          {loading ? (
            <div className="space-y-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-48 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-50 rounded w-full" />
                    <div className="h-4 bg-gray-50 rounded w-5/6" />
                    <div className="h-4 bg-gray-50 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {useApi
                ? /* Admin-managed HTML — each section is full rich-text from ReactQuill */
                  apiSections.map((section, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className="prose prose-lg max-w-none text-gray-600 leading-8 text-justify"
                        dir={isAr ? 'rtl' : 'ltr'}
                        dangerouslySetInnerHTML={{ __html: section.html }}
                      />
                    </div>
                  ))
                : /* Static fallback */
                  staticSections.map((section, idx) => (
                    <div key={idx} className="relative">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                      <p className="text-gray-600 leading-8 text-lg text-justify">{section.content}</p>
                    </div>
                  ))
              }
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-gray-100 grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <ShieldAlert className="text-[#008A66]" size={20} />
              <span>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <Scale className="text-[#008A66]" size={20} />
              <span>{isAr ? 'القانون المعمول به' : 'Governing Law'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FileCheck className="text-[#008A66]" size={20} />
              <span>{isAr ? 'حقوق المستخدم' : 'User Rights'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
