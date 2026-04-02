import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../Button';
import { useApp } from '../../../context/AppContext';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; startTime: string; endTime: string }) => void;
}

export const MeetingModal = ({ isOpen, onClose, onSubmit }: MeetingModalProps) => {
  const { language } = useApp();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const isAr = language === 'ar';

  const t = {
    title:        isAr ? 'طلب اجتماع افتراضي' : 'Schedule Virtual Meeting',
    date:         isAr ? 'التاريخ'             : 'Date',
    availability: isAr ? 'وقت التوفر'          : 'Availability',
    from:         isAr ? 'من'                   : 'From',
    to:           isAr ? 'إلى'                  : 'To',
    send:         isAr ? 'إرسال الطلب'          : 'Send Request',
    cancel:       isAr ? 'إلغاء'               : 'Cancel',
    note:         isAr
      ? '* سيتم التواصل معك لتأكيد الموعد خلال 24 ساعة'
      : '* You will be contacted to confirm the appointment within 24 hours',
  };

  const handleSubmit = () => {
    onSubmit({ date, startTime, endTime });
    onClose();
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-colors";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
      <div className="space-y-6">

        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.date}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} dir-ltr`}
          />
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.availability}</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 mb-1 block">{t.from}</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${inputClass} dir-ltr`}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400 mb-1 block">{t.to}</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${inputClass} dir-ltr`}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic">{t.note}</p>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} className="flex-1">{t.send}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">{t.cancel}</Button>
        </div>
      </div>
    </Modal>
  );
};
