import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-pf-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 bottom-0 z-50 w-[260px]
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 glass-toolbar sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-pf-dim hover:text-pf-accent transition-colors p-1">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <span className="font-mono text-base font-bold text-pf-accent tracking-wider">PLANT<span className="text-pf-text">FLOW</span></span>
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}