import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_SENT_MEETINGS, GET_RECEIVED_MEETINGS } from '../../../graphql/queries/dashboard';
import { DashBadge, SectionHeader, DashModal } from './DashboardView';

export const MeetingsView = () => {
  const { content, language, direction } = useApp();
  const isAr = language === 'ar';

  const [tab, setTab]   = useState<'sent' | 'received'>('received');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'past'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // P6-FIX R-04: real meetings data
  const { data: sentData,     loading: sentLoading     } = useQuery(GET_SENT_MEETINGS,     { variables: { limit: 50, offSet: 0 }, errorPolicy: 'all' });
  const { data: receivedData, loading: receivedLoading } = useQuery(GET_RECEIVED_MEETINGS, { variables: { limit: 50, offSet: 0 }, errorPolicy: 'all' });

  const rawMeetings = tab === 'sent'
    ? (sentData?.getMySentMeetingRequests?.items ?? [])
    : (receivedData?.getReceivedMeetingRequests?.items ?? []);

  const loading = tab === 'sent' ? sentLoading : receivedLoading;

  const filtered = filter === 'all'
    ? rawMeetings
    : rawMeetings.filter((m: any) =>
        filter === 'scheduled'
          ? ['SCHEDULED', 'PENDING', 'READY'].includes(m.status)
          : ['COMPLETED', 'REJECTED'].includes(m.status)
      );

  const selected = rawMeetings.find((m: any) => m.id === selectedId);

  const statusColor = (s: string) => {
    if (['SCHEDULED', 'READY'].includes(s)) return 'green';
    if (s === 'PENDING') return 'yellow';
    if (s === 'REJECTED') return 'red';
    return 'gray';
  };

  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      SCHEDULED: content.dashboard.meetings.status.scheduled,
      PENDING:   isAr ? 'قيد الانتظار' : 'Pending',
      READY:     isAr ? 'جاهز' : 'Ready',
      COMPLETED: content.dashboard.meetings.status.past,
      REJECTED:  isAr ? 'مرفوض' : 'Rejected',
    };
    return m[s] ?? s;
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-SA') : '—';

  const otherParty = (m: any) =>
    tab === 'sent' ? (m.requestedTo?.name ?? '—') : (m.requestedBy?.name ?? '—');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title={content.dashboard.meetings.title}
        action={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Sent / Received toggle */}
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              <button onClick={() => setTab('received')} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', tab === 'received' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{isAr ? 'المستلمة' : 'Received'}</button>
              <button onClick={() => setTab('sent')}     className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', tab === 'sent'     ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{isAr ? 'المُرسلة' : 'Sent'}</button>
            </div>
            {/* Status filter */}
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              <button onClick={() => setFilter('all')}       className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'all'       ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.all}</button>
              <button onClick={() => setFilter('scheduled')} className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'scheduled' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.scheduled}</button>
              <button onClick={() => setFilter('past')}      className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'past'      ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.past}</button>
            </div>
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
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.otherParty}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{isAr ? 'الإدراج' : 'Listing'}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.meetingDate}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.status}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {otherParty(m).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#111827]">{otherParty(m)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{m.business?.businessTitle}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#111827]">{fmtDate(m.requestedDate ?? m.receiverAvailabilityDate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DashBadge color={statusColor(m.status)}>{statusLabel(m.status)}</DashBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => setSelectedId(m.id)} className="text-[#10B981] hover:text-[#008A66] font-bold text-sm flex items-center gap-1">
                        {content.dashboard.meetings.actions.viewDetails}
                        {direction === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">{content.dashboard.meetings.empty}</div>
            )}
          </div>
        )}
      </div>

      <DashModal isOpen={!!selected} onClose={() => setSelectedId(null)} title={content.dashboard.meetings.actions.viewDetails}>
        {selected && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xl">
                {otherParty(selected).charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-[#111827] text-lg">{otherParty(selected)}</h4>
                <p className="text-gray-500 text-sm">{selected.business?.businessTitle}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium">{content.dashboard.meetings.table.meetingDate}</span>
                <span className="font-bold text-[#111827]">{fmtDate(selected.requestedDate ?? selected.receiverAvailabilityDate)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium">{content.dashboard.meetings.table.status}</span>
                <DashBadge color={statusColor(selected.status)}>{statusLabel(selected.status)}</DashBadge>
              </div>
              {selected.meetingLink && (
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">{content.dashboard.meetings.table.meetingLink}</span>
                  <a href={selected.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-bold">
                    <Video size={16} />Zoom Link
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </DashModal>
    </div>
  );
};
