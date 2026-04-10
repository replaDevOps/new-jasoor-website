import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Video, AlertCircle } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_SENT_MEETINGS, GET_RECEIVED_MEETINGS, GET_SCHEDULED_MEETINGS } from '../../../graphql/queries/dashboard';
import { useMutation } from '@apollo/client';
import { UPDATE_MEETING, APPROVE_MEETING, REJECT_MEETING } from '../../../graphql/mutations/dashboard';
import { toast } from 'sonner';
import { DashBadge, SectionHeader, DashModal } from './DashboardView';

// Helper: generate time slots for given day of week
// Sunday(0)-Thursday(4): 16:30-23:00, Friday(5)-Saturday(6): 14:00-23:00, every 30 min
const getTimeSlots = (dateStr: string): { value: string; label: string }[] => {
  if (!dateStr) return [];
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  let startHour = dayOfWeek >= 0 && dayOfWeek <= 4 ? 16 : 14; // Sun-Thu: 16:30, Fri-Sat: 14:00
  const startMin = dayOfWeek >= 0 && dayOfWeek <= 4 ? 30 : 0;
  const endHour = 23;

  const slots: { value: string; label: string }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = startMin; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({
        value: timeStr,
        label: `${String(displayH).padStart(2, '0')}:${mm} ${period}`,
      });
    }
    if (startMin === 30) startMin = 0; // Reset for next hour
  }
  return slots;
};

