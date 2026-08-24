import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAllAsRead, unreadCount } = useNotifications();

  const mockList = [
    {
      id: '1',
      title: 'Your wound image was analyzed',
      subtitle: 'Wound #001 • 20 Aug 2026',
      time: '10:30 AM',
      unread: true
    },
    {
      id: '2',
      title: 'Your image quality was insufficient',
      subtitle: 'Please upload a clearer image for reliable analysis.',
      time: '19 Aug 2026',
      unread: false
    },
    {
      id: '3',
      title: 'Dr. Sarah reviewed your wound',
      subtitle: 'Wound #001 • 18 Aug 2026',
      time: '18 Aug 2026',
      unread: false
    },
    {
      id: '4',
      title: 'New visual change detected',
      subtitle: 'Please review your wound information.',
      time: '16 Aug 2026',
      unread: false
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Notifications
            </h2>
            <p className="text-xs text-slate-400">
              Stay updated with your wound monitoring
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          title="Share"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {mockList.map((n) => (
          <div
            key={n.id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4 hover:border-teal-400 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-teal-600' : 'bg-transparent'}`} />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-xs text-slate-900">{n.title}</h3>
                <p className="text-xs text-slate-500">{n.subtitle}</p>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-medium shrink-0">
              {n.time}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="text-right pt-2">
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs font-bold text-teal-600 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
