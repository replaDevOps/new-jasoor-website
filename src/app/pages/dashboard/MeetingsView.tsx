import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_SENT_MEETINGS, GET_RECEIVED_MEETINGS, GET_SCHEDULED_MEETINGS } from '../../../graphql/queries/dashboard';
import { useMutation } from '@apollo/client';
import { UPDATE_MEETING, APPROVE_MEETING, REJECT_MEETING } from '../../../graphql/mutations/dashboard';
import { toast } from 'sonner';
import { DashBadge, SectionHeader, DashModal } from './DashboardView';

export const MeetingsView = () => {
  const { content, language, direction, userId } = useApp();
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<'all' | 'scheduled' | 'past'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes]           = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

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

  const { data: sentData,     loading: sentLoading,     refetch: refetchSent     } = useQuery(GET_SENT_MEETINGS,     { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const { data: receivedData, loading: receivedLoading, refetch: refetchReceived } = useQuery(GET_RECEIVED_MEETINGS, { variables: { limit: 50, offSet: 0 }, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });

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
  const handleAcceptMeeting = async (meetingId: string) => {
    if (!acceptDate) { toast.error(isAr ? 'يرجى اختيار التاريخ' : 'Please select a date'); return; }
    const iso = new Date(acceptDate).toISOString();
    const { errors } = await updateMeeting({
      variables: { input: { id: meetingId, receiverAvailabilityDate: iso } },
    });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم قبول طلب الاجتماع — بانتظار موافقة الإدارة' : 'Meeting accepted — awaiting admin approval');
    setAcceptDate('');
    refetch();
  };

  const handleRejectMeeting = async (meetingId: string) => {
    const { errors } = await rejectMeeting({ variables: { rejectMeetingId: meetingId } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم رفض الاجتماع' : 'Meeting rejected');
    refetch();
  };

  const otherParty = (m: any) =>
    m._role === 'sent' ? (m.requestedTo?.name ?? '—') : (m.requestedBy?.name ?? '—');

  // Effective status: if meeting is READY but end time has passed → show as COMPLETED
  const effectiveStatus = (m: any): string => {
    if (m.status === 'READY' && m.requestedEndDate) {
      const endTime = new Date(m.requestedEndDate).getTime();
      if (Date.now() > endTime) return 'COMPLETED';
    }
    return m.status;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

    {/* ── Admin Panel: only shown when backend returns scheduled meetings (admin role only) ── */}
    {isAdminUser && adminMeetings.length > 0 && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="font-bold text-amber-800 text-base">
            {isAr ? `اجتماعات تنتظر موافقة الإدارة (${adminMeetings.length})` : `Meetings Awaiting Admin Approval (${adminMeetings.length})`}
          </h3>
        </div>
        <div className="space-y-3">
          {adminMeetings.map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl p-4 border border-amber-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1 min-w-0">
                <p className="font-bold text-[#111827] text-sm truncate">{m.business?.businessTitle ?? '—'}</p>
                <p className="text-xs text-gray-500">{m.requestedBy?.name ?? '—'} → {m.requestedTo?.name ?? '—'}</p>
                <p className="text-xs text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-GB') : '—'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await approveMeeting({ variables: { meetingId: m.id, offerId: m.offer?.id } });
                      toast.success(isAr ? 'تمت الموافقة على الاجتماع' : 'Meeting approved');
                      refetch();
                    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                  }}
                  className="px-4 py-2 bg-[#10B981] text-white text-xs font-bold rounded-lg hover:bg-[#008A66] transition-colors"
                >
                  {isAr ? 'موافقة' : 'Approve'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await rejectMeeting({ variables: { rejectMeetingId: m.id } });
                      toast.success(isAr ? 'تم رفض الاجتماع' : 'Meeting rejected');
                      refetch();
                    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                >
                  {isAr ? 'رفض' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

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
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{isAr ? 'الإدراج' : 'Listing'}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">{isAr ? 'الدور' : 'Role'}</th>
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
                      <span className={cn('text-xs font-bold px-2 py-1 rounded-full', m._role === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700')}>
                        {m._role === 'sent' ? (isAr ? 'مُرسل' : 'Sent') : (isAr ? 'مستلم' : 'Received')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#111827]">{fmtDate(m.requestedDate ?? m.receiverAvailabilityDate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
            {/* Sent PENDING — awaiting the other party's response */}
            {selected._role === 'sent' && selected.status === 'PENDING' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                <span className="text-blue-500 font-bold text-lg leading-none">⏳</span>
                <p className="text-sm text-blue-700 font-medium">
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
                  onChange={e => setAcceptDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:border-[#10B981] text-sm bg-white"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptMeeting(selected.id)}
                    disabled={!acceptDate}
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

            {/* Admin approval notice for SCHEDULED meetings */}
            {selected.status === 'SCHEDULED' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                <span className="text-blue-500 font-bold text-lg leading-none">ⓘ</span>
                <p className="text-sm text-blue-700 font-medium">
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
