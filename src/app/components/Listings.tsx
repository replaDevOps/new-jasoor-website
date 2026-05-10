/**
 * Listings.tsx — PHASE 2
 * UI: 100% unchanged. Data replaced with useRandomBusinesses hook.
 * Falls back to skeleton cards while loading, then renders real data.
 */
import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from './Card';
import { Button } from './Button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRandomBusinesses } from '../../hooks/useRandomBusinesses';
import type { BusinessListItem } from '../../types/api';
import { useMutation } from '@apollo/client';
import { CREATE_SAVE_BUSINESS } from '../../graphql/mutations/dashboard';
import { resolveBusinessLocation } from '../../utils/location';

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return Math.round(v / 1_000) + 'K';
  return Math.round(v).toLocaleString('en-US');
}

export const Listings = ({ onViewAll, onNavigate }: { onViewAll?: () => void; onNavigate?: (page: string, id?: string | number) => void }) => {
  const { content, direction, language, userId, isLoggedIn } = useApp();
  const { businesses, loading } = useRandomBusinesses(userId);
  const [saveBusinessMutation] = useMutation(CREATE_SAVE_BUSINESS, { errorPolicy: 'all' });

  const labels = useMemo(() => ({
    revenue: language === 'ar' ? 'الإيرادات' : 'Revenue',
    profit: language === 'ar' ? 'الأرباح' : 'Profit',
    recovery: language === 'ar' ? 'الاسترداد' : 'Recovery',
    askingPrice: language === 'ar' ? 'السعر المطلوب' : 'Asking Price',
    currency: '⃁',
    details: language === 'ar' ? 'التفاصيل' : 'Details',
    noImage: language === 'ar' ? 'لا توجد صورة' : 'No image',
    month: language === 'ar' ? 'شهر' : 'mo',
    acquisition: language === 'ar' ? 'استحواذ' : 'Acquisition',
    taqbeel: language === 'ar' ? 'تقبيل' : 'Taqbeel',
  }), [language]);

  const renderBadge = (isByTakbeer: boolean) => (
    <div className="bg-white/95 text-[#111827] border-gray-100/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm border">
      {isByTakbeer ? labels.taqbeel : labels.acquisition}
    </div>
  );

  const SkeletonCard = () => (
    <div className="rounded-[24px] border border-gray-100 overflow-hidden bg-white animate-pulse shrink-0 w-[85%] sm:w-[300px] md:w-auto">
      <div className="aspect-[3/2] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-10 bg-gray-100 rounded" />
        <div className="h-px bg-gray-100" />
        <div className="flex justify-between"><div className="h-6 bg-gray-100 rounded w-1/3" /><div className="h-8 bg-gray-100 rounded-full w-1/4" /></div>
      </div>
    </div>
  );

  // Limit to 4 cards to match original layout
  const displayItems = businesses.slice(0, 4);

  return (
    <section className="py-24 bg-white" id="browse">
      <div className="container mx-auto px-6 lg:px-20">

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6">
          <div className="max-w-3xl text-center md:text-start">
            <h2 className="text-4xl font-bold text-[#111827] mb-4"
              dangerouslySetInnerHTML={{ __html: content.listings.headline }} />
            <p className="text-gray-500 text-lg leading-relaxed">{content.listings.subheadline}</p>
          </div>
          <div className="hidden lg:block shrink-0">
            <Button variant="link" className="text-[#004E39] font-bold flex items-center gap-2" onClick={onViewAll}>
              {content.listings.browseAll}
              {direction === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </Button>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : displayItems.map(b => (
              <div key={b.id} className="snap-center shrink-0 w-[85%] sm:w-[300px] md:w-auto">
                <Card
                  variant="listing"
                  hideFavorite={!isLoggedIn}
                  isSaved={b.isSaved ?? false}
                  onSave={(e) => {
                    e.stopPropagation();
                    if (!isLoggedIn) { onNavigate?.('signin'); return; }
                    saveBusinessMutation({ variables: { saveBusinessId: b.id } });
                  }}
                  title={b.businessTitle}
                  description={b.description || ''}
                  image={b.image}
                  number={fmt(b.price)}
                  badge={renderBadge(b.isByTakbeer)}
                  listingData={{
                    category: language === 'ar' ? b.category?.arabicName || b.category?.name : b.category?.name || '',
                    location: resolveBusinessLocation((b as any).district, (b as any).city, language as 'ar' | 'en'),

                    revenue: fmt(b.revenue) + ' ' + labels.currency,
                    profit: fmt(b.profit) + ' ' + labels.currency,
                    recovery: b.capitalRecovery ? Math.round(b.capitalRecovery) + ' ' + labels.month : '—',
                    refNumber: b.reference ? `#${b.reference}` : '',
                  }}
                  labels={labels}
                  // P5-FIX R-03: clicking the card navigates to the specific business details
                  onClick={() => onNavigate?.('details', b.id)}
                  footer={
                    // P5-FIX R-03: Details button also navigates to the specific business
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate?.('details', b.id); }}
                      className="bg-[#008A66] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-[#007053] transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span>{labels.details}</span>
                      {direction === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </button>
                  }
                />
              </div>
            ))
          }
        </div>

        <div className="mt-8 text-center lg:hidden">
          <Button variant="secondary" className="w-full" onClick={onViewAll}>
            {content.listings.browseAll}
          </Button>
        </div>

      </div>
    </section>
  );
};
