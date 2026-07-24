import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { HowItWorks, FAQ } from '../sections/PageSections';
import { getToolBySlug } from '../../config/tools.config';

export function AppShell() {
  const token = localStorage.getItem('access_token');
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }

  const pathParts = location.pathname.split('/');
  const toolSlug = pathParts[2];
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;
  const toolColorHex = tool?.color.hex ?? '#7C3AED';

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen bg-[#F5F3EE] flex flex-col overflow-hidden">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content Area: transitions left margin to clear the sidebar */}
        <main
          id="main-content"
          className={`flex-1 bg-white rounded-t-[32px] border border-stone-200/50 shadow-sm flex flex-col overflow-hidden transition-all duration-300 mx-6 ${isSidebarOpen ? 'ml-[120px]' : 'ml-6'
            }`}
        >
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col justify-between">
            <div className="flex flex-col flex-1">
              <Outlet />
              <div style={{ borderTop: `52px solid ${toolColorHex}` }} />
              <HowItWorks />
              <div style={{ borderTop: `52px solid ${toolColorHex}` }} />
              <FAQ />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
