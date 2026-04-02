import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from './Card';
import { motion } from 'motion/react';
import { ShieldCheck, Check, Lock, Users } from 'lucide-react';

export const Features = () => {
  const { content } = useApp();

  // Images mapped to features by index to ensure relevance - Green/Dark Theme
  const featureImages = [
    "https://images.unsplash.com/photo-1646444881469-1982aab3e7bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGJhY2tncm91bmQlMjBzZWN1cml0eSUyMHNoaWVsZCUyMHByb3RlY3Rpb24lMjBnZW9tZXRyaWN8ZW58MXx8fHwxNzcwMjM5NDUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1537796038586-f12d685bee03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGJhY2tncm91bmQlMjBnZW9tZXRyaWMlMjB0ZWNobm9sb2d5JTIwbHV4dXJ5fGVufDF8fHx8MTc3MDIzOTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1766339587432-8c5f4aa05fff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGJhY2tncm91bmQlMjBkYXRhJTIwbmV0d29yayUyMGdyYXBoJTIwZ2VvbWV0cmljfGVufDF8fHx8MTc3MDIzOTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1655793856210-c49f8ef3f315?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGJhY2tncm91bmQlMjBmbG93JTIwc21vb3RoJTIwYnVzaW5lc3MlMjBnZW9tZXRyaWN8ZW58MXx8fHwxNzcwMjM5NDUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  ];

  // Grid spans for a masonry-like/bento layout
  // 4 items total. We'll use a 6-column grid for flexibility.
  const gridClasses = [
    "md:col-span-6", // Full width (Secure & Protected Deals)
    "md:col-span-3", // Half width (Verified Listings)
    "md:col-span-3", // Half width (Transparent Data)
    "md:col-span-6", // Full width (Finalized Transactions)
  ];

  // Special visual component for the "Protected Deals" card (Index 0) - Small Card
  const ProtectedDealsVisual = () => (
    <div className="relative w-full h-full bg-[#173401] overflow-hidden flex flex-col items-center justify-start pt-10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#008A66]/20 via-transparent to-transparent" />
             <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#008A66 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
        </div>

        {/* Floating Lock/Shield Concept */}
        <div className="relative z-10 flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  scale: { duration: 0.8, type: "spring" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative w-28 h-28 flex items-center justify-center"
            >
                {/* Static Rings instead of animated */}
                <div className="absolute inset-0 rounded-full border border-[#00C995]/20" />
                <div className="absolute inset-4 rounded-full border border-[#00C995]/10" />
                
                {/* Central Shield */}
                <div className="relative z-10 bg-gradient-to-br from-[#008A66] to-[#004E39] p-4 rounded-2xl shadow-[0_0_30px_rgba(0,138,102,0.4)] border border-[#00C995]/30 backdrop-blur-md">
                    <Lock size={48} className="text-white" strokeWidth={1.5} />
                </div>
            </motion.div>

            {/* Status Badge */}
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 hidden md:flex px-3 py-1.5 rounded-full bg-[#00C995]/10 border border-[#00C995]/30 items-center gap-2 backdrop-blur-sm whitespace-nowrap"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C995]" />
                <span className="text-[10px] font-medium text-[#00C995] tracking-wide">SECURE</span>
            </motion.div>
        </div>
    </div>
  );

  // Special visual component for the "Verified Listings" card (Index 1) - Large Card
  const VerifiedListingsVisual = () => (
    <div className="relative w-full h-full bg-[#020804] overflow-hidden">
        {/* Abstract Grid Background */}
        <div className="absolute inset-0">
            <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-[#008A66]/10 to-transparent" />
            <div className="grid grid-cols-12 h-full w-full opacity-10 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-[#00C995]/20" />
                ))}
            </div>
        </div>

        {/* Main Interface Content - A list of verified entities */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
            
            <div className="relative z-10 w-full max-w-sm space-y-4">
                {/* Card 1: Verified */}
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-[#00C995]/30 backdrop-blur-sm"
                >
                    <div className="w-10 h-10 rounded-lg bg-[#00C995]/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded bg-[#00C995]" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#00C995] text-white text-[10px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(0,201,149,0.3)]">
                        <Check size={10} strokeWidth={3} /> VERIFIED
                    </div>
                </motion.div>

                {/* Card 2: Verified (Staggered) */}
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm ml-4 opacity-80"
                >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                         <div className="w-5 h-5 rounded bg-white/20" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                    </div>
                     <div className="px-3 py-1 rounded-full bg-[#00C995]/20 text-[#00C995] border border-[#00C995]/30 text-[10px] font-bold flex items-center gap-1">
                        <Check size={10} strokeWidth={3} /> VERIFIED
                    </div>
                </motion.div>
            </div>
            
            {/* Magnifying Glass Icon Overlay - Static */}
            <motion.div
                className="absolute top-10 right-10 text-[#00C995] drop-shadow-[0_0_20px_rgba(0,201,149,0.3)] opacity-80"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </motion.div>
        </div>
    </div>
  );

  // Special visual component for the "Transparent Data" card (Index 2)
  const TransparentDataVisual = () => (
    <div className="relative w-full h-full bg-[#008A66] flex items-start justify-center overflow-hidden pt-12 md:pt-16">
        {/* Simple Background */}
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        </div>

        {/* Main Chart Board */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-64 h-48 rounded-2xl border border-white/20 bg-black/20 backdrop-blur-sm shadow-xl p-4 flex flex-col justify-end"
        >
            {/* Grid Lines */}
            <div className="absolute inset-4 flex flex-col justify-between opacity-20 pointer-events-none">
                <div className="w-full h-px bg-white" />
                <div className="w-full h-px bg-white" />
                <div className="w-full h-px bg-white" />
                <div className="w-full h-px bg-white" />
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between gap-3 h-full px-2 pb-2 relative z-10">
                {[40, 60, 45, 85].map((height, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                        className="w-full rounded-t-sm bg-gradient-to-t from-white/10 to-white opacity-90"
                    />
                ))}
            </div>

            {/* Rising Line Arrow */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <motion.path
                    d="M 10 80 L 35 50 L 60 65 L 90 20"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                 />
                 {/* Glowing tip */}
                 <motion.circle 
                    cx="90" cy="20" r="3" fill="white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 1.5 }}
                    className="shadow-[0_0_15px_white]"
                 />
            </svg>
        </motion.div>

        {/* Floating Report Document - Left Overlay */}
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ 
                x: { duration: 0.8, delay: 0.6 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }}
            className="absolute left-8 md:left-16 top-32 md:top-40 w-28 h-36 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md shadow-2xl flex flex-col p-3 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500"
        >
             {/* Document Lines */}
             <div className="space-y-1.5 mb-3">
                 <div className="h-1 w-1/2 bg-white/50 rounded-full" />
                 <div className="h-1 w-3/4 bg-white/30 rounded-full" />
                 <div className="h-1 w-full bg-white/30 rounded-full" />
             </div>
             
             {/* Pie Chart Icon */}
             <div className="mt-auto self-center relative w-12 h-12">
                 <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                     <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                     <path d="M 16 16 L 16 2 A 14 14 0 0 1 28 22 Z" fill="white" />
                 </svg>
             </div>
        </motion.div>
    </div>
  );

  // Special visual component for the "Seamless Experience" card (Index 3)
  const SeamlessExperienceVisual = () => (
    <div className="relative w-full h-full bg-[#05110A] overflow-hidden flex flex-col items-center justify-start pt-10">
        {/* Background Subtle Grid */}
        <div className="absolute inset-0 opacity-20">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#008A66]/40 via-transparent to-transparent" />
             <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #008A66 1px, transparent 1px), linear-gradient(to bottom, #008A66 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.05 }}></div>
        </div>

        <div className="relative w-full flex flex-col items-center justify-center gap-2">
            {/* Process Flow Visualization - Perfectly Centered */}
            <div className="relative z-10 w-48 md:w-64 h-20 flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-2 right-2 h-1 bg-[#008A66]/20 -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full w-full bg-gradient-to-r from-[#008A66] to-[#00C995]"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </div>

                {/* Step 1: Search/Browse */}
                <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-8 h-8 rounded-full bg-[#0A1F13] border-2 border-[#00C995] flex items-center justify-center shadow-[0_0_15px_rgba(0,138,102,0.3)]"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C995]" />
                </motion.div>

                {/* Step 2: Negotiation/Process */}
                <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative z-10 w-8 h-8 rounded-full bg-[#0A1F13] border-2 border-[#00C995] flex items-center justify-center shadow-[0_0_15px_rgba(0,138,102,0.3)]"
                >
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00C995]" />
                </motion.div>

                {/* Step 3: Success/Handshake */}
                 <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-[#008A66] to-[#005E45] border-2 border-[#00C995] flex items-center justify-center shadow-[0_0_25px_rgba(0,201,149,0.5)]"
                >
                    <Check size={20} className="text-white" strokeWidth={3} />
                </motion.div>
            </div>

            {/* Success Card - Positioned Below Steps */}
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex px-4 py-2 rounded-xl bg-white/5 border border-[#00C995]/30 backdrop-blur-md items-center gap-3 shadow-xl"
            >
                 <div className="w-6 h-6 rounded-full bg-[#00C995]/20 flex items-center justify-center">
                     <Users size={12} className="text-[#00C995]" />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[11px] text-gray-400 uppercase tracking-wider">Status</span>
                     <span className="text-xs font-bold text-white">Deal Done</span>
                 </div>
            </motion.div>
        </div>
    </div>
  );

  return (
    <section className="pt-24 pb-16 bg-white overflow-hidden" id="features">
      <div className="container mx-auto px-6 lg:px-20">
        
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-2">
              {content.sections.features}
            </h2>
            <p className="text-2xl text-gray-500 mb-4 font-medium">
              {content.sections.featuresSubtitle}
            </p>
            <div className="h-1 w-20 bg-[#008A66] mx-auto rounded-full"></div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lg:gap-8">
          {content.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`w-full min-h-[400px] md:min-h-0 ${(index === 0 || index === 3) ? "md:h-[320px]" : "md:h-[550px]"} ${gridClasses[index] || "md:col-span-3"}`}
            >
              <Card 
                variant="premium"
                title={feature.title}
                description={feature.desc}
                // Only pass image if it's NOT a special visual card
                image={(index > 3) ? featureImages[index] : undefined}
                // Pass custom visuals based on index
                renderVisual={
                    index === 0 ? <ProtectedDealsVisual /> :
                    index === 1 ? <VerifiedListingsVisual /> : 
                    index === 2 ? <TransparentDataVisual /> : 
                    index === 3 ? <SeamlessExperienceVisual /> :
                    undefined
                }
                className={`h-full ${
                  index === 0 ? "border-[#173401]" :
                  index === 1 ? "border-[#020804]" :
                  index === 2 ? "border-[#008A66]" :
                  index === 3 ? "border-[#05110A]" :
                  ""
                }`}
                darkText={false}
                overlayClass={
                  index === 0 ? "from-[#173401] via-[#173401]/90" : 
                  index === 2 ? "from-[#008A66] via-[#008A66]/90" :
                  undefined
                }
                decorationClass={
                  (index === 0 || index === 2) ? "bg-white group-hover:bg-white/80" : undefined
                }
              />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};