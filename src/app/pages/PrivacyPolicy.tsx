import React from 'react';
import { useApp } from '../../context/AppContext';
import { useQuery } from '@apollo/client';
import { GET_PRIVACY_POLICY } from '../../graphql/queries/business';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicy = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language } = useApp();
  const isAr = language === 'ar';

  const { data, loading } = useQuery(GET_PRIVACY_POLICY, { errorPolicy: 'all' });
  const policies: any[] = data?.getPrivacyPolicy ?? [];

  const staticSections = [
    {
      title: isAr ? '1. المعلومات التي نجمعها' : '1. Information We Collect',
      content: isAr
        ? 'نجمع المعلومات التي تقدمها مباشرةً عند إنشاء حساب أو إدراج عمل تجاري أو إجراء معاملة على منصة جسور، بما في ذلك الاسم والبريد الإلكتروني ورقم الهاتف والمعلومات المالية ذات الصلة.'
        : 'We collect information you directly provide when creating an account, listing a business, or conducting a transaction on the Jusoor platform, including name, email, phone number, and relevant financial information.',
    },
    {
      title: isAr ? '2. كيفية استخدام المعلومات' : '2. How We Use Your Information',
      content: isAr
        ? 'نستخدم المعلومات التي نجمعها لتشغيل المنصة وتحسينها، ومعالجة المعاملات، والتواصل معك، والامتثال للالتزامات القانونية، وحماية حقوق جسور والمستخدمين.'
        : 'We use the information we collect to operate and improve the platform, process transactions, communicate with you, comply with legal obligations, and protect the rights of Jusoor and its users.',
    },
    {
      title: isAr ? '3. مشاركة المعلومات' : '3. Information Sharing',
      content: isAr
        ? 'لا نبيع معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع شركاء موثوقين لتسهيل المعاملات، أو عند الاقتضاء القانوني، أو بموافقتك الصريحة.'
        : 'We do not sell your personal information to third parties. We may share information with trusted partners to facilitate transactions, when legally required, or with your explicit consent.',
    },
    {
      title: isAr ? '4. أمان البيانات' : '4. Data Security',
      content: isAr
        ? 'نطبق تدابير أمنية تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرح به أو الإفصاح أو التعديل أو الإتلاف.'
        : 'We implement appropriate technical and organizational security measures to protect your data from unauthorized access, disclosure, modification, or destruction.',
    },
    {
      title: isAr ? '5. حقوقك' : '5. Your Rights',
      content: isAr
        ? 'يحق لك الوصول إلى بياناتك الشخصية وتصحيحها وحذفها وفقاً للقوانين المعمول بها. للتواصل معنا بشأن طلبات البيانات، يرجى التواصل مع فريق الدعم.'
        : 'You have the right to access, correct, and delete your personal data in accordance with applicable laws. To contact us regarding data requests, please reach out to our support team.',
    },
  ];

  // All policy fields are stored as { content: "<html>" } by the admin ReactQuill editor.
  // Accessing .content extracts the HTML string; plain string values are handled as fallback.
  const extractHtml = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.content ?? '';
  };

  const sections = policies.length > 0
    ? policies.map((p: any) => ({
        html: isAr ? extractHtml(p.arabicPolicy) : extractHtml(p.policy),
      }))
    : null;

  return (
    <div className={`min-h-screen bg-gray-50 font-sans ${direction === 'rtl' ? 'rtl' : 'ltr'}`} dir={direction}>
      {/* Hero */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck size={14} />{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
          <p className="text-gray-400 text-lg">{isAr ? 'كيف نجمع معلوماتك ونستخدمها ونحميها' : 'How we collect, use, and protect your information'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl px-6 py-16">
        {loading ? (
          <div className="text-center py-16 text-gray-400">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="space-y-8">
            {sections
              ? /* Admin-managed HTML content */
                sections.map((section, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div
                      className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                      dir={isAr ? 'rtl' : 'ltr'}
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </div>
                ))
              : /* Static fallback sections */
                staticSections.map((section, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-black text-[#111827] mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#E6F3EF] text-[#10B981] flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      {section.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed">{section.content}</p>
                  </div>
                ))
            }
          </div>
        )}

        <div className="mt-12 p-6 bg-[#F0FDF4] rounded-2xl border border-[#10B981]/20 text-center">
          <ShieldCheck size={24} className="text-[#10B981] mx-auto mb-3" />
          <p className="text-sm text-[#008A66] font-bold">
            {isAr
              ? 'للاستفسار عن سياسة الخصوصية، تواصل مع فريق الدعم'
              : 'For privacy-related inquiries, contact our support team'}
          </p>
          <button onClick={() => onNavigate?.('support')}
            className="mt-3 px-5 py-2 bg-[#10B981] text-white rounded-xl font-bold text-sm hover:bg-[#008A66] transition-colors">
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </button>
        </div>
      </div>
    </div>
  );
};
