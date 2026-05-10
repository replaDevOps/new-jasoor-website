import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, SlidersHorizontal, ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { Card } from '../components/Card';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
// BUG-09 FIX: replaced hardcoded mock LISTINGS with real API hook
import { useListings } from '../../hooks/useListings';
import type { BusinessListItem } from '../../types/api';
// R-05 FIX: real categories from API instead of local string IDs
import { useQuery, useMutation } from '@apollo/client';
import { CREATE_SAVE_BUSINESS } from '../../graphql/mutations/dashboard';
import { GET_CATEGORIES } from '../../graphql/queries/business';
import { SAUDI_REGIONS } from '../../data/saudiRegions';
import { resolveBusinessLocation } from '../../utils/location';

// Matches Listings.tsx fmt — abbreviated K/M format, em-dash for null
function fmt(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return '—';
  const n = Number(v);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K';
  return Math.round(n).toLocaleString('en-US');
}


export const BrowseBusinesses = ({ onNavigate }: { onNavigate?: (page: string, id?: string | number) => void }) => {
  const { direction, language, content, isLoggedIn } = useApp();
  const isAr = language === 'ar';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [saveBusiness] = useMutation(CREATE_SAVE_BUSINESS, { errorPolicy: 'all' });

  // BUG-09 FIX: all filter/sort/pagination state now lives in useListings hook
  // which calls the real GraphQL API — previously used hardcoded mock data
  const {
    businesses,
    loading,
    totalCount,
    totalPages,
    currentPage,
    selectedCategoryId,
    selectedCategoryName,
    sortOrder: hookSortOrder,
    filters,
    selectCategory,
    applyFilters,
    resetFilters,
    changeSortOrder,
    goToPage,
  } = useListings();

  // Local UI state for filter inputs (committed to hook on Apply)
  const [selectedRegion, setSelectedRegion] = useState<string>('all'); // → backend district
  const [selectedCity,   setSelectedCity]   = useState<string>('all'); // → backend city
  const [priceMinInput, setPriceMinInput]   = useState<string>('');
  const [priceMaxInput, setPriceMaxInput]   = useState<string>('');
  const [revenueMinInput, setRevenueMinInput] = useState<string>('');
  const [revenueMaxInput, setRevenueMaxInput] = useState<string>('');
  const [profitMinInput, setProfitMinInput] = useState<string>('');
  const [profitMaxInput, setProfitMaxInput] = useState<string>('');

  const handleApplyFilters = () => {
    const region = SAUDI_REGIONS.find(r => r.slug === selectedRegion);
    const city = region?.cities.find(c => c.slug === selectedCity);
    applyFilters({
      district: region?.en ?? null,
      city:     city?.en ?? null,
      minPrice: priceMinInput ? Number(priceMinInput) : null,
      maxPrice: priceMaxInput ? Number(priceMaxInput) : null,
      minRevenue: revenueMinInput ? Number(revenueMinInput) : null,
      maxRevenue: revenueMaxInput ? Number(revenueMaxInput) : null,
      minProfit: profitMinInput ? Number(profitMinInput) : null,
      maxProfit: profitMaxInput ? Number(profitMaxInput) : null,
    });
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedRegion('all');
    setSelectedCity('all');
    setPriceMinInput('');
    setPriceMaxInput('');
    setRevenueMinInput('');
    setRevenueMaxInput('');
    setProfitMinInput('');
    setProfitMaxInput('');
    resetFilters();
  };

  // Map hook sort values to UI sort values
  const sortOrder = hookSortOrder === 'Low to High' ? 'lowest' : hookSortOrder === 'High to Low' ? 'highest' : 'newest';
  const handleSortChange = (val: 'newest' | 'highest' | 'lowest') => {
    changeSortOrder(val === 'highest' ? 'High to Low' : val === 'lowest' ? 'Low to High' : 'default');
  };

  // filteredListings is now the live API result
  const filteredListings: BusinessListItem[] = businesses;

  // --- Translations ---
  const t = useMemo(() => {
    const isAr = language === 'ar';
    return {
      title: isAr ? 'اعثر على الشركة المناسبة لك' : 'Find the Right Business',
      subtitle: isAr ? 'تصفح العديد من الفرص الاستثمارية الواعدة في مختلف القطاعات والمناطق' : 'Browse promising investment opportunities across various sectors and regions',
      
      // Filters
      filterTitle: isAr ? 'تصفية النتائج' : 'Filter Results',
      showFilter: isAr ? 'إظهار الفلتر' : 'Show Filter',
      hideFilter: isAr ? 'إخفاء الفلتر' : 'Hide Filter',
      apply: isAr ? 'تطبيق الفلاتر' : 'Apply Filters',
      
      region: isAr ? 'المنطقة' : 'Region',
      city: isAr ? 'المدينة' : 'City',
      priceRange: isAr ? 'نطاق السعر (ريال)' : 'Price Range (SAR)',
      revenue: isAr ? 'الإيرادات السنوية' : 'Annual Revenue',
      profitRange: isAr ? 'الأرباح السنوية' : 'Annual Profit',
      
      moreThan: isAr ? 'أكثر من' : 'More than',
      lessThan: isAr ? 'أقل من' : 'Less than',
      all: isAr ? 'الكل' : 'All',
      
      // Regions & Cities
      // Controls
      sortBy: isAr ? 'ترتيب حسب:' : 'Sort by:',
      newest: isAr ? 'الأحدث' : 'Newest',
      highestPrice: isAr ? 'الأعلى سعراً' : 'Highest Price',
      lowestPrice: isAr ? 'الأقل سعراً' : 'Lowest Price',
      rows: isAr ? 'عدد الصفوف:' : 'Rows:',
      
      // Card
      details: isAr ? 'التفاصيل' : 'Details',
      viewDetails: isAr ? 'عرض التفاصيل' : 'View Details',
      sar: isAr ? 'ريال' : 'SAR',
      revenueLabel: isAr ? 'الإيرادات' : 'Revenue',
      profitLabel: isAr ? 'الأرباح' : 'Profit',
      recoveryLabel: isAr ? 'الاسترداد' : 'Recovery',
      month: isAr ? 'شهر' : 'mo',
      askingPrice: isAr ? 'السعر المطلوب' : 'Asking Price',
      
      // Badges
      acquisition: isAr ? 'استحواذ' : 'Acquisition',
      taqbeel: isAr ? 'تقبيل' : 'Taqbeel',
    };
  }, [language]);

  const selectedRegionRecord = SAUDI_REGIONS.find(r => r.slug === selectedRegion);

  // R-05 FIX: real categories from GET_CATEGORIES query — local string IDs ('tech', 'retail'…)
  // never matched backend IDs so category filter was always broken
  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    variables: { limit: 50, offSet: 0 },
    errorPolicy: 'all',
  });
  const CATEGORIES = useMemo(() => {
    const raw = categoriesData?.getAllCategories?.categories ?? [];
    if (raw.length > 0) {
      return raw.map((c: any) => ({
        id: c.id,
        name: language === 'ar' ? (c.arabicName || c.name) : c.name,
        englishName: c.name, // always English for API calls
      }));
    }
    // Fallback to localised names while API loads
    const cats = content.listings.categories as Record<string, string>;
    return [
      { id: 'tech',          name: cats.tech,          englishName: 'Tech & Software' },
      { id: 'retail',        name: cats.retail,        englishName: 'Retail' },
      { id: 'food',          name: cats.food,          englishName: 'Restaurants & Cafes' },
      { id: 'health',        name: cats.health,        englishName: 'Health, Beauty & Fitness' },
      { id: 'services',      name: cats.services,      englishName: 'Consulting & Professional Services' },
      { id: 'manufacturing', name: cats.manufacturing, englishName: 'Industrial Businesses' },
      { id: 'education',     name: cats.education,     englishName: 'Education Services' },
      { id: 'logistics',     name: cats.logistics,     englishName: 'Automotive, Transportation & Logistics' },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesData, language]);

  // Helper to render badge based on type
  const renderBadge = (type: string) => {
    const isAcquisition = type === 'acquisition';
    const text = isAcquisition ? t.acquisition : t.taqbeel;
    // White background for both, distinct text color if needed, or just dark text
    const colorClass = "bg-white/95 text-[#111827] border-gray-100/50 backdrop-blur-md"; 
    
    return (
      <div className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm border", colorClass)}>
         {text}
      </div>
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Region Filter */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">{t.region}</h4>
        <div className="relative">
            <select
                value={selectedRegion}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#008A66] transition-colors appearance-none text-gray-700"
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedCity('all');
                }}
              >
                <option value="all">{t.all}</option>
                {SAUDI_REGIONS.map(region => (
                  <option key={region.slug} value={region.slug}>
                    {isAr ? region.ar : region.en}
                  </option>
                ))}
              </select>
            <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none", direction === 'rtl' ? "left-3" : "right-3")} />
        </div>
      </div>

      {/* City Filter */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">{t.city}</h4>
        <div className="relative">
            <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#008A66] transition-colors appearance-none text-gray-700"
                disabled={selectedRegion === 'all'}
              >
                <option value="all">{t.all}</option>
                {(selectedRegionRecord?.cities ?? []).map(city => (
                  <option key={city.slug} value={city.slug}>
                    {isAr ? city.ar : city.en}
                  </option>
                ))}
              </select>
            <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none", direction === 'rtl' ? "left-3" : "right-3")} />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-4">{t.priceRange}</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.moreThan}</label>
            <input
                type="number"
                value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                placeholder="0"
                className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
              />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.lessThan}</label>
            <input
                type="number"
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                placeholder="10,000,000"
                className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
              />
          </div>
        </div>
      </div>

      {/* Revenue Range */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-4">{t.revenue}</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.moreThan}</label>
            <input
                type="number"
                value={revenueMinInput}
                onChange={(e) => setRevenueMinInput(e.target.value)}
                placeholder="0"
                className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
              />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.lessThan}</label>
            <input
                type="number"
                value={revenueMaxInput}
                onChange={(e) => setRevenueMaxInput(e.target.value)}
                placeholder="10,000,000"
                className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
              />
          </div>
        </div>
      </div>

      {/* Profit Range */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-4">{t.profitRange}</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.moreThan}</label>
            <input
              type="number"
              value={profitMinInput}
              onChange={(e) => setProfitMinInput(e.target.value)}
              placeholder="0"
              className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.lessThan}</label>
            <input
              type="number"
              value={profitMaxInput}
              onChange={(e) => setProfitMaxInput(e.target.value)}
              placeholder="5,000,000"
              className={cn("w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#008A66] placeholder:text-gray-300 dir-ltr", direction === 'rtl' ? 'text-right' : 'text-left')}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-2">
         <button
            onClick={handleApplyFilters}
            className="w-full bg-[#008A66] text-white font-bold py-3.5 rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20 flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {t.apply}
          </button>
          <button
            onClick={handleResetFilters}
            className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
          </button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#eceff2] pb-20" dir={direction}>
      {/* Header Section */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center leading-tight">
            {t.title}
          </h1>
          <p className="text-gray-400 text-center max-w-2xl mx-auto text-lg">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-20">
        
        {/* Categories Grid - Squares, Text Only */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl border border-gray-100 mb-8">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(selectedCategoryId === cat.id ? null : cat.id, selectedCategoryId === cat.id ? null : (cat as any).englishName ?? cat.name)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 group border",
                  selectedCategoryId === cat.id 
                    ? "bg-[#008A66] text-white border-[#008A66] shadow-md scale-105" 
                    : "bg-gray-50 text-gray-700 border-gray-100 hover:border-[#008A66] hover:text-[#008A66]"
                )}
              >
                <span className="text-xs md:text-sm font-bold text-center line-clamp-2">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Desktop Sidebar Filters */}
          <AnimatePresence>
            {isDesktopFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '25%' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="hidden lg:block w-1/4 flex-shrink-0 overflow-hidden sticky top-24"
              >
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 min-w-[280px]">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#008A66] font-bold">
                      <SlidersHorizontal size={20} />
                      <span>{t.filterTitle}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <FilterContent />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Filter Modal/Sheet */}
          <AnimatePresence>
            {isFilterOpen && (
              <>
                 {/* Backdrop */}
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
                 />
                 
                 {/* Sheet */}
                 <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] lg:hidden max-h-[90vh] overflow-y-auto"
                 >
                    <div className="sticky top-0 bg-white z-10 rounded-t-[32px] border-b border-gray-100 px-6 pt-3 pb-4">
                       <div className="flex justify-center mb-3">
                          <div className="w-10 h-1 rounded-full bg-gray-300" />
                       </div>
                       <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">{t.filterTitle}</h3>
                          <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors font-bold shadow-sm">
                             <X size={20} strokeWidth={2.5} />
                          </button>
                       </div>
                    </div>
                    <div className="p-6 pb-16">
                       <FilterContent />
                    </div>
                 </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Listings Area */}
          <motion.div layout className="flex-1 w-full">
            
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              
              {/* Filter Buttons (Mobile vs Desktop) */}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-[#008A66] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#007053] transition-all"
              >
                <SlidersHorizontal size={18} />
                <span>{t.filterTitle}</span>
              </button>

              <button 
                onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <SlidersHorizontal size={18} />
                <span>{isDesktopFilterOpen ? t.hideFilter : t.showFilter}</span>
              </button>
              
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium hidden sm:inline">{t.sortBy}</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(e.target.value as 'newest' | 'highest' | 'lowest')}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#008A66] text-gray-700"
                  >
                    <option value="newest">{t.newest}</option>
                    <option value="highest">{t.highestPrice}</option>
                    <option value="lowest">{t.lowestPrice}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className={cn(
              "grid gap-6 transition-all items-stretch",
              isDesktopFilterOpen ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {/* BUG-09 FIX: show loading skeletons while API fetches */}
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-[3/2] bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-8 bg-gray-100 rounded-xl mt-4" />
                    </div>
                  </div>
                ))
              ) : filteredListings.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    {language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No results found'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {language === 'ar' ? 'جرّب تعديل خيارات البحث أو إعادة تعيين الفلاتر' : 'Try adjusting your search or resetting the filters'}
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 bg-[#008A66] text-white rounded-xl font-bold text-sm hover:bg-[#007053] transition-colors"
                  >
                    {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                  </button>
                </div>
              ) : filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  variant="listing"
                  title={listing.businessTitle}
                  description={listing.description}
                  image={listing.image}
                  number={fmt(listing.price)}
                  hideFavorite={!isLoggedIn}
                  isSaved={listing.isSaved ?? false}
                  onSave={async (e) => { e.stopPropagation(); if (!isLoggedIn) { onNavigate?.('signin'); return; } await saveBusiness({ variables: { saveBusinessId: listing.id } }); }}
                  badge={renderBadge(listing.isByTakbeer ? 'taqbeel' : 'acquisition')}
                  labels={{
                    revenue: t.revenueLabel,
                    profit: t.profitLabel,
                    recovery: t.recoveryLabel,
                    askingPrice: t.askingPrice,
                    currency: t.sar,
                    details: t.details,
                    noImage: isAr ? 'لا توجد صورة' : 'No image',
                  }}
                  listingData={{
                    location: resolveBusinessLocation(listing.district, listing.city, language as 'ar' | 'en'),
                    category: isAr ? (listing.category?.arabicName || listing.category?.name || '') : (listing.category?.name || ''),
                    revenue: fmt(listing.revenue) + ' ' + t.sar,
                    profit: fmt(listing.profit) + ' ' + t.sar,
                    recovery: listing.capitalRecovery ? Math.round(listing.capitalRecovery) + ' ' + t.month : '—',
                    refNumber: listing.reference ? `#${listing.reference}` : '',
                  }}
                  onClick={() => onNavigate?.('details', listing.id)}
                  footer={
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate?.('details', listing.id); }}
                      className="bg-[#008A66] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-[#007053] transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span>{t.details}</span>
                      {direction === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </button>
                  }
                />
              ))}
            </div>

            {/* BUG-09 FIX: pagination now wired to real API pages */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2" dir="ltr">
                <button
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#008A66] hover:text-[#008A66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={20} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "w-10 h-10 rounded-full font-bold transition-all",
                        page === currentPage
                          ? "bg-[#008A66] text-white shadow-lg shadow-[#008A66]/20"
                          : "border border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66]"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#008A66] hover:text-[#008A66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
};
