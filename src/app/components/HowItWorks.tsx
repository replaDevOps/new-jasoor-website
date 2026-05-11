import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';
import { User, Store, FileText, ShieldCheck, Mail, CheckCircle, Search, CreditCard, FileSignature } from 'lucide-react';
import { Card } from './Card';
import logoWatermark from '../../assets/logo-navbar.svg';

export const HowItWorks = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { content } = useApp();
  const [activeTab, setActiveTab] = useState<'seller' | 'buyer'>('seller');

  const tabs = [
    { id: 'seller', label: content.howItWorks.seller.title, icon: <Store className="w-4 h-4" /> },
    { id: 'buyer', label: content.howItWorks.buyer.title, icon: <User className="w-4 h-4" /> }
  ] as const;

  const sellerIcons = [
    <FileText className="w-6 h-6 text-white" />,
    <ShieldCheck className="w-6 h-6 text-white" />,
    <Mail className="w-6 h-6 text-white" />,
    <CheckCircle className="w-6 h-6 text-white" />
  ];

  const buyerIcons = [
    <Search className="w-6 h-6 text-white" />,
    <CreditCard className="w-6 h-6 text-white" />,
    <FileSignature className="w-6 h-6 text-white" />,
    <CheckCircle className="w-6 h-6 text-white" />
  ];

  const currentSteps = content.howItWorks[activeTab].steps;
  const currentIcons = activeTab === 'seller' ? sellerIcons : buyerIcons;

  return (
    <section className="pt-12 pb-20 md:pb-24 bg-transparent overflow-hidden" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="bg-[#173401] rounded-[2.5rem] py-8 md:py-16 px-5 md:px-12 lg:px-20 relative overflow-hidden">
          
          <div className="text-center mb-8 md:mb-16 relative z-10">
            <h2 className="text-4xl font-bold text-white mb-2">
              {content.sections.howItWorks}
            </h2>
            <h3 
              className="text-xl md:text-2xl text-gray-300 font-medium mb-8"
              dangerouslySetInnerHTML={{ __html: content.howItWorks.subheadline }}
            />
            
            {/* Custom Tabs */}
            <div className="inline-flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-sm relative z-0 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 z-10 ${
                    activeTab === tab.id ? 'text-[#173401]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-full -z-10 shadow-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-h-[450px] z-10">
             <AnimatePresence mode='wait'>
              <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                  {currentSteps.map((step, index) => (
                    <div key={`${activeTab}-${index}`} className="w-full">
                      <Card 
                        variant="branded"
                        title={step.title}
                        description={step.desc}
                        icon={currentIcons[index]}
                        watermarkImage={logoWatermark}
                        className="h-full w-full"
                      />
                    </div>
                  ))}
              </motion.div>
             </AnimatePresence>
          </div>

          <div className="mt-8 text-center relative z-10">
            <Button size="lg" className="px-12" onClick={() => onNavigate?.('signup')}>
              {content.howItWorks.cta}
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};
