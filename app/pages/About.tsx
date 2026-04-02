import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Users, Search, FileText, Lock, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../components/Button';

export const About = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language } = useApp();
  const isAr = language === 'ar';

  const content = {
    hero: {
      title: isAr ? 'لمحة عن جسور' : 'About Jusoor',
      subtitle: isAr 
        ? 'ابدأ رحلتك مع جسور بفهم عميق... نُقدّم لك لمحة واضحة عن رؤيتنا، وخدماتنا، ومميزاتنا.'
        : 'Start your journey with Jusoor by gaining a clear understanding of our vision, services, and what makes us stand out.',
    },
    trusted: {
      title: isAr ? 'منصة سعودية موثوقة لبيع وشراء الشركات والمؤسسات' : 'A Trusted Marketplace for Buying & Selling Businesses',
      desc: isAr
        ? 'جسور هي منصة سعودية مرخّصة بسجل تجاري رقم ٧٠٥٠٢٦٩٤٥٠ تهدف إلى تبسيط وتأمين عمليات بيع وشراء المنشآت. نربط المشترين الجادين بأصحاب منشآت موثقة عبر سوق موثوق مدعوم بوثائق واضحة، وخطوات صفقة متسلسلة، وتغطية ميدانية في مختلف مناطق المملكة.'
        : 'Jusoor is a licensed Saudi-born platform (Unified Number: 7050269450) built to make buying and selling businesses easier, safer, and more transparent. We connect serious buyers with verified sellers while handling all the sensitive steps in between.',
      features: [
        { icon: ShieldCheck, text: isAr ? 'التحقق من هوية المالك والسجل التجاري لكل فرصة' : 'Verified listings through commercial and identity checks' },
        { icon: FileText, text: isAr ? 'مسار آمن للصفقات يشمل توقيع اتفاقيات عدم افصاح وعقد بيع الكتروني ملزم' : 'A secure deal flow that includes signing NDA and a binding electronic sale agreement' },
        { icon: Globe, text: isAr ? 'تغطية شاملة لمختلف مناطق المملكة' : 'End-to-end support across Saudi regions' },
      ]
    },
    mission: {
      title: isAr ? 'مهمّتنا هي تمكين بيع وشراء الشركات بشكل آمن وسريع' : 'Our Mission is to Make Buying & Selling Businesses Trusted, and Fast',
      desc: isAr
        ? 'في جسور نسعى إلى تمكين الأفراد في المملكة من شراء وبيع المؤسسات والشركات بأمان وسرعة، عبر فرص موثّقة، ودفع آمن، ودعم متواصل خطوة بخطوة — كل ذلك من خلال منصة واحدة.'
        : 'We’re on a mission to empower individuals in Saudi Arabia to confidently buy and sell businesses through verified listings, secure payments, and step-by-step support — all in one platform.',
    },
    values: [
      {
        title: isAr ? 'الشفافية أولًا' : 'Transparency First',
        desc: isAr ? 'نتحقق من البيانات والمستندات الرسمية لضمان الشفافية والوضوح.' : 'Verified data, real documents, no hidden surprises.',
        icon: Search
      },
      {
        title: isAr ? 'تجربة سلسة' : 'Seamless Experience',
        desc: isAr ? 'أدوات بسيطة، خطوات واضحة، وانتقال سلس للملكية.' : 'Simple tools, clear steps, smooth business transfers.',
        icon: Users
      },
      {
        title: isAr ? 'نعتمد على الثقة' : 'Built on Trust',
        desc: isAr ? 'مدفوعات آمنة، دعم متواصل، ومستندات قانونية ملزِمة.' : 'Secure payments, ongoing admin support, legally binding documents.',
        icon: Lock
      }
    ],
    whatWeDo: {
      title: isAr ? 'ماذا نقدّم؟' : 'What We Do?',
      subtitle: isAr ? 'كيف تساعدك جسور؟' : 'How Jusoor Helps You?',
      desc: isAr 
        ? 'تعمل جسور على إعادة تعريف طريقة بيع وشراء الشركات في السعودية، عبر منصة رقمية تتيح لأصحاب الشركات عرض شركاتهم للبيع.'
        : 'Jusoor is transforming how businesses are bought and sold in Saudi Arabia. We offer a digital marketplace where verified sellers can list their businesses.',
      items: [
        { title: isAr ? 'فرص موثّقة' : 'Verified Listings', desc: isAr ? 'يتم التحقّق من كل شركة من خلال مراجعة وثائقها الرسمية، بما يشمل السجل التجاري، لضمان الموثوقية.' : 'Every business goes through document verification including CR and more — ensuring legitimacy.' },
        { title: isAr ? 'عملية بيع آمنة' : 'Secure Deal Process', desc: isAr ? 'من تقديم العروض وحتى إتمام الصفقة، نوفر نظامًا وإجراءات لحماية البائع والمشتري.' : 'From submitting offers to finalizing deals, our step-by-step system protects both buyers and sellers.' },
        { title: isAr ? 'مصمّمة للسوق السعودي' : 'Built for Saudi Market', desc: isAr ? 'حلول مخصصة لروّاد الأعمال السعوديين تشمل تصفيه بحسب المنطقة، ومستندات داعمة، ودعم فني متكامل.' : 'Tailored specifically for Saudi entrepreneurs with region-specific filters, documentation, and support.' },
      ]
    }
  };

  return (
    <div className="min-h-screen bg-white" dir={direction}>
      {/* Hero Section */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-24 relative overflow-hidden">

        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1/3 h-full bg-[#008A66]/10 blur-3xl rounded-full" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
           >
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                {content.hero.title}
              </h1>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                {content.hero.subtitle}
              </p>
           </motion.div>
        </div>
      </div>

      {/* Trusted Marketplace Section */}
      <div className="py-20 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
             <div className="relative">
                <div className="absolute -inset-4 bg-[#008A66]/5 rounded-3xl -rotate-2" />
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1000" 
                  alt="Trusted Marketplace" 
                  className="relative rounded-2xl shadow-xl w-full h-auto object-cover aspect-video"
                />
             </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
             <h2 className="text-3xl font-bold text-gray-900 leading-snug">
               {content.trusted.title}
             </h2>
             <p className="text-gray-600 leading-relaxed text-lg">
               {content.trusted.desc}
             </p>
             <div className="space-y-4 pt-4">
               {content.trusted.features.map((feature, idx) => (
                 <div key={idx} className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#008A66]/10 flex items-center justify-center flex-shrink-0 text-[#008A66]">
                     <feature.icon size={20} />
                   </div>
                   <p className="text-gray-700 font-medium pt-2">{feature.text}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gray-50 py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
             <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
               {content.mission.title}
             </h2>
             <p className="text-gray-600 text-lg leading-relaxed">
               {content.mission.desc}
             </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {content.values.map((value, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 mx-auto bg-[#008A66] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#008A66]/20 transform rotate-3">
                  <value.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="py-24 container mx-auto px-4">
         <div className="text-center mb-16">
           <span className="text-[#008A66] font-bold tracking-wider uppercase text-sm mb-2 block">{content.whatWeDo.title}</span>
           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{content.whatWeDo.subtitle}</h2>
           <p className="text-gray-600 max-w-2xl mx-auto">{content.whatWeDo.desc}</p>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            {content.whatWeDo.items.map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#008A66] to-[#005F46] rounded-2xl p-8 hover:-translate-y-2 transition-all duration-300 shadow-lg group relative overflow-hidden border border-[#007A5A]">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/15 transition-colors" />
                
                <div className="text-6xl font-black text-white/20 mb-6 relative z-10">0{idx + 1}</div>
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{item.title}</h3>
                <p className="text-green-50 leading-relaxed text-lg relative z-10">{item.desc}</p>
              </div>
            ))}
         </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-[#0A1F13] py-20 text-center relative overflow-hidden">
        {/* subtle bg glow */}
        <div className="absolute inset-0 bg-[#008A66]/10 blur-[80px] rounded-full scale-150 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <p className="text-[#34D399] text-sm font-bold uppercase tracking-widest mb-4">
            {isAr ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            {isAr
              ? <>جاهز للخطوة القادمة؟<br /><span className="text-[#34D399]">جسور تفتح لك الباب.</span></>
              : <>Ready for the next step?<br /><span className="text-[#34D399]">Jusoor opens the door.</span></>}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            {isAr
              ? 'سواء كنت تبيع أو تشتري — منصة جسور تجعل العملية آمنة وسهلة وموثوقة.'
              : 'Whether you\'re buying or selling — Jusoor makes the process safe, simple, and trusted.'}
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${direction === 'rtl' ? 'sm:flex-row-reverse' : ''}`}>
            <Button
              size="lg"
              className="bg-[#008A66] hover:bg-[#007053] text-white font-bold px-10 rounded-full shadow-lg shadow-[#008A66]/30"
              onClick={() => onNavigate?.('browse')}
            >
              {isAr ? 'استعرض الفرص' : 'Explore Businesses'}
              {direction === 'rtl'
                ? <ArrowLeft size={18} className="mr-2" />
                : <ArrowRight size={18} className="ml-2" />}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-bold px-10 rounded-full"
              onClick={() => onNavigate?.('list-business')}
            >
              {isAr ? 'اعرض شركتك' : 'List Your Business'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
