import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User as UserIcon, LogOut, 
  Settings, Menu 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDoctor = user?.role === 'doctor';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return isDoctor ? 'Physician Clinical Triage Hub' : 'Patient Wound Overview';
    if (path.includes('/wounds/new')) return 'Register New Wound Profile';
    if (path.includes('/wounds/')) return 'Wound Monitoring Dossier';
    if (path.includes('/wounds')) return 'Monitored Wounds Directory';
    if (path.includes('/capture')) return 'Capture & Analyze Wound Image';
    if (path.includes('/analysis-result')) return 'AI Analysis Result';
    if (path.includes('/progress')) return 'Longitudinal Progression Analytics';
    if (path.includes('/compare')) return 'Compare Wound Images';
    if (path.includes('/doctors')) return 'Physician Telemedicine Sharing';
    if (path.includes('/doctor/patients')) return 'Assigned Patient Roster';
    if (path.includes('/doctor/review')) return 'Physician Clinical Examination';
    if (path.includes('/doctor/evaluation')) return 'AI Model Validation Benchmarks';
    if (path.includes('/reports')) return 'Clinical Reports Archive';
    if (path.includes('/profile')) return 'Account Profile';
    if (path.includes('/settings')) return 'Application Settings';
    return 'Smart Wound Healing Monitor';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      
      {/* Mobile Menu Trigger & Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <span className="hidden sm:block text-[11px] text-slate-400">
            Computer Vision Assessment • Transparent Biopolymer Dressings
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Profile Dropdown with dynamic user name */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.full_name?.charAt(0) || (isDoctor ? 'D' : 'P')}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 text-xs py-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="font-bold text-slate-900 block truncate">{user?.full_name || 'User'}</span>
                <span className="text-[11px] text-slate-400 block truncate">{user?.email || user?.phone || ''}</span>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <UserIcon size={14} className="text-slate-400" />
                <span>Account Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Settings size={14} className="text-slate-400" />
                <span>Settings & Privacy</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-600 font-bold text-left"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
