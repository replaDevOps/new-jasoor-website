import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Calendar, Users, TrendingUp, DollarSign, Clock, ShieldCheck,
  ArrowRight, Share2, ArrowLeft, CheckCircle2,
  PieChart, Bookmark, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cn } from '../../lib/utils';
import { OfferModal } from '../components/modals/OfferModal';
import { MeetingModal } from '../components/modals/MeetingModal';
import { ENDAModal } from '../components/modals/ENDAModal';
import { toast } from 'sonner';
import { Card } from '../components/Card';
import { useApp } from '../../context/AppContext';
// P5-FIX: use real hooks instead of mock data
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
// Offer/meeting mutations wired through modals — keep Apollo for offer submission
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_OFFER, REQUEST_MEETING, CREATE_ENDA, VIEW_BUSINESS } from '../../graphql/mutations/business';
import { GET_USER_DETAILS } from '../../graphql/queries/dashboard';
import { GET_SIMILAR_BUSINESS_PROFIT_GRAPH, GET_SUGGESTED_LISTINGS } from '../../graphql/queries/business';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialTableItem {
  name: string;
  quantity: number;
  value: string;
  date?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const BusinessDetails = ({
  onBack,
  businessId,
  onNavigate,
}: {
  onBack?: () => void;
  businessId?: number | null;
  onNavigate?: (page: string, id?: number) => void;
}) => {
  const { language, direction, userId, isLoggedIn } = useApp();
  const isAr = language === 'ar';

  // P5-FIX R-01: real data via useBusinessDetail hook
  const { business, loading, error, toggleSave } = useBusinessDetail(businessId);

  // F-SL: Replace random businesses with getSuggestedListings — real category/city/price matching
  const { data: suggestedData, loading: similarLoading } = useQuery(GET_SUGGESTED_LISTINGS, {
    variables: { businessId, limit: 6 },
    skip: !businessId,
    errorPolicy: 'all',
  });
  const similarBusinesses: any[] = suggestedData?.getSuggestedListings ?? [];

  const [modalOpen, setModalOpen] = useState<'offer' | 'meeting' | 'enda' | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Init isSaved from API data (savedBy array contains userId if already saved)
  useEffect(() => {
    if (business && userId) {
      setIsSaved(business.savedBy?.some(u => u.id === userId) ?? false);
    }
  }, [business, userId]);

  // Mutations for offer, meeting, NDA
  // Owner guard: hide action buttons if viewing own listing
  const { data: userDetailsData } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    errorPolicy: 'all',
  });
  const userStatus = userDetailsData?.getUserDetails?.status ?? '';
  const isVerified = userStatus === 'VERIFIED' || userStatus === 'verified';
  const isOwner = !!(userId && business?.seller?.id && String(userId) === String(business.seller.id));

  const [createOffer] = useMutation(CREATE_OFFER, { errorPolicy: 'all' });
  const [requestMeeting] = useMutation(REQUEST_MEETING, { errorPolicy: 'all' });
  const [createEnda] = useMutation(CREATE_ENDA, { errorPolicy: 'all' });
  const [viewBusiness] = useMutation(VIEW_BUSINESS, { errorPolicy: 'all' });
  // M-09: increment view count when business detail page mounts
  useEffect(() => {
    if (businessId) { viewBusiness({ variables: { viewBusinessId: String(businessId) } }).catch(() => {}); }
  }, [businessId]);

  // ── Labels ──────────────────────────────────────────────────────────────────
  const t = {
    back:            isAr ? 'العودة للقائمة' : 'Back to Listings',
    overview:        isAr ? 'نظرة عامة' : 'Overview',
    stats:           isAr ? 'إحصائيات المشروع' : 'Business Stats',
    revenue:         isAr ? 'الإيرادات' : 'Revenue',
    profit:          isAr ? 'صافي الربح' : 'Net Profit',
    margin:          isAr ? 'هامش الربح' : 'Profit Margin',
    employees:       isAr ? 'الموظفون' : 'Employees',
    recovery:        isAr ? 'فترة الاسترداد' : 'Recovery Period',
    established:     isAr ? 'تأسست' : 'Established',
    reasonSelling:   isAr ? 'سبب البيع' : 'Reason for Selling',
    assets:          isAr ? 'الأصول الرئيسية' : 'Key Assets',
    liabilities:     isAr ? 'الالتزامات' : 'Liabilities',
    inventory:       isAr ? 'المخزون' : 'Inventory',
    support:         isAr ? 'الدعم والتدريب' : 'Support & Training',
    sessions:        isAr ? 'جلسات تدريبية' : 'Training Sessions',
    askingPrice:     isAr ? 'السعر المطلوب' : 'Asking Price',
    scheduleMeeting: isAr ? 'جدولة اجتماع' : 'Schedule Meeting',
    makeOffer:       isAr ? 'تقديم عرض' : 'Make Offer',
    buyNow:          isAr ? 'شراء الآن' : 'Buy Now',
    save:            isAr ? 'حفظ' : 'Save',
    saved:           isAr ? 'محفوظ' : 'Saved',
    share:           isAr ? 'مشاركة' : 'Share',
    similar:         isAr ? 'فرص مشابهة' : 'Similar Opportunities',
    similarSub:      isAr ? 'استكشف شركات أخرى في نفس القطاع' : 'Explore other businesses in the same sector',
    viewMore:        isAr ? 'عرض المزيد' : 'View More',
    details:         isAr ? 'التفاصيل' : 'Details',
    currency:        isAr ? 'ر.س' : 'SAR',
    trustedSeller:   isAr ? 'بائع موثوق' : 'Trusted Seller',
    acquisition:     isAr ? 'استحواذ' : 'Acquisition',
    taqbeel:         isAr ? 'تقبيل' : 'Taqbeel',
    noImage:         isAr ? 'لا توجد صورة' : 'No image',
    assetName:       isAr ? 'الاسم' : 'Name',
    qty:             isAr ? 'الكمية' : 'Qty',
    value:           isAr ? 'القيمة' : 'Value',
    purchaseDate:    isAr ? 'تاريخ الشراء' : 'Purchase Date',
    startDate:       isAr ? 'تاريخ البدء' : 'Start Date',
    month:           isAr ? 'شهر' : 'mo',
    notFound:        isAr ? 'هذا الإعلان غير موجود' : 'Business Not Found',
    notFoundSub:     isAr ? 'قد يكون الإعلان قد تم حذفه أو الرابط غير صحيح.' : 'This listing may have been removed or the link is incorrect.',
    browseCta:       isAr ? 'تصفح الفرص الاستثمارية' : 'Browse Businesses',
    meeting:         isAr ? 'اجتماع' : 'Meeting',
    buy:             isAr ? 'شراء' : 'Buy',
    offerSent:       isAr ? 'تم إرسال العرض بنجاح' : 'Offer sent successfully',
    meetingSent:     isAr ? 'تم إرسال طلب الاجتماع' : 'Meeting request sent',
    endaSigned:      isAr ? 'تم توقيع الاتفاقية، يمكنك الآن إتمام الشراء' : 'Agreement signed, you can now complete the purchase',
    linkCopied:      isAr ? 'تم نسخ الرابط' : 'Link copied to clipboard',
    linkFail:        isAr ? 'تعذر نسخ الرابط' : 'Could not copy link',
    businessSaved:   isAr ? 'تم حفظ الإعلان' : 'Business saved!',
    businessUnsaved: isAr ? 'تم إلغاء الحفظ' : 'Removed from saved',
    errGeneric:      isAr ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong',
  };

  const labels = {
    revenue: t.revenue, profit: t.profit, recovery: t.recovery,
    askingPrice: t.askingPrice, currency: t.currency, details: t.details, noImage: t.noImage
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleOfferSubmit = async (amount: string) => {
    if (!business?.id) return;
    // C8/C11/C12: use errorPolicy 'all' result, check errors array
    const result = await createOffer({
      variables: {
        input: {
          businessId: business.id,
          price: parseFloat(amount),
          message: '',
          status: 'PENDING',
          isProceedToPay: false,
        },
      },
    });
    const errors = result?.errors ?? [];
    if (errors.length) {
      const msg = errors[0]?.message ?? '';
      if (msg.includes('OFFER_ALREADY_EXISTS')) {
        // C11/C12: bilingual duplicate offer error
        toast.error(isAr
          ? 'لديك عرض نشط بالفعل على هذا الإعلان'
          : 'You already have an active offer on this listing');
      } else {
        toast.error(t.errGeneric);
      }
    } else {
      toast.success(t.offerSent);
    }
    setModalOpen(null);
  };

  const handleMeetingSubmit = async (data: { date: string; startTime: string; endTime: string }) => {
    if (!business?.id) return;
    // C8: check errors array from errorPolicy 'all' mutation
    const result = await requestMeeting({
      variables: {
        input: {
          businessId: business.id,
          requestedDate: data.date ? `${data.date}T${data.startTime || '00:00'}:00.000Z` : new Date().toISOString(),
          requestedEndDate: data.date ? `${data.date}T${data.endTime || '00:00'}:00.000Z` : new Date().toISOString(),
        },
      },
    });
    const errors = result?.errors ?? [];
    if (errors.length) {
      const msg = errors[0]?.message ?? '';
      if (msg.includes('MEETING_REQUEST_OUTSIDE_ALLOWED_HOURS') || msg.includes('MEETING_TIME_INVALID')) {
        toast.error(isAr
          ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها'
          : 'Selected time is outside the allowed meeting hours');
      } else if (msg.includes('NDA_NOT_SIGNED')) {
        toast.error(isAr
          ? 'يجب توقيع اتفاقية السرية (NDA) لهذا الإعلان أولاً'
          : 'You must sign the NDA for this listing before requesting a meeting');
      } else {
        toast.error(t.errGeneric);
      }
    } else {
      toast.success(t.meetingSent);
    }
    setModalOpen(null);
  };

  const handleENDAConfirm = async () => {
    if (!isLoggedIn) { onNavigate?.('signin'); return; }
    if (!business?.id || !userId) return;
    try {
      await createEnda({
        variables: {
          input: {
            userId,
            businessId: business.id,
            acceptNdaTerms: true,
            acceptPlatformTerms: true,
            acceptCommission: true,
            commissionRate: '2.5',
            signatureText: userId,
          },
        },
      });
      toast.success(t.endaSigned);
    } catch {
      toast.error(t.errGeneric);
    }
    setModalOpen(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = isAr ? business?.businessTitle : business?.businessTitle;
    if (navigator.share) {
      try { await navigator.share({ title: title || '', url }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t.linkCopied);
      } catch {
        toast.error(t.linkFail);
      }
    }
  };

  const handleSave = async () => {
    try {
      await toggleSave();
      setIsSaved(prev => !prev);
      toast.success(isSaved ? t.businessUnsaved : t.businessSaved);
    } catch {
      toast.error(t.errGeneric);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#008A66] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // ── Error / not found state ───────────────────────────────────────────────────
  if (!businessId || (error && !loading) || (!loading && !business)) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-[#111827] mb-3">{t.notFound}</h1>
        <p className="text-gray-500 max-w-sm mb-8">{t.notFoundSub}</p>
        <button
          onClick={() => onNavigate?.('browse')}
          className="px-6 py-3 bg-[#008A66] text-white font-bold rounded-xl hover:bg-[#007053] transition-colors"
        >
          {t.browseCta}
        </button>
      </div>
    );
  }

  // ── Derived display values from real API data ─────────────────────────────────
  const categoryName = isAr ? business.category?.arabicName : business.category?.name;
  const cityDisplay  = business.city ? (business.district ? `${business.district}, ${business.city}` : business.city) : '';
  const priceDisplay = business.price ? Number(business.price).toLocaleString() : '—';
  const profitDisplay = business.profit ? `${Number(business.profit).toLocaleString()} ${t.currency}` : '—';
  const revenueDisplay = business.revenue ? `${Number(business.revenue).toLocaleString()} ${t.currency}` : '—';
  const marginDisplay = business.profitMargen ? `${business.profitMargen}%` : '—';
  const employeesDisplay = business.numberOfEmployees || '—';
  const recoveryDisplay = (business.capitalRecovery != null && business.capitalRecovery > 0) ? `${Math.round(business.capitalRecovery)} ${t.month}` : '—';
  const foundedDisplay  = business.foundedDate ? new Date(business.foundedDate).getFullYear().toString() : '—';
  const coverImage = business.documents?.find(d => d.fileType === 'image')?.filePath || null;

  // Convert assets to FinancialTableItem shape
  const toTableItems = (items: typeof business.assets): FinancialTableItem[] =>
    (items || []).map(a => ({
      name: a.name,
      quantity: a.quantity,
      value: `${Number(a.price).toLocaleString()} ${t.currency}`,
      date: a.purchaseYear?.toString(),
    }));

  const assetItems     = toTableItems(business.assets);
  const liabilityItems = toTableItems(business.liabilities);
  const inventoryItems = toTableItems(business.inventoryItems);

  // Filter similar businesses — exclude current business, take up to 3
  const similar = similarBusinesses
    .filter(b => b.id !== business.id)
    .slice(0, 3);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pb-32 pt-[80px]" dir={direction}>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">

        {/* Back Link */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-[#008A66] transition-colors font-medium mb-8 mt-6 group"
        >
          {direction === 'rtl' ? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> : <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />}
          <span className="text-lg">{t.back}</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Cover Image */}
            <div className="relative w-full aspect-[4/3] rounded-[32px] overflow-hidden mb-10 shadow-sm border border-gray-100 group">
              {coverImage ? (
                <ImageWithFallback
                  src={coverImage}
                  alt={business.businessTitle}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E6F3EF] to-[#C8E6D8] flex items-center justify-center">
                  <span className="text-6xl opacity-30">🏢</span>
                </div>
              )}
              <div className="absolute top-6 right-6 flex gap-3 z-10">
                {categoryName && (
                  <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-[#111827] border border-gray-100/50">
                    {categoryName}
                  </div>
                )}
                {business.isSupportVerified && (
                  <div className="bg-[#10B981] text-white backdrop-blur-md px-4 py-2 rounded-xl font-bold shadow-sm text-sm flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {t.trustedSeller}
                  </div>
                )}
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-8 border-b border-gray-100 pb-8">
              <div className="flex flex-col gap-3">
                {cityDisplay && (
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-base">
                    <MapPin size={20} className="text-[#008A66]" />
                    {cityDisplay}
                  </div>
                )}
                <h1 className="text-2xl md:text-4xl lg:text-[42px] font-black text-[#111827] leading-tight mt-2">
                  {business.businessTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="bg-[#10B981] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    {business.isByTakbeer ? t.taqbeel : t.acquisition}
                  </div>
                  {business.reference && (
                    <div className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg">
                      #{business.reference}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overview */}
            {business.description && (
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-3">{t.overview}</h2>
                <p className="text-gray-600 text-base md:text-lg leading-loose">{business.description}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-4">{t.stats}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                <StatRow icon={<TrendingUp size={20} />} label={t.revenue}    value={revenueDisplay}   valueColor="text-[#10B981]" />
                <StatRow icon={<DollarSign size={20} />} label={t.profit}     value={profitDisplay} />
                <StatRow icon={<Calendar   size={20} />} label={t.established} value={foundedDisplay} />
                <StatRow icon={<PieChart   size={20} />} label={t.margin}     value={marginDisplay} />
                <StatRow icon={<Users      size={20} />} label={t.employees}  value={employeesDisplay} />
                <StatRow icon={<Clock      size={20} />} label={t.recovery}   value={recoveryDisplay} />
              </div>
            </div>

            {/* Reason for Selling */}
            {business.reason && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{t.reasonSelling}</h2>
                <p className="text-gray-600 text-lg leading-loose">{business.reason}</p>
              </div>
            )}

            {/* Assets */}
            {assetItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{t.assets}</h2>
                <DataTable items={assetItems} type="asset" t={t} direction={direction} />
              </div>
            )}

            {/* Inventory */}
            {inventoryItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{t.inventory}</h2>
                <DataTable items={inventoryItems} type="inventory" t={t} direction={direction} />
              </div>
            )}

            {/* Liabilities */}
            {liabilityItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{t.liabilities}</h2>
                <DataTable items={liabilityItems} type="liability" t={t} direction={direction} />
              </div>
            )}

            {/* Support */}
            {(business.supportSession || business.supportDuration) && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#111827] mb-4 flex items-center gap-2">
                  <Users size={28} className="text-[#008A66]" />
                  {t.support}
                </h3>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {business.supportSession && (
                    <div className="bg-[#10B981] text-white px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 shadow-md shadow-emerald-100">
                      <CheckCircle2 size={18} />
                      {business.supportSession} {t.sessions}
                    </div>
                  )}
                  {business.supportDuration && (
                    <div className="bg-[#10B981] text-white px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 shadow-md shadow-emerald-100">
                      <Clock size={18} />
                      {business.supportDuration} {isAr ? 'شهر دعم' : 'Months Support'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Growth Opportunities */}
            {business.growthOpportunities && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{isAr ? 'فرص النمو' : 'Growth Opportunities'}</h2>
                <p className="text-gray-600 text-lg leading-loose">{business.growthOpportunities}</p>
              </div>
            )}

          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="lg:w-[400px] shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">

                {/* Price Info */}
                <div className="mb-8 space-y-6">
                  <div>
                    <div className="text-sm text-gray-400 font-bold mb-2 uppercase tracking-wide">{t.askingPrice}</div>
                    <div className="text-4xl font-black text-[#00C995]">{t.currency} {priceDisplay}</div>
                  </div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div>
                    <div className="text-sm text-gray-400 font-bold mb-2 uppercase tracking-wide">{t.profit}</div>
                    <div className="text-3xl font-black text-[#111827]">{profitDisplay}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-8 hidden lg:block">
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('meeting');
                    }}
                    className="w-full bg-white text-[#111827] border border-gray-200 font-bold py-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    {t.scheduleMeeting}
                  </button>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('offer');
                    }}
                    className="w-full bg-[#111827] text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                  >
                    {t.makeOffer}
                  </button>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('enda');
                    }}
                    className="w-full bg-[#10B981] text-white font-bold py-4 rounded-xl hover:bg-[#059669] transition-all shadow-lg shadow-emerald-100"
                  >
                    {t.buyNow}
                  </button>
                </div>

                {/* Save & Share */}
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 border rounded-xl py-3 font-bold transition-all',
                      isSaved
                        ? 'border-[#008A66] text-[#008A66] bg-[#E6F3EF]'
                        : 'border-gray-200 text-[#111827] hover:bg-gray-50 hover:border-[#008A66] hover:text-[#008A66]'
                    )}
                  >
                    <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? t.saved : t.save}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-[#111827] font-bold hover:bg-gray-50 transition-all hover:border-[#008A66] hover:text-[#008A66]"
                  >
                    <Share2 size={20} /> {t.share}
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>



        {/* ── Similar Opportunities ──────────────────────────────────────── */}
        {(similar.length > 0 || similarLoading) && (
          <div className="mt-16 md:mt-24 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">{t.similar}</h2>
                <p className="text-gray-500 text-sm md:text-lg">{t.similarSub}</p>
              </div>
              <button
                onClick={() => onNavigate?.('browse')}
                className="hidden md:flex text-[#008A66] font-bold text-lg hover:underline items-center gap-2"
              >
                {t.viewMore} <ArrowRight size={20} />
              </button>
            </div>

            {similarLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#008A66] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 snap-x snap-mandatory md:snap-none hide-scrollbar">
                {similar.map((listing) => {
                  const fmt = (n: number) => Number(n).toLocaleString();
                  const catName = isAr ? listing.category?.arabicName : listing.category?.name;
                  return (
                    <div key={listing.id} className="min-w-[85%] md:min-w-0 md:w-auto pl-4 md:pl-0 last:pl-4 md:last:pl-0 snap-center">
                      <Card
                        variant="listing"
                        hideFavorite={!isLoggedIn}
                        title={listing.businessTitle}
                        description={listing.description || ''}
                        number={fmt(listing.price)}
                        badge={
                          <div className="bg-white/95 text-[#111827] border-gray-100/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm border">
                            {listing.isByTakbeer ? t.taqbeel : t.acquisition}
                          </div>
                        }
                        listingData={{
                          category: catName || '',
                          revenue: `${fmt(listing.revenue)} ${t.currency}`,
                          profit: `${fmt(listing.profit)} ${t.currency}`,
                          recovery: listing.capitalRecovery ? `${Math.round(listing.capitalRecovery)} ${t.month}` : '—',
                          refNumber: listing.reference || '',
                        }}
                        labels={labels}
                        // P5-FIX R-02: Details button navigates to the real listing
                        footer={
                          <button
                            onClick={() => onNavigate?.('details', listing.id)}
                            className="bg-[#008A66] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-[#007053] transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <span>{t.details}</span>
                            {direction === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                          </button>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onNavigate?.('browse')}
              className="md:hidden w-full flex items-center justify-center gap-2 text-[#008A66] font-bold py-4 border border-gray-100 rounded-xl mt-2"
            >
              {t.viewMore} <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <OfferModal
        isOpen={modalOpen === 'offer'}
        onClose={() => setModalOpen(null)}
        type="make-offer"
        onSubmit={handleOfferSubmit}
      />
      <MeetingModal
        isOpen={modalOpen === 'meeting'}
        onClose={() => setModalOpen(null)}
        onSubmit={handleMeetingSubmit}
      />
      <ENDAModal
        isOpen={modalOpen === 'enda'}
        onClose={() => setModalOpen(null)}
        onConfirm={handleENDAConfirm}
      />

      {/* ── Mobile Sticky Bar ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 z-40 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.askingPrice}</span>
              <span className="text-2xl font-black text-[#008A66] leading-none">{t.currency} {priceDisplay}</span>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="flex flex-col gap-0.5 items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.profit}</span>
              <span className="text-xl font-bold text-[#111827] leading-none">{profitDisplay}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('meeting');
                    }}
              className="col-span-1 bg-white text-[#111827] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 py-2"
            >
              <Users size={18} />
              <span className="text-[10px] font-bold">{t.meeting}</span>
            </button>
            <button
              onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('offer');
                    }}
              className="col-span-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 py-3 shadow-lg shadow-gray-200"
            >
              {t.makeOffer}
            </button>
            <button
              onClick={() => {
                      if (!isLoggedIn) { onNavigate?.('signin'); return; }
                      if (isOwner) { toast.error(isAr ? 'لا يمكنك التفاعل مع إدراجك الخاص' : 'You cannot interact with your own listing'); return; }
                      if (!isVerified) { toast.error(isAr ? 'يجب التحقق من حسابك أولاً' : 'Please verify your account first'); return; }
                      setModalOpen('enda');
                    }}
              className="col-span-1 bg-[#10B981] text-white rounded-xl hover:bg-[#059669] transition-colors flex flex-col items-center justify-center gap-1 py-2"
            >
              <ShieldCheck size={18} />
              <span className="text-[10px] font-bold">{t.buy}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────

const StatRow = ({ icon, label, value, valueColor = 'text-[#111827]' }: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string;
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
    <div className="flex items-center gap-2 text-gray-500 text-sm md:text-base">
      <div className="text-[#008A66]">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
    <div className={cn('font-bold text-base md:text-lg', valueColor)}>{value}</div>
  </div>
);

const DataTable = ({ items, type, t, direction }: {
  items: FinancialTableItem[];
  type: 'asset' | 'liability' | 'inventory';
  t: Record<string, string>;
  direction: string;
}) => {
  const isRtl = direction === 'rtl';
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <table className={`w-full text-sm md:text-base ${isRtl ? 'text-right' : 'text-left'}`} dir={direction}>
        <thead className="bg-gray-50">
          <tr className="text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-3 py-3 font-bold w-[40%]">{t.assetName}</th>
            <th className="px-3 py-3 font-bold w-[15%]">{t.qty}</th>
            <th className="px-3 py-3 font-bold w-[25%]">{t.value}</th>
            <th className="px-3 py-3 font-bold w-[20%]">{type === 'asset' ? t.purchaseDate : t.startDate}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-3 py-2 font-bold text-[#111827]">{item.name}</td>
              <td className="px-3 py-2 text-gray-600 font-medium">{item.quantity}</td>
              <td className="px-3 py-2 font-bold text-[#008A66]">{item.value}</td>
              <td className="px-3 py-2 text-gray-500 font-medium">{item.date || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
