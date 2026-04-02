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
import { ListingsView }  from './dashboard/ListingsView';
import { OffersView }    from './dashboard/OffersView';
import { DealsView }     from './dashboard/DealsView';
import { MeetingsView }  from './dashboard/MeetingsView';
import { AlertsView }    from './dashboard/AlertsView';
import { SettingsView }  from './dashboard/SettingsView';
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
  MARK_NOTIFICATION_AS_READ,
  // P9: deal flow mutations
  UPDATE_DEAL,
  UPLOAD_DOCUMENT,
  SEND_BANK_TO_BUYER,
  REJECT_MEETING,
  // P10: meeting mutations
  UPDATE_MEETING,
} from '../../graphql/mutations/dashboard';
import { REQUEST_MEETING } from '../../graphql/mutations/business';

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
    green: 'bg-[#E6F3EF] text-[#10B981]',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-600',
    black: 'bg-gray-900 text-white'
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1", colorClasses[color] || colorClasses.gray)}>
      {children}
    </span>
  );
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


// --- Sub-Views ---

const DashboardView = () => {
  const { content, language } = useApp();
  const isAr = language === 'ar';

  // P6-FIX R-04: real stats from API
  const { data: sellerData } = useQuery(GET_PROFILE_STATISTICS, { errorPolicy: 'all' });
  const { data: buyerData  } = useQuery(GET_BUYER_STATISTICS,   { errorPolicy: 'all' });

  const ss = sellerData?.getProfileStatistics;
  const bs = buyerData?.getBuyerStatistics;

  const stats = [
    { label: isAr ? 'الصفقات المكتملة'  : 'Finalized Deals',     value: ss?.finalizedDealsCount ?? bs?.finalizedDealsCount ?? '—', icon: Handshake,    color: 'bg-[#E6F3EF] text-[#10B981]' },
    { label: isAr ? 'الإدراجات النشطة'  : 'Listed Businesses',   value: ss?.listedBusinessesCount ?? '—',                           icon: Store,        color: 'bg-blue-50 text-blue-600' },
    { label: isAr ? 'العروض المستلمة'   : 'Received Offers',     value: ss?.receivedOffersCount ?? '—',                            icon: DollarSign,   color: 'bg-orange-50 text-orange-600' },
    { label: isAr ? 'الاجتماعات'        : 'Meetings',            value: ss?.scheduledMeetingsCount ?? bs?.scheduledMeetingsCount ?? '—', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: isAr ? 'مشاهدات الإدراجات' : 'Business Views',      value: ss?.viewedBusinessesCount ?? '—',                          icon: Eye,          color: 'bg-pink-50 text-pink-600' },
    { label: isAr ? 'المحفوظة'          : 'Saved Businesses',    value: bs?.favouriteBusinessesCount ?? '—',                       icon: Bookmark,     color: 'bg-yellow-50 text-yellow-600' },
  ];

  const activityItems = [
    { title: content.dashboard.activity.items.newOffer.title,         desc: content.dashboard.activity.items.newOffer.desc,         time: content.dashboard.activity.items.newOffer.time,         icon: DollarSign,   color: 'bg-orange-100 text-orange-600' },
    { title: content.dashboard.activity.items.upcomingMeeting.title,  desc: content.dashboard.activity.items.upcomingMeeting.desc,  time: content.dashboard.activity.items.upcomingMeeting.time,  icon: Calendar,     color: 'bg-blue-100 text-blue-600' },
    { title: content.dashboard.activity.items.listingPublished.title, desc: content.dashboard.activity.items.listingPublished.desc, time: content.dashboard.activity.items.listingPublished.time, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  ];

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
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white", item.color)}>
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







export const Dashboard = ({ onNavigate }: { onNavigate?: (page: string, id?: number) => void }) => {
  const { content, language, logout, userId } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  // BUG-5 FIX: fetch notifications to drive the bell badge unread count
  const { data: notifData, refetch: refetchNotifications } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId, limit: 50, offSet: 0 },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  // P14 S-01: real-time subscription — refetch badge count when a new notification arrives
  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    skip: !userId,
    onData: () => { if (userId) refetchNotifications(); },
  });
  const unreadCount = (notifData?.getNotifications?.notifications ?? []).filter((n: any) => !n.isRead).length;
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleAddListing = () => {
    setViewMode('create-listing');
    window.scrollTo(0, 0);
  };
  
  const handleEditListing = (id: number) => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* BUG-20 FIX: useLightLogo was not passed — dark background needs dark logo (false = dark) */}
      <Navbar onNavigate={onNavigate} useLightLogo={false} />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header Profile Section */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
             {/* Top Section: Profile & Actions */}
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                {/* Profile Info */}
                <div className="flex items-center gap-5">
                   {/* Avatar */}
                   <div className="w-20 h-20 rounded-full bg-[#111827] text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-gray-200">
                      {avatarLetter}
                   </div>
                   <div>
                      <h1 className="text-2xl md:text-3xl font-black text-[#111827] mb-1">{displayName}</h1>
                      <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
                         <span>{navUser?.email || ''}</span>
                         <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                         <span className="text-[#10B981]">{content.dashboard.accountStatus.verified}</span>
                      </div>
                   </div>
                </div>

                {/* Actions: Add Listing + Bell + Logout */}
                <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto justify-end">
                   <button onClick={() => handleAddListing()} className="bg-[#10B981] hover:bg-[#008A66] text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#10B981]/20 flex items-center gap-2 text-sm whitespace-nowrap">
                      <Plus size={18} />
                      <span>{content.dashboard.listings.addNew}</span>
                   </button>
                   
                   <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block"></div>

                   <button onClick={() => setActiveTab('alerts')} aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors relative focus-visible:ring-2 focus-visible:ring-[#008A66] focus-visible:outline-none">
                      <Bell size={20} />
                      {/* BUG-5 FIX: only show badge when there are unread notifications */}
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                      )}
                   </button>
                   
                   <button onClick={() => { logout(); onNavigate?.('home'); }} aria-label={language === 'ar' ? 'تسجيل الخروج' : 'Logout'} className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors">
                      <LogOut size={20} />
                   </button>
                </div>
             </div>

             {/* Bottom Section: Tabs */}
             <div className="border-t border-gray-100 pt-6 -mx-2 px-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-2 w-max md:w-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                        activeTab === tab.id 
                          ? "bg-[#111827] text-white shadow-md" 
                          : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
                      )}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                   {activeTab === 'dashboard' && <DashboardView />}
                   {activeTab === 'listings' && <ListingsView onAddListing={handleAddListing} onEditListing={handleEditListing} onNavigate={onNavigate} />}
                   {activeTab === 'offers' && <OffersView />}
                   {activeTab === 'deals' && <DealsView />}
                   {activeTab === 'meetings' && <MeetingsView />}
                   {activeTab === 'favorites' && <ListingsView isFavorites onNavigate={onNavigate} />}
                   {activeTab === 'alerts' && <AlertsView />}
                   {activeTab === 'settings' && <SettingsView />}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};