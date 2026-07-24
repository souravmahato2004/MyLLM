import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { History, MoreHorizontal, Sparkles, BookOpen, Languages, ShieldCheck } from 'lucide-react';
import { TOOLS_CONFIG } from '../../config/tools.config';

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <aside className={`fixed top-16 left-0 bottom-0 w-[96px] flex flex-col items-center bg-[#F5F3EE] overflow-y-auto z-40 pb-4 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Top spacer instead of logo header */}
      <div className="h-4" />

      {/* ── Tool Navigation ── */}
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        {TOOLS_CONFIG.map(({ slug, label, icon: Icon, path, color }) => (
          <NavLink
            key={slug}
            id={`sidebar-${slug}`}
            to={path}
            title={label}
            className="flex flex-col items-center gap-1 w-full py-1.5 rounded-xl transition-all duration-200 group"
          >
            {({ isActive }) => (
              <>
                {/* Icon chip */}
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive
                      ? `${color.chipBg} ${color.iconColor} shadow-sm`
                      : 'text-zinc-500 group-hover:bg-stone-200/40 group-hover:text-zinc-800'
                    }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {/* Label */}
                <span
                  className={`text-[11px] font-semibold text-center leading-tight px-0.5 transition-colors duration-200 ${isActive ? color.activeText : 'text-zinc-500 group-hover:text-zinc-800'
                    }`}
                  style={{ maxWidth: '80px', wordBreak: 'break-word' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="w-8 h-px bg-stone-100 my-2" />

      {/* ── Account ── */}
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        <NavLink
          id="sidebar-history"
          to="/history"
          title="History"
          className="flex flex-col items-center gap-1 w-full py-1.5 rounded-xl transition-all duration-200 group"
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive
                    ? 'bg-stone-100 text-stone-700 shadow-sm'
                    : 'text-zinc-500 group-hover:bg-stone-200/40 group-hover:text-zinc-800'
                  }`}
              >
                <History className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                className={`text-[11px] font-semibold text-center leading-tight transition-colors duration-200 ${isActive ? 'text-stone-700' : 'text-zinc-500 group-hover:text-zinc-800'
                  }`}
              >
                History
              </span>
            </>
          )}
        </NavLink>
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── More Dropdown / Modal Menu ── */}
      <div className="relative w-full px-2">
        <button
          id="sidebar-more-btn"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center gap-1 w-full py-1.5 rounded-xl transition-all duration-200 group ${isMoreOpen ? 'bg-stone-200/50 text-zinc-850' : 'text-zinc-500 hover:bg-stone-200/40 hover:text-zinc-800'
            }`}
        >
          <span className="w-10 h-10 rounded-xl flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" />
          </span>
          <span className="text-[11px] font-semibold text-center leading-tight">
            More
          </span>
        </button>

        {isMoreOpen && createPortal(
          <>
            {/* Click-away overlay */}
            <div className="fixed inset-0 z-45 cursor-default" onClick={() => setIsMoreOpen(false)} />

            {/* Popover Card */}
            <div className="fixed bottom-16 left-20 bg-white border border-stone-200/60 rounded-2xl shadow-xl z-50 p-3 w-64 flex flex-col gap-2 fade-up">
              {/* Future AI Models Section */}
              <div className="px-1 py-1 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Upcoming AI Models
                </span>

                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="flex items-center gap-2 px-1 py-1 rounded-lg">
                    <BookOpen className="w-4 h-4 text-stone-450 flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-stone-800 leading-tight">AI Summarizer</span>
                      <span className="text-[9px] text-stone-500 leading-none">Condense long articles</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-1 py-0.5 rounded uppercase tracking-wider scale-90">Soon</span>
                  </div>

                  <div className="flex items-center gap-2 px-1 py-1 rounded-lg">
                    <Languages className="w-4 h-4 text-stone-450 flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-stone-800 leading-tight">AI Translator</span>
                      <span className="text-[9px] text-stone-500 leading-none">Translate 30+ languages</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-1 py-0.5 rounded uppercase tracking-wider scale-90">Soon</span>
                  </div>

                  <div className="flex items-center gap-2 px-1 py-1 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-stone-450 flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-stone-800 leading-tight">Plagiarism Scanner</span>
                      <span className="text-[9px] text-stone-500 leading-none">Detect duplicate content</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-1 py-0.5 rounded uppercase tracking-wider scale-90">Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}


      </div>
    </aside>
  );
}
