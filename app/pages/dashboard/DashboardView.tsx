import React from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { DollarSign, Calendar, CheckCircle2, ShieldCheck, Store, Users, Eye, Handshake } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_PROFILE_STATISTICS, GET_BUYER_STATISTICS } from '../../../graphql/queries/dashboard';

// ─── Shared helpers ───────────────────────────────────────────────────────────
export const DashBadge = ({ children, color }: { children: React.ReactNode; color: string }) => {
  const c: Record<string, string> = {
    green:  'bg-[#E6F3EF] text-[#10B981]',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-50 text-red-600',
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-50 text-blue-600',
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
  const { content, language } = useApp();
  const isAr = language === 'ar';

  // P6-FIX R-04: real stats from API (both seller + buyer queries)
  const { data: sellerData } = useQuery(GET_PROFILE_STATISTICS, { errorPolicy: 'all' });
  const { data: buyerData }  = useQuery(GET_BUYER_STATISTICS,  { errorPolicy: 'all' });

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
      color: 'bg-blue-50 text-blue-600',
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

  const activityItems = [
    { title: content.dashboard.activity.items.newOffer.title,         desc: content.dashboard.activity.items.newOffer.desc,         time: content.dashboard.activity.items.newOffer.time,         icon: DollarSign,    color: 'bg-orange-100 text-orange-600' },
    { title: content.dashboard.activity.items.upcomingMeeting.title,  desc: content.dashboard.activity.items.upcomingMeeting.desc,  time: content.dashboard.activity.items.upcomingMeeting.time,  icon: Calendar,      color: 'bg-blue-100 text-blue-600' },
    { title: content.dashboard.activity.items.listingPublished.title, desc: content.dashboard.activity.items.listingPublished.desc, time: content.dashboard.activity.items.listingPublished.time, icon: CheckCircle2,  color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <button className="text-sm text-[#10B981] font-bold hover:underline">{content.dashboard.activity.viewHistory}</button>
          </div>
          <div className="space-y-8 relative before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {activityItems.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white', item.color)}>
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-base">{item.title}</p>
                  <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-xl font-bold text-[#111827] mb-4">{content.dashboard.accountStatus.title}</h3>
            <div className="bg-[#E6F3EF] p-4 rounded-2xl flex items-center gap-3 mb-6">
              <ShieldCheck className="text-[#10B981]" size={24} />
              <div>
                <p className="font-bold text-[#004E39]">{content.dashboard.accountStatus.verified}</p>
                <p className="text-xs text-[#004E39]/70">{content.dashboard.accountStatus.verifiedDesc}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{content.dashboard.accountStatus.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
