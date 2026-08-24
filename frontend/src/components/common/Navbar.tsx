import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, Shield, Bell, User as UserIcon, LogOut, 
  Camera, Stethoscope, FileText, CheckCircle2, ChevronDown, 
  Layers, BarChart2, Menu, X, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const isDoctor = user?.role === 'doctor';

  const patientNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'AI Vision Lab', path: '/lab', icon: Sparkles },
    { name: 'Progress Analytics', path: '/progress', icon: BarChart2 },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const doctorNavLinks = [
    { name: 'Clinical Dashboard', path: '/doctor/dashboard', icon: Activity },
    { name: 'AI Vision Lab', path: '/lab', icon: Sparkles },
    { name: 'Patient Triage', path: '/doctor/patients', icon: Stethoscope },
    { name: 'AI Model Validation', path: '/doctor/evaluation', icon: Layers },
    { name: 'Reports Hub', path: '/reports', icon: FileText },
  ];

  const currentNavLinks = isDoctor ? doctorNavLinks : patientNavLinks;

  const handleRoleToggle = async () => {
    setIsSwitchingRole(true);
    try {
      if (isDoctor) {
        await demoLogin('patient');
        navigate('/dashboard');
      } else {
        await demoLogin('doctor');
        navigate('/doctor/dashboard');
      }
    } finally {
      setIsSwitchingRole(false);
      setShowUserMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <Link to={user ? (isDoctor ? '/doctor/dashboard' : '/dashboard') : '/landing'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Activity size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-teal-900 to-slate-800 bg-clip-text text-transparent block leading-tight">
                  HEAL VISION AI
                </span>
                <span className="text-[10px] text-teal-600 font-semibold tracking-wider uppercase block">
                  Biopolymer Wound Monitor
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {currentNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* 1-Click Role Switcher Demo Badge */}
                <button
                  onClick={handleRoleToggle}
                  disabled={isSwitchingRole}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isDoctor
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title="Click to switch between Patient and Doctor view in Demo Mode"
                >
                  <Sparkles size={13} className={isDoctor ? 'text-indigo-600' : 'text-emerald-600'} />
                  <span>Role: {isDoctor ? 'Doctor Mode (Dr. Chen)' : 'Patient Mode (Sarah)'}</span>
                  <span className="text-[10px] opacity-70 underline ml-0.5">Switch</span>
                </button>

                {/* Notifications Drawer Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-teal-600" />
                          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                                !notif.is_read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.is_read ? 'bg-teal-500' : 'bg-slate-300'}`} />
                                <div className="space-y-0.5 flex-1">
                                  <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                                    <span>{notif.title}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-snug">{notif.message}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                      alt={user.full_name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300"
                    />
                    <div className="hidden lg:block text-left">
                      <span className="text-xs font-semibold text-slate-800 block leading-tight">
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize block leading-tight">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-800">{user.full_name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={handleRoleToggle}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-left transition-colors font-medium"
                        >
                          <Sparkles size={15} className="text-teal-600" />
                          <span>Switch to {isDoctor ? 'Patient View' : 'Doctor View'}</span>
                        </button>
                      </div>

                      <div className="p-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors font-medium"
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Doctor / Patient Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all shadow-teal-500/20"
                >
                  Start Monitoring
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Menu Slide-out */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 px-1 border-b border-slate-100 mb-2">
            <button
              onClick={handleRoleToggle}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold"
            >
              <span>Current Role: {user.role.toUpperCase()}</span>
              <span className="underline">Switch Role</span>
            </button>
          </div>
          {currentNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
