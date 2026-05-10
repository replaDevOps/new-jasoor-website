import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, User, Store, FileText, Handshake, Bookmark, Calendar, Settings, 
  Bell, LogOut, Plus, Search, Filter, Clock, CheckCircle2, 
  ChevronRight, MapPin, Phone, Mail, CalendarDays, DollarSign,
  ArrowRight, CreditCard, ShieldCheck, Lock, Trash2, Eye,
  AlertCircle, XCircle, Video, Briefcase, Download, Upload,
  ChevronDown, FileCheck, Ban, Wallet, ChevronLeft, ArrowUpRight, ArrowDownLeft, X, File
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ListingWizard } from './ListingWizard';
import { Card } from '../components/Card';
import { Badge as UiBadge } from '../components/Badge';
import { Modal } from '../components/ui/Modal';
// P6-FIX R-04: replace mock data with real Apollo queries/mutations
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_USER_DETAILS,
  GET_PROFILE_STATISTICS,
  GET_BUYER_STATISTICS,
  GET_SELLER_BUSINESSES,
  GET_FAVORITE_BUSINESSES,
  GET_OFFERS_BY_USER,
  GET_OFFERS_BY_SELLER,
  GET_SENT_MEETINGS,
  GET_RECEIVED_MEETINGS,
  GET_BUYER_INPROGRESS_DEALS,
  GET_SELLER_INPROGRESS_DEALS,
  GET_NOTIFICATIONS,
  GET_USER_BANKS,
  // P9: deal flow queries
  GET_DEAL,
  GET_BANKS_FOR_DEAL,
  GET_ACTIVE_ADMIN_BANK,
  GET_USER_ACTIVE_BANK,
  GET_BUYER_COMPLETED_DEALS,
  GET_SELLER_COMPLETED_DEALS,
  GET_SELLER_SOLD_BUSINESSES,
  // P10: meeting queries
  GET_READY_SCHEDULED_MEETINGS,
  GET_SCHEDULED_MEETINGS,
  // P14: real-time notification subscription
  NEW_NOTIFICATION_SUBSCRIPTION,
} from '../../graphql/queries/dashboard';
import {
  UPDATE_USER,
  CHANGE_PASSWORD,
  UPDATE_OFFER_STATUS,
  COUNTER_OFFER,
  APPROVE_MEETING,
  ADD_BANK,
  DELETE_BANK,
  SET_ACTIVE_BANK,
  MARK_NOTIFICATION_AS_READ,
  // P9: deal flow mutations
  UPDATE_DEAL,
  UPLOAD_DOCUMENT,
  SEND_BANK_TO_BUYER,
  REJECT_MEETING,
  // P10: meeting mutations
  UPDATE_MEETING,
  // Fix 7: identity document upload
  UPLOAD_IDENTITY_DOCUMENT,
  CREATE_SAVE_BUSINESS,
} from '../../graphql/mutations/dashboard';
import { REQUEST_MEETING } from '../../graphql/mutations/business';
import { maskName } from '../../utils/maskName';
import { resolveBusinessLocation } from '../../utils/location';

// ─── BUG-11 ARCHITECTURAL DECISION ──────────────────────────────────────────
// The files in ./dashboard/ (DashboardView.tsx, OffersView.tsx, etc.) are
// DEAD CODE — never imported or rendered. All views are defined inline below.
// DECISION: Keep inline architecture. DELETE the ./dashboard/ sub-view files
// to avoid confusion. Future edits must be made HERE, not in those files.
// ─────────────────────────────────────────────────────────────────────────────

// --- Types ---

type TabType = 'dashboard' | 'listings' | 'offers' | 'deals' | 'meetings' | 'alerts' | 'settings';
type ViewMode = 'dashboard' | 'create-listing' | 'edit-listing';

// --- Shared Components ---

const DashBadge = ({ children, color }: { children: React.ReactNode, color: string }) => {
  const colorClasses: Record<string, string> = {
    green:  'bg-[#E6F3EF] text-[#10B981]',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-50 text-red-600',
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    black:  'bg-gray-900 text-white',
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1", colorClasses[color] || colorClasses.gray)}>
      {children}
    </span>
  );
};

const statusMeta = (status: string, isAr: boolean): { color: string; label: string } => {
  switch (status) {
    // ── Offer statuses ────────────────────────────────────────────────────────
    case 'PENDING':      return { color: 'yellow', label: isAr ? 'قيد الانتظار'   : 'Pending' };
    case 'ACCEPTED':     return { color: 'green',  label: isAr ? 'مقبول'          : 'Accepted' };
    case 'REJECTED':     return { color: 'red',    label: isAr ? 'مرفوض'          : 'Rejected' };
    case 'COUNTERED':    return { color: 'orange', label: isAr ? 'عرض مضاد'       : 'Countered' };
    case 'MEETING':      return { color: 'blue',   label: isAr ? 'اجتماع مجدول'  : 'Meeting Scheduled' };
    // ── Meeting statuses (backend enum) ───────────────────────────────────────
    case 'REQUESTED':    return { color: 'yellow', label: isAr ? 'قيد الانتظار'   : 'Pending' };
    case 'APPROVED':     return { color: 'blue',   label: isAr ? 'مجدول'          : 'Scheduled' };
    case 'HELD':         return { color: 'gray',   label: isAr ? 'مكتمل'          : 'Completed' };
    case 'CANCELED':     return { color: 'gray',   label: isAr ? 'ملغى'           : 'Cancelled' };
    case 'RESCHEDULED':  return { color: 'orange', label: isAr ? 'معاد جدولته'    : 'Rescheduled' };
    case 'TIMELAPSED':   return { color: 'red',    label: isAr ? 'انتهت المهلة'   : 'Timed Out' };
    // ── Shared ────────────────────────────────────────────────────────────────
    case 'CANCELLED':    return { color: 'gray',   label: isAr ? 'ملغى'           : 'Cancelled' };
    case 'SCHEDULED':    return { color: 'blue',   label: isAr ? 'مجدول'          : 'Scheduled' };
    case 'READY':        return { color: 'green',  label: isAr ? 'جاهز للجدولة'  : 'Ready' };
    case 'COMPLETED':    return { color: 'gray',   label: isAr ? 'مكتمل'          : 'Completed' };
    case 'ACTIVE':       return { color: 'green',  label: isAr ? 'نشط'            : 'Active' };
    case 'SOLD':         return { color: 'gray',   label: isAr ? 'مباع'           : 'Sold' };
    default:             return { color: 'gray',   label: status };
  }
};

const normalizeUserStatus = (status?: string | null) =>
  String(status || 'inactive').trim().toLowerCase();

const userStatusMeta = (status: string | null | undefined, isAr: boolean) => {
  switch (normalizeUserStatus(status)) {
    case 'verified':
      return {
        icon: ShieldCheck,
        box: 'bg-[#E6F3EF]',
        iconColor: 'text-[#10B981]',
        text: 'text-[#004E39]',
        label: isAr ? 'تم التحقق' : 'Verified',
        desc: isAr ? 'حسابك موثق وجاهز للاستخدام' : 'Your account is verified and ready',
      };
    case 'under_review':
      return {
        icon: Clock,
        box: 'bg-amber-50',
        iconColor: 'text-amber-600',
        text: 'text-amber-800',
        label: isAr ? 'قيد المراجعة' : 'Under Review',
        desc: isAr ? 'فريق جسور يراجع وثيقتك' : 'Your identity document is being reviewed',
      };
    case 'pending':
      return {
        icon: AlertCircle,
        box: 'bg-blue-50',
        iconColor: 'text-blue-600',
        text: 'text-blue-800',
        label: isAr ? 'بانتظار التحقق' : 'Pending Verification',
        desc: isAr ? 'ارفع وثيقة الهوية لتفعيل حسابك' : 'Upload your ID to activate your account',
      };
    default:
      return {
        icon: XCircle,
        box: 'bg-red-50',
        iconColor: 'text-red-500',
        text: 'text-red-700',
        label: isAr ? 'غير موثق' : 'Not Verified',
        desc: isAr ? 'حسابك غير موثق حالياً' : 'Your account is not verified yet',
      };
  }
};

const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
    <div className="inline-flex flex-col gap-1.5 items-start">
      <h2 className="text-2xl font-black text-[#111827]">{title}</h2>
      <div className="h-1 w-full bg-[#10B981] rounded-full"></div>
    </div>
    <div className="flex-1 md:flex-none flex justify-start md:justify-end w-full md:w-auto">
       {action}
    </div>
  </div>
);


const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="w-16 h-6 rounded-full bg-gray-100" />
    </div>
    <div className="h-4 bg-gray-200 rounded-full w-3/4" />
    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
    <div className="h-2 bg-gray-100 rounded-full w-full mt-2" />
  </div>
);

const SkeletonRow = ({ cols = 5 }: { cols?: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-3 bg-gray-200 rounded-full" style={{ width: `${60 + (i % 3) * 20}%` }} />
      </td>
    ))}
  </tr>
);

const SkeletonNotification = () => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-start animate-pulse">
    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-100 rounded-full w-3/4" />
      <div className="h-2 bg-gray-100 rounded-full w-1/4" />
    </div>
  </div>
);

const ErrorCard = ({ onRetry, isAr }: { onRetry: () => void; isAr: boolean }) => (
  <div className="bg-white rounded-3xl border border-red-100 p-12 text-center space-y-4">
    <p className="text-red-500 font-bold">{isAr ? 'حدث خطأ في التحميل' : 'Something went wrong'}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white font-bold rounded-xl text-sm hover:bg-black transition-colors"
    >
      {isAr ? 'إعادة المحاولة' : 'Try again'}
    </button>
  </div>
);

// --- Sub-Views ---

const DashboardView = ({
  notifications = [],
  notificationsLoading = false,
  notificationsError,
  onRetryNotifications,
  onOpenAlerts,
  onTabChange,
  onNavigate,
  onGoToIdentity,
}: {
  notifications?: any[];
  notificationsLoading?: boolean;
  notificationsError?: unknown;
  onRetryNotifications?: () => void;
  onOpenAlerts?: () => void;
  onTabChange?: (tab: string) => void;
  onNavigate?: (page: string, id?: string | number) => void;
  onGoToIdentity?: () => void;
}) => {
  const { content, language, userId } = useApp();
  const isAr = language === 'ar';

  const { data: sellerData, loading: statsLoading } = useQuery(GET_PROFILE_STATISTICS, { skip: !userId, errorPolicy: 'all' });
  const { data: buyerData  } = useQuery(GET_BUYER_STATISTICS,   { skip: !userId, errorPolicy: 'all' });
  const { data: accountData } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const ss = sellerData?.getProfileStatistics;
  const bs = buyerData?.getBuyerStatistics;
  const accountStatus = userStatusMeta(accountData?.getUserDetails?.status, isAr);
  const AccountStatusIcon = accountStatus.icon;

  const stats = [
    { label: isAr ? 'الصفقات المكتملة'  : 'Finalized Deals',     value: ss?.finalizedDealsCount ?? bs?.finalizedDealsCount ?? '—', icon: Handshake,    color: 'bg-[#E6F3EF] text-[#10B981]' },
    { label: isAr ? 'الإدراجات النشطة'  : 'Listed Businesses',   value: ss?.listedBusinessesCount ?? '—',                           icon: Store,        color: 'bg-blue-50 text-blue-600' },
    { label: isAr ? 'العروض المستلمة'   : 'Received Offers',     value: ss?.receivedOffersCount ?? '—',                            icon: DollarSign,   color: 'bg-orange-50 text-orange-600' },
    { label: isAr ? 'الاجتماعات'        : 'Meetings',            value: ss?.scheduledMeetingsCount ?? bs?.scheduledMeetingsCount ?? '—', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: isAr ? 'مشاهدات الإدراجات' : 'Business Views',      value: ss?.viewedBusinessesCount ?? '—',                          icon: Eye,          color: 'bg-pink-50 text-pink-600' },
    { label: isAr ? 'المفضلة'           : 'Saved Businesses',    value: bs?.favouriteBusinessesCount ?? '—',                       icon: Bookmark,     color: 'bg-yellow-50 text-yellow-600' },
  ];

  const activityIconFor = (notification: any) => {
    const source = `${notification?.actionType ?? ''} ${notification?.entityType ?? ''} ${notification?.name ?? ''}`.toLowerCase();
    if (source.includes('offer') || source.includes('عرض')) return { icon: DollarSign, color: 'bg-orange-100 text-orange-600' };
    if (source.includes('meeting') || source.includes('اجتماع')) return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
    if (source.includes('deal') || source.includes('صفقة')) return { icon: Handshake, color: 'bg-[#E6F3EF] text-[#10B981]' };
    if (source.includes('identity') || source.includes('document') || source.includes('هوية')) return { icon: ShieldCheck, color: 'bg-purple-100 text-purple-600' };
    return { icon: Bell, color: 'bg-gray-100 text-gray-600' };
  };
  const formatActivityTime = (date?: string) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const activityItems = notifications.slice(0, 3).map((notification) => {
    const meta = activityIconFor(notification);

    // Resolve route from actionType → view name, falling back to entityType.
    // ACTION_TO_VIEW and ENTITY_TO_VIEW are module-level constants.
    const rawTarget =
      (notification.actionType && ACTION_TO_VIEW[notification.actionType]) ||
      (notification.entityType && ENTITY_TO_VIEW[notification.entityType]) ||
      null;

    let onClick: (() => void) | undefined;
    if (rawTarget === 'settings:identity') {
      onClick = () => onGoToIdentity?.();
    } else if (rawTarget === 'details' && notification.entityId) {
      onClick = () => onNavigate?.('details', notification.entityId);
    } else if (rawTarget) {
      onClick = () => onTabChange?.(rawTarget);
    }

    return {
      title: isAr ? (notification.nameAr || notification.name) : notification.name,
      desc: isAr ? (notification.messageAr || notification.message) : notification.message,
      time: formatActivityTime(notification.createdAt),
      icon: meta.icon,
      color: meta.color,
      onClick,
    };
  });

  return (
  <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <SectionHeader title={content.dashboard.tabs.dashboard} />

    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 md:gap-4">
            <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon size={20} className="md:w-7 md:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-[10px] md:text-sm font-bold mb-1 line-clamp-1">{stat.label}</p>
              {statsLoading
                ? <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse mt-1" />
                : <p className="text-xl md:text-3xl font-black text-[#111827]">{stat.value}</p>
              }
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-[#111827]">{content.dashboard.activity.title}</h3>
             <button onClick={onOpenAlerts} className="text-sm text-[#10B981] font-bold hover:underline">{content.dashboard.activity.viewHistory}</button>
          </div>
          {notificationsLoading ? (
            <div className="space-y-5">
              {[1, 2, 3].map(i => <SkeletonNotification key={i} />)}
            </div>
          ) : notificationsError ? (
            <ErrorCard onRetry={() => onRetryNotifications?.()} isAr={isAr} />
          ) : activityItems.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500">{isAr ? 'لا يوجد نشاط حديث' : 'No recent activity'}</p>
              <p className="text-xs text-gray-400 mt-1">{isAr ? 'سيظهر آخر نشاط من إشعاراتك هنا' : 'Your latest notification activity will appear here'}</p>
            </div>
          ) : (
          <div className="space-y-8 relative before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
             {activityItems.map((item, i) => (
               <div
                 key={i}
                 onClick={item.onClick}
                 className={cn(
                   "flex gap-4 relative rounded-xl -mx-2 px-2 py-1 transition-colors",
                   item.onClick
                     ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                     : "cursor-default"
                 )}
               >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white", item.color)}>
                     <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-[#111827] text-base">{item.title}</p>
                     <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.desc}</p>
                     <p className="text-xs text-gray-400 mt-2 font-medium">{item.time}</p>
                  </div>
               </div>
             ))}
          </div>
          )}
       </div>

       <div className="bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-xl font-bold text-[#111827] mb-4">{content.dashboard.accountStatus.title}</h3>
            <div className={cn("p-4 rounded-2xl flex items-center gap-3 mb-6", accountStatus.box)}>
              <AccountStatusIcon className={accountStatus.iconColor} size={24} />
              <div>
                <p className={cn("font-bold", accountStatus.text)}>{accountStatus.label}</p>
                <p className={cn("text-xs opacity-80", accountStatus.text)}>{accountStatus.desc}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{content.dashboard.accountStatus.message}</p>
          </div>
       </div>
    </div>
  </div>
  );
};

