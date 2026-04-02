import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_OFFERS_BY_USER,
  GET_OFFERS_BY_SELLER,
  GET_BUYER_INPROGRESS_DEALS,
  GET_SELLER_INPROGRESS_DEALS,
} from '../../../graphql/queries/dashboard';
import {
  UPDATE_OFFER_STATUS,
  COUNTER_OFFER,
  CREATE_DEAL,
} from '../../../graphql/mutations/dashboard';
import { REQUEST_MEETING } from '../../../graphql/mutations/business';
import { DashBadge, SectionHeader, DashModal } from './DashboardView';

// Mask last name for privacy: "Mohammed Al-Zahrani" → "Mohammed ***"
const maskName = (name: string | null | undefined): string => {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return parts[0] + ' ***';
};

export const OffersView = ({ onGoToDeals }: { onGoToDeals?: () => void }) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'details' | 'counter' | 'meeting'>('details');
  const [counterPrice, setCounterPrice] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // Load both buyer and seller offers always
  const { data: buyerData,  loading: buyerLoading,  refetch: refetchBuyer  } = useQuery(GET_OFFERS_BY_USER,   { errorPolicy: 'all' });
  const { data: sellerData, loading: sellerLoading, refetch: refetchSeller } = useQuery(GET_OFFERS_BY_SELLER, { errorPolicy: 'all' });
  const [updateStatus] = useMutation(UPDATE_OFFER_STATUS, { errorPolicy: 'all' });
  const [counterOffer]  = useMutation(COUNTER_OFFER,       { errorPolicy: 'all' });
  const [createDeal]    = useMutation(CREATE_DEAL, {
    errorPolicy: 'all',
    refetchQueries: [
      { query: GET_BUYER_INPROGRESS_DEALS,  variables: { limit: 50, offset: 0 } },
      { query: GET_SELLER_INPROGRESS_DEALS, variables: { limit: 50, offset: 0 } },
    ],
    awaitRefetchQueries: true,
  });
  const [reqMeeting]    = useMutation(REQUEST_MEETING,      { errorPolicy: 'all' });

  // Merge all offers — deduplicate by id
  const receivedOffers = sellerData?.getOffersBySeller          ?? [];
  const sentOffers     = buyerData?.getOffersByUser?.offers      ?? [];
  const seen = new Set<string>();
  const allOffers = [...receivedOffers, ...sentOffers].filter((o: any) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  const loading = buyerLoading || sellerLoading;
  const refetch = () => { refetchBuyer(); refetchSeller(); };
  const selectedOffer = allOffers.find((o: any) => o.id === selectedId);

  const statusColor = (s: string) =>
    s === 'ACCEPTED' ? 'green' : s === 'REJECTED' ? 'red' : s === 'PENDING' ? 'yellow' : 'blue';

  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      ACCEPTED: content.dashboard.offers.status.accepted,
      REJECTED: content.dashboard.offers.status.rejected,
      PENDING:  content.dashboard.offers.status.pending,
      MEETING:  content.dashboard.offers.status.sent,
      COUNTERED: isAr ? 'عرض مضاد' : 'Countered',
    };
    return m[s] ?? s;
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB') : '—';
  const fmt = (n: number) => Number(n).toLocaleString();

  const handleAccept = async (offer?: any) => {
    const o = offer ?? selectedOffer;
    if (!o) return;
    const { errors } = await updateStatus({ variables: { input: { id: o.id, status: 'ACCEPTED' } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    // Create deal immediately on accept — meetingId is optional
    let dealErrors: any[] = [];
    try {
      const result = await createDeal({ variables: { input: {
        offerId:    o.id,
        businessId: o.business.id,
        meetingId:  o.meeting?.id ?? undefined,
        buyerId:    o.buyer.id,
        price:      o.price,
      }}});
      dealErrors = result.errors ?? [];
    } catch (e: any) {
      console.error('createDeal exception:', e);
      dealErrors = [{ message: e?.message ?? 'Unknown error' }];
    }
    if (!dealErrors?.length) {
      toast.success(isAr ? 'تم قبول العرض وإنشاء الصفقة ✓' : 'Offer accepted & deal created ✓');
      setTimeout(() => onGoToDeals?.(), 1000);
    } else {
      console.error('createDeal failed:', dealErrors);
      const errMsg = dealErrors[0]?.message ?? '';
      toast.error(isAr
        ? `تم قبول العرض لكن فشل إنشاء الصفقة: ${errMsg}`
        : `Offer accepted but deal creation failed: ${errMsg}`
      );
    }
    setSelectedId(null);
    refetch();
  };

  const handleCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !counterPrice) return;
    const { errors } = await counterOffer({ variables: { input: { parentOfferId: selectedOffer.id, price: parseFloat(counterPrice) } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(content.dashboard.offers.actions.successCounter);
    setCounterPrice('');
    setSelectedId(null);
    refetch();
  };

  const handleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !meetingDate) return;
    const startIso = `${meetingDate}T${meetingTime || '09:00'}:00.000Z`;
    // End time = start + 1 hour
    const endDate = new Date(startIso);
    endDate.setHours(endDate.getHours() + 1);
    const endIso = endDate.toISOString();
    const { errors } = await reqMeeting({ variables: { input: { businessId: selectedOffer.business.id, offerId: selectedOffer.id, requestedDate: startIso, requestedEndDate: endIso } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(content.dashboard.offers.actions.successMeeting);
    setMeetingDate('');
    setMeetingTime('');
    setSelectedId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.offers.title}
        action={undefined}
      />

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.offers.table.listing}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.offers.table.offerAmount}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.offers.table.date}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.offers.table.status}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.offers.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allOffers.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[#111827]">{o.business?.businessTitle}</p>
                      <p className="text-xs text-gray-500">{fmt(o.business?.price)} {content.dashboard.offers.sar}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-[#10B981]">{fmt(o.price)} {content.dashboard.offers.sar}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(o.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DashBadge color={statusColor(o.status)}>{statusLabel(o.status)}</DashBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedId(o.id); setMode('details'); }} className="text-[#10B981] hover:text-[#008A66] font-bold text-sm whitespace-nowrap">
                          {content.dashboard.offers.actions.viewDetails}
                        </button>
                        {/* Quick accept for seller on PENDING offers */}
                        {o.status === 'PENDING' && String(o.buyer?.id) !== String(userId) && (
                          <button
                            onClick={async (e) => { e.stopPropagation(); setSelectedId(o.id); await handleAccept(o); }}
                            className="bg-[#10B981] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#008A66] transition-colors whitespace-nowrap"
                          >
                            {isAr ? 'قبول' : 'Accept'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allOffers.length === 0 && (
              <div className="p-8 text-center text-gray-400">{content.dashboard.meetings.empty}</div>
            )}
          </div>
        )}
      </div>

      <DashModal
        isOpen={!!selectedOffer}
        onClose={() => { setSelectedId(null); setMode('details'); }}
        title={mode === 'details' ? content.dashboard.offers.actions.viewDetails : mode === 'counter' ? content.dashboard.offers.actions.counterOffer : content.dashboard.offers.actions.scheduleMeeting}
      >
        {selectedOffer && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.listing}</p>
                  <p className="font-bold text-[#111827]">{selectedOffer.business?.businessTitle}</p>
                </div>
                <DashBadge color={statusColor(selectedOffer.status)}>{statusLabel(selectedOffer.status)}</DashBadge>
              </div>
              {mode === 'details' && (
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.salePrice}</p>
                    <p className="font-bold text-gray-900">{fmt(selectedOffer.business?.price)} {content.dashboard.offers.sar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.offerAmount}</p>
                    <p className="font-black text-[#10B981]">{fmt(selectedOffer.price)} {content.dashboard.offers.sar}</p>
                  </div>
                </div>
              )}
            </div>

            {mode === 'details' && (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{content.dashboard.offers.table.date}</span>
                    <span className="font-bold text-[#111827]">{fmtDate(selectedOffer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">
                      {String(selectedOffer.buyer?.id) === String(userId)
                        ? content.dashboard.offers.table.seller
                        : content.dashboard.offers.table.buyer}
                    </span>
                    <span className="font-bold text-[#111827]">
                      {String(selectedOffer.buyer?.id) === String(userId)
                        ? maskName(selectedOffer.business?.seller?.name)
                        : maskName(selectedOffer.buyer?.name)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{content.dashboard.offers.table.offerNumber}</span>
                    <span className="font-bold text-[#111827]">#{selectedOffer.id}</span>
                  </div>
                </div>
                {selectedOffer.status === 'PENDING' && (
                  <div className="flex flex-col gap-3 mt-6">
                    {/* Seller (receiver): can accept, counter, or schedule meeting */}
                    {String(selectedOffer.buyer?.id) !== String(userId) && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setMode('counter')} className="py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                            <DollarSign size={18} />{content.dashboard.offers.actions.counterOffer}
                          </button>
                          <button onClick={() => setMode('meeting')} className="py-3 rounded-xl bg-[#111827] text-white font-bold hover:bg-black flex items-center justify-center gap-2">
                            <Calendar size={18} />{content.dashboard.offers.actions.scheduleMeeting}
                          </button>
                        </div>
                        <button onClick={() => handleAccept()} className="w-full py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66] flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} />{content.dashboard.offers.actions.accept}
                        </button>
                      </>
                    )}
                    {/* Buyer (sender): can only counter their own offer */}
                    {String(selectedOffer.buyer?.id) === String(userId) && (
                      <button onClick={() => setMode('counter')} className="w-full py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                        <DollarSign size={18} />{content.dashboard.offers.actions.counterOffer}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {mode === 'counter' && (
              <form onSubmit={handleCounter} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.amount}</label>
                  <input type="number" placeholder="0" value={counterPrice} onChange={e => setCounterPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981]" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode('details')} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">{content.dashboard.offers.actions.cancel}</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66]">{content.dashboard.offers.actions.submit}</button>
                </div>
              </form>
            )}

            {mode === 'meeting' && (
              <form onSubmit={handleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingDate}</label>
                  <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingTime}</label>
                  <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981]" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode('details')} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">{content.dashboard.offers.actions.cancel}</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-[#111827] text-white font-bold hover:bg-black">{content.dashboard.offers.actions.submit}</button>
                </div>
              </form>
            )}
          </div>
        )}
      </DashModal>
    </div>
  );
};
