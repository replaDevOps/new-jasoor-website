import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge as UiBadge } from '../../components/Badge';
import { useQuery } from '@apollo/client';
import { GET_SELLER_BUSINESSES, GET_FAVORITE_BUSINESSES } from '../../../graphql/queries/dashboard';
import { SectionHeader } from './DashboardView';

export const ListingsView = ({
  isFavorites = false,
  onAddListing,
  onEditListing,
}: {
  isFavorites?: boolean;
  onAddListing?: () => void;
  onEditListing?: (id: number) => void;
}) => {
  const { content, language, direction } = useApp();
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<'all' | 'sold'>('all');

  // P6-FIX R-04: real data
  const { data: sellerData, loading: sellerLoading } = useQuery(GET_SELLER_BUSINESSES,  { skip: isFavorites,  errorPolicy: 'all' });
  const { data: favData,    loading: favLoading    } = useQuery(GET_FAVORITE_BUSINESSES, { skip: !isFavorites, errorPolicy: 'all' });

  const rawListings = isFavorites
    ? (favData?.getFavoritBusiness?.businesses ?? [])
    : (sellerData?.getAllSellerBusinesses?.businesses ?? []);

  const loading = isFavorites ? favLoading : sellerLoading;

  const filtered = filter === 'all'
    ? rawListings
    : rawListings.filter((b: any) => b.businessStatus === 'SOLD');

  const statusLabel = (status: string) => {
    if (status === 'ACTIVE')       return { text: content.dashboard.listings.status.active,      variant: 'success'  as const };
    if (status === 'SOLD')         return { text: content.dashboard.listings.status.sold,        variant: 'neutral'  as const };
    return                                { text: content.dashboard.listings.status.underReview, variant: 'warning'  as const };
  };

  const fmt = (n: number) => Number(n).toLocaleString();

  const labels = isFavorites
    ? { revenue: isAr ? 'الإيرادات' : 'Revenue', profit: isAr ? 'الأرباح' : 'Profit', recovery: isAr ? 'الاسترداد' : 'Recovery', askingPrice: isAr ? 'السعر' : 'Price', currency: isAr ? 'ر.س' : 'SAR', details: isAr ? 'التفاصيل' : 'Details', noImage: isAr ? 'لا توجد صورة' : 'No image' }
    : { revenue: isAr ? 'المشاهدات' : 'Views',   profit: isAr ? 'العروض' : 'Offers',   recovery: isAr ? 'المفضلة' : 'Favorites', askingPrice: isAr ? 'السعر' : 'Price', currency: isAr ? 'ر.س' : 'SAR', details: isAr ? 'التفاصيل' : 'Details', noImage: isAr ? 'لا توجد صورة' : 'No image' };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={isFavorites ? content.dashboard.tabs.favorites : content.dashboard.listings.title}
        action={!isFavorites && (
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
              <button onClick={() => setFilter('all')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'all' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.listings.filters.all}</button>
              <button onClick={() => setFilter('sold')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'sold' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.listings.filters.sold}</button>
            </div>
            <button onClick={onAddListing} className="bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#008A66] transition-colors shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus size={18} />
              {content.dashboard.listings.addNew}
            </button>
          </div>
        )}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="rounded-[24px] border border-gray-100 overflow-hidden bg-white animate-pulse h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 font-medium">
          {isAr ? 'لا توجد إدراجات بعد' : 'No listings yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b: any) => {
            const sl = statusLabel(b.businessStatus);
            return (
              <Card
                key={b.id}
                variant="listing"
                title={isAr ? b.businessTitle : b.businessTitle}
                number={fmt(b.price)}
                badge={<UiBadge variant={sl.variant} className="backdrop-blur-md bg-white/90 shadow-sm">{sl.text}</UiBadge>}
                listingData={{
                  category: isAr ? b.category?.arabicName : b.category?.name,
                  revenue: isFavorites ? fmt(b.revenue) : (b.offerCount ?? 0).toString(),
                  profit:  isFavorites ? fmt(b.profit)  : '—',
                  recovery: '—',
                  refNumber: b.reference ? `#${b.reference}` : '',
                }}
                labels={labels}
                footer={!isFavorites ? (
                  <div className="flex gap-2 w-full">
                    {b.businessStatus !== 'SOLD' && (
                      <button onClick={e => { e.stopPropagation(); onEditListing?.(Number(b.id)); }} className="flex-1 bg-[#F3F4F6] text-[#111827] py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                        {content.dashboard.listings.actions.edit}
                      </button>
                    )}
                    <button className="flex-1 bg-[#10B981] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#008A66] transition-colors flex items-center justify-center gap-1">
                      {content.dashboard.listings.actions.view}
                      {direction === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                ) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
