import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { ArrowRight, CheckCircle2, Handshake } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_BUYER_INPROGRESS_DEALS, GET_SELLER_INPROGRESS_DEALS, GET_BUYER_COMPLETED_DEALS, GET_SELLER_COMPLETED_DEALS } from '../../../graphql/queries/dashboard';
import { DashBadge, SectionHeader } from './DashboardView';

export const DealsView = ({ onNavigate }: { onNavigate?: (view: string, id?: string) => void }) => {
  const { content, language, direction } = useApp();
  const isAr = language === 'ar';

  const [filter, setFilter]   = useState<'in-progress' | 'completed'>('in-progress');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // P6-FIX R-04: real deals data — in-progress + completed
  const { data: buyerData,     loading: buyerLoading     } = useQuery(GET_BUYER_INPROGRESS_DEALS,  { variables: { limit: 50, offset: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const { data: sellerData,    loading: sellerLoading    } = useQuery(GET_SELLER_INPROGRESS_DEALS, { variables: { limit: 50, offset: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const { data: buyerDoneData, loading: buyerDoneLoading } = useQuery(GET_BUYER_COMPLETED_DEALS,   { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all', skip: filter !== 'completed' });
  const { data: sellerDoneData,loading: sellerDoneLoading} = useQuery(GET_SELLER_COMPLETED_DEALS,  { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all', skip: filter !== 'completed' });

  // Merge buyer + seller deals (in-progress or completed), deduplicate
  const buyerDeals      = (buyerData?.getBuyerInprogressDeals?.deals     ?? []).map((d: any) => ({ ...d, _role: 'buyer'  }));
  const sellerDeals     = (sellerData?.getSellerInprogressDeals?.deals   ?? []).map((d: any) => ({ ...d, _role: 'seller' }));
  const buyerDoneDeals  = (buyerDoneData?.getBuyerCompletedDeals?.deals  ?? []).map((d: any) => ({ ...d, _role: 'buyer'  }));
  const sellerDoneDeals = (sellerDoneData?.getSellerCompletedDeals?.deals ?? []).map((d: any) => ({ ...d, _role: 'seller' }));

  const seen = new Set<string>();
  const rawDeals = [...buyerDeals, ...sellerDeals, ...buyerDoneDeals, ...sellerDoneDeals].filter((d: any) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  const loading = buyerLoading || sellerLoading || buyerDoneLoading || sellerDoneLoading;

  // C16: align filtering with all 14 DealStatus enum states
  const filtered = filter === 'in-progress'
    ? rawDeals.filter((d: any) => !['COMPLETED', 'CANCEL'].includes(d.status))
    : rawDeals.filter((d: any) =>  ['COMPLETED', 'CANCEL'].includes(d.status));

  // Map API deal flags to progress steps
  const getSteps = (d: any) => [
    { id: 1, title: isAr ? 'توقيع اتفاقية NDA' : 'NDA Signed',          done: d.isDsaBuyer && d.isDsaSeller },
    { id: 2, title: isAr ? 'التحقق من الوثائق' : 'Documents Verified',  done: d.isDocVedifiedBuyer && d.isDocVedifiedSeller },
    { id: 3, title: isAr ? 'دفع العمولة' : 'Commission Paid',           done: d.isCommissionVerified },
    { id: 4, title: isAr ? 'إتمام الصفقة' : 'Deal Completed',           done: d.isBuyerCompleted && d.isSellerCompleted },
  ];

  const getProgress = (d: any) => {
    const steps = getSteps(d);
    const done = steps.filter(s => s.done).length;
    return Math.round((done / steps.length) * 100);
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB') : '—';

  const selectedDeal = rawDeals.find((d: any) => d.id === selectedId);

  if (selectedDeal) {
    const steps = getSteps(selectedDeal);
    const progress = getProgress(selectedDeal);
    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-gray-500 hover:text-[#111827] font-bold text-sm">
            {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowRight size={18} className="rotate-180" />}
            {content.dashboard.deals.labels.backToDeals}
          </button>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h2 className="text-xl md:text-2xl font-black text-[#111827] mb-1">{selectedDeal.business?.businessTitle}</h2>
          <p className="text-sm text-gray-500 font-medium mb-6">
            {content.dashboard.deals.labels.buyer}: <span className="text-[#111827] font-bold">{selectedDeal.buyer?.name}</span>
          </p>
          <p className="text-2xl md:text-4xl font-black text-[#10B981] mb-2">{Number(selectedDeal.price).toLocaleString()} SAR</p>
          {/* C17: show bracket-based commission from offer snapshot */}
          {selectedDeal.offer?.commission != null && (
            <p className="text-sm font-medium text-gray-500 mb-6">
              {isAr ? 'العمولة' : 'Commission'}:{' '}
              <span className={`font-bold ${selectedDeal.offer.commissionBracketId ? 'text-[#008A66]' : 'text-gray-700'}`}>
                {Number(selectedDeal.offer.commission).toLocaleString()} SAR
              </span>
              {selectedDeal.offer.commissionBracketId && (
                <span className="ml-2 text-xs text-[#008A66] bg-[#E6F3EF] px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'شريحة مخصصة' : 'Bracket Rate'}
                </span>
              )}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500">{content.dashboard.deals.labels.progress}</span>
              <span className="text-[#10B981]">{progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400">{content.dashboard.deals.labels.start}: {fmtDate(selectedDeal.createdAt)}</p>
          </div>
        </div>
        <div className="space-y-3 md:space-y-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0', step.done ? 'bg-[#E6F3EF] text-[#10B981]' : idx === steps.findIndex(s => !s.done) ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400')}>
                {step.done ? <CheckCircle2 size={22} /> : step.id}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg text-[#111827] mb-1">{step.title}</h4>
                <DashBadge color={step.done ? 'green' : idx === steps.findIndex(s => !s.done) ? 'yellow' : 'gray'}>
                  {step.done ? content.dashboard.deals.stepStatus.verified : idx === steps.findIndex(s => !s.done) ? content.dashboard.deals.stepStatus.inProcess : content.dashboard.deals.stepStatus.pending}
                </DashBadge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.deals.title}
        action={
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
            <button onClick={() => setFilter('in-progress')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'in-progress' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.deals.filters.inProgress}</button>
            <button onClick={() => setFilter('completed')}   className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'completed'   ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.deals.filters.completed}</button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="rounded-3xl border border-gray-100 overflow-hidden bg-white animate-pulse h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 font-medium">
          {isAr ? 'لا توجد صفقات بعد' : 'No deals yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((deal: any) => {
            const progress = getProgress(deal);
            // C16: map all DealStatus values to badge color + label
            const dealStatusBadge = (status: string): { color: string; label: string } => {
              switch (status) {
                case 'COMPLETED':
                  return { color: 'gray',   label: isAr ? 'مكتملة'     : 'Completed' };
                case 'CANCEL':
                  return { color: 'red',    label: isAr ? 'ملغاة'      : 'Cancelled' };
                case 'COMMISSION_TRANSFER_FROM_BUYER_PENDING':
                  return { color: 'yellow', label: isAr ? 'في انتظار تحويل العمولة' : 'Awaiting Commission Transfer' };
                case 'COMMISSION_VERIFICATION_PENDING':
                  return { color: 'yellow', label: isAr ? 'التحقق من العمولة'       : 'Commission Verification' };
                case 'COMMISSION_VERIFIED':
                  return { color: 'green',  label: isAr ? 'تم التحقق من العمولة'    : 'Commission Verified' };
                case 'DSA_FROM_SELLER_PENDING':
                case 'DSA_FROM_BUYER_PENDING':
                  return { color: 'yellow', label: isAr ? 'في انتظار NDA'            : 'Awaiting NDA' };
                case 'BANK_DETAILS_FROM_SELLER_PENDING':
                  return { color: 'yellow', label: isAr ? 'في انتظار بيانات البنك'   : 'Awaiting Bank Details' };
                case 'BUYER_PAYMENT_PENDING':
                  return { color: 'yellow', label: isAr ? 'في انتظار دفع المشتري'   : 'Awaiting Buyer Payment' };
                case 'SELLER_PAYMENT_VERIFICATION_PENDING':
                  return { color: 'yellow', label: isAr ? 'التحقق من الدفع'          : 'Payment Verification' };
                case 'DOCUMENT_UPLOAD_PENDING':
                  return { color: 'yellow', label: isAr ? 'في انتظار الوثائق'        : 'Awaiting Documents' };
                case 'WAITING':
                  return { color: 'yellow', label: isAr ? 'قيد المراجعة'              : 'Under Review' };
                case 'BUYERCOMPLETED':
                  return { color: 'green',  label: isAr ? 'أكمل المشتري'             : 'Buyer Completed' };
                case 'SELLERCOMPLETED':
                  return { color: 'green',  label: isAr ? 'أكمل البائع'              : 'Seller Completed' };
                case 'PENDING':
                  return { color: 'yellow', label: isAr ? 'قيد المعالجة'             : 'Pending Admin' };
                default:
                  return { color: 'green',  label: isAr ? 'جارية'                    : 'In Progress' };
              }
            };
            const badge = dealStatusBadge(deal.status);
            return (
              <div key={deal.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedId(deal.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Handshake size={24} />
                    </div>
                    <DashBadge color={deal._role === 'buyer' ? 'blue' : 'yellow'}>
                      {deal._role === 'buyer' ? (isAr ? 'مشترٍ' : 'Buyer') : (isAr ? 'بائع' : 'Seller')}
                    </DashBadge>
                  </div>
                  <DashBadge color={badge.color}>{badge.label}</DashBadge>
                </div>
                {/* F-T1: Clickable listing title — stop propagation so the card click still goes to deal detail */}
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate?.('details', deal.business?.id); }}
                  className="text-lg font-black text-[#111827] hover:text-[#10B981] hover:underline transition-colors text-left mb-2 block"
                >
                  {deal.business?.businessTitle}
                </button>
                <p className="text-gray-500 text-sm mb-4">{content.dashboard.deals.labels.buyer}: {deal.buyer?.name}</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">{content.dashboard.deals.labels.progress}</span>
                    <span className={cn(completed ? 'text-gray-600' : 'text-[#10B981]')}>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', deal.status === 'CANCEL' ? 'bg-red-400' : deal.status === 'COMPLETED' ? 'bg-gray-600' : 'bg-[#10B981] group-hover:bg-[#008A66]')} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
