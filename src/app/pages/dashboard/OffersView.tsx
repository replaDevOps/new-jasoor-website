import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, DollarSign, ChevronDown, ChevronUp, XCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_OFFERS_BY_USER,
  GET_OFFERS_BY_SELLER,
} from '../../../graphql/queries/dashboard';
import {
  UPDATE_OFFER_STATUS,
  COUNTER_OFFER,
  // CREATE_DEAL removed: C13 — deal is now auto-created server-side on offer acceptance
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

// Meeting time window validation
// Sun–Fri (JS day 0–5): 4:30 PM – 11:00 PM
// Sat (JS day 6): 2:00 PM – 11:00 PM
const isValidMeetingTime = (dateStr: string, timeStr: string): boolean => {
  if (!dateStr || !timeStr) return false;
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay(); // 0=Sun … 6=Sat
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const maxMinutes = 23 * 60; // 11:00 PM
  if (dayOfWeek === 6) {
    // Saturday: 2:00 PM (14:00) – 11:00 PM
    return totalMinutes >= 14 * 60 && totalMinutes <= maxMinutes;
  }
  // Sunday–Friday: 4:30 PM (16:30) – 11:00 PM
  return totalMinutes >= 16 * 60 + 30 && totalMinutes <= maxMinutes;
};

const meetingTimeHint = (dateStr: string, isAr: boolean): string => {
  if (!dateStr) return isAr ? 'أوقات الاجتماعات: الأحد–الجمعة 4:30م–11م / السبت 2م–11م' : 'Meeting hours: Sun–Fri 4:30 PM–11 PM / Sat 2:00 PM–11 PM';
  const d = new Date(dateStr);
  const isSat = d.getDay() === 6;
  return isAr
    ? isSat ? 'السبت: من 2:00م حتى 11:00م' : 'الأحد–الجمعة: من 4:30م حتى 11:00م'
    : isSat ? 'Saturday: 2:00 PM – 11:00 PM' : 'Sun–Fri: 4:30 PM – 11:00 PM';
};

export const OffersView = ({
  onGoToDeals,
  onNavigate,
}: {
  onGoToDeals?: () => void;
  onNavigate?: (view: string, id?: string) => void;
}) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [mode, setMode]                 = useState<'details' | 'counter' | 'meeting' | 'reject'>('details');
  const [counterPrice, setCounterPrice] = useState('');
  const [meetingDate, setMeetingDate]   = useState('');
  const [meetingTime, setMeetingTime]   = useState('');
  const [timeError, setTimeError]       = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load both buyer and seller offers — network-only so fresh data is always fetched,
  // skip until userId is available to avoid unauthenticated requests.
  const { data: buyerData,  loading: buyerLoading,  refetch: refetchBuyer  } = useQuery(GET_OFFERS_BY_USER,   { fetchPolicy: 'network-only', skip: !userId, errorPolicy: 'all' });
  const { data: sellerData, loading: sellerLoading, refetch: refetchSeller } = useQuery(GET_OFFERS_BY_SELLER, { fetchPolicy: 'network-only', skip: !userId, errorPolicy: 'all' });
  const [updateStatus] = useMutation(UPDATE_OFFER_STATUS, { errorPolicy: 'all', refetchQueries: ['GetOffersByUser', 'GetOffersBySeller'] });
  const [counterOffer]  = useMutation(COUNTER_OFFER,       { errorPolicy: 'all', refetchQueries: ['GetOffersByUser', 'GetOffersBySeller'] });
  // C13: createDeal hook removed — server auto-creates deal on ACCEPTED
  const [reqMeeting] = useMutation(REQUEST_MEETING, { errorPolicy: 'all' });

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

  // Does the current user (as buyer) already have an active (non-rejected) offer on any business?
  const activeOfferBusinessIds = new Set<string>(
    sentOffers
      .filter((o: any) => o.status !== 'REJECTED' && o.status !== 'ACCEPTED')
      .map((o: any) => o.business?.id)
  );

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusColor = (s: string) =>
    s === 'ACCEPTED' ? 'green' : s === 'REJECTED' ? 'red' : s === 'PENDING' ? 'yellow' : 'blue';

  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      ACCEPTED:      content.dashboard.offers.status.accepted,
      REJECTED:      content.dashboard.offers.status.rejected,
      PENDING:       content.dashboard.offers.status.pending,
      MEETING:       content.dashboard.offers.status.sent,
      COUNTERED:     isAr ? 'عرض مضاد' : 'Countered',
    };
    return m[s] ?? s;
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB') : '—';
  const fmt = (n: number) => Number(n).toLocaleString();

  const handleAccept = async (offer?: any) => {
    // C13: deal is auto-created server-side when offer is ACCEPTED — no explicit createDeal call needed
    const o = offer ?? selectedOffer;
    if (!o) return;
    const { errors } = await updateStatus({ variables: { input: { id: o.id, status: 'ACCEPTED' } } });
    if (errors?.length) {
      const errMsg = errors[0]?.message ?? '';
      if (errMsg.includes('NDA_NOT_SIGNED')) {
        // C14/C15: NDA not signed — redirect to offers with message
        toast.error(isAr
          ? 'يجب توقيع اتفاقية السرية (NDA) أولاً قبل قبول العرض'
          : 'You must sign the NDA for this listing before accepting the offer');
        onNavigate?.('offers');
      } else if (errMsg.includes('MULTIPLE_ACCEPTED_OFFERS')) {
        // Guard: seller already accepted another offer for this same business
        toast.error(isAr
          ? 'لا يمكن قبول أكثر من عرض على نفس الإعلان'
          : 'You cannot accept more than one offer for the same listing');
      } else {
        toast.error(isAr ? 'حدث خطأ' : 'Error');
      }
      return;
    }
    toast.success(isAr ? 'تم قبول العرض وإنشاء الصفقة ✓' : 'Offer accepted & deal created ✓');
    setTimeout(() => onGoToDeals?.(), 1000);
    setSelectedId(null);
    refetch();
  };

  const handleReject = async () => {
    if (!selectedOffer) return;
    const { errors } = await updateStatus({ variables: { input: { id: selectedOffer.id, status: 'REJECTED' } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم رفض العرض' : 'Offer rejected');
    setSelectedId(null);
    setMode('details');
    refetch();
  };

  const handleCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !counterPrice) return;
    const { errors } = await counterOffer({ variables: { input: { parentOfferId: selectedOffer.id, price: parseFloat(counterPrice) } } });
    if (errors?.length) {
      const errMsg = errors[0]?.message ?? '';
      if (errMsg.includes('OFFER_ALREADY_EXISTS')) {
        toast.error(isAr ? 'عرض موجود بالفعل على هذا الإعلان' : 'An offer already exists for this listing');
      } else {
        toast.error(isAr ? 'حدث خطأ' : 'Error');
      }
      return;
    }
    toast.success(content.dashboard.offers.actions.successCounter);
    setCounterPrice('');
    setSelectedId(null);
    refetch();
  };

  const handleTimeChange = (time: string) => {
    setMeetingTime(time);
    if (time && meetingDate) {
      if (!isValidMeetingTime(meetingDate, time)) {
        setTimeError(isAr
          ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها.'
          : 'Selected time is outside the allowed meeting hours.');
      } else {
        setTimeError('');
      }
    }
  };

  const handleDateChange = (date: string) => {
    setMeetingDate(date);
    if (meetingTime && date) {
      if (!isValidMeetingTime(date, meetingTime)) {
        setTimeError(isAr
          ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها.'
          : 'Selected time is outside the allowed meeting hours.');
      } else {
        setTimeError('');
      }
    } else {
      setTimeError('');
    }
  };

  const handleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !meetingDate) return;
    if (!meetingTime) {
      setTimeError(isAr ? 'يرجى تحديد وقت الاجتماع' : 'Please select a meeting time');
      return;
    }
    if (!isValidMeetingTime(meetingDate, meetingTime)) {
      setTimeError(isAr
        ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها.'
        : 'Selected time is outside the allowed meeting hours.');
      return;
    }
    const startIso = `${meetingDate}T${meetingTime}:00.000Z`;
    const endDate = new Date(startIso);
    endDate.setHours(endDate.getHours() + 1);
    const endIso = endDate.toISOString();
    const { errors } = await reqMeeting({ variables: { input: { businessId: selectedOffer.business.id, offerId: selectedOffer.id, requestedDate: startIso, requestedEndDate: endIso } } });
    if (errors?.length) {
      const msg = errors[0]?.message ?? '';
      if (msg.includes('MEETING_REQUEST_OUTSIDE_ALLOWED_HOURS') || msg.includes('MEETING_TIME_INVALID')) {
        // C4: server-side time window validation error
        const localMsg = isAr
          ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها.'
          : 'Selected time is outside the allowed meeting hours.';
        setTimeError(localMsg);
        toast.error(localMsg);
      } else if (msg.includes('NDA_NOT_SIGNED')) {
        // C15: NDA gate — user must sign NDA first
        toast.error(isAr
          ? 'يجب توقيع اتفاقية السرية (NDA) لهذا الإعلان أولاً'
          : 'You must sign the NDA for this listing before requesting a meeting');
        onNavigate?.('offers');
      } else {
        toast.error(isAr ? 'حدث خطأ' : 'Error');
      }
      return;
    }
    toast.success(content.dashboard.offers.actions.successMeeting);
    setMeetingDate('');
    setMeetingTime('');
    setTimeError('');
    setSelectedId(null);
  };

  // Active offer warning — shown as inline note inside buyer's offer row (mobile) or modal
  const buyerHasActiveOffer = (businessId: string) => activeOfferBusinessIds.has(businessId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.offers.title}
        action={undefined}
      />

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
        ) : allOffers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{content.dashboard.meetings.empty}</div>
        ) : (
          <>
            {/* ─── DESKTOP TABLE (md and above) ─── */}
            <div className="hidden md:block overflow-x-auto">
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
                        <button
                          onClick={() => onNavigate?.('details', o.business?.id)}
                          className="text-sm font-bold text-[#111827] hover:text-[#10B981] hover:underline text-left transition-colors"
                        >
                          {o.business?.businessTitle}
                        </button>
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
            </div>

            {/* ─── MOBILE LIST (below md) ─── */}
            <div className="md:hidden divide-y divide-gray-100">
              {allOffers.map((o: any) => {
                const isExpanded = expandedRows.has(o.id);
                const isBuyer = String(o.buyer?.id) === String(userId);
                return (
                  <div key={o.id} className="px-4 py-3">
                    {/* Collapsed row: Status + Listing Name + chevron */}
                    <button
                      className="w-full flex items-center justify-between gap-3 text-left"
                      onClick={() => toggleRow(o.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <DashBadge color={statusColor(o.status)}>{statusLabel(o.status)}</DashBadge>
                        <span className="text-sm font-bold text-[#111827] truncate">{o.business?.businessTitle}</span>
                      </div>
                      <span className="shrink-0 text-gray-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 pl-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{content.dashboard.offers.table.offerAmount}</span>
                          <span className="font-black text-[#10B981]">{fmt(o.price)} {content.dashboard.offers.sar}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{content.dashboard.offers.table.date}</span>
                          <span className="font-medium text-[#111827]">{fmtDate(o.createdAt)}</span>
                        </div>
                        {/* Active offer note for buyer */}
                        {isBuyer && o.status === 'PENDING' && buyerHasActiveOffer(o.business?.id) && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 font-medium">
                              {isAr
                                ? 'لديك عرض نشط بالفعل على هذا النشاط. يرجى انتظار رد البائع قبل تقديم عرض آخر.'
                                : 'You already have an active offer on this business. Please wait for the seller\'s response before submitting another offer.'}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => { setSelectedId(o.id); setMode('details'); }}
                            className="text-[#10B981] hover:text-[#008A66] font-bold text-sm"
                          >
                            {content.dashboard.offers.actions.viewDetails}
                          </button>
                          {o.status === 'PENDING' && !isBuyer && (
                            <button
                              onClick={async (e) => { e.stopPropagation(); setSelectedId(o.id); await handleAccept(o); }}
                              className="bg-[#10B981] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#008A66] transition-colors"
                            >
                              {isAr ? 'قبول' : 'Accept'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── DETAIL MODAL ─── */}
      <DashModal
        isOpen={!!selectedOffer}
        onClose={() => { setSelectedId(null); setMode('details'); setTimeError(''); }}
        title={
          mode === 'details'  ? content.dashboard.offers.actions.viewDetails
          : mode === 'counter'  ? content.dashboard.offers.actions.counterOffer
          : mode === 'meeting'  ? content.dashboard.offers.actions.scheduleMeeting
          :                       isAr ? 'رفض العرض' : 'Reject Offer'
        }
      >
        {selectedOffer && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.listing}</p>
                  <button
                    onClick={() => { setSelectedId(null); onNavigate?.('details', selectedOffer.business?.id); }}
                    className="font-bold text-[#111827] hover:text-[#10B981] hover:underline transition-colors text-left"
                  >
                    {selectedOffer.business?.businessTitle}
                  </button>
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

            {/* ─── DETAILS MODE ─── */}
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
                    {/* ── Seller (receiver): Accept / Reject / Counter / Schedule ── */}
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
                        {/* Mandatory Reject button */}
                        <button onClick={() => setMode('reject')} className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                          <XCircle size={18} />{isAr ? 'رفض العرض' : 'Reject Offer'}
                        </button>
                      </>
                    )}

                    {/* ── Buyer (sender): counter only + active offer note ── */}
                    {String(selectedOffer.buyer?.id) === String(userId) && (
                      <>
                        {buyerHasActiveOffer(selectedOffer.business?.id) && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 font-medium">
                              {isAr
                                ? 'لديك عرض نشط بالفعل على هذا النشاط. يرجى انتظار رد البائع قبل تقديم عرض آخر.'
                                : "You already have an active offer on this business. Please wait for the seller's response before submitting another offer."}
                            </p>
                          </div>
                        )}
                        <button onClick={() => setMode('counter')} className="w-full py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                          <DollarSign size={18} />{content.dashboard.offers.actions.counterOffer}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ─── REJECT CONFIRM MODE ─── */}
            {mode === 'reject' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                  {isAr
                    ? 'هل أنت متأكد أنك تريد رفض هذا العرض؟ لا يمكن التراجع عن هذه الخطوة.'
                    : 'Are you sure you want to reject this offer? This action cannot be undone.'}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode('details')} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">
                    {content.dashboard.offers.actions.cancel}
                  </button>
                  <button type="button" onClick={handleReject} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 flex items-center justify-center gap-2">
                    <XCircle size={18} />{isAr ? 'تأكيد الرفض' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── COUNTER OFFER MODE ─── */}
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

            {/* ─── SCHEDULE MEETING MODE ─── */}
            {mode === 'meeting' && (
              <form onSubmit={handleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingDate}</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingTime}</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => handleTimeChange(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-[#10B981]",
                      timeError ? "border-red-400 focus:border-red-400" : "border-gray-200"
                    )}
                  />
                  {timeError ? (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />{timeError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-400">
                      {meetingTimeHint(meetingDate, isAr)}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setMode('details'); setTimeError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">{content.dashboard.offers.actions.cancel}</button>
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
