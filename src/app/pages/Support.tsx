import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, ChevronDown, ChevronUp, Send, Twitter, Linkedin, Instagram, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CONTACT } from '../../graphql/mutations/business';
import { GET_USER_DETAILS } from '../../graphql/queries/dashboard';
import { GET_FAQ } from '../../graphql/queries/business';
import { toast } from 'sonner';

export const Support = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language, isLoggedIn, userId } = useApp();
  const isAr = language === 'ar';
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [createContact, { loading: sending }] = useMutation(CREATE_CONTACT, { errorPolicy: 'all' });

  // Autofill name/email if user is logged in
  const { data: userData } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !isLoggedIn || !userId,
    errorPolicy: 'all',
  });
  useEffect(() => {
    const u = userData?.getUserDetails;
    if (u) {
      if (u.fullName && !contactName) setContactName(u.fullName);
      if (u.email && !contactEmail) setContactEmail(u.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    try {
      await createContact({ variables: { input: { name: contactName, email: contactEmail, message: contactMessage } } });
      toast.success(isAr ? 'تم استلام رسالتك بنجاح، سنرد عليك قريباً.' : 'Your message has been received, we will reply shortly.');
      setContactMessage('');
    } catch (err: any) {
      toast.error(err?.graphQLErrors?.[0]?.message || (isAr ? 'حدث خطأ' : 'Something went wrong'));
    }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const t = {
    title: isAr ? 'تواصل مع جسور' : 'Contact With Jusoor',
    subtitle: isAr ? 'فريقنا جاهز للإجابة على استفساراتك ومساعدتك في كل خطوة.' : 'Our team is ready to answer your questions and help you every step of the way.',
    form: {
        namePlaceholder: isAr ? 'الاسم' : 'Name',
        emailPlaceholder: isAr ? 'البريد الإلكتروني' : 'Email',
        messagePlaceholder: isAr ? 'الرسالة' : 'Message',
        submit: isAr ? 'إرسال' : 'Submit',
        success: isAr ? 'تم استلام رسالتك بنجاح، سنرد عليك قريباً.' : 'Your message has been received, we will reply shortly.'
    },
    faqTitle: isAr ? 'الأسئلة الأكثر تكراراً' : 'Frequently Asked Questions',
    socialTitle: isAr ? 'تابعنا على' : 'Follow Us',
    contactInfo: isAr ? 'معلومات التواصل' : 'Contact Information',
  };

  // Load all FAQs from API — full list for support page (no limit)
  const { data: faqApiData } = useQuery(GET_FAQ, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const apiFaqItems = faqApiData?.getFAQs?.faqs ?? [];
  const FAQS = apiFaqItems.length > 0
    ? apiFaqItems
        .filter((f: any) => f.isArabic === isAr || (f.arabicQuestion && f.question))
        .map((f: any) => ({
          q: isAr ? (f.arabicQuestion || f.question) : f.question,
          a: isAr ? (f.arabicAnswer || f.answer) : f.answer,
        }))
    : [
        { q: isAr ? "كيف تضمن جسور سرية المعلومات؟" : "How does Jusoor ensure confidentiality?", a: isAr ? "نستخدم اتفاقيات عدم إفصاح صارمة (NDA) وتشفير للبيانات لضمان سرية جميع الأطراف." : "We use strict NDAs and data encryption to ensure confidentiality for all parties." },
        { q: isAr ? "ما هي رسوم استخدام المنصة؟" : "What are the platform fees?", a: isAr ? "تختلف الرسوم بناءً على نوع الصفقة وحجمها، يمكنك الاطلاع على صفحة الرسوم للتفاصيل." : "Fees vary based on deal type and size. Check our pricing page for details." },
        { q: isAr ? "كم تستغرق عملية البيع؟" : "How long does the selling process take?", a: isAr ? "تعتمد المدة على جاهزية الأوراق وسرعة التفاوض، وتتراوح عادة بين أسبوعين إلى شهرين." : "It depends on documentation readiness and negotiation speed, usually 2-8 weeks." },
        { q: isAr ? "هل يمكنني بيع حصة من الشركة فقط؟" : "Can I sell only a share of the business?", a: isAr ? "نعم، تتيح جسور خيار بيع حصص أو شراكات استراتيجية." : "Yes, Jusoor allows selling shares or strategic partnerships." },
        { q: isAr ? "كيف يتم تقييم الشركات؟" : "How are businesses valued?", a: isAr ? "نعتمد على معايير مالية وتشغيلية دقيقة لتقديم تقييم عادل يعكس قيمة الشركة الحقيقية في السوق." : "We rely on accurate financial and operational standards to provide a fair valuation." },
      ];

  const SOCIALS = [
    { icon: Twitter, label: 'X (Twitter)', href: '#', color: 'bg-black text-white' },
    { icon: Instagram, label: 'Instagram', href: '#', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white' },
    { icon: Linkedin, label: 'LinkedIn', href: '#', color: 'bg-[#0077b5] text-white' },
    { icon: Mail, label: 'Email', href: 'mailto:info@jusoor.sa', color: 'bg-gray-600 text-white' },
    { icon: MessageCircle, label: 'WhatsApp', href: '#', color: 'bg-[#25D366] text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir={direction}>
      {/* Header */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-20">
         <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t.title}</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.subtitle}</p>
         </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
         <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form & Info */}
            <div className="lg:col-span-1 space-y-6">
               {/* Form Card */}
               <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t.contactInfo}</h3>
                  
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.namePlaceholder}</label>
                        <input
                           type="text"
                           value={contactName}
                           onChange={e => setContactName(e.target.value)}
                           placeholder={t.form.namePlaceholder}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.emailPlaceholder}</label>
                        <input
                           type="email"
                           value={contactEmail}
                           onChange={e => setContactEmail(e.target.value)}
                           placeholder={t.form.emailPlaceholder}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] transition-colors dir-ltr"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.messagePlaceholder}</label>
                        <textarea 
                           value={contactMessage}
                           onChange={e => setContactMessage(e.target.value)}
                           placeholder={t.form.messagePlaceholder}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-[#008A66] transition-colors resize-none"
                        ></textarea>
                     </div>
                     <button type="submit" disabled={sending} className="w-full bg-[#008A66] text-white font-bold py-3.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20 flex items-center justify-center gap-2 disabled:opacity-60">
                        <span>{sending ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : t.form.submit}</span>
                        <Send size={18} />
                     </button>
                  </form>
               </div>

               {/* Social Media */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t.socialTitle}</h3>
                  <div className="flex flex-wrap gap-3">
                     {SOCIALS.map((social, idx) => (
                        <a 
                           key={idx} 
                           href={social.href} 
                           className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm", social.color)}
                           title={social.label}
                        >
                           <social.icon size={20} />
                        </a>
                     ))}
                  </div>
               </div>
            </div>

            {/* FAQ Section */}
            <div className="lg:col-span-2">
               <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                     <span className="w-2 h-8 bg-[#008A66] rounded-full block"></span>
                     {t.faqTitle}
                  </h3>
                  
                  <div className="space-y-4">
                     {FAQS.map((faq, idx) => (
                        <div 
                           key={idx} 
                           className={cn(
                              "border rounded-xl transition-all duration-300 overflow-hidden",
                              openFaq === idx ? "border-[#008A66] bg-[#008A66]/5" : "border-gray-100 hover:border-gray-200"
                           )}
                        >
                           <button 
                              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                              className="w-full flex items-center justify-between p-5 text-start"
                           >
                              <span className={cn("font-bold text-lg", openFaq === idx ? "text-[#008A66]" : "text-gray-800")}>
                                 {faq.q}
                              </span>
                              {openFaq === idx ? <ChevronUp className="text-[#008A66]" /> : <ChevronDown className="text-gray-400" />}
                           </button>
                           <AnimatePresence>
                              {openFaq === idx && (
                                 <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                 >
                                    <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-[#008A66]/10 mt-2">
                                       {faq.a}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
