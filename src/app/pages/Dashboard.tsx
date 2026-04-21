import React from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { Bell, DollarSign, Calendar, CheckCircle2, ShieldCheck, Store, Users, Eye, Handshake, AlertCircle } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_PROFILE_STATISTICS, GET_BUYER_STATISTICS, GET_NOTIFICATIONS, GET_USER_DETAILS } from '../../../graphql/queries/dashboard';

// ─── Shared helpers ───────────────────────────────────────────────────────────
export const DashBadge = ({ children, color }: { children: React.ReactNode; color: string }) => {
  const c: Record<string, string> = {
    green:  'bg-[#E6F3EF] text-[#10B981]',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-50 text-red-600',
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-[#E6F3EF] text-[#10B981]',
    black:  'bg-gray-900 text-white',
  };
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1', c[color] || c.gray)}>
      {children}
    </span>
  );
};

export const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
    <div className="inline-flex flex-col gap-1.5 items-start">
      <h2 className="text-2xl font-black text-[#111827]">{title}</h2>
      <div className="h-1 w-full bg-[#10B981] rounded-full" />
    </div>
    <div className="flex-1 md:flex-none flex justify-start md:justify-end w-full md:w-auto">{action}</div>
  </div>
);

export const DashModal = ({ isOpen, onClose, title, children }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-[#111827]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ─── DashboardView ────────────────────────────────────────────────────────────
export const DashboardView = () => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  // P6-FIX R-04: real stats from API (both seller + buyer queries)
  const { data: sellerData, error: sellerStatsError } = useQuery(GET_PROFILE_STATISTICS, { errorPolicy: 'all' });
  const { data: userDetailsData } = useQuery(GET_USER_DETAILS, { variables: { getUserDetailsId: userId }, skip: !userId, errorPolicy: 'all' });
  const userStatus = userDetailsData?.getUserDetails?.status ?? '';
  const isVerified = userStatus === 'VERIFIED' || userStatus === 'verified';
  const { data: buyerData, error: buyerStatsError }  = useQuery(GET_BUYER_STATISTICS,  { errorPolicy: 'all' });
  const statsError = sellerStatsError || buyerStatsError;
  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    skip: !userId,
    variables: { userId: String(userId), limit: 5, offSet: 0 },
    fetchPolicy: 'network-only',
    pollInterval: 30000,
    errorPolicy: 'all',
  });

  // skip: !userId already prevents the query until userId is available — no manual refetch needed
  const notifications = notifData?.getNotifications?.notifications ?? [];

  const ss = sellerData?.getProfileStatistics;
  const bs = buyerData?.getBuyerStatistics;

  const stats = [
    {
      label: isAr ? 'الصفقات المكتملة' : 'Finalized Deals',
      value: ss?.finalizedDealsCount ?? bs?.finalizedDealsCount ?? '—',
      icon: Handshake,
      color: 'bg-[#E6F3EF] text-[#10B981]',
    },
    {
      label: isAr ? 'الإدراجات النشطة' : 'Listed Businesses',
      value: ss?.listedBusinessesCount ?? '—',
      icon: Store,
      color: 'bg-[#E6F3EF] text-[#10B981]',
    },
    {
      label: isAr ? 'العروض المستلمة' : 'Received Offers',
      value: ss?.receivedOffersCount ?? '—',
      icon: DollarSign,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: isAr ? 'الاجتماعات المجدولة' : 'Scheduled Meetings',
      value: ss?.scheduledMeetingsCount ?? bs?.scheduledMeetingsCount ?? '—',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: isAr ? 'المشاهدات' : 'Business Views',
      value: ss?.viewedBusinessesCount ?? '—',
      icon: Eye,
      color: 'bg-pink-50 text-pink-600',
    },
    {
      label: isAr ? 'المفضلة' : 'Saved Businesses',
      value: bs?.favouriteBusinessesCount ?? '—',
      icon: Users,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* F-11: Error banner */}
      {statsError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{isAr ? 'تعذر تحميل الإحصائيات، يرجى المحاولة مجدداً' : 'Could not load statistics. Please try again.'}</span>
        </div>
      )}
      <SectionHeader title={content.dashboard.tabs.dashboard} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 md:gap-4">
              <div className={cn('w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', stat.color)}>
                <stat.icon size={20} className="md:w-7 md:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-[10px] md:text-sm font-bold mb-1 line-clamp-1">{stat.label}</p>
                <p className="text-xl md:text-3xl font-black text-[#111827]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#111827]">{content.dashboard.activity.title}</h3>
            <span className="text-sm text-[#10B981] font-bold">{isAr ? 'آخر الأنشطة' : 'Recent Activity'}</span>
          </div>
          <div className="space-y-6 relative before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{isAr ? 'لا يوجد نشاط بعد' : 'No recent activity'}</p>
            ) : notifications.map((n: any) => (
              <div key={n.id} className="flex gap-4 relative">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white', n.isRead ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-[#10B981]')}>
                  <Bell size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-sm">{n.name}</p>
                  {n.message && <p className="text-gray-500 text-sm mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-xl font-bold text-[#111827] mb-4">{content.dashboard.accountStatus.title}</h3>
            <div className={`p-4 rounded-2xl flex items-center gap-3 mb-6 ${isVerified ? 'bg-[#E6F3EF]' : 'bg-amber-50'}`}>
              <ShieldCheck className={isVerified ? 'text-[#10B981]' : 'text-amber-500'} size={24} />
              <div>
                <p className={`font-bold ${isVerified ? 'text-[#004E39]' : 'text-amber-800'}`}>
                  {isVerified ? content.dashboard.accountStatus.verified : (isAr ? 'قيد المراجعة' : 'Under Review')}
                </p>
                <p className={`text-xs ${isVerified ? 'text-[#004E39]/70' : 'text-amber-700'}`}>
                  {isVerified ? content.dashboard.accountStatus.verifiedDesc : (isAr ? 'يتم مراجعة حسابك حالياً' : 'Your account is being reviewed')}
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{content.dashboard.accountStatus.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
