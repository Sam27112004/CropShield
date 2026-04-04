'use client';

import React, { useMemo, useState } from 'react';
import { Bell, Search, User, Grid, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

interface SearchItem {
  label: string;
  href: string;
}

const ADMIN_SEARCH_ITEMS: SearchItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Analysis', href: '/analysis' },
  { label: 'Claims', href: '/claims' },
  { label: 'Weather', href: '/weather' },
  { label: 'Market', href: '/market' },
  { label: 'Financial', href: '/financial' },
  { label: 'Advisory', href: '/advisory' },
  { label: 'Chatbot', href: '/chatbot' },
  { label: 'Multilingual Chatbot', href: '/multilingual-chatbot' },
  { label: 'Smart Advisor', href: '/smart-advisor' },
  { label: 'Crop Predictor', href: '/crop-predictor' },
  { label: 'Disease', href: '/disease' },
  { label: 'Forum', href: '/forum' },
  { label: 'Admin', href: '/admin' },
  { label: 'Settings', href: '/settings' },
];

const FARMER_SEARCH_ITEMS: SearchItem[] = [
  { label: 'Farmer Requests', href: '/farmer/requests' },
  { label: 'Weather', href: '/weather' },
  { label: 'Market', href: '/market' },
  { label: 'Financial', href: '/financial' },
  { label: 'Advisory', href: '/advisory' },
  { label: 'Chatbot', href: '/chatbot' },
  { label: 'Multilingual Chatbot', href: '/multilingual-chatbot' },
  { label: 'Smart Advisor', href: '/smart-advisor' },
  { label: 'Crop Predictor', href: '/crop-predictor' },
  { label: 'Disease', href: '/disease' },
  { label: 'Forum', href: '/forum' },
  { label: 'Settings', href: '/settings' },
];

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const name = user?.name ?? 'User';
  const roleLabel = user?.role === 'farmer' ? 'Farmer' : 'Claims Auditor';
  const searchItems = user?.role === 'farmer' ? FARMER_SEARCH_ITEMS : ADMIN_SEARCH_ITEMS;

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return searchItems.slice(0, 6);
    return searchItems
      .filter((item) => item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchItems, searchText]);

  const navigateTo = (href: string) => {
    setSearchOpen(false);
    setSearchText('');
    if (pathname !== href) {
      router.push(href);
    }
  };

  return (
    <header className="
      h-16 md:h-20
      fixed top-0 left-0 right-0
      lg:top-6 lg:right-8 lg:left-[312px]
      flex items-center justify-between
      px-4 md:px-8
      z-[90]
      bg-background-card/80 backdrop-blur-xl
      border-b border-primary/10
      lg:rounded-lg lg:border lg:border-primary/15 lg:shadow-sm
    ">
      {/* Left: hamburger (mobile) + search (desktop) */}
      <div className="flex items-center gap-3 flex-1">
        {/* Hamburger — only on mobile */}
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-md text-foreground-muted hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        {/* Logo text on mobile (sidebar is hidden) */}
        <span className="font-outfit text-lg font-bold tracking-tighter text-primary lg:hidden">
          CropShield <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary">AI</span>
        </span>

        {/* Search bar — hidden on small screens */}
        <div className="hidden md:block relative w-[300px] xl:w-[400px]">
          <div className="flex items-center gap-3 bg-white border border-primary/10 px-5 py-2.5 rounded-md transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-[0_4px_15px_rgba(98,111,71,0.1)] shadow-[0_2px_10px_rgba(98,111,71,0.05)]">
            <Search className="text-foreground-dim shrink-0" size={18} />
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filteredItems.length > 0) {
                  event.preventDefault();
                  navigateTo(filteredItems[0].href);
                }
              }}
              placeholder="Quick navigate to pages..."
              className="bg-transparent border-none text-foreground-main w-full outline-none text-sm font-inter"
            />
          </div>

          {searchOpen ? (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-xl border border-primary/10 bg-white shadow-[0_10px_30px_rgba(38,48,32,0.12)] p-2 z-[120]">
              {filteredItems.length === 0 ? (
                <p className="px-3 py-2 text-sm text-foreground-muted">No matching pages.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => navigateTo(item.href)}
                      className="text-left rounded-lg px-3 py-2 text-sm text-foreground-main hover:bg-primary/5"
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="ml-2 text-xs text-foreground-muted">{item.href}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3 md:gap-6">
        <button className="relative bg-transparent border-none text-foreground-muted cursor-pointer transition-all duration-200 p-1.5 rounded-md hover:text-primary hover:bg-primary/5">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
        </button>
        <button className="hidden sm:block relative bg-transparent border-none text-foreground-muted cursor-pointer transition-all duration-200 p-1.5 rounded-md hover:text-primary hover:bg-primary/5">
          <Grid size={20} />
        </button>
        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-primary/10 cursor-pointer">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground-main leading-tight">{name}</span>
            <span className="text-[10px] text-foreground-dim uppercase tracking-wider font-bold">{roleLabel}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(98,111,71,0.05)] text-white">
            {user?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.picture} alt={name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <User size={18} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
