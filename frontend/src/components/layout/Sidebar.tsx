import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Layers, Camera, BarChart2, 
  Users, FileText, Settings, User as UserIcon, 
  LogOut, Activity, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isDoctor = user?.role === 'doctor';

  const patientNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Wounds', path: '/wounds', icon: Layers },
    { label: 'Capture Image', path: '/capture', icon: Camera },
    { label: 'Progress', path: '/progress', icon: BarChart2 },
    { label: 'Doctors', path: '/doctors', icon: Users },
    { label: 'Reports', path: '/reports', icon: FileText },
  ];

  const doctorNavItems = [
    { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/doctor/patients', icon: Users },
    { label: 'Evaluations', path: '/doctor/evaluation', icon: Award },
    { label: 'Reports', path: '/reports', icon: FileText },
  ];

  const navItems = isDoctor ? doctorNavItems : patientNavItems;

  const bottomItems = [
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none shrink-0">
      
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity size={18} />
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block leading-none">
              Smart Wound
            </span>
            <span className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider block mt-0.5">
              Healing Monitor
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && item.path !== '/doctor/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Settings Navigation */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
};
