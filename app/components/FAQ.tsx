import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useQuery } from '@apollo/client';
import { GET_FAQ } from '../../graphql/queries/business';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ArrowRight, HelpCircle, MessageCircle } from 'lucide-react';
import { Button } from './Button';

export const FAQ = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { content, direction, language } = useApp();
  const isAr = language === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // BUG-8 FIX: load FAQs from API, fall back to static content if empty
  const { data: faqData } = useQuery(GET_FAQ, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const apiFaqs: { id: string; question: string; arabicQuestion: string; answer: string; arabicAnswer: string; isArabic: boolean }[] =
    faqData?.getFAQs?.faqs ?? [];
  // Filter by isArabic field — matches how admin panel stores FAQs (mirrors old frontend)
  const filteredFaqs = apiFaqs.length > 0
    ? apiFaqs.filter(f => f.isArabic === isAr || (f.arabicQuestion && f.question))
    : [];
  const allFaqItems = filteredFaqs.length > 0
    ? filteredFaqs.map(f => ({ q: isAr ? (f.arabicQuestion || f.question) : f.question, a: isAr ? (f.arabicAnswer || f.answer) : f.answer }))
    : content.faq.items.map((item: any) => ({ q: item.q, a: item.a }));
  const faqItems = allFaqItems.slice(0, 4);

  return (
    <section className="py-12 md:py-24 bg-gray-50 overflow-hidden" id="faq">
      <div className="container mx-auto px-6 lg:px-20">
        
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Header Column */}
          <div className="lg:w-5/12 sticky top-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008A66]/10 text-[#008A66] text-xs font-bold uppercase tracking-wider mb-6">
              <HelpCircle size={14} />
              <span>{content.sections.faq}</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-[#111827] mb-6 leading-tight">
              {content.faq.headline}
              <br />
              <span className="text-gray-400">
                {content.faq.subheadline}
              </span>
            </h2>
            
            <p className="text-gray-500 mb-8 text-lg leading-relaxed">
              {content.faq.description}
            </p>
            
            <div className="hidden lg:flex flex-col gap-4">
                <Button variant="primary" className="w-fit flex items-center gap-2 group" onClick={() => onNavigate?.('support')}>
                  {content.faq.cta}
                  {direction === 'rtl' ? <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </Button>
                
                <div className="flex items-center gap-3 mt-4 text-sm text-gray-500 font-medium">
                    <MessageCircle size={18} className="text-[#008A66]" />
                    <span>
                        {content.faq.notFound}
                        <button onClick={() => onNavigate?.('support')} className="text-[#008A66] underline hover:text-[#006C4F] transition-colors font-medium bg-transparent border-none p-0 cursor-pointer">
                            {content.buttons.contact}
                        </button>
                    </span>
                </div>
            </div>
          </div>

          {/* Accordion Column */}
          <div className="lg:w-7/12 w-full">
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div 
                  key={index}
                  className={`group rounded-2xl transition-all duration-300 ${
                      openIndex === index 
                      ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#008A66]/20' 
                      : 'bg-white border border-transparent hover:border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full flex items-start justify-between p-6 md:p-8 text-start focus:outline-none"
                  >
                    <div className="flex gap-4">
                        <span className={`text-xl font-bold transition-colors duration-300 ${openIndex === index ? 'text-[#008A66]' : 'text-[#111827] group-hover:text-[#008A66]'}`}>
                            0{index + 1}
                        </span>
                        <span className={`text-lg md:text-xl font-bold transition-colors duration-300 ${openIndex === index ? 'text-[#111827]' : 'text-[#111827]'}`}>
                            {item.q}
                        </span>
                    </div>
                    
                    <span className={`flex-shrink-0 ml-4 p-2 rounded-full transition-all duration-300 ${
                        openIndex === index 
                        ? 'bg-[#008A66] text-white rotate-180' 
                        : 'bg-gray-50 text-gray-400 group-hover:bg-[#008A66]/10 group-hover:text-[#008A66]'
                    }`}>
                      {openIndex === index ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 md:px-8 pb-8 pt-0 pl-[4.5rem] md:pl-[5rem] rtl:pr-[4.5rem] rtl:md:pr-[5rem] rtl:pl-6 text-gray-500 leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="mt-10 lg:hidden flex flex-col items-center gap-4">
              <Button variant="primary" className="w-full justify-center" onClick={() => onNavigate?.('support')}>
                {content.faq.cta}
              </Button>
               <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageCircle size={16} className="text-[#008A66]" />
                    <span>
                        {content.faq.notFound}
                        <button onClick={() => onNavigate?.('support')} className="text-[#008A66] font-bold bg-transparent border-none p-0 cursor-pointer">
                            {content.buttons.contact}
                        </button>
                    </span>
                </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};