import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, HeartPulse,
  Syringe, Pill, Landmark, BookOpen, BarChart3, MessageSquare,
  LogOut, Menu, Globe, Activity,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, LANGUAGES, type Lang } from '../lib/i18n';
import AIAssistant from './AIAssistant';

const navItems = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/patients', key: 'patients', icon: Users },
  { to: '/appointments', key: 'appointments', icon: CalendarDays },
  { to: '/consultations', key: 'consultations', icon: Stethoscope },
  { to: '/maternal', key: 'maternal', icon: HeartPulse },
  { to: '/vaccinations', key: 'vaccinations', icon: Syringe },
  { to: '/inventory', key: 'inventory', icon: Pill },
  { to: '/schemes', key: 'schemes', icon: Landmark },
  { to: '/education', key: 'education', icon: BookOpen },
  { to: '/reports', key: 'reports', icon: BarChart3 },
  { to: '/feedback', key: 'feedback', icon: MessageSquare },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut, lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const roleLabel = profile ? t(lang, profile.role) : '';
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">{t(lang, 'appName')}</h1>
            <p className="text-[10px] text-gray-500 truncate">{t(lang, 'tagline')}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{t(lang, item.key)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-ghost w-full mt-2 justify-start text-sm">
            <LogOut className="w-4 h-4" />
            {t(lang, 'signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-base font-semibold text-gray-900 hidden sm:block">{t(lang, 'welcome')}, {profile?.full_name?.split(' ')[0]}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="btn-ghost text-sm px-3"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang?.native}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-40 py-1 max-h-72 overflow-y-auto">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${lang === l.code ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}
                      >
                        {l.native} <span className="text-gray-400 text-xs">({l.label})</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
