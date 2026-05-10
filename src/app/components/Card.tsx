import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TrendingUp, MapPin, ArrowLeft, ArrowRight, Bookmark, Clock } from 'lucide-react';

type CardVariant = 'feature' | 'info' | 'grid' | 'branded' | 'listing' | 'premium';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  number?: string | number;
  numberColor?: string;
  footer?: React.ReactNode;
  hideFavorite?: boolean;
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  renderVisual?: React.ReactNode;
  // Specific for listing cards
  listingData?: {
    location?: string;
    category?: string;
    revenue?: string;
    profit?: string;
    recovery?: string;
    refNumber?: string;
  };
  labels?: {
    revenue?: string;
    profit?: string;
    recovery?: string;
    askingPrice?: string;
    currency?: string;
    details?: string;
    noImage?: string;
  };
}

export const Card = ({
  variant = 'feature',
  className,
  title,
  description,
  image,
  icon,
  badge,
  number,
  numberColor = '#10B981',
  footer,
  onClick,
  children,
  listingData,
  renderVisual,
  darkText = false,
  overlayClass,
  decorationClass,
  watermarkImage,
  iconBgClass,
  labels,
  hideFavorite = false,
  isSaved = false,
  onSave,
}: CardProps & { darkText?: boolean; overlayClass?: string; decorationClass?: string; iconBgClass?: string; watermarkImage?: string }) => {

  const baseStyles = "bg-white overflow-hidden transition-all duration-300 ease-out";
  
  // Style 1: Feature Cards
  const featureStyles = "rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]";

  // Style 2: Vertical Info Cards
  const infoStyles = "rounded-[20px] p-6 border border-gray-100 hover:border-[#004E39]/30 hover:shadow-lg flex flex-col items-start gap-4";

  // Style 3: Grid Cards
  const gridStyles = "rounded-[16px] shadow-sm hover:shadow-md flex flex-col h-full";

  // Style 4: Branded Cards (Green with Watermark)
  // Uses the logo icon as a background watermark
  const brandedStyles = "group rounded-[24px] px-6 pt-6 pb-8 bg-[#008A66] text-white relative overflow-hidden flex flex-col justify-end items-start text-start shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[220px] border border-white/10";

  // Style 5: Listing Cards (Modern with Image)
  const listingStyles = "rounded-[24px] shadow-sm hover:shadow-xl bg-white flex flex-col group border border-gray-100 overflow-hidden h-full";

  // Style 6: Premium Cards (Full Image Overlay)
  const premiumStyles = "group rounded-[32px] overflow-hidden flex flex-col shadow-xl hover:shadow-2xl transition-all duration-500 h-full border border-white/10 bg-[#0A1F13] relative";

  const getVariantStyles = () => {
    switch (variant) {
      case 'feature': return featureStyles;
      case 'info': return infoStyles;
      case 'grid': return gridStyles;
      case 'branded': return brandedStyles;
      case 'listing': return listingStyles;
      case 'premium': return premiumStyles;
      default: return featureStyles;
    }
  };

  return (
    <motion.div
      whileHover={variant === 'branded' ? { y: -8 } : { y: -4 }}
      className={cn(baseStyles, getVariantStyles(), className)}
      onClick={onClick}
    >
      {variant === 'branded' && (
        <>
           {/* Watermark Background - Top Left */}
           <div className="absolute -top-8 -left-8 text-black/10 pointer-events-none">
             {watermarkImage ? (
               <img src={watermarkImage} alt="" className="w-40 h-40 object-contain opacity-20" />
             ) : (
               <TrendingUp size={160} strokeWidth={0.8} />
             )}
           </div>
           
           {/* Content positioned at bottom */}
           <div className="relative z-10 w-full flex flex-col items-start text-start">
             {icon && (
               <div className={cn("w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg backdrop-blur-md border border-white/20 shadow-inner mb-3", iconBgClass)}>
                 {icon}
               </div>
             )}
             
             {title && <h3 className="text-lg font-bold mb-1.5 tracking-wide">{title}</h3>}
             {description && <p className="text-white/80 leading-relaxed text-xs font-medium opacity-90">{description}</p>}
             {children}
           </div>
        </>
      )}

      {variant === 'premium' && (
        <div className="relative h-full flex flex-col justify-end group">
             {/* Background Image/Visual - Covers Full Card */}
             <div className="absolute inset-0 z-0">
               {renderVisual ? (
                 renderVisual
               ) : image ? (
                 <ImageWithFallback 
                   src={image} 
                   alt={title || "Feature"} 
                   className="w-full h-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-110 opacity-90" 
                 />
               ) : (
                 <div className="w-full h-full bg-[#173401]" />
               )}
               {/* Stronger Gradient for text readability and seamless blend */}
               <div className={cn(
                 "absolute inset-0 bg-gradient-to-t to-transparent opacity-90 pointer-events-none",
                 overlayClass ? overlayClass : (darkText ? "from-white via-white/80" : "from-black/95 via-black/60")
               )} />
             </div>

             {/* Content Section - Positioned at bottom with large typography */}
             <div className="relative z-10 p-8 pb-10 flex flex-col justify-end">
                  {title && (
                    <h3 className={cn(
                      "text-3xl md:text-4xl font-black mb-3 leading-[1.1] drop-shadow-lg tracking-tight transition-colors duration-300",
                      darkText ? "text-gray-900 group-hover:text-[#008A66]" : "text-white group-hover:text-[#00C995]"
                    )}>
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className={cn(
                      "text-base md:text-lg font-medium leading-relaxed max-w-[90%] drop-shadow-md",
                      darkText ? "text-gray-600" : "text-gray-300"
                    )}>
                      {description}
                    </p>
                  )}
                  
                  {/* Decorative line/element that expands on hover */}
                  <div className={cn(
                    "h-1 w-12 mt-4 rounded-full transition-all duration-500 group-hover:w-24",
                    decorationClass ? decorationClass : "bg-[#008A66] group-hover:bg-[#00C995]"
                  )} />
             </div>
        </div>
      )}

      {variant === 'listing' && (
        <>
          {/* Image Section - Reduced height */}
          <div className="relative aspect-[3/2] w-full overflow-hidden group-hover:opacity-95 transition-opacity border-b border-gray-100">
             {/* Main Image */}
             {image ? (
                <ImageWithFallback 
                  src={image} 
                  alt={title || "Listing"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
             ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">{labels?.noImage || "No image"}</span>
                </div>
             )}

             {/* Type Badge (Top Right) */}
             <div className="absolute top-2 right-2 z-10">
                 {typeof badge === 'string' ? (
                    <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-[#111827] border border-gray-100/50 scale-90 origin-top-right">
                      {badge}
                    </div>
                 ) : (
                    badge && <div className="scale-90 origin-top-right">{badge}</div>
                 )}
             </div>

             {/* Category Badge (Bottom Right) */}
             <div className="absolute bottom-2 right-2 z-10">
                <div className="bg-[#008A66] px-3 py-1 rounded-lg shadow-sm text-xs font-bold text-white scale-90 origin-bottom-right shadow-[#008A66]/20">
                  {listingData?.category}
                </div>
             </div>
             
             {/* Bookmark Button (Top Left) */}
             {!hideFavorite && (
             <div className="absolute top-2 left-2 z-10">
               <button
                 onClick={e => { e.stopPropagation(); onSave?.(e); }}
                 className={cn(
                   "bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-colors shadow-sm",
                   isSaved ? "text-[#008A66]" : "text-gray-400 hover:text-[#008A66]"
                 )}
               >
                 <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
               </button>
             </div>
             )}
          </div>

          {/* Content Section - Compact vertical spacing but normal fonts */}
          <div className="flex flex-col relative bg-white">
            
            {/* Main Text Content */}
            <div className="px-4 pt-4 pb-2">
                {/* Ref Number */}
                <div className="flex items-center justify-between mb-1">
                     <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                         {listingData?.refNumber || "#000"}
                     </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[#111827] leading-tight group-hover:text-[#008A66] transition-colors line-clamp-1 mb-1">
                  {title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500 text-xs font-medium mb-2">
                    <MapPin size={12} className="text-[#008A66]" />
                    <span>{listingData?.location}</span>
                </div>
                
                {/* Description */}
                {description && (
                    <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-3 h-[4.5em]">
                        {description}
                    </p>
                )}
            </div>

            {/* Combined Footer Section (Stats + Price) - White Background */}
            <div className="px-4 pb-3 pt-0">
                
                {/* Divider */}
                <div className="h-px bg-gray-100 w-full mb-2" />

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 mt-2">
                   {/* Revenue */}
                   <div className="flex flex-col items-center justify-center gap-1 border-l border-gray-200 last:border-l-0 rtl:border-l-0 rtl:border-r rtl:last:pr-0">
                     <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider text-center">
                       {labels?.revenue || "Revenue"}
                     </span>
                     <div className="text-xs font-bold text-[#111827] text-center">{listingData?.revenue}</div>
                   </div>
                   
                   {/* Profit */}
                   <div className="flex flex-col items-center justify-center gap-1 border-l border-gray-200 rtl:border-l-0 rtl:border-r">
                     <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider text-center">
                       {labels?.profit || "Profit"}
                     </span>
                     <div className="text-xs font-bold text-[#111827] text-center">{listingData?.profit}</div>
                   </div>

                   {/* Recovery */}
                   <div className="flex flex-col items-center justify-center gap-1 border-l border-gray-200 rtl:border-l-0 rtl:border-r">
                     <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider text-center">
                       {labels?.recovery || "Recovery"}
                     </span>
                     <div className="text-xs font-bold text-[#111827] text-center">{listingData?.recovery}</div>
                   </div>
                </div>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-px">{labels?.askingPrice || "Asking Price"}</span>
                      <div className="text-base font-black text-[#008A66] flex items-baseline gap-1 tracking-tight">
                         {number} <span className="text-[10px] font-bold text-[#008A66]/70">{labels?.currency || "SAR"}</span>
                      </div>
                   </div>
                   
                   {footer || (
                     <button className="bg-[#111827] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-black transition-colors shadow-lg shadow-black/10 flex items-center gap-1.5">
                       <span>{labels?.details || "Details"}</span>
                       <ArrowRight size={12} className="rtl:rotate-180" />
                     </button>
                   )}
                </div>
            </div>
          </div>
        </>
      )}

      {(variant === 'feature' || variant === 'info' || variant === 'grid') && (
        <div className="flex flex-col h-full">
        {variant === 'feature' && (
            <div className="flex flex-col h-full relative">
              {icon && <div className="mb-4 text-2xl">{icon}</div>}
              {title && <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>}
              {description && <p className="text-gray-500 mb-6 leading-relaxed">{description}</p>}
              {image && (
                <div className="mt-auto w-full aspect-video rounded-xl overflow-hidden relative">
                  <ImageWithFallback src={image} alt={title || "Feature"} className="w-full h-full object-cover" />
                </div>
              )}
              {children}
            </div>
          )}
    
          {variant === 'info' && (
            <>
              <div className="flex w-full justify-between items-start">
                {icon && <div className="text-3xl">{icon}</div>}
                {badge}
              </div>
              <div className="mt-2">
                {title && <h3 className="text-xl font-bold text-black mb-1">{title}</h3>}
                {number && (
                  <div className="text-3xl font-bold mb-1" style={{ color: numberColor }}>
                    {number}
                  </div>
                )}
                {description && <p className="text-sm text-gray-400">{description}</p>}
              </div>
              {children}
            </>
          )}
    
          {variant === 'grid' && (
            <div className="p-5 flex flex-col h-full">
               <div className="flex items-start justify-between mb-4">
                 {image ? (
                   <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                     <ImageWithFallback src={image} alt={title || "Logo"} className="w-full h-full object-cover" />
                   </div>
                 ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🏢</div>
                 )}
                 {badge}
               </div>
               
               <div className="mb-auto">
                 {title && <h3 className="text-lg font-bold text-black mb-1">{title}</h3>}
                 {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
                 {children}
               </div>
    
               {footer && (
                 <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                   {footer}
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
