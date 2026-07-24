import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getToolBySlug } from '../../config/tools.config';
import { Menu, Feather, LogOut } from 'lucide-react';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    navigate('/login', { replace: true });
  };

  // Find tool by route segment
  const pathParts = location.pathname.split('/');
  const toolSlug = pathParts[2];
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;

  let pageTitle = 'NavQuill';
  if (tool) {
    pageTitle = tool.label;
  } else if (location.pathname === '/history') {
    pageTitle = 'History';
  }

  // Parse user email for avatar initial
  const name = localStorage.getItem('name');
  const email = localStorage.getItem('email');

  const userInitial = email ? email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="relative h-16 flex items-center justify-between bg-[#F5F3EE]">
      {/* Left side items: Burger button + Logo */}
      <div className="flex items-center">
        {/* Burger button container - matches sidebar width of 96px to align perfectly */}
        <div className="w-[56px] flex-shrink-0 flex justify-center items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-850 hover:bg-stone-200/40 transition-colors cursor-pointer"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* NavQuill Logo */}
        <Link to="/editor/ai-paraphraser" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md shadow-violet-200 group-hover:shadow-violet-300 transition-shadow duration-300">
            <Feather className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-stone-800">Nav</span>
            <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent font-extrabold">Quill</span>
          </span>
        </Link>
      </div>

      {/* Dynamic Title - centered like Quillbot — hidden on mobile to prevent overlap */}
      <h1 className="text-base font-bold text-stone-800 tracking-tight absolute left-1/2 -translate-x-1/2 hidden sm:block">
        {pageTitle}
      </h1>

      {/* Right side items */}
      <div className="flex items-center gap-3">
        {/* User initials avatar */}
        <div
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title={email || 'Logged in user'}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-300 flex mr-4 sm:mr-12 items-center justify-center text-[11px] font-bold text-white shadow-sm cursor-pointer hover:scale-105 transition-transform duration-150"
        >
          {userInitial}
        </div>
      </div>

      {isProfileOpen && createPortal(
        <>
          {/* Click-away overlay */}
          <div className="fixed inset-0 z-45 cursor-default" onClick={() => setIsProfileOpen(false)} />
          
          {/* Profile Popover */}
          <div className="fixed top-14 right-8 sm:right-16 bg-white border border-stone-200/60 rounded-2xl shadow-xl z-50 p-4 w-60 flex flex-col gap-3.5 fade-up">
            {/* User Details */}
            <div className="flex items-center gap-3 pb-2.5 border-b border-stone-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-300 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-stone-850 truncate">
                  {name || 'NavQuill User'}
                </span>
                <span className="text-[10px] text-stone-600 truncate" title={email || ''}>
                  {email || 'user@example.com'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsProfileOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:text-red-650 hover:bg-red-50/60 rounded-xl transition-colors cursor-pointer border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