export const MeetingsView = ({ onNavigate }: { onNavigate?: (view: string, id?: string) => void }) => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<'all' | 'scheduled' | 'past'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes]           = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // P6-FIX R-04: real meetings data
  // Admin: fetch all SCHEDULED meetings needing approval
  // Only admins get results from getScheduledMeetings — regular users get empty array
  const { data: scheduledData, refetch: refetchScheduled } = useQuery(GET_SCHEDULED_MEETINGS, {
    variables: { limit: 50, offSet: 0 },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const adminMeetings = scheduledData?.getScheduledMeetings?.items ?? [];
  // isAdmin: true if backend returned meetings via getScheduledMeetings
  // (only admin role gets non-empty results from this resolver)
  const isAdminUser = adminMeetings.length > 0;

  const { data: sentData,     loading: sentLoading,     refetch: refetchSent,     error: sentError     } = useQuery(GET_SENT_MEETINGS,     { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const { data: receivedData, loading: receivedLoading, refetch: refetchReceived, error: receivedError } = useQuery(GET_RECEIVED_MEETINGS, { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const queryError = sentError || receivedError;

  const [updateMeeting]   = useMutation(UPDATE_MEETING,   { errorPolicy: 'all' });
  const [approveMeeting]  = useMutation(APPROVE_MEETING,  { errorPolicy: 'all' });
  const [rejectMeeting]   = useMutation(REJECT_MEETING,   { errorPolicy: 'all' });

  const refetch = () => { refetchSent(); refetchReceived(); refetchScheduled(); };

  // Merge sent + received, deduplicate, tag with role
  const sentMeetings     = (sentData?.getMySentMeetingRequests?.items     ?? []).map((m: any) => ({ ...m, _role: 'sent'     }));
  const receivedMeetings = (receivedData?.getReceivedMeetingRequests?.items ?? []).map((m: any) => ({ ...m, _role: 'received' }));
  const seen = new Set<string>();
  const rawMeetings = [...sentMeetings, ...receivedMeetings].filter((m: any) => {
    if (seen.has(m.id)) return false; seen.add(m.id); return true;
  });

  const loading = sentLoading || receivedLoading;

  // Effective status: if meeting is READY but end time has passed → show as COMPLETED
  // Must be declared before `filtered` and table render (used in both)
  const effectiveStatus = (m: any): string => {
    if (m.status === 'READY' && m.requestedEndDate) {
      const endTime = new Date(m.requestedEndDate).getTime();
      if (Date.now() > endTime) return 'COMPLETED';
    }
    return m.status;
  };

  const filtered = filter === 'all'
    ? rawMeetings
    : rawMeetings.filter((m: any) => {
        const es = effectiveStatus(m);
        if (filter === 'scheduled') return ['PENDING', 'SCHEDULED', 'READY'].includes(es);
        return ['COMPLETED', 'REJECTED'].includes(es);
      });

  const selected = rawMeetings.find((m: any) => m.id === selectedId);

  const statusColor = (s: string) => {
    if (s === 'READY')      return 'green';
    if (s === 'SCHEDULED')  return 'blue';   // awaiting admin approval
    if (s === 'PENDING')    return 'yellow';
    if (s === 'REJECTED')   return 'red';
    if (s === 'COMPLETED')  return 'gray';
    return 'gray';
  };

  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      PENDING:   isAr ? 'قيد الانتظار' : 'Pending Confirmation',
      SCHEDULED: isAr ? 'بانتظار موافقة الإدارة' : 'Awaiting Admin Approval',
      READY:     isAr ? 'مؤكد' : 'Confirmed',
      COMPLETED: isAr ? 'مكتمل' : 'Completed',
      REJECTED:  isAr ? 'مرفوض' : 'Rejected',
    };
    return m[s] ?? s;
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB') : '—';
  const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString(isAr ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

  // ── Meeting Status Flow ────────────────────────────────────────────────────
  // PENDING    → Buyer sent request, waiting for seller/receiver to confirm
  // SCHEDULED  → Receiver confirmed (set availability date), waiting for ADMIN to approve
  // READY      → Admin approved + added meeting link, both parties can join
  // COMPLETED  → Meeting happened
  // REJECTED   → Rejected by receiver OR by admin
  //
  // User actions:
  //   Receiver on PENDING  → Accept (sets date) → becomes SCHEDULED
  //   Receiver on PENDING  → Reject → becomes REJECTED
  //   Admin on SCHEDULED   → Approve → becomes READY
  //   Admin on SCHEDULED   → Reject → becomes REJECTED
  // ────────────────────────────────────────────────────────────────────────────
  // Receiver accepts a PENDING meeting → sets availability date → status becomes SCHEDULED
  const [acceptDate, setAcceptDate] = useState('');
  const [acceptSlot, setAcceptSlot] = useState('');
  const acceptTimeSlots = getTimeSlots(acceptDate);

  const handleAcceptMeeting = async (meetingId: string) => {
    if (!acceptDate || !acceptSlot) {
      toast.error(isAr ? 'يرجى اختيار التاريخ والوقت' : 'Please select date and time');
      return;
    }

    // Convert slot time (HH:MM) to ISO datetime, accounting for Saudi time (UTC+3)
    const [h, m] = acceptSlot.split(':').map(Number);
    const dt = new Date(acceptDate + 'T00:00:00');
    dt.setHours(h - 3, m, 0, 0); // subtract 3 for UTC+3 → UTC
    const iso = dt.toISOString();

    const { errors } = await updateMeeting({
      variables: { input: { id: meetingId, receiverAvailabilityDate: iso } },
    });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم قبول طلب الاجتماع — بانتظار موافقة الإدارة' : 'Meeting accepted — awaiting admin approval');
    setAcceptDate('');
    setAcceptSlot('');
    refetch();
  };

  const handleRejectMeeting = async (meetingId: string) => {
    const { errors } = await rejectMeeting({ variables: { rejectMeetingId: meetingId } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم رفض الاجتماع' : 'Meeting rejected');
    refetch();
  };

  const handleReschedule = async (meetingId: string) => {
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error(isAr ? 'يرجى اختيار التاريخ والوقت' : 'Please select date and time');
      return;
    }

    // Convert slot time (HH:MM) to ISO datetime, accounting for Saudi time (UTC+3)
    const [h, m] = rescheduleSlot.split(':').map(Number);
    const dt = new Date(rescheduleDate + 'T00:00:00');
    dt.setHours(h - 3, m, 0, 0); // subtract 3 for UTC+3 → UTC
    const newIso = dt.toISOString();

    const { errors } = await updateMeeting({
      variables: { input: { id: meetingId, receiverAvailabilityDate: newIso } },
    });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم إعادة جدولة الاجتماع' : 'Meeting rescheduled');
    setRescheduleMode(false);
    setRescheduleDate('');
    setRescheduleSlot('');
    refetch();
  };

  const otherParty = (m: any) =>
    m._role === 'sent' ? (m.requestedTo?.name ?? '—') : (m.requestedBy?.name ?? '—');

  const rescheduleTimeSlots = getTimeSlots(rescheduleDate);

  // F-14: find READY meetings starting within 24 hours
  const upcomingReminders = rawMeetings.filter((m: any) => {
    if (effectiveStatus(m) !== 'READY') return false;
    const meetingTime = new Date(m.requestedDate ?? m.receiverAvailabilityDate).getTime();
    const now = Date.now();
    const diff = meetingTime - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000; // within 24h, not yet passed
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* F-11: Error banner */}
      {queryError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{isAr ? 'تعذر تحميل الاجتماعات، يرجى المحاولة مجدداً' : 'Could not load meetings. Please try again.'}</span>
          <button onClick={() => { refetchSent(); refetchReceived(); }} className="mr-auto ml-2 text-xs font-bold underline">{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}
      {/* F-14: 24h meeting reminder banners */}
      {upcomingReminders.map((m: any) => {
        const meetingTime = new Date(m.requestedDate ?? m.receiverAvailabilityDate);
        const hoursLeft = Math.ceil((meetingTime.getTime() - Date.now()) / (60 * 60 * 1000));
        return (
          <div key={m.id} className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium">
            <span className="text-lg leading-none">⏰</span>
            <span>
              {isAr
                ? `تذكير: لديك اجتماع مع ${otherParty(m)} بعد ${hoursLeft} ساعة — ${fmtDate(m.requestedDate ?? m.receiverAvailabilityDate)} ${fmtTime(m.requestedDate ?? m.receiverAvailabilityDate)}`
                : `Reminder: You have a meeting with ${otherParty(m)} in ${hoursLeft}h — ${fmtDate(m.requestedDate ?? m.receiverAvailabilityDate)} ${fmtTime(m.requestedDate ?? m.receiverAvailabilityDate)}`}
            </span>
            {m.meetingLink && (
              <a href={m.meetingLink} target="_blank" rel="noopener noreferrer"
                className="mr-auto ml-2 text-xs font-bold underline whitespace-nowrap">
                {isAr ? 'انضم الآن' : 'Join Now'}
              </a>
            )}
          </div>
        );
      })}

      <SectionHeader
        title={content.dashboard.meetings.title}
        action={
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            <button onClick={() => setFilter('all')}       className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'all'       ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.all}</button>
            <button onClick={() => setFilter('scheduled')} className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'scheduled' ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.scheduled}</button>
            <button onClick={() => setFilter('past')}      className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap', filter === 'past'      ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}>{content.dashboard.meetings.filters.past}</button>
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
                  <th className="hidden md:table-cell px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{isAr ? 'الإدراج' : 'Listing'}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.meetingDate}</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.status}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{content.dashboard.meetings.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E6F3EF] text-[#10B981] flex items-center justify-center font-bold text-xs">
                          {otherParty(m).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#111827]">{otherParty(m)}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      {/* F-T1: Clickable listing title → navigate to business details */}
                      <button
                        onClick={() => onNavigate?.('details', m.business?.id)}
                        className="text-sm text-gray-600 hover:text-[#10B981] hover:underline transition-colors font-medium text-left"
                      >
                        {m.business?.businessTitle}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-sm">
                        <span className="font-bold text-[#111827]">{fmtDate(m.requestedDate ?? m.receiverAvailabilityDate)}</span>
                        <span className="text-xs text-gray-500">{fmtTime(m.requestedDate ?? m.receiverAvailabilityDate)}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <DashBadge color={statusColor(effectiveStatus(m))}>{statusLabel(effectiveStatus(m))}</DashBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => { setSelectedId(m.id); setNotes(m.notes ?? ''); }} className="text-[#10B981] hover:text-[#008A66] font-bold text-sm flex items-center gap-1">
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

      <DashModal isOpen={!!selected} onClose={() => { setSelectedId(null); setRescheduleMode(false); }} title={content.dashboard.meetings.actions.viewDetails}>
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
                <div className="text-right">
                  <div className="font-bold text-[#111827]">{fmtDate(selected.requestedDate ?? selected.receiverAvailabilityDate)}</div>
                  <div className="text-sm text-gray-500">{fmtTime(selected.requestedDate ?? selected.receiverAvailabilityDate)}</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium">{content.dashboard.meetings.table.status}</span>
                <DashBadge color={statusColor(effectiveStatus(selected))}>{statusLabel(effectiveStatus(selected))}</DashBadge>
              </div>
              {/* F-13: Rejection reason */}
              {effectiveStatus(selected) === 'REJECTED' && selected.rejectionReason && (
                <div className="flex justify-between items-start py-3 border-b border-gray-50">
                  <span className="text-gray-500 font-medium shrink-0">{isAr ? 'سبب الرفض' : 'Rejection Reason'}</span>
                  <span className="text-red-600 text-sm font-medium text-right max-w-[60%]">{selected.rejectionReason}</span>
                </div>
              )}
              {selected.meetingLink && (
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">{content.dashboard.meetings.table.meetingLink}</span>
                  <a href={selected.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline flex items-center gap-1 text-sm font-bold">
                    <Video size={16} />Zoom Link
                  </a>
                </div>
              )}
            </div>

            {/* Action buttons based on status */}
            {effectiveStatus(selected) === 'READY' && selected.meetingLink && (
              <button
                onClick={() => window.open(selected.meetingLink, '_blank')}
                className="w-full py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66] flex items-center justify-center gap-2"
              >
                <Video size={18} />{isAr ? 'دخول الاجتماع' : 'Join Meeting'}
              </button>
            )}

            {(effectiveStatus(selected) === 'SCHEDULED' || effectiveStatus(selected) === 'READY') && !rescheduleMode && (
              <button
                onClick={() => setRescheduleMode(true)}
                className="w-full py-3 rounded-xl border border-gray-300 text-[#111827] font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Calendar size={18} />{isAr ? 'إعادة الجدولة' : 'Reschedule'}
              </button>
            )}

            {/* Reschedule form */}
            {rescheduleMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-amber-800">{isAr ? 'اختر التاريخ والوقت الجديد' : 'Select new date and time'}</p>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => { setRescheduleDate(e.target.value); setRescheduleSlot(''); }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                {rescheduleDate && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isAr ? 'الوقت' : 'Time'}</label>
                    <select value={rescheduleSlot} onChange={e => setRescheduleSlot(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:border-[#10B981]">
                      <option value="">{isAr ? 'اختر الوقت' : 'Select time'}</option>
                      {rescheduleTimeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setRescheduleMode(false); setRescheduleDate(''); setRescheduleSlot(''); }}
                    className="flex-1 py-3 rounded-xl border border-amber-300 text-amber-800 font-bold hover:bg-amber-100"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleReschedule(selected.id)}
                    disabled={!rescheduleDate || !rescheduleSlot}
                    className="flex-1 py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#008A66] disabled:opacity-50"
                  >
                    {isAr ? 'تأكيد' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            {/* Sent PENDING — awaiting the other party's response */}
            {selected._role === 'sent' && selected.status === 'PENDING' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <span className="text-amber-500 font-bold text-lg leading-none">⏳</span>
                <p className="text-sm text-amber-700 font-medium">
                  {isAr ? 'في انتظار رد الطرف الآخر على طلب الاجتماع.' : 'Waiting for the other party to respond to your meeting request.'}
                </p>
              </div>
            )}

            {/* Accept / Reject — only shown for PENDING received meetings */}
            {selected._role === 'received' && selected.status === 'PENDING' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-amber-800">
                  {isAr ? 'طلب اجتماع جديد — اختر تاريخ توفرك للرد' : 'New meeting request — choose your available date to respond'}
                </p>
                <input
                  type="date"
                  value={acceptDate}
                  onChange={e => { setAcceptDate(e.target.value); setAcceptSlot(''); }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:border-[#10B981] text-sm bg-white"
                />
                {acceptDate && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isAr ? 'الوقت' : 'Time'}</label>
                    <select value={acceptSlot} onChange={e => setAcceptSlot(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:border-[#10B981]">
                      <option value="">{isAr ? 'اختر الوقت' : 'Select time'}</option>
                      {acceptTimeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptMeeting(selected.id)}
                    disabled={!acceptDate || !acceptSlot}
                    className="flex-1 bg-[#10B981] text-white py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-50"
                  >
                    {isAr ? 'قبول الاجتماع' : 'Accept Meeting'}
                  </button>
                  <button
                    onClick={() => handleRejectMeeting(selected.id)}
                    className="flex-1 bg-white border border-red-300 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors"
                  >
                    {isAr ? 'رفض' : 'Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* Admin approval buttons */}
            {isAdminUser && effectiveStatus(selected) === 'SCHEDULED' && (
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await approveMeeting({ variables: { meetingId: selected.id, offerId: selected.offer?.id } });
                      toast.success(isAr ? 'تمت الموافقة على الاجتماع' : 'Meeting approved');
                      refetch();
                      setSelectedId(null);
                    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                  }}
                  className="flex-1 px-4 py-3 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#008A66] transition-colors"
                >
                  {isAr ? 'موافقة' : 'Approve'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await rejectMeeting({ variables: { rejectMeetingId: selected.id } });
                      toast.success(isAr ? 'تم رفض الاجتماع' : 'Meeting rejected');
                      refetch();
                      setSelectedId(null);
                    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                  }}
                  className="flex-1 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  {isAr ? 'رفض' : 'Reject'}
                </button>
              </div>
            )}

            {/* Admin approval notice for SCHEDULED meetings */}
            {!isAdminUser && selected.status === 'SCHEDULED' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <span className="text-amber-500 font-bold text-lg leading-none">ⓘ</span>
                <p className="text-sm text-amber-700 font-medium">
                  {isAr
                    ? 'تم تأكيد الاجتماع من الطرفين — بانتظار موافقة الإدارة لتحديد الرابط.'
                    : 'Both parties confirmed — awaiting admin approval to schedule the meeting link.'}
                </p>
              </div>
            )}

            {/* Ready notice */}
            {selected.status === 'READY' && selected.meetingLink && (
              <div className="bg-green-50 border border-[#10B981] rounded-xl p-4 flex gap-3 items-start">
                <span className="text-[#10B981] font-bold text-lg leading-none">✓</span>
                <div>
                  <p className="text-sm font-bold text-[#004E39] mb-1">
                    {isAr ? 'تمت الموافقة — الاجتماع جاهز' : 'Approved — Meeting is ready'}
                  </p>
                  <a href={selected.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="text-[#008A66] underline text-sm font-bold">
                    {isAr ? 'انضم للاجتماع' : 'Join Meeting'}
                  </a>
                </div>
              </div>
            )}

            {/* Notes — shown for all meetings, editable, saves on blur */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isAr ? 'ملاحظات الاجتماع' : 'Meeting Notes'}
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={async () => {
                  if (!selected) return;
                  setSavingNotes(true);
                  await updateMeeting({ variables: { input: { id: selected.id, notes } } });
                  setSavingNotes(false);
                }}
                placeholder={isAr ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm resize-none transition-colors"
              />
              {savingNotes && (
                <p className="text-xs text-gray-400 mt-1">{isAr ? 'جارٍ الحفظ...' : 'Saving...'}</p>
              )}
            </div>
          </div>
        )}
      </DashModal>
    </div>
  );
};
