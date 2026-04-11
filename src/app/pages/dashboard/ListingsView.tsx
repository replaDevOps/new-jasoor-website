import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight, AlertCircle, Eye, Heart, MessageCircle } from 'lucide-react';
import { Card } from '../../components/Card';
import { Badge as UiBadge } from '../../components/Badge';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { CREATE_SAVE_BUSINESS } from '../../../graphql/mutations/dashboard';
import { GET_SELLER_BUSINESSES, GET_FAVORITE_BUSINESSES, GET_SELLER_SOLD_BUSINESSES } from '../../../graphql/queries/dashboard';
import { SectionHeader } from './DashboardView';

export const ListingsView = ({
  isFavorites = false,
  onAddListing,
  onEditListing,
  onNavigate,
}: {
  isFavorites?: boolean;
  onAddListing?: () => void;
  onEditListing?: (id: number) => void;
  onNavigate?: (page: string, id?: number) => void;
}) => {
  const { content, language, direction, userId } = useApp();
  const apolloClient = useApolloClient();
  const isAr = language === 'ar';
  const [saveBusiness] = useMutation(CREATE_SAVE_BUSINESS, { errorPolicy: 'all' });
  const [filter, setFilter] = useState<'all' | 'sold'>('all');

  // Load active + sold listings separately (backend splits them)
  const { data: sellerData, loading: sellerLoading, refetch: refetchSeller, error: sellerError } = useQuery(GET_SELLER_BUSINESSES,      { skip: isFavorites, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: soldData,   loading: soldLoading,   refetch: refetchSold,   error: soldError   } = useQuery(GET_SELLER_SOLD_BUSINESSES, { skip: isFavorites, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: favData,    loading: favLoading,    refetch: refetchFav,    error: favError    } = useQuery(GET_FAVORITE_BUSINESSES,    { skip: !isFavorites, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const queryError = isFavorites ? favError : (sellerError || soldError);

  // Force fresh fetch: evict cached listings and refetch when userId is available
  useEffect(() => {
    if (!userId) return;
    // Evict any stale cached results so we always get fresh data from server
    try {
      apolloClient.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getAllSellerBusinesses' });
      apolloClient.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getAllSellerSoldBusinesses' });
      apolloClient.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getFavoritBusiness' });
      apolloClient.cache.gc();
    } catch {}
    if (!isFavorites) { refetchSeller(); refetchSold(); }
    else              { refetchFav(); }
  }, [userId]);

  // Debug: log what backend returns
  useEffect(() => {
    if (sellerData) {
      console.log('[ListingsView] getAllSellerBusinesses returned:',
        sellerData?.getAllSellerBusinesses?.businesses?.length ?? 0, 'listings',
        sellerData?.getAllSellerBusinesses
      );
    }
  }, [sellerData]);

  const activeListings = sellerData?.getAllSellerBusinesses?.businesses  ?? [];
  const soldListings   = soldData?.getAllSellerSoldBusinesses?.businesses ?? [];
  const allMyListings  = [...activeListings, ...soldListings];

  const rawListings = isFavorites
    ? (favData?.getFavoritBusiness?.businesses ?? [])
    : allMyListings;

  const loading = isFavorites ? favLoading : (sellerLoading || soldLoading);

  const filtered = filter === 'all'
    ? rawListings
    : rawListings.filter((b: any) => b.businessStatus === 'SOLD');

  const statusLabel = (status: string) => {
    if (status === 'ACTIVE')       return { text: content.dashboard.listings.status.active,      variant: 'success'  as const };
    if (status === 'SOLD')         return { text: content.dashboard.listings.status.sold,        variant: 'neutral'  as const };
    return                                { text: content.dashboard.listings.status.underReview, variant: 'warning'  as const };
  };

  const fmt = (n: number) => Number(n).toLocaleString();

  // Same labels as BrowseBusinesses
  const labels = {
    revenue:    isAr ? 'الإيرادات السنوية' : 'Revenue',
    profit:     isAr ? 'صافي الربح'        : 'Profit',
    recovery:   isAr ? 'فترة الاسترداد'    : 'Recovery',
    askingPrice: isAr ? 'سعر الطلب'        : 'Asking Price',
    currency:   isAr ? 'ر.س'               : 'SAR',
    details:    isAr ? 'التفاصيل'          : 'Details',
    noImage:    isAr ? 'لا توجد صورة'      : 'No image',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* F-11: Error banner */}
      {queryError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{isAr ? 'تعذر تحميل القوائم، يرجى المحاولة مجدداً' : 'Could not load listings. Please try again.'}</span>
          <button onClick={() => isFavorites ? refetchFav() : refetchSeller()} className="mr-auto ml-2 text-xs font-bold underline">{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}
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
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-3">
          <p className="text-gray-400 font-medium">{isAr ? 'لا توجد إدراجات بعد' : 'No listings yet'}</p>
          <button
            onClick={() => { refetchSeller(); refetchSold(); }}
            className="text-sm text-[#008A66] font-bold hover:underline block mx-auto"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b: any) => {
            const sl = statusLabel(b.businessStatus);
            const sar = isAr ? 'ر.س' : 'SAR';
            const mo  = isAr ? 'شهر' : 'mo';
            return (
              <Card
                key={b.id}
                variant="listing"
                title={b.businessTitle}
                description={b.description}
                image={b.image}
                number={fmt(b.price)}
                hideFavorite={!isFavorites}
                isSaved={isFavorites ? true : (userId ? (b.savedBy?.some((u: any) => String(u.id) === String(userId)) ?? false) : false)}
                onSave={async (e) => {
                  e.stopPropagation();
                  await saveBusiness({ variables: { saveBusinessId: b.id } });
                  // Refetch so saved state updates immediately
                  if (isFavorites) refetchFav(); else { refetchSeller(); refetchSold(); }
                }}
                badge={<UiBadge variant={sl.variant} className="backdrop-blur-md bg-white/90 shadow-sm">{sl.text}</UiBadge>}
                listingData={{
                  location: b.city || b.district || '',
                  category: isAr ? b.category?.arabicName : b.category?.name,
                  revenue:  b.revenue  ? `${fmt(b.revenue)} ${sar}`  : '—',
                  profit:   b.profit   ? `${fmt(b.profit)} ${sar}`   : '—',
                  recovery: b.capitalRecovery ? `${Math.round(b.capitalRecovery)} ${mo}` : '—',
                  refNumber: b.reference ? `#${b.reference}` : '',
                }}
                labels={labels}
                footer={
                  <div className="flex flex-col gap-2 w-full">
                    {/* Status row — always visible below card image */}
                    {!isFavorites && (
                      <div className="flex items-center justify-between px-1 pb-1">
                        <UiBadge variant={sl.variant}>{sl.text}</UiBadge>
                        {/* Listing analytics */}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {b.viewCount != null && (
                            <span className="flex items-center gap-1"><Eye size={11} />{b.viewCount}</span>
                          )}
                          {b.saveCount != null && (
                            <span className="flex items-center gap-1"><Heart size={11} />{b.saveCount}</span>
                          )}
                          {b.offerCount != null && (
                            <span className="flex items-center gap-1"><MessageCircle size={11} />{b.offerCount}</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      {!isFavorites && b.businessStatus !== 'SOLD' && (
                        <button onClick={e => { e.stopPropagation(); onEditListing?.(Number(b.id)); }} className="flex-1 bg-[#F3F4F6] text-[#111827] py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                          {content.dashboard.listings.actions.edit}
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); onNavigate?.('details', Number(b.id)); }}
                        className="flex-1 bg-[#008A66] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#007053] transition-colors flex items-center justify-center gap-1">
                        {content.dashboard.listings.actions.view}
                        {direction === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
