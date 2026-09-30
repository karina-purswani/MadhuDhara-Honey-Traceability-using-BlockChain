import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { LanguageCode } from '../../shared/types';
import { 
  Bell, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuthModal }) => {
  const { currentUser, role, isAuthenticated, isBeekeeper, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { notifications, alerts } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const activeAlertsCount = alerts.filter((a) => !a.isAcknowledged).length;

  // Build role-specific navigation links
  let navLinks: { id: string; label: string }[] = [];

  if (isBeekeeper) {
    navLinks = [
      { id: 'dashboard', label: t('navDashboard') },
      { id: 'hives', label: t('navHives') },
      { id: 'alerts', label: `${t('navAlerts')}${activeAlertsCount > 0 ? ` (${activeAlertsCount})` : ''}` },
      { id: 'batches', label: t('navBatches') },
      { id: 'marketplace', label: t('navMarketplace') },
      { id: 'learning', label: t('navLearning') },
      { id: 'tickets', label: t('navTickets') },
      { id: 'profit', label: t('navProfitCalc') },
    ];
  } else if (isAdmin) {
    navLinks = [
      { id: 'admin', label: t('navigation.admin') },
      { id: 'beekeepers', label: t('navigation.beekeepers') },
      { id: 'batches', label: t('navigation.allBatches') },
      { id: 'tickets', label: t('navigation.supportDesk') },
      { id: 'learning', label: t('navigation.learningAdmin') },
      { id: 'marketplace', label: t('navigation.marketplace') },
      { id: 'verify', label: t('navigation.verify') },
    ];
  } else {
    // Public Consumer
    navLinks = [
      { id: 'verify', label: t('navigation.verify') },
      { id: 'marketplace', label: t('navigation.marketplace') },
    ];
  }

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: MadhuDhara Logo and Brand Wordmark */}
          <div className="flex items-center shrink-0 pr-6 mr-4 lg:mr-6 border-r border-stone-200">
            <button
              onClick={() => setCurrentTab(isAuthenticated ? (isBeekeeper ? 'dashboard' : 'admin') : 'verify')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="MadhuDhara"
                className="h-9 w-auto max-w-[42px] object-contain shrink-0"
              />
              <span className="text-xl font-bold tracking-tight text-[#25211D] font-serif group-hover:text-[#7A4B24] transition-colors whitespace-nowrap">
                {t('common.brandName')}
              </span>
            </button>
          </div>

          {/* Zone 2: Clean 4-6 Text Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5">
            {navLinks.slice(0, 6).map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentTab(link.id)}
                className={`text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === link.id
                    ? 'text-[#7A4B24] font-semibold border-b-2 border-[#7A4B24] pb-0.5'
                    : 'text-[#6F665D] hover:text-[#7A4B24]'
                }`}
              >
                {link.id === 'admin' ? (
                  <span className="inline-flex flex-col items-center justify-center text-center leading-[1.15]">
                    <span>{link.label.split(' ')[0] || 'Cluster'}</span>
                    <span>{link.label.split(' ').slice(1).join(' ') || 'Admin'}</span>
                  </span>
                ) : (
                  link.label
                )}
              </button>
            ))}

            {navLinks.length > 6 && (
              <div className="relative group">
                <button className="text-sm font-medium text-[#6F665D] hover:text-[#7A4B24] flex items-center gap-1 cursor-pointer">
                  {t('navigation.more')}
                  <span className="text-xs">▼</span>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E8DCC8] rounded-lg shadow-lg py-2 hidden group-hover:block group-focus-within:block z-50">
                  {navLinks.slice(6).map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setCurrentTab(link.id)}
                      className={`block w-full text-left px-4 py-2 text-sm cursor-pointer ${
                        currentTab === link.id ? 'bg-[#FFF8E7] text-[#7A4B24] font-semibold' : 'text-[#25211D] hover:bg-[#FFF8E7] hover:text-[#7A4B24]'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Zone 3: Primary Actions (Language, Auth / Session Controls) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-100 rounded-md p-0.5 text-xs font-medium">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                    language === l.code
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Authenticated User Controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 relative transition-colors"
                    aria-label={t('navigation.notifications')}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#D99A24] rounded-full ring-2 ring-[#FFF8E7]" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8DCC8] rounded-xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-700">{t('navigation.notifications')}</span>
                        <span className="text-xs text-stone-400">{notifications.length} {t('navigation.updatesCount')}</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-stone-100">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-[#FFF8E7]/50 transition-colors">
                            <p className="text-xs font-semibold text-stone-800">{n.title}</p>
                            <p className="text-xs text-stone-500 mt-1">{n.message}</p>
                            <span className="text-[10px] text-stone-400 mt-1 block">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info Capsule */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200 text-xs">
                  <div className="text-right">
                    <span className="font-semibold text-[#25211D] block truncate max-w-[120px]">
                      {currentUser?.name}
                    </span>
                    <span className="text-[10px] text-[#7A4B24] font-medium block">
                      {isBeekeeper ? t('navigation.beekeeperRole') : t('navigation.adminRole')}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setCurrentTab('verify');
                  }}
                  className="px-2.5 py-1.5 text-stone-600 hover:text-[#171717] hover:bg-stone-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={t('navigation.signOut')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('navigation.signOut')}</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated Public Consumer Controls */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 py-1.5 text-[#25211D] hover:text-[#7A4B24] text-xs font-medium transition-colors flex items-center gap-1.5 hover:bg-[#FFF8E7] rounded-lg cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('navigation.signIn')}</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-3 py-1.5 bg-[#7A4B24] hover:bg-[#5A3418] text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#F4C542]" />
                  <span>{t('navigation.registerApiary')}</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                currentTab === link.id
                  ? 'bg-[#FFF8E7] text-[#7A4B24] font-semibold'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
