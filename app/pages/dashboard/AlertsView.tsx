import React from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { DollarSign, FileText, Wallet, Bell } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../../graphql/queries/dashboard';
import { MARK_NOTIFICATION_AS_READ } from '../../../graphql/mutations/dashboard';
import { SectionHeader } from './DashboardView';

export const AlertsView = () => {
  const { content, language, userId } = useApp();
  const isAr = language === 'ar';

  // P6-FIX R-04: real notifications
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId, limit: 50, offSet: 0 },
    skip: !userId,
    errorPolicy: 'all',
  });

  // P3-FIX kept: Mark All Read mutation
  const [markAllRead, { loading: marking }] = useMutation(MARK_NOTIFICATION_AS_READ);

  const notifications: any[] = data?.getNotifications?.notifications ?? [];

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllRead({ variables: { userId } });
      toast.success(isAr ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read');
      refetch();
    } catch {
      toast.error(isAr ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong');
    }
  };

  // Determine icon from notification name/type heuristic
  const iconFor = (name: string) => {
    const n = name?.toLowerCase() ?? '';
    if (n.includes('offer') || n.includes('عرض')) return { Icon: DollarSign, bg: 'bg-orange-50 text-orange-600', bar: 'bg-orange-500' };
    if (n.includes('payment') || n.includes('دفع')) return { Icon: Wallet,    bg: 'bg-green-50 text-green-600',  bar: 'bg-green-500' };
    if (n.includes('meeting') || n.includes('اجتماع')) return { Icon: Bell, bg: 'bg-blue-50 text-blue-600',    bar: 'bg-blue-500'   };
    return { Icon: FileText, bg: 'bg-gray-50 text-gray-500', bar: 'bg-gray-300' };
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-SA') : '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.alerts.title}
        action={
          <button
            onClick={handleMarkAllRead}
            disabled={marking || !userId}
            className="text-sm font-bold text-[#10B981] hover:underline disabled:opacity-50"
          >
            {content.dashboard.alerts.markAllRead}
          </button>
        }
      />

      {loading ? (
        <div className="text-center p-8 text-gray-400">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 font-medium">
          {isAr ? 'لا توجد إشعارات' : 'No notifications yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n: any) => {
            const { Icon, bg, bar } = iconFor(n.name);
            return (
              <div
                key={n.id}
                className={cn(
                  'bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all flex gap-4 items-start relative overflow-hidden',
                  n.isRead ? 'border-gray-100' : 'border-[#10B981]/30'
                )}
              >
                <div className={cn('w-2 h-full absolute right-0 top-0 bottom-0', bar)} />
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', bg)}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#111827] text-lg">{n.name}</h4>
                  <p className="text-gray-500 text-sm mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{fmtDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
