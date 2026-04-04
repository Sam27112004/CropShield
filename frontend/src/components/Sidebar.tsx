'use client';

import React from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, LogOut, ShieldCheck, X, UserCog, MessageSquare, CloudSun, TrendingUp, Bot, ScanSearch, Sprout, Wallet, Languages, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Farmer Requests', href: '/farmer/requests' },
  { icon: BarChart3, label: 'Analysis', href: '/analysis' },
  { icon: CloudSun, label: 'Weather', href: '/weather' },
  { icon: TrendingUp, label: 'Market', href: '/market' },
  { icon: Wallet, label: 'Financial', href: '/financial' },
  { icon: Bot, label: 'Advisory', href: '/advisory' },
  { icon: Bot, label: 'Chatbot', href: '/chatbot' },
  { icon: Languages, label: 'Multilingual', href: '/multilingual-chatbot' },
  { icon: Sparkles, label: 'Smart Advisor', href: '/smart-advisor' },
  { icon: Sprout, label: 'Crop Predictor', href: '/crop-predictor' },
  { icon: ScanSearch, label: 'Disease', href: '/disease' },
  { icon: MessageSquare, label: 'Forum', href: '/forum' },
  { icon: UserCog, label: 'Admin', href: '/admin' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const farmerNavItems = [
  { icon: FileText, label: 'Farmer Requests', href: '/farmer/requests' },
  { icon: CloudSun, label: 'Weather', href: '/weather' },
  { icon: TrendingUp, label: 'Market', href: '/market' },
  { icon: Wallet, label: 'Financial', href: '/financial' },
  { icon: Bot, label: 'Advisory', href: '/advisory' },
  { icon: Bot, label: 'Chatbot', href: '/chatbot' },
  { icon: Languages, label: 'Multilingual', href: '/multilingual-chatbot' },
  { icon: Sparkles, label: 'Smart Advisor', href: '/smart-advisor' },
  { icon: Sprout, label: 'Crop Predictor', href: '/crop-predictor' },
  { icon: ScanSearch, label: 'Disease', href: '/disease' },
  { icon: MessageSquare, label: 'Forum', href: '/forum' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isOpen, close } = useSidebar();
  const activeNavItems = user?.role === 'farmer' ? farmerNavItems : navItems.filter((item) => item.href !== '/farmer/requests');

  const handleLogout = () => {
    logout();
    close();
    router.replace('/login');
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full w-[280px] flex flex-col p-6 z-[100]
          bg-accent/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:left-6 lg:top-6 lg:h-[calc(100vh-48px)] lg:rounded-xl lg:border lg:border-white/10 lg:translate-x-0
        `}
      >
        {/* Logo + close btn (mobile only) */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-secondary animate-pulse" />
            <span className="font-outfit text-2xl font-bold tracking-tighter text-white">
              CropShield{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-secondary to-white/80">
                AI
              </span>
            </span>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-4 p-4 px-5 rounded-2xl font-semibold text-base transition-all duration-300 no-underline relative overflow-hidden group
                  ${isActive
                    ? 'text-white bg-primary shadow-[0_8px_16px_rgba(51,107,75,0.40)] border border-white/15'
                    : 'text-white/65 hover:text-white hover:bg-white/10 hover:translate-x-1'
                  }`}
              >
                <Icon size={20} className={`${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-0 bg-white/10 group-active:w-full transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-transparent border-none cursor-pointer text-red-300 font-inherit flex items-center gap-4 p-4 px-5 rounded-2xl font-semibold transition-all duration-300 hover:bg-red-500/20 hover:text-red-200 hover:scale-[0.98]"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
