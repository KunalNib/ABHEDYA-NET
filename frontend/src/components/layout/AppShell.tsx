import React from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { GlobalContextBar } from './GlobalContextBar';
import { SystemStoryIndicator } from './SystemStoryIndicator';
import { GlobalStatusBar } from './GlobalStatusBar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <GlobalContextBar />
      <TopBar />
      <SystemStoryIndicator />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
      <GlobalStatusBar />
    </div>
  );
};