const ListingsView = ({ isFavorites = false, onAddListing, onEditListing, onNavigate }: { isFavorites?: boolean; onAddListing?: () => void; onEditListing?: (id: string | number) => void; onNavigate?: (page: string, id?: string | number) => void }) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<'all' | 'sold'>('all');

  // skip: !userId ensures queries wait until auth token is confirmed
  const { data: sellerData, loading: sellerLoading, error: sellerError, refetch: refetchSeller } = useQuery(GET_SELLER_BUSINESSES,      { skip: isFavorites  || !userId, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  // G-09: seller sold businesses tab
  const { data: soldData,   loading: soldLoading,   error: soldError,   refetch: refetchSold   } = useQuery(GET_SELLER_SOLD_BUSINESSES, { skip: isFavorites  || !userId, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: favData,    loading: favLoading,    error: favError,    refetch: refetchFav    } = useQuery(GET_FAVORITE_BUSINESSES,    { skip: !isFavorites || !userId, variables: { limit: 50, offSet: 0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const [saveBusinessMutation] = useMutation(CREATE_SAVE_BUSINESS, { errorPolicy: 'all' });

  const rawListings = isFavorites
    ? (favData?.getFavoritBusiness?.businesses ?? [])
    : (sellerData?.getAllSellerBusinesses?.businesses ?? []);
  const filtered = filter === 'sold'
    ? (soldData?.getAllSellerSoldBusinesses?.businesses ?? [])
    : rawListings.filter((b: any) => b.businessStatus !== 'SOLD');
  const loading = isFavorites ? favLoading : filter === 'sold' ? soldLoading : sellerLoading;
  const hasError = isFavorites ? !!favError : filter === 'sold' ? !!soldError : !!sellerError;

  const statusLabel = (s: string) => {
    if (s === 'ACTIVE') return { text: content.dashboard.listings.status.active,      variant: 'success'  as const };
    if (s === 'SOLD')   return { text: content.dashboard.listings.status.sold,        variant: 'neutral'  as const };
    return                    { text: content.dashboard.listings.status.underReview,  variant: 'warning'  as const };
  };
  const fmt = (n: number) => Number(n).toLocaleString('en-US');

  const labels = isFavorites
    ? { revenue: isAr?'الإيرادات':'Revenue', profit: isAr?'الأرباح':'Profit', recovery: isAr?'الاسترداد':'Recovery', askingPrice: isAr?'السعر':'Price', currency: isAr?'ر.س':'SAR', details: isAr?'التفاصيل':'Details', noImage: isAr?'لا توجد صورة':'No image' }
    : { revenue: isAr?'المشاهدات':'Views',   profit: isAr?'العروض':'Offers',   recovery: isAr?'الاسترداد':'Recovery', askingPrice: isAr?'السعر':'Price', currency: isAr?'ر.س':'SAR', details: isAr?'التفاصيل':'Details', noImage: isAr?'لا توجد صورة':'No image' };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={isFavorites ? content.dashboard.tabs.favorites : content.dashboard.listings.title}
        action={!isFavorites && (
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              <button onClick={() => setFilter('all')}  className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all", filter==='all'  ? "bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>{content.dashboard.listings.filters.all}</button>
              <button onClick={() => setFilter('sold')} className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all", filter==='sold' ? "bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>{content.dashboard.listings.filters.sold}</button>
            </div>
            <button onClick={onAddListing} className="bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#008A66] flex items-center justify-center gap-2">
              <Plus size={18} />{content.dashboard.listings.addNew}
            </button>
          </div>
        )}
      />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i=><div key={i} className="rounded-[24px] border border-gray-100 bg-white animate-pulse h-64"/>)}</div>
      ) : hasError ? (
        <ErrorCard onRetry={() => { isFavorites ? refetchFav() : filter === 'sold' ? refetchSold() : refetchSeller(); }} isAr={isAr} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-4">
          <p className="text-[#111827] font-bold text-lg">{isFavorites ? (isAr?'لا توجد إدراجات محفوظة':'No saved listings yet') : (isAr?'لا توجد إدراجات بعد':'No listings yet')}</p>
          <p className="text-gray-400 text-sm">{isFavorites ? (isAr?'احفظ الإدراجات التي تهمك لتجدها هنا':'Save listings you like to find them here') : (isAr?'إذا كنت تمتلك إدراجات، اضغط "إعادة المحاولة" للتحديث':'If you have listings, tap Retry to refresh')}</p>
          {!isFavorites && <button onClick={() => { refetchSeller(); refetchSold(); }} className="bg-[#008A66] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#007053] transition-colors text-sm mx-auto block">{isAr?'إعادة المحاولة':'Retry'}</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b: any) => {
            const sl = statusLabel(b.businessStatus);
            return (
              <Card
                key={b.id}
                variant="listing"
                title={b.businessTitle}
                description={b.description || ''}
                image={b.image}
                number={fmt(b.price)}
                onClick={() => onNavigate?.('details', b.id)}
                badge={isFavorites
                  ? (
                    <div className="bg-white/95 text-[#111827] border-gray-100/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm border">
                      {b.isByTakbeer ? (isAr ? 'تقبيل' : 'Taqbeel') : (isAr ? 'استحواذ' : 'Acquisition')}
                    </div>
                  )
                  : <UiBadge variant={sl.variant} className="backdrop-blur-md bg-white/90 shadow-sm">{sl.text}</UiBadge>
                }
                hideFavorite={!isFavorites}
                isSaved={isFavorites ? (b.isSaved ?? false) : false}
                onSave={isFavorites ? async (e) => {
                  e.stopPropagation();
                  await saveBusinessMutation({ variables: { saveBusinessId: b.id } });
                  refetchFav();
                } : undefined}
                listingData={{
                  category:  isAr ? b.category?.arabicName : b.category?.name,
                  location:  resolveBusinessLocation(b.district, b.city, language as 'ar' | 'en'),
                  revenue:   isFavorites ? fmt(b.revenue) : (b.viewCount ?? 0).toString(),
                  profit:    isFavorites ? fmt(b.profit)  : (b.offerCount ?? 0).toString(),
                  recovery:  b.capitalRecovery ? `${Math.round(Number(b.capitalRecovery))} ${isAr ? 'شهر' : 'mo'}` : '—',
                  refNumber: b.reference ? `#${b.reference}` : '',
                }}
                labels={labels}
                footer={!isFavorites ? (
                  <div className="flex gap-2 w-full">
                    {b.businessStatus !== 'SOLD' && (
                      <button onClick={e=>{e.stopPropagation();onEditListing?.(b.id);}} className="flex-1 bg-[#F3F4F6] text-[#111827] py-2 rounded-lg text-xs font-bold hover:bg-gray-200">{content.dashboard.listings.actions.edit}</button>
                    )}
                    <button onClick={e=>{e.stopPropagation();onNavigate?.('details', b.id);}} className="flex-1 bg-[#10B981] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#008A66] flex items-center justify-center gap-1">
                      {content.dashboard.listings.actions.view}{direction==='rtl'?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}
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


const OffersView = ({ onNavigate, onGoToIdentity }: { onNavigate?: (page: string, id?: string | number) => void; onGoToIdentity?: () => void }) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';
  const [directionFilter, setDirectionFilter] = useState<'received'|'sent'>('received');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [actionMode, setActionMode] = useState<'details'|'counter'|'meeting'>('details');
  const [counterPrice, setCounterPrice] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data: buyerData,  loading: buyerLoading,  error: buyerError,  refetch: refetchBuyer  } = useQuery(GET_OFFERS_BY_USER,    { skip: !userId, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: sellerData, loading: sellerLoading, error: sellerError, refetch: refetchSeller } = useQuery(GET_OFFERS_BY_SELLER,  { skip: !userId, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const [updateStatus] = useMutation(UPDATE_OFFER_STATUS, { errorPolicy: 'all' });
  const [doCounter]    = useMutation(COUNTER_OFFER,       { errorPolicy: 'all' });
  const [reqMeeting]   = useMutation(REQUEST_MEETING,     { errorPolicy: 'all' });

  const allOffers = directionFilter === 'sent' ? (buyerData?.getOffersByUser?.offers ?? []) : (sellerData?.getOffersBySeller ?? []);
  const loading   = directionFilter === 'sent' ? buyerLoading : sellerLoading;
  const hasError  = directionFilter === 'sent' ? !!buyerError  : !!sellerError;
  const refetch   = directionFilter === 'sent' ? refetchBuyer  : refetchSeller;
  const selectedOffer = allOffers.find((o: any) => o.id === selectedId);

  // Determine if the current user is the *recipient* of the selected offer.
  // In a counter-offer chain createdBy tracks who sent each offer in the chain:
  //   seller-created counter → buyer is the recipient (can accept/reject)
  //   buyer-created offer    → seller is the recipient (can accept/reject)
  const iAmRecipient = (() => {
    if (!selectedOffer || !userId) return false;
    const sellerCreated =
      selectedOffer.createdBy != null &&
      String(selectedOffer.createdBy) === String(selectedOffer.business?.seller?.id);
    return sellerCreated
      ? String(userId) === String(selectedOffer.buyer?.id)
      : String(userId) === String(selectedOffer.business?.seller?.id);
  })();

  const statusColor = (s: string) => statusMeta(s, isAr).color;
  const statusLabel = (s: string) => statusMeta(s, isAr).label;
  const fmtDate = (d: string) => d?new Date(d).toLocaleDateString(isAr?'ar-SA-u-ca-gregory-nu-latn':'en-GB'):'—';
  const fmt = (n: number) => Number(n).toLocaleString('en-US');

  const handleAccept = async () => {
    if (!selectedOffer || actionLoading) return;
    setActionLoading(true);
    try {
      const { errors } = await updateStatus({ variables: { input: { id: selectedOffer.id, status: 'ACCEPTED' } } });
      if (errors?.length) {
        const msg = errors[0]?.message ?? '';
        if (msg.includes('VERIFICATION_REQUIRED')) {
          toast.error(
            isAr ? 'يجب التحقق من هويتك أولاً لقبول العرض' : 'Identity verification required to accept this offer',
            { action: { label: isAr ? 'التحقق من الهوية' : 'Verify Identity', onClick: () => onGoToIdentity?.() } }
          );
        } else if (msg.includes('MULTIPLE_ACCEPTED_OFFERS')) {
          toast.error(isAr
            ? 'لا يمكن قبول أكثر من عرض على نفس الإعلان'
            : 'You cannot accept more than one offer for the same listing');
        } else {
          toast.error(isAr ? 'حدث خطأ' : 'Error');
        }
        return;
      }
      toast.success(isAr ? 'تم قبول العرض' : 'Offer accepted');
      setSelectedId(null);
      refetch();
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOffer || actionLoading) return;
    setActionLoading(true);
    try {
      const { errors } = await updateStatus({ variables: { input: { id: selectedOffer.id, status: 'REJECTED' } } });
      if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
      toast.success(isAr ? 'تم رفض العرض' : 'Offer rejected');
      setSelectedId(null);
      refetch();
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setActionLoading(false);
    }
  };

  // handleCancelOffer removed — 'CANCELLED' is not in the OfferStatus enum.
  // The Withdraw button is hidden in the UI until the backend adds WITHDRAWN/CANCELLED.

  const handleCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !counterPrice || actionLoading) return;
    setActionLoading(true);
    try {
      const { errors } = await doCounter({ variables: { input: { parentOfferId: selectedOffer.id, price: parseFloat(counterPrice) } } });
      if (errors?.length) {
        const msg = errors[0]?.message ?? '';
        if (msg.includes('VERIFICATION_REQUIRED')) {
          toast.error(
            isAr ? 'يجب التحقق من هويتك أولاً لإرسال عرض مضاد' : 'Identity verification required to send a counter-offer',
            { action: { label: isAr ? 'التحقق من الهوية' : 'Verify Identity', onClick: () => onGoToIdentity?.() } }
          );
        } else if (msg.includes('OFFER_ALREADY_EXISTS')) {
          toast.error(isAr ? 'عرض موجود بالفعل على هذا الإعلان' : 'An offer already exists for this listing');
        } else {
          toast.error(isAr ? 'حدث خطأ' : 'Error');
        }
        return;
      }
      toast.success(content.dashboard.offers.actions.successCounter);
      setSelectedId(null);
      refetch();
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !meetingDate || !meetingTime || actionLoading) return;
    setActionLoading(true);
    const iso = `${meetingDate}T${meetingTime}:00.000Z`;
    const endDate = new Date(iso); endDate.setHours(endDate.getHours() + 1);
    try {
      const { errors } = await reqMeeting({ variables: { input: { businessId: selectedOffer.business.id, offerId: selectedOffer.id, requestedDate: iso, requestedEndDate: endDate.toISOString() } } });
      if (errors?.length) {
        const msg = errors[0]?.message ?? '';
        if (msg.includes('VERIFICATION_REQUIRED')) {
          toast.error(
            isAr ? 'يجب التحقق من هويتك أولاً لطلب اجتماع' : 'Identity verification required to request a meeting',
            { action: { label: isAr ? 'التحقق من الهوية' : 'Verify Identity', onClick: () => onGoToIdentity?.() } }
          );
        } else if (msg.includes('NDA_NOT_SIGNED')) {
          toast.error(isAr
            ? 'يجب توقيع اتفاقية السرية (NDA) لهذا الإعلان أولاً'
            : 'You must sign the NDA for this listing before requesting a meeting');
        } else if (msg.includes('MEETING_REQUEST_OUTSIDE_ALLOWED_HOURS') || msg.includes('MEETING_TIME_INVALID')) {
          toast.error(isAr
            ? 'الوقت المحدد خارج نطاق أوقات الاجتماعات المسموح بها. (الأحد–الجمعة ٤:٣٠م–١١م / السبت ٢م–١١م)'
            : 'Selected time is outside allowed meeting hours. (Sun–Fri 4:30 PM–11 PM / Sat 2 PM–11 PM)');
        } else {
          toast.error(isAr ? 'حدث خطأ' : 'Error');
        }
        return;
      }
      toast.success(content.dashboard.offers.actions.successMeeting);
      setSelectedId(null);
    } catch {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.offers.title} action={
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
          <button onClick={() => setDirectionFilter('received')} className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap", directionFilter==='received'?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>
            <ArrowDownLeft size={16}/>{content.dashboard.offers.filters.received}
          </button>
          <button onClick={() => setDirectionFilter('sent')} className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap", directionFilter==='sent'?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>
            <ArrowUpRight size={16}/>{content.dashboard.offers.filters.sent}
          </button>
        </div>
      }/>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 animate-pulse space-y-3">
                  <div className="flex justify-between"><div className="h-4 bg-gray-200 rounded-full w-1/2"/><div className="h-5 bg-gray-100 rounded-full w-16"/></div>
                  <div className="flex justify-between"><div className="h-3 bg-gray-100 rounded-full w-24"/><div className="h-3 bg-gray-100 rounded-full w-16"/></div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full"><thead className="bg-gray-50 border-b border-gray-100"><tr>{[1,2,3,4,5,6].map(i=><th key={i} className="px-6 py-4"><div className="h-3 bg-gray-200 rounded-full w-20"/></th>)}</tr></thead>
              <tbody>{[1,2,3,4,5].map(i=><SkeletonRow key={i} cols={6}/>)}</tbody></table>
            </div>
          </>
        ) : hasError ? (
          <div className="p-8"><ErrorCard onRetry={refetch} isAr={isAr} /></div>
        ) : allOffers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign size={28} className="text-gray-400"/>
            </div>
            <p className="text-gray-500 font-bold mb-1">
              {directionFilter==='received' ? (isAr?'لا توجد عروض مستلمة':'No offers received yet') : (isAr?'لم ترسل أي عروض بعد':'No offers sent yet')}
            </p>
            <p className="text-gray-400 text-sm mb-5">
              {directionFilter==='received' ? (isAr?'ستظهر العروض الواردة على إدراجاتك هنا':'Offers on your listings will appear here') : (isAr?'تصفح الإدراجات وقدّم عرضك الأول':'Browse listings and make your first offer')}
            </p>
            {directionFilter==='sent' && (
              <button onClick={() => onNavigate?.('browse')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#008A66] transition-colors text-sm">
                {isAr?'تصفح الإدراجات':'Browse Listings'}{direction==='rtl'?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {allOffers.map((o: any) => {
                const counterparty = directionFilter==='sent' ? o.business?.seller?.name : o.buyer?.name;
                return (
                  <div key={o.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onNavigate?.('details', o.business?.id)}
                          className="text-sm font-bold text-[#10B981] hover:underline truncate block text-right w-full"
                        >
                          {o.business?.businessTitle}
                        </button>
                        <p className="text-xs text-gray-500 mt-0.5">{maskName(counterparty)}</p>
                      </div>
                      <DashBadge color={statusColor(o.status)}>{statusLabel(o.status)}</DashBadge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-black text-[#10B981]">{fmt(o.price)} {content.dashboard.offers.sar}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{fmtDate(o.createdAt)}</span>
                        <button onClick={() => { setSelectedId(o.id); setActionMode('details'); }} className="text-[#10B981] font-bold text-sm flex items-center gap-1">
                          {content.dashboard.offers.actions.viewDetails}
                          {direction==='rtl'?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      content.dashboard.offers.table.listing,
                      directionFilter==='sent' ? content.dashboard.offers.table.seller : content.dashboard.offers.table.buyer,
                      content.dashboard.offers.table.offerAmount,
                      content.dashboard.offers.table.date,
                      content.dashboard.offers.table.status,
                      content.dashboard.offers.table.actions,
                    ].map(h=>(
                      <th key={h} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allOffers.map((o: any) => {
                    const counterparty = directionFilter==='sent' ? o.business?.seller?.name : o.buyer?.name;
                    return (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => onNavigate?.('details', o.business?.id)}
                            className="text-sm font-bold text-[#10B981] hover:underline block text-right"
                          >
                            {o.business?.businessTitle}
                          </button>
                          <p className="text-xs text-gray-500 mt-0.5">{fmt(o.business?.price)} {content.dashboard.offers.sar}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#111827]">{maskName(counterparty)}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-black text-[#10B981]">{fmt(o.price)} {content.dashboard.offers.sar}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(o.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><DashBadge color={statusColor(o.status)}>{statusLabel(o.status)}</DashBadge></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => { setSelectedId(o.id); setActionMode('details'); }} className="text-[#10B981] hover:text-[#008A66] font-bold text-sm flex items-center gap-1">
                            {content.dashboard.offers.actions.viewDetails}
                            {direction==='rtl'?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={!!selectedOffer} onClose={() => { setSelectedId(null); setActionMode('details'); }}
        title={actionMode==='details'?content.dashboard.offers.actions.viewDetails:actionMode==='counter'?content.dashboard.offers.actions.counterOffer:content.dashboard.offers.actions.scheduleMeeting}>
        {selectedOffer && (
          <div className="space-y-6">
            {/* Listing header — clickable */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.listing}</p>
                  <button
                    onClick={() => { onNavigate?.('details', selectedOffer.business?.id); setSelectedId(null); }}
                    className="font-bold text-[#10B981] hover:underline text-right"
                  >
                    {selectedOffer.business?.businessTitle}
                  </button>
                </div>
                <DashBadge color={statusColor(selectedOffer.status)}>{statusLabel(selectedOffer.status)}</DashBadge>
              </div>
              {actionMode==='details' && (
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                  <div><p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.salePrice}</p><p className="font-bold text-gray-900">{fmt(selectedOffer.business?.price)} {content.dashboard.offers.sar}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">{content.dashboard.offers.table.offerAmount}</p><p className="font-black text-[#10B981]">{fmt(selectedOffer.price)} {content.dashboard.offers.sar}</p></div>
                </div>
              )}
            </div>

            {actionMode==='details' && (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{content.dashboard.offers.table.date}</span>
                    <span className="font-bold text-[#111827]">{fmtDate(selectedOffer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{directionFilter==='sent' ? content.dashboard.offers.table.seller : content.dashboard.offers.table.buyer}</span>
                    <span className="font-bold text-[#111827]">
                      {directionFilter==='sent' ? maskName(selectedOffer.business?.seller?.name) : maskName(selectedOffer.buyer?.name)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{content.dashboard.offers.table.offerNumber}</span>
                    <span className="font-bold text-[#111827]">#{selectedOffer.id}</span>
                  </div>
                </div>

                {/* Offer actions: visible to the *recipient* of this specific offer in the chain */}
                {selectedOffer.status==='PENDING' && iAmRecipient && (
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActionMode('counter')} disabled={actionLoading} className="py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2">
                        <DollarSign size={18}/>{content.dashboard.offers.actions.counterOffer}
                      </button>
                      <button onClick={() => setActionMode('meeting')} disabled={actionLoading} className="py-3 rounded-xl bg-[#111827] text-white font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2">
                        <Calendar size={18}/>{content.dashboard.offers.actions.scheduleMeeting}
                      </button>
                    </div>
                    <button onClick={handleAccept} disabled={actionLoading} className="w-full py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                      {actionLoading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        : <CheckCircle2 size={18}/>}
                      {content.dashboard.offers.actions.accept}
                    </button>
                    <button onClick={handleReject} disabled={actionLoading} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                      <XCircle size={18}/>{isAr ? 'رفض العرض' : 'Reject Offer'}
                    </button>
                  </div>
                )}

                {/* Withdraw Offer: hidden until backend adds CANCELLED/WITHDRAWN to OfferStatus enum */}
              </>
            )}

            {actionMode==='counter' && (
              <form onSubmit={handleCounter} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.amount}</label>
                  <input type="number" value={counterPrice} onChange={e=>setCounterPrice(e.target.value)} disabled={actionLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981] disabled:opacity-60"/>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setActionMode('details')} disabled={actionLoading} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">{content.dashboard.offers.actions.cancel}</button>
                  <button type="submit" disabled={!counterPrice || actionLoading} className="flex-1 py-3 rounded-xl bg-[#10B981] text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                    {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                    {content.dashboard.offers.actions.submit}
                  </button>
                </div>
              </form>
            )}

            {actionMode==='meeting' && (
              <form onSubmit={handleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingDate}</label>
                  <input type="date" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} disabled={actionLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981] disabled:opacity-60"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{content.dashboard.offers.actions.meetingTime}</label>
                  <input type="time" value={meetingTime} onChange={e=>setMeetingTime(e.target.value)} min="16:30" max="23:00" disabled={actionLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981] disabled:opacity-60"/>
                  <p className="text-xs text-gray-400 mt-1">{isAr?'المواعيد المتاحة: ٤:٣٠ م – ١١:٠٠ م':'Available: 4:30 PM – 11:00 PM'}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setActionMode('details')} disabled={actionLoading} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">{content.dashboard.offers.actions.cancel}</button>
                  <button type="submit" disabled={!meetingDate || !meetingTime || actionLoading} className="flex-1 py-3 rounded-xl bg-[#111827] text-white font-bold hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                    {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                    {content.dashboard.offers.actions.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};


const DealsView = ({
  onNavigate,
  onGoToWallet,
  initialSelectedId,
}: {
  onNavigate?: (page: string, id?: string | number) => void;
  onGoToWallet?: (dealId: string) => void;
  initialSelectedId?: string | null;
}) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<'in-progress'|'completed'>('in-progress');
  const [selectedId, setSelectedId] = useState<string|null>(() => initialSelectedId ?? null);

  const { data: buyerData,  loading: buyerLoading,  error: buyerDealsErr,  refetch: refetchBuyer  } = useQuery(GET_BUYER_INPROGRESS_DEALS,  { skip: !userId, variables: { limit:50, offset:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: sellerData, loading: sellerLoading, error: sellerDealsErr, refetch: refetchSeller } = useQuery(GET_SELLER_INPROGRESS_DEALS, { skip: !userId, variables: { limit:50, offset:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: buyerCompData,  loading: buyerCompLoading,  error: buyerCompErr,  refetch: refetchBuyerComp  } = useQuery(GET_BUYER_COMPLETED_DEALS,  { skip: !userId, variables: { limit:50, offset:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: sellerCompData, loading: sellerCompLoading, error: sellerCompErr, refetch: refetchSellerComp } = useQuery(GET_SELLER_COMPLETED_DEALS, { skip: !userId, variables: { limit:50, offset:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });

  // P9: single deal detail query — only fires when a deal is selected
  const { data: dealDetailData, loading: dealDetailLoading, refetch: refetchDeal } = useQuery(GET_DEAL, {
    variables: { getDealId: selectedId },
    skip: !selectedId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  const deal = dealDetailData?.getDeal ?? null;

  // P9: bank queries — only fire when deal is selected
  const { data: banksForDealData } = useQuery(GET_BANKS_FOR_DEAL, {
    variables: { dealId: selectedId },
    skip: !selectedId,
    errorPolicy: 'all',
  });
  const { data: adminBankData } = useQuery(GET_ACTIVE_ADMIN_BANK, {
    skip: !selectedId || !userId,
    errorPolicy: 'all',
  });
  const { data: userBankData } = useQuery(GET_USER_ACTIVE_BANK, {
    variables: { getUserActiveBanksId: userId },
    skip: !selectedId || !userId,
    errorPolicy: 'all',
  });

  // P9: deal mutations
  const [updateDeal,       { loading: updatingDeal }]  = useMutation(UPDATE_DEAL,       { errorPolicy: 'all' });
  const [uploadDocument,   { loading: uploadingDoc }]  = useMutation(UPLOAD_DOCUMENT,   { errorPolicy: 'all' });
  const [sendBankToBuyer,  { loading: sendingBank }]   = useMutation(SEND_BANK_TO_BUYER,{ errorPolicy: 'all' });

  // Fix 3: merge buyer + seller from all 4 queries, deduplicate by id
  const mergedRaw: any[] = filter === 'in-progress'
    ? [...(buyerData?.getBuyerInprogressDeals?.deals ?? []), ...(sellerData?.getSellerInprogressDeals?.deals ?? [])]
    : [...(buyerCompData?.getBuyerCompletedDeals?.deals ?? []), ...(sellerCompData?.getSellerCompletedDeals?.deals ?? [])];
  const seen = new Set<string>();
  const filtered = mergedRaw.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });

  const loading = filter === 'in-progress'
    ? (buyerLoading || sellerLoading)
    : (buyerCompLoading || sellerCompLoading);
  const hasError = filter === 'in-progress'
    ? (!!buyerDealsErr || !!sellerDealsErr)
    : (!!buyerCompErr || !!sellerCompErr);

  const refetch = () => {
    if (filter === 'in-progress') { refetchBuyer(); refetchSeller(); }
    else { refetchBuyerComp(); refetchSellerComp(); }
    if (selectedId) refetchDeal();
  };
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr?'ar-SA-u-ca-gregory-nu-latn':'en-GB') : '—';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isBuyer  = deal ? deal.buyer?.id === userId : false;
  const isSeller = deal ? deal.business?.seller?.id === userId : false;

  const adminBank  = adminBankData?.getActiveAdminBank ?? null;
  const userBank   = userBankData?.getUserActiveBanks   ?? null;
  const dealBanks  = banksForDealData?.getBankDetailsByDealId ?? [];

  // ── Buyer step actions ──────────────────────────────────────────────────────
  const handleBuyerSignNDA = async () => {
    if (!deal) return;
    try {
      await updateDeal({ variables: { input: { id: deal.id, isDsaBuyer: true } } });
      toast.success(isAr ? 'تم توقيع اتفاقية NDA' : 'NDA signed');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handlePayCommission = async () => {
    if (!deal || !adminBank) return;
    toast.info(isAr ? `يرجى التحويل إلى: ${adminBank.bankName} — IBAN: ${adminBank.iban}` : `Transfer to: ${adminBank.bankName} — IBAN: ${adminBank.iban}`, { duration: 8000 });
  };

  const handleUploadPaymentProof = async (file: File) => {
    if (!deal) return;
    try {
      // Step 1: upload the file to storage
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(import.meta.env.VITE_UPLOAD_URL || 'https://verify.jusoor-sa.co/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${document.cookie.match(/_at=([^;]+)/)?.[1] ?? ''}` },
      });
      if (!res.ok) throw new Error('Upload failed');
      const uploaded = await res.json();

      // Step 2: persist the document tied to the deal.
      // Backend sets isCommissionUploaded = true and notifies admins automatically.
      const { errors } = await uploadDocument({
        variables: {
          input: {
            title:       isAr ? 'إثبات دفع العمولة' : 'Commission Payment Proof',
            fileName:    file.name,
            fileType:    file.type,
            filePath:    uploaded.fileUrl,
            dealId:      deal.id,
            type:        'PAYMENT_PROOF',
          },
        },
      });
      if (errors?.length) throw new Error(errors[0]?.message ?? 'Mutation failed');

      toast.success(isAr ? 'تم رفع إثبات الدفع بنجاح — سيراجعه الفريق قريباً' : 'Payment proof uploaded — the team will review it shortly');
      refetch();
    } catch (err: any) {
      toast.error(isAr ? 'فشل رفع الملف، يرجى المحاولة مجدداً' : 'Upload failed, please try again');
    }
  };

  const handleBuyerComplete = async () => {
    if (!deal) return;
    try {
      await updateDeal({ variables: { input: { id: deal.id, isBuyerCompleted: true } } });
      toast.success(isAr ? 'تم تأكيد إتمام الصفقة' : 'Deal marked complete');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  // ── Seller step actions ─────────────────────────────────────────────────────
  const handleSellerSignNDA = async () => {
    if (!deal) return;
    try {
      await updateDeal({ variables: { input: { id: deal.id, isDsaSeller: true } } });
      toast.success(isAr ? 'تم توقيع اتفاقية NDA' : 'NDA signed');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handleSellerSendBank = async () => {
    if (!deal || !userBank) return;
    // Prefer the DealBank whose bank matches the current active bank; fall back to any unsent row.
    const unsentDealBank =
      dealBanks.find((b: any) => !b.isSend && b.bank?.id === userBank.id) ??
      dealBanks.find((b: any) => !b.isSend);
    if (!unsentDealBank?.id) {
      toast.error(isAr ? 'لا توجد تفاصيل بنك مرتبطة بهذه الصفقة بعد' : 'No bank detail is attached to this deal yet');
      return;
    }
    try {
      await sendBankToBuyer({ variables: { sendBankToBuyerId: unsentDealBank.id } });
      toast.success(isAr ? 'تم إرسال تفاصيل البنك للمشتري' : 'Bank details sent to buyer');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handleSellerConfirmDocs = async () => {
    if (!deal) return;
    try {
      await updateDeal({ variables: { input: { id: deal.id, isDocVedifiedSeller: true } } });
      toast.success(isAr ? 'تم تأكيد المستندات' : 'Documents confirmed');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handleSellerComplete = async () => {
    if (!deal) return;
    try {
      await updateDeal({ variables: { input: { id: deal.id, isSellerCompleted: true } } });
      toast.success(isAr ? 'تم تأكيد إتمام الصفقة' : 'Deal marked complete');
      refetch();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  // ── Step definitions ─────────────────────────────────────────────────────────
  const getBuyerSteps = (d: any) => [
    {
      id: 1,
      title: isAr ? 'توقيع اتفاقية NDA' : 'Sign NDA Agreement',
      desc:  isAr ? 'وقّع على اتفاقية عدم الإفصاح لبدء الصفقة' : 'Sign the non-disclosure agreement to begin the deal',
      done:  d.isDsaBuyer,
      action: !d.isDsaBuyer ? handleBuyerSignNDA : null,
      actionLabel: isAr ? 'توقيع الاتفاقية' : 'Sign Agreement',
      loading: updatingDeal,
      ndaPath: d.ndaPdfPath,
    },
    {
      id: 2,
      title: isAr ? 'دفع العمولة' : 'Pay Commission',
      desc:  isAr ? `قم بتحويل العمولة إلى حساب جسور${adminBank ? ` — ${adminBank.bankName} / IBAN: ${adminBank.iban}` : ''}` : `Transfer commission to Jusoor${adminBank ? ` — ${adminBank.bankName} / IBAN: ${adminBank.iban}` : ''}`,
      done:  d.isCommissionVerified,
      action: !d.isCommissionVerified && !d.isCommissionUploaded && d.isDsaBuyer ? handlePayCommission : null,
      actionLabel: isAr ? 'عرض تفاصيل الدفع' : 'View Payment Details',
      loading: false,
      uploadProof: !d.isCommissionVerified && d.isDsaBuyer && !d.isCommissionUploaded,
    },
    {
      id: 3,
      title: isAr ? 'التحقق من المستندات' : 'Documents Verified',
      desc:  isAr ? 'سيقوم فريق جسور بمراجعة مستنداتك' : 'The Jusoor team will review your documents',
      done:  d.isDocVedifiedBuyer && d.isDocVedifiedAdmin,
      action: null,
      actionLabel: '',
      loading: false,
    },
    {
      id: 4,
      title: isAr ? 'إتمام الصفقة' : 'Complete Deal',
      desc:  isAr ? 'أكّد إتمام الصفقة بعد استلام جميع المستندات' : 'Confirm deal completion after receiving all documents',
      done:  d.isBuyerCompleted,
      action: !d.isBuyerCompleted && d.isDocVedifiedBuyer && d.isDocVedifiedAdmin ? handleBuyerComplete : null,
      actionLabel: isAr ? 'تأكيد الإتمام' : 'Confirm Completion',
      loading: updatingDeal,
    },
  ];

  const getSellerSteps = (d: any) => [
    {
      id: 1,
      title: isAr ? 'توقيع اتفاقية NDA' : 'Sign NDA Agreement',
      desc:  isAr ? 'وقّع على اتفاقية عدم الإفصاح لبدء الصفقة' : 'Sign the non-disclosure agreement to begin',
      done:  d.isDsaSeller,
      action: !d.isDsaSeller ? handleSellerSignNDA : null,
      actionLabel: isAr ? 'توقيع الاتفاقية' : 'Sign Agreement',
      loading: updatingDeal,
      ndaPath: d.arabicNdaPdfPath || d.ndaPdfPath,
    },
    {
      id: 2,
      title: isAr ? 'إرسال تفاصيل البنك' : 'Send Bank Details',
      desc:  isAr
        ? (dealBanks.length > 0 ? `تم الإرسال — ${dealBanks[0]?.bank?.bankName ?? ''}` : (userBank ? `${userBank.bankName} — IBAN: ${userBank.iban}` : 'أضف حساباً بنكياً أولاً'))
        : (dealBanks.length > 0 ? `Sent — ${dealBanks[0]?.bank?.bankName ?? ''}` : (userBank ? `${userBank.bankName} — IBAN: ${userBank.iban}` : 'Add a bank account first')),
      done:  dealBanks.some((b: any) => b.isSend),
      action: dealBanks.some((b: any) => !b.isSend) && userBank && d.isDsaSeller ? handleSellerSendBank : null,
      actionLabel: isAr ? 'إرسال تفاصيل البنك' : 'Send Bank Details',
      loading: sendingBank,
      // If no active bank, show an "Add Bank Account" button that navigates to Settings → Wallet
      addBankAction: !userBank && !dealBanks.some((b: any) => b.isSend) && selectedId
        ? () => onGoToWallet?.(selectedId)
        : null,
    },
    {
      id: 3,
      title: isAr ? 'تأكيد المستندات' : 'Confirm Documents',
      desc:  isAr ? 'راجع وثائق المشتري وأكّد صحتها' : 'Review buyer documents and confirm they are valid',
      done:  d.isDocVedifiedSeller,
      action: !d.isDocVedifiedSeller && d.isDsaSeller ? handleSellerConfirmDocs : null,
      actionLabel: isAr ? 'تأكيد المستندات' : 'Confirm Documents',
      loading: updatingDeal,
    },
    {
      id: 4,
      title: isAr ? 'إتمام الصفقة' : 'Complete Deal',
      desc:  isAr ? 'أكّد إتمام الصفقة من طرفك' : 'Confirm deal completion from your side',
      done:  d.isSellerCompleted,
      action: !d.isSellerCompleted && d.isDocVedifiedSeller ? handleSellerComplete : null,
      actionLabel: isAr ? 'تأكيد الإتمام' : 'Confirm Completion',
      loading: updatingDeal,
    },
  ];

  const getGenericSteps = (d: any) => [
    { id:1, title: isAr?'توقيع اتفاقية NDA':'NDA Signed',         done: d.isDsaBuyer&&d.isDsaSeller },
    { id:2, title: isAr?'التحقق من الوثائق':'Documents Verified',  done: d.isDocVedifiedBuyer&&d.isDocVedifiedSeller },
    { id:3, title: isAr?'دفع العمولة':'Commission Paid',           done: d.isCommissionVerified },
    { id:4, title: isAr?'إتمام الصفقة':'Deal Completed',           done: d.isBuyerCompleted&&d.isSellerCompleted },
  ];

  const getProgress = (d: any) => { const steps=getGenericSteps(d); return Math.round((steps.filter(s=>s.done).length/steps.length)*100); };

  // ── Deal Detail View ─────────────────────────────────────────────────────────
  if (selectedId) {
    if (dealDetailLoading) return (
      <div className="flex items-center justify-center p-16 text-gray-400">{isAr?'جارٍ التحميل...':'Loading deal...'}</div>
    );

    if (!deal) return (
      <div className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-gray-500 hover:text-[#111827] font-bold text-sm">
          {direction==='rtl'?<ArrowRight size={18}/>:<ArrowRight size={18} className="rotate-180"/>}{content.dashboard.deals.labels.backToDeals}
        </button>
        <div className="bg-white p-8 rounded-3xl border border-red-100 text-center text-red-500">{isAr?'تعذر تحميل تفاصيل الصفقة':'Could not load deal details'}</div>
      </div>
    );

    const steps = isBuyer ? getBuyerSteps(deal) : isSeller ? getSellerSteps(deal) : getGenericSteps(deal).map(s => ({...s, desc:'', action:null, actionLabel:'', loading:false}));
    const progress = getProgress(deal);
    const allDone = deal.isBuyerCompleted && deal.isSellerCompleted;

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-gray-500 hover:text-[#111827] font-bold text-sm mb-2">
          {direction==='rtl'?<ArrowRight size={18}/>:<ArrowRight size={18} className="rotate-180"/>}{content.dashboard.deals.labels.backToDeals}
        </button>

        {/* Deal header */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <button
                onClick={() => onNavigate?.('details', deal.business?.id)}
                className="text-xl md:text-2xl font-black text-[#111827] mb-1 hover:text-[#10B981] transition-colors text-right block"
              >
                {deal.business?.businessTitle}
              </button>
              <p className="text-sm text-gray-500">{content.dashboard.deals.labels.buyer}: <span className="text-[#111827] font-bold">{maskName(deal.buyer?.name)}</span></p>
              <p className="text-sm text-gray-500">{isAr?'البائع':'Seller'}: <span className="text-[#111827] font-bold">{maskName(deal.business?.seller?.name)}</span></p>
            </div>
            <DashBadge color={allDone?'gray':'green'}>{allDone?(isAr?'مكتملة':'Completed'):(isAr?'قيد التنفيذ':'In Progress')}</DashBadge>
          </div>
          <p className="text-3xl font-black text-[#10B981] mb-5">{Number(deal.price ?? deal.offer?.price ?? 0).toLocaleString('en-US')} SAR</p>
          {deal.offer?.commission && (
            <p className="text-sm text-gray-500 mb-4">{isAr?'العمولة':'Commission'}: <span className="font-bold text-[#111827]">{Number(deal.offer.commission).toLocaleString('en-US')} SAR</span></p>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500">{content.dashboard.deals.labels.progress}</span>
              <span className="text-[#10B981]">{progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
            </div>
            <p className="text-xs text-gray-400">{content.dashboard.deals.labels.start}: {fmtDate(deal.createdAt)}</p>
          </div>
        </div>

        {/* ── Deal pipeline flow strip ── */}
        {(() => {
          const pipeline = [
            { label: isAr ? 'تقديم العرض'    : 'Offer Sent',          done: true },
            { label: isAr ? 'قبول العرض'     : 'Offer Accepted',      done: true },
            { label: isAr ? 'توقيع الاتفاقية': 'NDA Signed',          done: deal.isDsaBuyer && deal.isDsaSeller },
            { label: isAr ? 'التحقق من الوثائق': 'Docs Verified',     done: deal.isDocVedifiedBuyer && deal.isDocVedifiedSeller && deal.isDocVedifiedAdmin },
            { label: isAr ? 'إتمام الصفقة'   : 'Deal Complete',       done: deal.isBuyerCompleted && deal.isSellerCompleted },
          ];
          const activeIdx = pipeline.findIndex(s => !s.done);
          return (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-none">
              <div className="flex items-center min-w-max mx-auto gap-0">
                {pipeline.map((step, i) => {
                  const isActive = i === activeIdx;
                  const isDone   = step.done;
                  return (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all',
                          isDone   ? 'bg-[#10B981] text-white' :
                          isActive ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300 ring-offset-1' :
                                     'bg-gray-100 text-gray-400'
                        )}>
                          {isDone ? <CheckCircle2 size={18}/> : <span>{i + 1}</span>}
                        </div>
                        <span className={cn(
                          'text-[10px] font-bold text-center leading-tight max-w-[64px]',
                          isDone ? 'text-[#10B981]' : isActive ? 'text-orange-600' : 'text-gray-400'
                        )}>{step.label}</span>
                      </div>
                      {i < pipeline.length - 1 && (
                        <div className={cn('h-[2px] w-10 mx-1 rounded-full shrink-0 mb-4', step.done ? 'bg-[#10B981]' : 'bg-gray-200')} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* NDA documents */}
        {(deal.ndaPdfPath || deal.arabicNdaPdfPath) && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-[#111827] mb-3 flex items-center gap-2"><FileCheck size={18} className="text-[#10B981]"/>{isAr?'مستندات NDA':'NDA Documents'}</h4>
            <div className="flex flex-wrap gap-3">
              {deal.ndaPdfPath && (
                <a href={deal.ndaPdfPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#111827] hover:bg-gray-100 transition-colors">
                  <Download size={16}/>{isAr?'اتفاقية NDA (EN)':'NDA Agreement (EN)'}
                </a>
              )}
              {deal.arabicNdaPdfPath && (
                <a href={deal.arabicNdaPdfPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#111827] hover:bg-gray-100 transition-colors">
                  <Download size={16}/>{isAr?'اتفاقية NDA (AR)':'NDA Agreement (AR)'}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step: any, idx: number) => {
            const isActive = !step.done && steps.slice(0,idx).every((s: any) => s.done);
            return (
              <div key={step.id} className={cn("bg-white p-5 rounded-3xl border shadow-sm", isActive?"border-[#10B981]/30 bg-[#F0FDF4]":"border-gray-100")}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 mt-0.5",
                    step.done?"bg-[#E6F3EF] text-[#10B981]":isActive?"bg-orange-50 text-orange-500":"bg-gray-100 text-gray-400")}>
                    {step.done?<CheckCircle2 size={22}/>:step.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-lg text-[#111827]">{step.title}</h4>
                      <DashBadge color={step.done?'green':isActive?'yellow':'gray'}>
                        {step.done?(isAr?'مكتمل':'Done'):isActive?(isAr?'جارٍ':'Active'):(isAr?'انتظار':'Pending')}
                      </DashBadge>
                    </div>
                    {step.desc && <p className="text-sm text-gray-500 mb-3">{step.desc}</p>}

                    {/* NDA download link in step */}
                    {step.ndaPath && !step.done && (
                      <a href={step.ndaPath} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
                        <Download size={14}/>{isAr?'تنزيل للمراجعة':'Download to review'}
                      </a>
                    )}

                    {/* Upload payment proof */}
                    {step.uploadProof && isActive && (
                      <label className="mt-2 flex items-center gap-2 cursor-pointer">
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPaymentProof(f); }} />
                        <span className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                          uploadingDoc?"bg-gray-100 text-gray-400 cursor-wait":"bg-[#E6F3EF] text-[#10B981] hover:bg-[#d0ebe5]")}>
                          <Upload size={16}/>{uploadingDoc?(isAr?'جارٍ الرفع...':'Uploading...'):(isAr?'رفع إثبات الدفع':'Upload Payment Proof')}
                        </span>
                      </label>
                    )}

                    {/* Action button */}
                    {step.action && isActive && (
                      <button onClick={step.action} disabled={step.loading}
                        className={cn("mt-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors",
                          step.loading?"bg-gray-100 text-gray-400 cursor-wait":"bg-[#111827] text-white hover:bg-[#1f2937]")}>
                        {step.loading?(isAr?'جارٍ...':'Processing...'):step.actionLabel}
                      </button>
                    )}

                    {/* Add Bank Account — shown when seller has no active bank set */}
                    {step.addBankAction && isActive && !step.done && (
                      <button onClick={step.addBankAction}
                        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#008A66] text-white hover:bg-[#007053] transition-colors">
                        <CreditCard size={16}/>{isAr ? 'إضافة حساب بنكي' : 'Add Bank Account'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Business docs */}
        {deal.business?.documents?.length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-[#111827] mb-3 flex items-center gap-2"><FileText size={18} className="text-[#10B981]"/>{isAr?'مستندات الأعمال':'Business Documents'}</h4>
            <div className="space-y-2">
              {deal.business.documents.map((doc: any) => (
                <a key={doc.id} href={doc.filePath} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <File size={16} className="text-gray-400 shrink-0"/>
                  <span className="text-sm font-bold text-[#111827]">{doc.title}</span>
                  <Download size={14} className="text-gray-400 ml-auto"/>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Deal documents — payment proofs uploaded by buyer */}
        {(() => {
          const dealDocs = (deal.documents ?? []).filter((doc: any) => doc.type === 'PAYMENT_PROOF');
          if (!dealDocs.length) return null;
          return (
            <div className="bg-white p-5 rounded-3xl border border-[#10B981]/20 shadow-sm">
              <h4 className="font-bold text-[#111827] mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#10B981]"/>
                {isAr ? 'إثباتات دفع العمولة' : 'Commission Payment Proofs'}
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {isAr ? 'قيد المراجعة' : 'Under Review'}
                </span>
              </h4>
              <div className="space-y-2">
                {dealDocs.map((doc: any) => (
                  <a key={doc.id} href={doc.filePath} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <Upload size={16} className="text-[#10B981] shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#111827] block truncate">{doc.title}</span>
                      {doc.createdAt && <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString(isAr?'ar-SA-u-ca-gregory-nu-latn':'en-GB')}</span>}
                    </div>
                    <Download size={14} className="text-gray-400 shrink-0"/>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Deal List View ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.deals.title} action={
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          <button onClick={() => setFilter('in-progress')} className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", filter==='in-progress'?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>{content.dashboard.deals.filters.inProgress}</button>
          <button onClick={() => setFilter('completed')}   className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", filter==='completed'  ?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>{content.dashboard.deals.filters.completed}</button>
        </div>
      }/>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2,3,4].map(i=><SkeletonCard key={i}/>)}</div>
      ) : hasError ? (
        <ErrorCard onRetry={refetch} isAr={isAr} />
      ) : filtered.length===0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Handshake size={32} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{isAr?'لا توجد صفقات بعد':'No deals yet'}</p>
          <p className="text-gray-400 text-sm mt-1">{isAr?'ستظهر صفقاتك هنا بعد قبول عرض':'Your deals will appear here after an offer is accepted'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((d: any) => {
            const progress=getProgress(d); const completed=d.isBuyerCompleted&&d.isSellerCompleted;
            return (
              <div key={d.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedId(d.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Handshake size={24}/></div>
                  <DashBadge color={completed?'gray':'green'}>{completed?content.dashboard.deals.status.completed:content.dashboard.deals.status.inProgress}</DashBadge>
                </div>
                <h3 className="text-lg font-black text-[#111827] mb-0.5">{d.business?.businessTitle}</h3>
                <button
                  onClick={e => { e.stopPropagation(); onNavigate?.('details', d.business?.id); }}
                  className="text-xs text-[#10B981] font-bold hover:underline mb-3 block"
                >
                  {isAr ? 'عرض الإدراج' : 'View Listing'}
                </button>
                <p className="text-gray-500 text-sm mb-4">{content.dashboard.deals.labels.buyer}: {maskName(d.buyer?.name)}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">{content.dashboard.deals.labels.progress}</span>
                    <span className={cn(completed?'text-gray-600':'text-[#10B981]')}>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",completed?"bg-gray-600":"bg-[#10B981]")} style={{width:`${progress}%`}}/>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{fmtDate(d.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MeetingsView = ({ onNavigate }: { onNavigate?: (page: string, id?: string | number) => void }) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  // tabs: 'all' | 'upcoming' | 'past' (matching Figma)
  const [tab, setTab]         = useState<'all'|'upcoming'|'past'>('all');
  const [filter, setFilter]   = useState<'all'|'pending'|'past'>('all');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [availDate, setAvailDate]   = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Queries
  const { data: sentData,     loading: sentLoading,     error: sentErr,       refetch: refetchSent     } = useQuery(GET_SENT_MEETINGS,              { skip: !userId, variables: { limit:50, offSet:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: receivedData, loading: receivedLoading, error: receivedErr,   refetch: refetchReceived } = useQuery(GET_RECEIVED_MEETINGS,           { skip: !userId, variables: { limit:50, offSet:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: readyData,     loading: readyLoading,     error: readyErr,     refetch: refetchReady     } = useQuery(GET_READY_SCHEDULED_MEETINGS, { skip: !userId, variables: { limit:50, offSet:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: scheduledData, loading: scheduledLoading, error: scheduledErr, refetch: refetchScheduled } = useQuery(GET_SCHEDULED_MEETINGS,       { skip: !userId, variables: { limit:50, offSet:0 }, fetchPolicy: 'network-only', errorPolicy: 'all' });

  // Mutations
  const [approveMeeting, { loading: approving }]  = useMutation(APPROVE_MEETING, { errorPolicy: 'all' });
  const [rejectMeeting,  { loading: rejecting }]  = useMutation(REJECT_MEETING,  { errorPolicy: 'all' });
  const [updateMeeting,  { loading: updatingM }]  = useMutation(UPDATE_MEETING,  { errorPolicy: 'all' });

  // Data selectors
  // Merge all meeting sources into one list
  const allMeetings = [
    ...(sentData?.getMySentMeetingRequests?.items ?? []),
    ...(receivedData?.getReceivedMeetingRequests?.items ?? []),
    ...(readyData?.getMeetingsReadyForScheduling?.items ?? []),
    ...(scheduledData?.getScheduledMeetings?.items ?? []),
  ].filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === i); // dedupe

  const loading   = sentLoading || receivedLoading || readyLoading || scheduledLoading;
  const hasError  = !!sentErr || !!receivedErr || !!readyErr || !!scheduledErr;

  const now = new Date();
  const rawMeetings =
    tab === 'upcoming' ? allMeetings.filter((m: any) => {
      const d = m.adminAvailabilityDate ?? m.receiverAvailabilityDate ?? m.requestedDate;
      return d ? new Date(d) >= now : true;
    })
    : tab === 'past' ? allMeetings.filter((m: any) => {
      const d = m.adminAvailabilityDate ?? m.receiverAvailabilityDate ?? m.requestedDate;
      return d ? new Date(d) < now : false;
    })
    : allMeetings;

  const filtered = rawMeetings;

  const selected = rawMeetings.find((m:any) => m.id === selectedId);

  // Helpers
  const statusColor = (s: string) => statusMeta(s, isAr).color;
  const statusLabel = (s: string) => statusMeta(s, isAr).label;
  const fmtDate   = (d: string) => d ? new Date(d).toLocaleDateString(isAr?'ar-SA-u-ca-gregory-nu-latn':'en-GB') : '—';
  const otherParty = (m: any): string | null => {
    if (userId && m.requestedBy?.id && String(m.requestedBy.id) === String(userId)) {
      return m.requestedTo?.name ?? null;
    }
    if (userId && m.requestedTo?.id && String(m.requestedTo.id) === String(userId)) {
      return m.requestedBy?.name ?? null;
    }
    return m.requestedTo?.name ?? m.requestedBy?.name ?? null;
  };

  // Actions
  const refetchAll = () => {
    refetchSent(); refetchReceived(); refetchReady(); refetchScheduled();
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMeeting({ variables: { meetingId: id } });
      toast.success(isAr ? 'تمت الموافقة على الاجتماع' : 'Meeting approved');
      refetchAll(); setSelectedId(null);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMeeting({ variables: { meetingId: id } });
      toast.success(isAr ? 'تم رفض الاجتماع' : 'Meeting rejected');
      refetchAll(); setSelectedId(null);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const handleSetAvailability = async (id: string) => {
    if (!availDate) { toast.error(isAr ? 'اختر تاريخاً' : 'Please select a date'); return; }
    try {
      await updateMeeting({ variables: { input: { id, receiverAvailabilityDate: new Date(availDate).toISOString() } } });
      toast.success(isAr ? 'تم تحديد تاريخ توفرك' : 'Availability date set');
      setAvailDate(''); setShowDatePicker(false);
      refetchAll(); setSelectedId(null);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Something went wrong'); }
  };

  const tabs = [
    { value: 'all',      label: isAr?'الكل':'All'          },
    { value: 'upcoming', label: isAr?'القادمة':'Upcoming'  },
    { value: 'past',     label: isAr?'السابقة':'Past'      },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.meetings.title} action={
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Tab switcher */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 flex-wrap gap-1">
            {tabs.map(t => (
              <button key={t.value} onClick={() => { setTab(t.value as any); setFilter('all'); }}
                className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  tab===t.value?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>
                {t.label}
              </button>
            ))}
          </div>

        </div>
      }/>

      {/* Main table — single source of truth for all meetings */}
      {(
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <>
              <div className="md:hidden divide-y divide-gray-100">
                {[1,2,3].map(i=>(
                  <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"/>
                    <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded-full w-1/2"/><div className="h-2 bg-gray-100 rounded-full w-1/3"/></div>
                    <div className="h-5 bg-gray-100 rounded-full w-16"/>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full"><thead className="bg-gray-50 border-b border-gray-100"><tr>{[1,2,3,4,5].map(i=><th key={i} className="px-6 py-4"><div className="h-3 bg-gray-200 rounded-full w-20"/></th>)}</tr></thead>
                <tbody>{[1,2,3,4,5].map(i=><SkeletonRow key={i} cols={5}/>)}</tbody></table>
              </div>
            </>
          ) : hasError ? (
            <div className="p-8"><ErrorCard onRetry={refetchAll} isAr={isAr} /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">{content.dashboard.meetings.empty}</p>
              <p className="text-gray-400 text-sm mt-1">{isAr?'ستظهر اجتماعاتك هنا':'Your meetings will appear here'}</p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((m: any) => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {(otherParty(m) ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#111827] truncate">{maskName(otherParty(m))}</p>
                          <button
                            onClick={e => { e.stopPropagation(); onNavigate?.('details', m.business?.id); }}
                            className="text-xs text-[#10B981] hover:underline truncate block text-right"
                          >
                            {m.business?.businessTitle}
                          </button>
                        </div>
                      </div>
                      <DashBadge color={statusColor(m.status)}>{statusLabel(m.status)}</DashBadge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500 font-bold">
                        {fmtDate(m.adminAvailabilityDate ?? m.receiverAvailabilityDate ?? m.requestedDate)}
                      </span>
                      <div className="flex items-center gap-2">
                        {(m.status === 'APPROVED' || m.status === 'SCHEDULED') && m.meetingLink && (
                          <a href={m.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700">
                            <Video size={12}/>{isAr?'انضم':'Join'}
                          </a>
                        )}
                        <button onClick={() => { setSelectedId(m.id); setShowDatePicker(false); setAvailDate(''); }}
                          className="text-[#10B981] font-bold text-sm flex items-center gap-1">
                          {content.dashboard.meetings.actions.viewDetails}
                          {direction==='rtl'?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[content.dashboard.meetings.table.otherParty, isAr?'الإدراج':'Listing',
                        content.dashboard.meetings.table.meetingDate, content.dashboard.meetings.table.status,
                        content.dashboard.meetings.table.actions].map(h => (
                        <th key={h} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {(otherParty(m) ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-[#111827]">{maskName(otherParty(m))}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => onNavigate?.('details', m.business?.id)}
                            className="text-sm text-[#10B981] hover:underline font-bold"
                          >
                            {m.business?.businessTitle}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-[#111827]">
                            {fmtDate(m.adminAvailabilityDate ?? m.receiverAvailabilityDate ?? m.requestedDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><DashBadge color={statusColor(m.status)}>{statusLabel(m.status)}</DashBadge></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(m.status === 'APPROVED' || m.status === 'SCHEDULED') && m.meetingLink && (
                              <a href={m.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors">
                                <Video size={13}/>{isAr?'انضم':'Join'}
                              </a>
                            )}
                            <button onClick={() => { setSelectedId(m.id); setShowDatePicker(false); setAvailDate(''); }}
                              className="text-[#10B981] hover:text-[#008A66] font-bold text-sm flex items-center gap-1">
                              {content.dashboard.meetings.actions.viewDetails}
                              {direction==='rtl'?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelectedId(null); setShowDatePicker(false); setAvailDate(''); }}
        title={content.dashboard.meetings.actions.viewDetails}>
        {selected && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xl">
                {(otherParty(selected) ?? '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-[#111827] text-lg">{maskName(otherParty(selected))}</h4>
                <button
                  onClick={() => { onNavigate?.('details', selected.business?.id); setSelectedId(null); }}
                  className="text-sm text-[#10B981] hover:underline font-bold"
                >
                  {selected.business?.businessTitle}
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500">{content.dashboard.meetings.table.status}</span>
                <DashBadge color={statusColor(selected.status)}>{statusLabel(selected.status)}</DashBadge>
              </div>
              {selected.requestedDate && (
                <div className="flex justify-between py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">{isAr?'التاريخ المطلوب':'Requested Date'}</span>
                  <span className="font-bold text-[#111827]">{fmtDate(selected.requestedDate)}</span>
                </div>
              )}
              {selected.receiverAvailabilityDate && (
                <div className="flex justify-between py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">{isAr?'تاريخ التوفر':'Availability Date'}</span>
                  <span className="font-bold text-[#111827]">{fmtDate(selected.receiverAvailabilityDate)}</span>
                </div>
              )}
              {selected.adminAvailabilityDate && (
                <div className="flex justify-between py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">{isAr?'تاريخ الاجتماع':'Meeting Date'}</span>
                  <span className="font-bold text-[#111827]">{fmtDate(selected.adminAvailabilityDate)}</span>
                </div>
              )}
              {selected.meetingLink && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">{content.dashboard.meetings.table.meetingLink}</span>
                  <a href={selected.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-bold">
                    <Video size={16}/>{isAr ? 'رابط الاجتماع' : 'Meeting Link'}
                  </a>
                </div>
              )}
            </div>

            {/* Prominent Join button — shown for APPROVED (admin confirmed) meetings with a link */}
            {(selected.status === 'APPROVED' || selected.status === 'SCHEDULED') && selected.meetingLink && (
              <a
                href={selected.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                <Video size={18}/>
                {isAr ? 'انضم إلى الاجتماع' : 'Join Meeting'}
              </a>
            )}

            {/* Cancel / reschedule note — users cannot do this themselves */}
            {!['HELD', 'CANCELED', 'TIMELAPSED'].includes(selected.status) && (
              <p className="text-xs text-gray-400 text-center">
                {isAr
                  ? 'لإلغاء الاجتماع أو إعادة جدولته، يرجى التواصل مع فريق جسور عبر الدعم.'
                  : 'To cancel or reschedule, please contact Jusoor support.'}
              </p>
            )}

            {/* M-05: Seller sets availability date for received REQUESTED meetings */}
            {userId && selected.requestedTo?.id && String(selected.requestedTo.id) === String(userId) && selected.status==='REQUESTED' && (
              <div className="space-y-3 pt-1">
                {!showDatePicker ? (
                  <button onClick={() => setShowDatePicker(true)}
                    className="w-full py-2.5 rounded-xl border border-[#10B981] text-[#10B981] font-bold text-sm hover:bg-[#F0FDF4] transition-colors flex items-center justify-center gap-2">
                    <CalendarDays size={16}/>{isAr?'تحديد تاريخ توفرك':'Set Your Availability'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">{isAr?'اختر تاريخ توفرك':'Select your availability date'}</p>
                    <input type="datetime-local" value={availDate} onChange={e => setAvailDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981]"/>
                    <div className="flex gap-2">
                      <button onClick={() => handleSetAvailability(selected.id)} disabled={updatingM}
                        className="flex-1 bg-[#10B981] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#008A66] disabled:opacity-50 transition-colors">
                        {updatingM?(isAr?'جارٍ...':'Saving...'):(isAr?'تأكيد':'Confirm')}
                      </button>
                      <button onClick={() => { setShowDatePicker(false); setAvailDate(''); }}
                        className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                        {isAr?'إلغاء':'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selected.id)} disabled={approving||rejecting}
                    className="flex-1 bg-[#008A66] text-white py-2.5 rounded-xl font-bold hover:bg-[#007053] transition-colors disabled:opacity-50">
                    {approving?(isAr?'جارٍ...':'...'):(isAr?'موافقة':'Approve')}
                  </button>
                  <button onClick={() => handleReject(selected.id)} disabled={approving||rejecting}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                    {rejecting?(isAr?'جارٍ...':'...'):(isAr?'رفض':'Reject')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const ACTION_TO_VIEW: Record<string, string> = {
  // View-navigate actions
  VIEW_OFFERS: 'offers', VIEW_DEALS: 'deals', VIEW_MEETINGS: 'meetings',
  VIEW_LISTING: 'details', VIEW_LISTINGS: 'listings', VIEW_ALERTS: 'alerts',
  VIEW_IDENTITY: 'settings:identity',  // navigates to Settings → Identity subtab
  // Backend-emitted action types
  NEW_OFFER: 'offers', OFFER_ACCEPTED: 'offers', OFFER_REJECTED: 'offers',
  COUNTER_OFFER: 'offers', OFFER_WITHDRAWN: 'offers',
  NEW_MEETING: 'meetings', MEETING_ACCEPTED: 'meetings', MEETING_APPROVED: 'meetings',
  MEETING_REJECTED: 'meetings', MEETING_RESCHEDULED: 'meetings', MEETING_HELD: 'meetings',
  NEW_DEAL: 'deals', DEAL_UPDATED: 'deals', DEAL_COMPLETED: 'deals',
  NDA_SIGNED: 'deals', PAYMENT_UPLOADED: 'deals', COMMISSION_VERIFIED: 'deals',
};

/** Fallback: route by entity type when actionType has no mapping. */
const ENTITY_TO_VIEW: Record<string, string> = {
  offer: 'offers', Offer: 'offers',
  meeting: 'meetings', Meeting: 'meetings',
  deal: 'deals', Deal: 'deals',
  business: 'listings', Business: 'listings',
  document: 'settings:identity', Document: 'settings:identity',
};

const AlertsView = ({ onNavigate, onTabChange, onSettingsIdentity }: {
  onNavigate?: (view: string, id?: number) => void;
  onTabChange?: (tab: string) => void;
  onSettingsIdentity?: () => void;
}) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  // P6-FIX R-04: real notifications
  const { data, loading, error: notifError, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 50, offSet: 0 },
    skip: !userId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  const [markAllRead, { loading: marking }] = useMutation(MARK_NOTIFICATION_AS_READ);

  const notifications: any[] = data?.getNotifications?.notifications??[];

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllRead({ variables: { id: userId } });
      toast.success(isAr?'تم تحديد جميع الإشعارات كمقروءة':'All notifications marked as read');
      refetch();
    } catch { toast.error(isAr?'حدث خطأ':'Something went wrong'); }
  };

  const iconFor = (name: string) => {
    const n = name?.toLowerCase()??'';
    if (n.includes('offer')||n.includes('عرض'))    return { Icon:DollarSign, bg:'bg-orange-50 text-orange-600', bar:'bg-orange-500' };
    if (n.includes('payment')||n.includes('دفع'))  return { Icon:Wallet,     bg:'bg-green-50 text-green-600',  bar:'bg-green-500'  };
    return                                                 { Icon:FileText,   bg:'bg-blue-50 text-blue-600',    bar:'bg-blue-400'   };
  };
  const fmtDate = (d: string) => d?new Date(d).toLocaleDateString(isAr?'ar-SA-u-ca-gregory-nu-latn':'en-GB'):'';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.alerts.title} action={
        <button onClick={handleMarkAllRead} disabled={marking||!userId} className="text-sm font-bold text-[#10B981] hover:underline disabled:opacity-50">
          {content.dashboard.alerts.markAllRead}
        </button>
      }/>
      {loading ? (
        <div className="space-y-4">{[1,2,3,4].map(i=><SkeletonNotification key={i}/>)}</div>
      ) : notifError ? (
        <ErrorCard onRetry={refetch} isAr={isAr} />
      ) : notifications.length===0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Bell size={32} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{isAr?'لا توجد إشعارات':'No notifications yet'}</p>
          <p className="text-gray-400 text-sm mt-1">{isAr?'ستظهر إشعاراتك هنا':'Your notifications will appear here'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n: any) => {
            const { Icon, bg, bar } = iconFor(n.name);
            const rawTarget =
              (n.actionType && ACTION_TO_VIEW[n.actionType]) ||
              (n.entityType && ENTITY_TO_VIEW[n.entityType]) ||
              null;
            const targetView = rawTarget;
            const handleGoTo = () => {
              if (!rawTarget) return;
              if (rawTarget === 'settings:identity') {
                onSettingsIdentity?.();
              } else if (rawTarget === 'details') {
                onNavigate?.(rawTarget, n.entityId ?? undefined);
              } else {
                onTabChange?.(rawTarget);
              }
            };
            return (
              <div key={n.id} className={cn("bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all flex gap-4 items-start relative overflow-hidden", n.isRead?'border-gray-100':'border-[#10B981]/30')}>
                <div className={cn("w-2 h-full absolute right-0 top-0 bottom-0", bar)}/>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", bg)}><Icon size={20}/></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#111827] text-base">{isAr ? (n.nameAr || n.name) : n.name}</h4>
                  <p className="text-gray-500 text-sm mt-1">{isAr ? (n.messageAr || n.message) : n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-gray-400">{fmtDate(n.createdAt)}</p>
                    {targetView && (onNavigate || onTabChange || onSettingsIdentity) && (
                      <button
                        onClick={handleGoTo}
                        className="text-xs font-bold text-[#10B981] hover:text-[#008A66] flex items-center gap-1 transition-colors"
                      >
                        {isAr ? 'اذهب إلى' : 'Go to'}
                        {direction === 'rtl' ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
                      </button>
                    )}
                  </div>
                </div>
                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-1"/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const SettingsView = ({ defaultTab, onReturnToDeal }: { defaultTab?: string; onReturnToDeal?: () => void }) => {
  const { content, language, userId } = useApp();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState(defaultTab ?? 'profile');
  const [profileForm, setProfileForm] = useState({ name:'', email:'', phone:'', city:'', region:'' });
  const [pwdForm, setPwdForm] = useState({ current:'', new:'', confirm:'' });
  const [bankForm, setBankForm] = useState({ bankName:'', accountNumber:'', accountTitle:'', iban:'' });

  // P6-FIX R-04: real user + banks data
  const { data: userData, loading: userLoading, refetch: refetchUserData } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId }, skip: !userId, fetchPolicy: 'network-only', errorPolicy: 'all',
  });
  const { data: banksData, loading: banksLoading, refetch: refetchBanks } = useQuery(GET_USER_BANKS, { skip: !userId, errorPolicy: 'all' });
  const [updateUser,        { loading: savingProfile    }] = useMutation(UPDATE_USER,              { errorPolicy: 'all' });
  const [changePwd,         { loading: savingPassword   }] = useMutation(CHANGE_PASSWORD,          { errorPolicy: 'all' });
  const [addBank,           { loading: addingBank       }] = useMutation(ADD_BANK,                 { errorPolicy: 'all' });
  const [deleteBank                                      ] = useMutation(DELETE_BANK,               { errorPolicy: 'all' });
  const [setActiveBankMut,  { loading: settingActiveBank }] = useMutation(SET_ACTIVE_BANK,          { errorPolicy: 'all' });
  const [uploadIdentityDoc, { loading: uploadingIdentity }] = useMutation(UPLOAD_IDENTITY_DOCUMENT, { errorPolicy: 'all' });

  React.useEffect(() => {
    const u = userData?.getUserDetails;
    if (u) setProfileForm({ name:u.name??'', email:u.email??'', phone:u.phone??'', city:u.city??'', region:u.district??'' });
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!userId) { toast.error(isAr ? 'يرجى تسجيل الدخول' : 'Not logged in'); return; }
    const nameParts = (profileForm.name ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] || undefined;
    const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
    // UpdateUserInput requires id: String!
    const { errors } = await updateUser({ variables: { input: { id: String(userId), name: profileForm.name, firstName, lastName, email: profileForm.email, phone: profileForm.phone, city: profileForm.city, district: profileForm.region } } });
    if (errors?.length) { toast.error(isAr?'حدث خطأ أثناء الحفظ':'Error saving'); return; }
    toast.success(isAr?'تم حفظ التغييرات بنجاح':'Changes saved');
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current||!pwdForm.new) { toast.error(isAr?'يرجى تعبئة جميع الحقول':'Fill all fields'); return; }
    if (pwdForm.new!==pwdForm.confirm) { toast.error(isAr?'كلمتا المرور غير متطابقتين':'Passwords do not match'); return; }
    const { errors } = await changePwd({ variables: { adminChangePasswordId: userId, oldPassword: pwdForm.current, newPassword: pwdForm.new } });
    if (errors?.length) { toast.error(isAr?'كلمة المرور الحالية غير صحيحة':'Current password incorrect'); return; }
    toast.success(isAr?'تم تغيير كلمة المرور':'Password updated');
    setPwdForm({ current:'', new:'', confirm:'' });
  };

  const handleAddBank = async () => {
    if (!bankForm.bankName||!bankForm.accountNumber||!bankForm.accountTitle) { toast.error(isAr?'يرجى تعبئة الحقول المطلوبة':'Fill required fields'); return; }
    const { errors } = await addBank({ variables: { input: { bankName:bankForm.bankName, accountNumber:bankForm.accountNumber, accountTitle:bankForm.accountTitle, iban:bankForm.iban } } });
    if (errors?.length) { toast.error(isAr?'حدث خطأ':'Error'); return; }
    toast.success(isAr?'تم إضافة الحساب المصرفي':'Bank account added');
    setBankForm({ bankName:'', accountNumber:'', accountTitle:'', iban:'' });
    refetchBanks();
  };

  const handleDeleteBank = async (id: string) => {
    const { errors } = await deleteBank({ variables: { deleteBankId: id } });
    if (errors?.length) { toast.error(isAr?'حدث خطأ':'Error'); return; }
    toast.success(isAr?'تم حذف الحساب':'Account removed');
    refetchBanks();
  };

  const handleSetActiveBank = async (id: string) => {
    const { errors } = await setActiveBankMut({ variables: { setActiveBankId: id } });
    if (errors?.length) { toast.error(isAr?'حدث خطأ':'Error'); return; }
    toast.success(isAr?'تم تعيين الحساب كحساب فعّال':'Account set as active');
    refetchBanks();
  };

  // Fix 7: identity document upload
  const handleUploadIdentity = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(import.meta.env.VITE_UPLOAD_URL || 'https://verify.jusoor-sa.co/upload', {
        method: 'POST', body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const { errors } = await uploadIdentityDoc({
        variables: {
          input: {
            title: isAr ? 'وثيقة الهوية' : 'Identity Document',
            fileName: file.name,
            fileType: file.type,
            filePath: data.fileUrl,
            description: isAr ? 'وثيقة التحقق من الهوية' : 'Identity verification document',
          },
        },
      });
      if (errors?.length) throw new Error('Mutation failed');
      toast.success(isAr ? 'تم رفع وثيقة الهوية بنجاح' : 'Identity document uploaded successfully');
      // Immediately refresh user data so status + document list update without page reload
      await refetchUserData();
    } catch {
      toast.error(isAr ? 'فشل رفع الوثيقة' : 'Upload failed');
    }
  };

  const userStatus = normalizeUserStatus(userData?.getUserDetails?.status);
  const identityDocs = userData?.getUserDetails?.documents ?? [];

  const tabs = [
    { id:'profile',  label:content.dashboard.settings.tabs.profile,  icon:User },
    { id:'wallet',   label:content.dashboard.settings.tabs.wallet,    icon:CreditCard },
    { id:'password', label:content.dashboard.settings.tabs.password,  icon:Lock },
    { id:'identity', label:isAr?'الهوية':'Identity',                  icon:ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.settings.title}/>
      {/* Settings sub-tabs: horizontal pills on mobile, vertical sidebar on desktop */}
      <div className="flex md:hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-1 gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab===tab.id?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>
            <tab.icon size={15}/><span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="hidden md:block md:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1", activeTab===tab.id?"bg-[#111827] text-white":"text-gray-500 hover:bg-gray-50")}>
                <tab.icon size={18}/>{tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-8">
            {activeTab==='profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">{content.dashboard.settings.sections.profile}</h3>
                {userLoading ? <div className="text-gray-400 text-center py-8">{isAr?'جارٍ التحميل...':'Loading...'}</div> : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-[#111827] text-white flex items-center justify-center text-3xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase()||'U'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[{key:'name',label:content.dashboard.settings.profile.name,type:'text'},{key:'email',label:content.dashboard.settings.profile.email,type:'email'},{key:'phone',label:content.dashboard.settings.profile.phone,type:'tel'},{key:'city',label:content.dashboard.settings.profile.city,type:'text'},{key:'region',label:content.dashboard.settings.profile.region,type:'text'}].map(f=>(
                        <div key={f.key} className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">{f.label}</label>
                          <input type={f.type} value={(profileForm as any)[f.key]} onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"/>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#008A66] disabled:opacity-60">
                        {savingProfile?(isAr?'جارٍ الحفظ...':'Saving...'):content.dashboard.settings.profile.saveChanges}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab==='wallet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">{content.dashboard.settings.wallet.title}</h3>

                {/* Return-to-deal banner — shown when user arrived from deal step */}
                {onReturnToDeal && (
                  <div className="bg-[#E6F3EF] border border-[#10B981]/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Wallet size={20} className="text-[#008A66] shrink-0"/>
                      <p className="text-sm font-bold text-[#004E39]">
                        {isAr
                          ? 'أضف حسابك البنكي وفعّله، ثم عد للصفقة لإرسال تفاصيله للمشتري'
                          : 'Add and activate your bank account, then return to your deal to send it to the buyer'}
                      </p>
                    </div>
                    <button onClick={onReturnToDeal}
                      className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-[#008A66] bg-white border border-[#10B981]/40 px-3 py-2 rounded-xl hover:bg-[#d0ebe5] transition-colors">
                      <ArrowRight size={15} className={isAr ? '' : 'rotate-180'}/>
                      {isAr ? 'العودة للصفقة' : 'Back to Deal'}
                    </button>
                  </div>
                )}

                {banksLoading ? <div className="text-gray-400 text-center py-8">{isAr?'جارٍ التحميل...':'Loading...'}</div> : (
                  <div className="space-y-3">
                    {(banksData?.getUserBanks??[]).length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm font-bold">
                        {isAr ? 'لا توجد حسابات بنكية بعد' : 'No bank accounts yet'}
                      </div>
                    )}
                    {(banksData?.getUserBanks??[]).map((b:any) => (
                      <div key={b.id} className={cn(
                        "p-4 rounded-2xl border flex justify-between items-start gap-3 transition-all",
                        b.isActive ? "border-[#10B981] bg-[#F0FDF4]" : "border-gray-200 bg-white"
                      )}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-[#111827]">{b.bankName}</p>
                            {b.isActive && (
                              <span className="bg-[#E6F3EF] text-[#008A66] text-xs font-bold px-2 py-0.5 rounded-full">
                                {isAr ? 'الحساب الفعّال' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{b.accountTitle}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.iban || b.accountNumber}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!b.isActive && (
                            <button onClick={() => handleSetActiveBank(b.id)} disabled={settingActiveBank}
                              className="text-xs font-bold text-[#008A66] hover:bg-[#E6F3EF] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              {isAr ? 'تفعيل' : 'Set Active'}
                            </button>
                          )}
                          <button onClick={() => handleDeleteBank(b.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <Trash2 size={17}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-base font-bold text-[#111827] mb-4 flex items-center gap-2"><Plus size={18} className="text-[#10B981]"/>{content.dashboard.settings.wallet.addAccount}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[{key:'bankName',label:isAr?'اسم البنك':'Bank Name',req:true},{key:'accountTitle',label:isAr?'اسم الحساب':'Account Title',req:true},{key:'accountNumber',label:isAr?'رقم الحساب':'Account Number',req:true},{key:'iban',label:'IBAN',req:false}].map(f=>(
                      <div key={f.key} className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">{f.label}{f.req&&<span className="text-red-500"> *</span>}</label>
                        <input value={(bankForm as any)[f.key]} onChange={e=>setBankForm(b=>({...b,[f.key]:e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"/>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={handleAddBank} disabled={addingBank} className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#008A66] disabled:opacity-60">
                      {addingBank?(isAr?'جارٍ الإضافة...':'Adding...'):(isAr?'إضافة الحساب':'Add Account')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab==='password' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">{content.dashboard.settings.password.updatePassword}</h3>
                <div className="space-y-4 max-w-md">
                  {[{key:'current',label:content.dashboard.settings.password.currentPassword},{key:'new',label:content.dashboard.settings.password.newPassword},{key:'confirm',label:content.dashboard.settings.password.confirmPassword}].map(f=>(
                    <div key={f.key} className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{f.label}</label>
                      <input type="password" value={(pwdForm as any)[f.key]} onChange={e=>setPwdForm(p=>({...p,[f.key]:e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"/>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button onClick={handleChangePassword} disabled={savingPassword} className="bg-[#111827] text-white px-8 py-3 rounded-xl font-bold hover:bg-black w-full disabled:opacity-60">
                      {savingPassword?(isAr?'جارٍ التحديث...':'Updating...'):content.dashboard.settings.password.updatePassword}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fix 7: Identity verification tab */}
            {activeTab==='identity' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] border-b border-gray-100 pb-4 flex items-center gap-2">
                  <ShieldCheck size={22} className="text-[#10B981]"/>
                  {isAr ? 'التحقق من الهوية' : 'Identity Verification'}
                </h3>

                {/* Status badge */}
                {(() => {
                  const statusConfig = {
                    verified:     { color:'bg-[#E6F3EF] text-[#10B981] border-[#10B981]/20', icon:<ShieldCheck size={18}/>, label: isAr?'تم التحقق':'Verified' },
                    under_review: { color:'bg-yellow-50 text-yellow-700 border-yellow-200',   icon:<ShieldCheck size={18}/>, label: isAr?'قيد المراجعة':'Under Review' },
                    pending:      { color:'bg-blue-50 text-blue-600 border-blue-200',          icon:<ShieldCheck size={18}/>, label: isAr?'بانتظار الرفع':'Pending Upload' },
                    inactive:     { color:'bg-red-50 text-red-500 border-red-200',             icon:<ShieldCheck size={18}/>, label: isAr?'غير موثق':'Not Verified' },
                  } as Record<string, any>;
                  const cfg = statusConfig[userStatus] ?? statusConfig.inactive;
                  return (
                    <div className={cn('flex items-center gap-3 px-5 py-4 rounded-2xl border font-bold text-sm', cfg.color)}>
                      {cfg.icon}
                      <div>
                        <p className="font-black">{isAr ? 'حالة حسابك' : 'Account Status'}: {cfg.label}</p>
                        {userStatus !== 'verified' && (
                          <p className="text-xs font-normal mt-0.5 opacity-80">
                            {userStatus === 'under_review'
                              ? (isAr ? 'فريق جسور يراجع وثيقتك — سيتم إشعارك عند الانتهاء' : 'The Jusoor team is reviewing your document — you\'ll be notified when done')
                              : (isAr ? 'ارفع وثيقة هويتك لتفعيل حسابك كاملاً والتمكن من تقديم عروض وصفقات' : 'Upload your ID to fully activate your account and be able to submit offers and deals')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Already uploaded documents */}
                {identityDocs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-600">{isAr ? 'الوثائق المرفوعة' : 'Uploaded Documents'}</p>
                    {identityDocs.map((doc: any) => (
                      <a key={doc.id} href={doc.filePath} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <ShieldCheck size={18} className="text-[#10B981] shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#111827] text-sm truncate">{doc.title || doc.fileName}</p>
                          {doc.description && <p className="text-xs text-gray-400 truncate">{doc.description}</p>}
                        </div>
                        <Download size={16} className="text-gray-400 shrink-0"/>
                      </a>
                    ))}
                  </div>
                )}

                {/* Upload section — rules:
                    verified     → hidden entirely (account already approved)
                    under_review → locked: doc submitted, waiting for admin
                    pending/inactive with doc already uploaded → locked (doc exists, awaiting review)
                    pending/inactive with no doc → show uploader */}
                {userStatus !== 'verified' && (
                  <div className="border-t border-gray-100 pt-6">
                    {userStatus === 'under_review' || identityDocs.length > 0 ? (
                      /* Document already submitted — prevent duplicate upload */
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                        <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-700 text-sm">
                            {isAr ? 'وثيقتك قيد المراجعة' : 'Document under review'}
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            {isAr
                              ? 'تم رفع وثيقتك بالفعل وهي قيد المراجعة من قِبل فريق جسور. لا يمكن رفع وثيقة أخرى حتى اكتمال المراجعة.'
                              : 'Your document has been submitted and is being reviewed by the Jusoor team. You cannot upload another document until the review is complete.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* No document yet — show upload zone */
                      <>
                        <p className="text-sm font-bold text-[#111827] mb-1">
                          {isAr ? 'رفع وثيقة الهوية' : 'Upload Identity Document'}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          {isAr
                            ? 'يُقبل: الهوية الوطنية، الإقامة، جواز السفر — PDF أو صورة (JPG/PNG)'
                            : 'Accepted: National ID, Iqama, Passport — PDF or image (JPG/PNG)'}
                        </p>
                        <label className={cn(
                          'flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                          uploadingIdentity
                            ? 'border-gray-200 bg-gray-50 cursor-wait'
                            : 'border-[#10B981]/40 hover:border-[#10B981] hover:bg-[#F0FDF4]'
                        )}>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploadingIdentity}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadIdentity(f); }}
                          />
                          {uploadingIdentity ? (
                            <>
                              <div className="w-8 h-8 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin"/>
                              <p className="text-sm font-bold text-gray-500">{isAr ? 'جارٍ الرفع...' : 'Uploading...'}</p>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-[#E6F3EF] flex items-center justify-center">
                                <Upload size={24} className="text-[#10B981]"/>
                              </div>
                              <p className="text-sm font-bold text-[#111827]">{isAr ? 'اضغط لرفع الوثيقة' : 'Click to upload document'}</p>
                              <p className="text-xs text-gray-400">{isAr ? 'الحد الأقصى: 10 ميغابايت' : 'Max size: 10 MB'}</p>
                            </>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export const Dashboard = ({ onNavigate, defaultTab }: { onNavigate?: (page: string, id?: string | number) => void; onEditListing?: (id: string | number) => void; defaultTab?: string }) => {
  const { content, language, direction, logout, userId } = useApp();
  const isAr = language === 'ar';
  // When arriving via intent-routing (e.g. 'settings:identity'), open the right tab immediately
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    defaultTab === 'settings:identity' ? 'settings' : 'dashboard'
  );
  // Track which Settings sub-tab to open when navigating from a notification or intent-routing
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<string>(() =>
    defaultTab === 'settings:identity' ? 'identity' : 'profile'
  );
  // When seller navigates to Wallet from a deal, remember the deal ID so we can reopen it on return
  const [pendingDealId, setPendingDealId] = useState<string | null>(null);
  // BUG-5 FIX: fetch notifications to drive the bell badge unread count
  const { data: notifData, loading: notificationsLoading, error: notificationsError, refetch: refetchNotifications } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 50, offSet: 0 },
    skip: !userId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    skip: !userId,
    onData: ({ data }) => {
      if (!userId) return;
      const n = data?.data?.newNotification;
      if (!n) return;
      // Defence-in-depth: even if server-side withFilter passes this through,
      // drop any notification not addressed to the current user
      if (n.user?.id && String(n.user.id) !== String(userId)) return;
      refetchNotifications();
      // Resolve best navigation target from routing fields
      const rawTarget =
        (n.actionType && ACTION_TO_VIEW[n.actionType]) ||
        (n.entityType && ENTITY_TO_VIEW[n.entityType]) ||
        'alerts';
      const title   = isAr ? (n.nameAr    || n.name)    : n.name;
      const message = isAr ? (n.messageAr || n.message)  : n.message;
      toast(title, {
        description: message,
        action: {
          label: isAr ? 'عرض' : 'View',
          onClick: () => {
            if (rawTarget === 'settings:identity') {
              setSettingsDefaultTab('identity');
              setActiveTab('settings');
            } else {
              setActiveTab(rawTarget as any);
            }
          },
        },
        duration: 6000,
      });
    },
  });
  const dashboardNotifications = notifData?.getNotifications?.notifications ?? [];
  const unreadCount = dashboardNotifications.filter((n: any) => !n.isRead).length;
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // P6-FIX R-04: real user data for profile header
  const { data: navUserData } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    errorPolicy: 'all',
  });
  const navUser = navUserData?.getUserDetails;
  const displayName = navUser?.name || (language === 'ar' ? 'المستخدم' : 'User');
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const tabs = [
    { id: 'dashboard', label: content.dashboard.tabs.dashboard, icon: LayoutDashboard },
    { id: 'listings', label: content.dashboard.tabs.listings, icon: Store },
    { id: 'offers', label: content.dashboard.tabs.offers, icon: FileText },
    { id: 'deals', label: content.dashboard.tabs.deals, icon: Handshake },
    { id: 'meetings', label: content.dashboard.tabs.meetings, icon: Video },
    { id: 'favorites', label: content.dashboard.tabs.favorites, icon: Bookmark },
    // Removed Alerts from tabs array as requested
    { id: 'settings', label: content.dashboard.tabs.settings, icon: Settings },
  ];

  // Mobile bottom bar excludes Settings (accessed via avatar in top strip)
  const mobileTabs = tabs.filter(t => t.id !== 'settings');

  const handleAddListing = () => {
    setEditingId(null);
    setViewMode('create-listing');
    window.scrollTo(0, 0);
  };
  
  const handleEditListing = (id: string | number) => {
    setEditingId(id);
    setViewMode('edit-listing');
    window.scrollTo(0, 0);
  };
  
  const handleCancelListing = () => {
    setViewMode('dashboard');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  const handleCompleteListing = () => {
    setViewMode('dashboard');
    setEditingId(null);
    setActiveTab('listings');
    toast.success(content.dashboard.listings.successMessage);
    window.scrollTo(0, 0);
  };

  if (viewMode === 'create-listing' || viewMode === 'edit-listing') {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
           {/* BUG-20 FIX: useLightLogo was not passed — dark background needs dark logo (false = dark) */}
           <Navbar onNavigate={onNavigate} useLightLogo={false} />
           <main className="flex-grow pt-20 pb-16 px-4">
              <ListingWizard 
                mode={viewMode === 'create-listing' ? 'create' : 'edit'}
                onCancel={handleCancelListing} 
                onSuccess={handleCompleteListing} 
                initialData={viewMode === 'edit-listing' && editingId ? { id: String(editingId) } : undefined}
              />
           </main>
           <Footer />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* BUG-20 FIX: useLightLogo was not passed — dark background needs dark logo (false = dark) */}
      <Navbar onNavigate={onNavigate} useLightLogo={false} />

      <div className={cn('flex pt-24', direction === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>

        {/* ── Desktop Sidebar ────────────────────────────────────────── */}
        <aside className={cn(
          'hidden md:flex flex-col fixed top-24 bottom-0 w-64 bg-white z-40 overflow-y-auto',
          direction === 'rtl' ? 'right-0 border-l border-gray-100' : 'left-0 border-r border-gray-100'
        )}>
          {/* Brand */}
          <div className="p-5 border-b border-gray-100 shrink-0">
            <button
              onClick={() => onNavigate?.('home')}
              className="font-black text-[#008A66] text-2xl tracking-tight hover:opacity-80 transition-opacity"
            >
              {isAr ? 'جسور' : 'Jusoor'}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all',
                  direction === 'rtl' ? 'text-right' : 'text-left',
                  activeTab === tab.id
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'
                )}
              >
                <tab.icon size={18} className="shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Bell / Alerts */}
          <div className="px-3 pb-2 shrink-0">
            <button
              onClick={() => setActiveTab('alerts')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all relative',
                direction === 'rtl' ? 'text-right' : 'text-left',
                activeTab === 'alerts'
                  ? 'bg-[#111827] text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'
              )}
            >
              <Bell size={18} className="shrink-0" />
              {isAr ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <span className={cn(
                  'absolute top-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white',
                  direction === 'rtl' ? 'left-3' : 'right-3'
                )} />
              )}
            </button>
          </div>

          {/* Add Listing CTA */}
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 shrink-0">
            <button
              onClick={handleAddListing}
              className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#008A66] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-[#10B981]/20"
            >
              <Plus size={16} />
              {content.dashboard.listings.addNew}
            </button>
          </div>

          {/* User profile + logout */}
          <div className="p-4 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#111827] text-sm truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{navUser?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={async () => { await logout(); onNavigate?.('home'); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors',
                direction === 'rtl' ? 'text-right' : 'text-left'
              )}
            >
              <LogOut size={16} className="shrink-0" />
              {isAr ? 'تسجيل الخروج' : 'Log out'}
            </button>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────────── */}
        <main className={cn(
          'flex-1 min-w-0 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-10',
          direction === 'rtl' ? 'md:mr-64' : 'md:ml-64'
        )}>
          <div className="container mx-auto px-4 max-w-5xl py-6">

            {/* Mobile: compact profile strip */}
            <div className="md:hidden flex items-center justify-between mb-5 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar → opens Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ring-2',
                    activeTab === 'settings'
                      ? 'bg-[#008A66] text-white ring-[#008A66]/30'
                      : 'bg-[#111827] text-white ring-transparent'
                  )}
                  aria-label={isAr ? 'الإعدادات' : 'Settings'}
                >
                  {avatarLetter}
                </button>
                <p className="font-bold text-[#111827] text-sm truncate">{displayName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleAddListing}
                  className="bg-[#10B981] hover:bg-[#008A66] text-white p-2 rounded-xl transition-colors shadow-lg shadow-[#10B981]/20"
                  aria-label={isAr ? 'إضافة إدراج' : 'Add listing'}
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center relative transition-colors"
                  aria-label={isAr ? 'الإشعارات' : 'Notifications'}
                >
                  <Bell size={18} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  )}
                </button>
                <button
                  onClick={async () => { await logout(); onNavigate?.('home'); }}
                  className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                  aria-label={isAr ? 'تسجيل الخروج' : 'Log out'}
                >
                  <LogOut size={16} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard'  && <DashboardView
                  notifications={dashboardNotifications}
                  notificationsLoading={notificationsLoading}
                  notificationsError={notificationsError}
                  onRetryNotifications={refetchNotifications}
                  onOpenAlerts={() => setActiveTab('alerts')}
                  onTabChange={(tab) => setActiveTab(tab as TabType)}
                  onNavigate={onNavigate}
                  onGoToIdentity={() => { setSettingsDefaultTab('identity'); setActiveTab('settings'); }}
                />}
                {activeTab === 'listings'   && <ListingsView onAddListing={handleAddListing} onEditListing={handleEditListing} onNavigate={onNavigate} />}
                {activeTab === 'offers'     && <OffersView onNavigate={onNavigate} onGoToIdentity={() => { setSettingsDefaultTab('identity'); setActiveTab('settings'); }} />}
                {activeTab === 'deals'      && <DealsView
                  onNavigate={onNavigate}
                  initialSelectedId={pendingDealId}
                  onGoToWallet={(dealId) => {
                    setPendingDealId(dealId);
                    setSettingsDefaultTab('wallet');
                    setActiveTab('settings');
                  }}
                />}
                {activeTab === 'meetings'   && <MeetingsView onNavigate={onNavigate} />}
                {activeTab === 'favorites'  && <ListingsView isFavorites onNavigate={onNavigate} />}
                {activeTab === 'alerts'     && <AlertsView
                  onNavigate={onNavigate}
                  onTabChange={(tab) => setActiveTab(tab as TabType)}
                  onSettingsIdentity={() => {
                    setSettingsDefaultTab('identity');
                    setActiveTab('settings');
                  }}
                />}
                {activeTab === 'settings'   && <SettingsView
                  defaultTab={settingsDefaultTab}
                  onReturnToDeal={pendingDealId ? () => {
                    setPendingDealId(null);
                    setActiveTab('deals');
                  } : undefined}
                />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ──────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,138,102,0.10)]">
        {/* Swipeable scroll container — hides scrollbar, touch-friendly */}
        <div className="overflow-x-auto scrollbar-none pb-safe pt-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-end" style={{ minWidth: 'max-content' }}>
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="flex flex-col items-center justify-end gap-0.5 pt-1.5 pb-2 px-1 relative"
                  style={{ minWidth: '72px' }}
                >
                  {/* Active top indicator */}
                  <span className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300',
                    isActive ? 'w-6 bg-[#008A66]' : 'w-0 bg-transparent'
                  )} />
                  {/* Icon bubble */}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200',
                    isActive ? 'bg-[#008A66]/10' : 'bg-transparent'
                  )}>
                    <tab.icon
                      size={isActive ? 21 : 19}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={cn('transition-colors duration-200', isActive ? 'text-[#008A66]' : 'text-gray-400')}
                    />
                  </div>
                  {/* Label */}
                  <span className={cn(
                    'text-[9px] font-bold leading-tight text-center transition-colors duration-200 whitespace-nowrap',
                    isActive ? 'text-[#008A66]' : 'text-gray-400'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};
