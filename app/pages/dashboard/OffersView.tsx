import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_OFFERS_BY_USER,
  GET_OFFERS_BY_SELLER,
} from '../../../graphql/queries/dashboard';
import {
  UPDATE_OFFER_STATUS,
  COUNTER_OFFER,
} from '../../../graphql/mutations/dashboard';
import { REQUEST_MEETING } from '../../../graphql/mutations/business';
import { DashBadge, SectionHeader, DashModal } from './DashboardView';

export const OffersView = () => {
  const { content, language, direction } = useApp();
  const isAr = language === 'ar';

  const [directionFilter, setDirectionFilter] = useState<'received' | 'sent'>('received');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'details' | 'counter' | 'meeting'>('details');
  const [counterPrice, setCounterPrice] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // P6-FIX R-04: real offers queries
  const { data: buyerData,  loading: buyerLoading,  refetch: refetchBuyer  } = useQuery(GET_OFFERS_BY_USER,   { errorPolicy: 'all' });
  const { data: sellerData, loading: sellerLoading, refetch: refetchSeller } = useQuery(GET_OFFERS_BY_SELLER, { errorPolicy: 'all' });
  const [updateStatus] = useMutation(UPDATE_OFFER_STATUS, { errorPolicy: 'all' });
  const [counterOffer]  = useMutation(COUNTER_OFFER,       { errorPolicy: 'all' });
  const [reqMeeting]    = useMutation(REQUEST_MEETING,      { errorPolicy: 'all' });

  const allOffers = directionFilter === 'sent'
    ? (buyerData?.getOffersByUser   ?? [])
    : (sellerData?.getOffersBySeller ?? []);

  const loading = directionFilter === 'sent' ? buyerLoading : sellerLoading;
  const refetch = directionFilter === 'sent' ? refetchBuyer : refetchSeller;
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

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-SA') : '—';
  const fmt = (n: number) => Number(n).toLocaleString();

  const handleAccept = async () => {
    if (!selectedOffer) return;
    const { errors } = await updateStatus({ variables: { input: { id: selectedOffer.id, status: 'ACCEPTED' } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم قبول العرض' : 'Offer accepted');
    setSelectedId(null);
    refetch();
  };

  const handleCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !counterPrice) return;
    const { errors } = await counterOffer({ variables: { input: { offerId: selectedOffer.id, price: parseFloat(counterPrice) } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(content.dashboard.offers.actions.successCounter);
    setSelectedId(null);
    refetch();
  };

  const handleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !meetingDate) return;
    const iso = `${meetingDate}T${meetingTime || '09:00'}:00.000Z`;
    const { errors } = await reqMeeting({ variables: { input: { businessId: selectedOffer.business.id, requestedDate: iso, requestedEndDate: iso } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(content.dashboard.offers.actions.successMeeting);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.offers.title}
        action={
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
            <button onClick={() => setDirectionFilter('received')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap', directionFilter === 'received' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              <ArrowDownLeft size={16} />{content.dashboard.offers.filters.received}
            </button>
            <button onClick={() => setDirectionFilter('sent')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap', directionFilter === 'sent' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              <ArrowUpRight size={16} />{content.dashboard.offers.filters.sent}
            </button>
          </div>
        }
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
                      <button onClick={() => { setSelectedId(o.id); setMode('details'); }} className="text-[#10B981] hover:text-[#008A66] font-bold text-sm">
                        {content.dashboard.offers.actions.viewDetails}
                      </button>
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
                    <span className="text-gray-500">{directionFilter === 'sent' ? content.dashboard.offers.table.seller : content.dashboard.offers.table.buyer}</span>
                    <span className="font-bold text-[#111827]">{selectedOffer.buyer?.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{content.dashboard.offers.table.offerNumber}</span>
                    <span className="font-bold text-[#111827]">#{selectedOffer.id}</span>
                  </div>
                </div>
                {selectedOffer.status === 'PENDING' && directionFilter === 'received' && (
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setMode('counter')} className="py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                        <DollarSign size={18} />{content.dashboard.offers.actions.counterOffer}
                      </button>
                      <button onClick={() => setMode('meeting')} className="py-3 rounded-xl bg-[#111827] text-white font-bold hover:bg-black flex items-center justify-center gap-2">
                        <Calendar size={18} />{content.dashboard.offers.actions.scheduleMeeting}
                      </button>
                    </div>
                    <button onClick={handleAccept} className="w-full py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66] flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} />{content.dashboard.offers.actions.accept}
                    </button>
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
