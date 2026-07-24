import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { TOOLS_CONFIG } from '../../config/tools.config';

const UPCOMING_MODELS = [
  { name: 'AI Summarizer', desc: 'Condense long articles' },
  { name: 'AI Translator', desc: 'Translate 30+ languages' },
  { name: 'Plagiarism Scanner', desc: 'Detect duplicate content' },
];

export function Footer() {
  return (
    <footer className="bg-[#EDE9FE] border-t border-violet-200 mt-auto">
      {/* Top section */}
      <div className="px-8 lg:px-12 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md shadow-violet-300/50">
                <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold">
                <span className="text-violet-900">Nav</span>
                <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
                  Quill
                </span>
              </span>
            </div>
            <p className="text-sm text-violet-600/80 leading-relaxed max-w-[220px]">
              Your AI writing assistant for smarter, cleaner, and more human content.
            </p>
          </div>

          {/* Tools column */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-4">
              Tools
            </p>
            <ul className="space-y-2.5">
              {TOOLS_CONFIG.map((t) => (
                <li key={t.slug}>
                  <Link
                    to={t.path}
                    className="text-sm text-violet-700 hover:text-violet-900 transition-colors duration-200 flex items-center gap-2 font-medium"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.color.hex }}
                    />
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Models */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-4">
              Upcoming Models
            </p>
            <ul className="space-y-3">
              {UPCOMING_MODELS.map((m) => (
                <li key={m.name} className="flex flex-col">
                  <span className="text-sm font-semibold text-violet-750">
                    {m.name}
                  </span>
                  <span className="text-xs text-violet-600/70 leading-tight">
                    {m.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-violet-200 px-8 lg:px-12 py-5 bg-[#E8E2FD]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-violet-500 font-medium">
            © {new Date().getFullYear()} NavQuill. All rights reserved.
          </p>

          {/* Tool color bar */}
          <div className="flex gap-1">
            {TOOLS_CONFIG.map(({ slug, color }) => (
              <div
                key={slug}
                className="w-6 h-1.5 rounded-full"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
