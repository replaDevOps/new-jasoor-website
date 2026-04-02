import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, UserCheck, Video, Calendar, ArrowUpRight, MapPin } from 'lucide-react';
import { Badge } from './Badge';

export const HeroDashboard = () => {
  const { content, language } = useApp();

  return (
    <div className="relative w-full max-w-[500px] mx-auto perspective-1000 -my-2 lg:my-0 scale-[0.85] sm:scale-100 transition-transform origin-center">
      {/* Main Card - Business Listing */}
      <motion.div 
        initial={{ y: 20, opacity: 0, rotateX: 5 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 relative z-20"
      >
        {/* Card Header / Image Placeholder */}
        <div className="h-40 bg-gradient-to-r from-[#008A66] to-[#34D399] relative p-6 flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
            <div className="flex justify-between items-start z-10">
                <Badge variant="success" className="bg-white/20 backdrop-blur-md text-white border-none">
                    {language === 'ar' ? "فرصة مميزة" : "Featured"}
                </Badge>
                <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="z-10 text-white">
                <h3 className="text-xl font-bold mb-1">
                    {language === 'ar' ? "شركة لوجستيات وتقنية" : "Logistics & Tech Co."}
                </h3>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{language === 'ar' ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</span>
                </div>
            </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F9FAFB] p-3 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">
                        {language === 'ar' ? "الإيرادات السنوية" : "Annual Revenue"}
                    </div>
                    <div className="text-lg font-bold text-[#111827]">SAR 4.2M</div>
                    <div className="text-xs text-[#10B981] flex items-center gap-1 mt-1 font-medium">
                        <ArrowUpRight className="w-3 h-3" /> +12%
                    </div>
                </div>
                <div className="bg-[#F9FAFB] p-3 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">
                        {language === 'ar' ? "صافي الربح" : "Net Profit"}
                    </div>
                    <div className="text-lg font-bold text-[#111827]">SAR 1.1M</div>
                    <div className="text-xs text-[#10B981] flex items-center gap-1 mt-1 font-medium">
                        <ArrowUpRight className="w-3 h-3" /> +8%
                    </div>
                </div>
            </div>

            {/* Growth Chart Simulation */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500">
                        {language === 'ar' ? "نمو المبيعات" : "Sales Growth"}
                    </span>
                    <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                        +24% YOY
                    </span>
                </div>
                <div className="h-24 w-full flex items-end justify-between gap-1.5 px-1">
                    {[28, 38, 33, 48, 52, 58, 62, 70, 76, 82].map((h, i) => (
                        <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full bg-[#E6F7F2] rounded-t-md hover:bg-[#10B981] transition-colors"
                        >

                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </motion.div>

      {/* Floating Card 1: Verification (Bottom Left) */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -bottom-6 -left-2 md:-left-8 bg-white p-3 md:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-3 z-30 max-w-[180px]"
      >
        <div className="bg-[#10B981] p-2 rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/20 shrink-0">
            <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
            <div className="text-sm font-bold text-[#111827]">
                {language === 'ar' ? "هوية موثقة" : "Verified ID"}
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">
                {language === 'ar' ? "تم التحقق من المالك" : "Owner Verified"}
            </div>
        </div>
      </motion.div>

      {/* Floating Card 2: Security (Top Right) */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute -top-6 -right-2 md:-right-12 bg-white p-3 md:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-3 z-30 max-w-[200px]"
      >
        <div className="bg-[#004E39] p-2 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
            <div className="text-sm font-bold text-[#111827]">
                {language === 'ar' ? "صفقات آمنة" : "Secure Deals"}
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">
                 {language === 'ar' ? "حماية قانونية كاملة" : "Full Legal Protection"}
            </div>
        </div>
      </motion.div>

       {/* Floating Card 3: Meetings (Top Left) */}
       <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute top-20 -left-6 md:-left-16 bg-white p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-3 z-25 max-w-[180px]"
      >
        <div className="bg-blue-500 p-2 rounded-lg shrink-0 shadow-lg shadow-blue-500/20">
            <Video className="w-4 h-4 text-white" />
        </div>
        <div>
            <div className="text-xs font-bold text-[#111827]">
                {language === 'ar' ? "اجتماعات مباشرة" : "Virtual Meetings"}
            </div>
            <div className="text-[11px] text-gray-400 leading-tight">
                 {language === 'ar' ? "مع البائعين والمشترين" : "With Sellers & Buyers"}
            </div>
        </div>
      </motion.div>



      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#004E39] opacity-[0.08] blur-[80px] -z-10 rounded-full" />
    </div>
  );
};