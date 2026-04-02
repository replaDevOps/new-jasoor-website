import React from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@apollo/client';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { HeroDashboard } from './HeroDashboard';
import { GET_ALL_BUSINESSES } from '../../graphql/queries/business';

export const Hero = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { content, direction } = useApp();
  const { data: bizData } = useQuery(GET_ALL_BUSINESSES, {
    variables: { limit: 1, offSet: 0, sort: null },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });
  const totalBusinesses = bizData?.getAllBusinesses?.totalCount ?? null;

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-[80px] overflow-hidden bg-gradient-to-b from-white to-[#F5F5F7]">
      
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#E6F7F2] to-transparent opacity-50 -z-10" />
      
      <div className="container mx-auto px-6 lg:px-20 h-full">
        {/* 
            Mobile: Flex Column (Order: Title -> Image -> Subtitle -> Buttons)
            Desktop: Grid 2 Columns. Left Col (Rows 1-4) -> Text items. Right Col (Row 1-4 span) -> Image.
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-x-16 gap-y-6 lg:gap-y-8 items-center h-full py-12">
          
          {/* 1. Title */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="order-1 lg:col-start-1 lg:row-start-1 w-full text-center lg:text-start z-10"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-[1.2] lg:leading-[1.1] text-[#111827] tracking-tight font-[Cairo]">
              {content.hero.title}
            </h1>
          </motion.div>

          {/* 2. Image (HeroDashboard) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-2 lg:col-start-2 lg:row-span-4 w-full flex justify-center lg:justify-end relative z-20 lg:my-0"
          >
            <HeroDashboard />
          </motion.div>

          {/* 3. Subtitle */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="order-3 lg:col-start-1 lg:row-start-2 w-full text-center lg:text-start z-10"
          >
            <p className="text-lg lg:text-xl text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
              {content.hero.subtitle}
            </p>
          </motion.div>

          {/* 4. Buttons */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="order-4 lg:col-start-1 lg:row-start-3 w-full flex flex-col sm:flex-row justify-center lg:justify-start gap-4 z-10"
          >
            {/* P2-FIX-BUG1: 'Explore Businesses' must go to browse, not signup */}
            <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => onNavigate?.('browse')}>
              {content.hero.cta}
            </Button>
            {/* P2-FIX-BUG2: 'Sell Your Business' must go to list-business, not browse */}
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8" onClick={() => onNavigate?.('list-business')}>
              {content.hero.ctaSecondary}
            </Button>
          </motion.div>
          
          {/* 5. Social Proof */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="order-5 lg:col-start-1 lg:row-start-4 w-full flex justify-center lg:justify-start mt-2 lg:mt-0 z-10"
          >
               <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm lg:shadow-none lg:bg-transparent lg:border-none lg:p-0">
                   <div className="flex -space-x-3 space-x-reverse">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />
                      ))}
                   </div>
                   <div className="text-sm text-start">
                     <p className="font-bold text-[#111827]">
                       {totalBusinesses != null
                         ? (content.direction === 'rtl'
                             ? `موثوق من +${totalBusinesses} شركة`
                             : `Trusted by ${totalBusinesses}+ Businesses`)
                         : content.hero.trustedBy}
                     </p>
                     <div className="flex text-[#FBAA1A] text-xs">★★★★★</div>
                   </div>
               </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};