'use client';

import React from 'react';
import { Bell, Search, User, Grid, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

export const Header = () => {
  const { toggle } = useSidebar();
  const { user } = useAuth();

  const name = user?.name ?? 'User';
  const roleLabel = user?.role === 'farmer' ? 'Farmer' : 'Claims Auditor';

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
        <div className="hidden md:flex items-center gap-3 bg-white border border-primary/10 px-5 py-2.5 rounded-md w-[300px] xl:w-[400px] transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-[0_4px_15px_rgba(98,111,71,0.1)] shadow-[0_2px_10px_rgba(98,111,71,0.05)]">
          <Search className="text-foreground-dim shrink-0" size={18} />
          <input
            type="text"
            placeholder="Search claims, farmers, or reports..."
            className="bg-transparent border-none text-foreground-main w-full outline-none text-sm font-inter"
          />
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
