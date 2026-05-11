import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { useApp } from '../../../context/AppContext';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; startTime: string; endTime: string }) => void;
}

/**
 * Returns the allowed 30-minute time slots for a given date string (YYYY-MM-DD).
 * Business hours (Saudi time):
 *   Sunday–Friday  → 16:30 – 23:00
 *   Saturday       → 14:00 – 23:00
 */
function getAllowedSlots(dateStr: string): string[] {
  if (!dateStr) return [];
  // Parse as local midnight to get the correct day-of-week
  const day = new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun … 6=Sat
  const isSat = day === 6;
  let h = isSat ? 14 : 16;
  let m = isSat ? 0  : 30;
  const slots: string[] = [];
  // Generate up to and including 23:00
  while (h < 23 || (h === 23 && m === 0)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
}

// Minimum date: today (no past dates)
const todayISO = (): string => new Date().toISOString().split('T')[0];

export const MeetingModal = ({ isOpen, onClose, onSubmit }: MeetingModalProps) => {
  const { language } = useApp();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const isAr = language === 'ar';

  const t = {
    title:        isAr ? 'طلب اجتماع افتراضي'                               : 'Schedule Virtual Meeting',
    date:         isAr ? 'التاريخ'                                           : 'Date',
    availability: isAr ? 'وقت التوفر'                                        : 'Availability',
    from:         isAr ? 'من'                                                : 'From',
    to:           isAr ? 'إلى'                                               : 'To',
    send:         isAr ? 'إرسال'                                             : 'Send',
    cancel:       isAr ? 'إلغاء'                                             : 'Cancel',
    note:         isAr
      ? '* أوقات العمل: الأحد–الجمعة ٤:٣٠م–١١م | السبت ٢م–١١م'
      : '* Business hours: Sun–Fri 4:30 PM–11 PM | Sat 2 PM–11 PM',
    selectSlot:   isAr ? 'اختر الوقت'                                        : 'Select time',
  };

  // Slots for the currently selected date
  const slots = getAllowedSlots(date);

  // End-time options: only slots strictly after the selected start time
  const endSlots = startTime ? slots.filter(s => s > startTime) : slots;

  // When date changes, clear start/end if they're no longer valid for the new day
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const newSlots = getAllowedSlots(newDate);
    if (startTime && !newSlots.includes(startTime)) { setStartTime(''); setEndTime(''); }
    else if (endTime && !newSlots.filter(s => s > startTime).includes(endTime)) { setEndTime(''); }
  };

  const canSubmit = date.trim() !== '' && startTime !== '' && endTime !== '' && endTime > startTime;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ date, startTime, endTime });
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-colors";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
      <div className="space-y-6">

        {/* Date — min = today */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.date}</label>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`${inputClass} dir-ltr`}
          />
        </div>

        {/* Time slots — constrained to business hours, date-aware */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.availability}</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 mb-1 block">{t.from}</span>
              <select
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setEndTime(''); }}
                disabled={!date}
                className={`${inputClass} dir-ltr appearance-none cursor-pointer disabled:opacity-40`}
              >
                <option value="">{t.selectSlot}</option>
                {/* Start time: all slots except the last (23:00) — user must have at least 30 min */}
                {slots.filter(s => s < '23:00').map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs text-gray-400 mb-1 block">{t.to}</span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime}
                className={`${inputClass} dir-ltr appearance-none cursor-pointer disabled:opacity-40`}
              >
                <option value="">{t.selectSlot}</option>
                {endSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic">{t.note}</p>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} className="flex-1" disabled={!canSubmit}>{t.send}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">{t.cancel}</Button>
        </div>
      </div>
    </Modal>
  );
};
