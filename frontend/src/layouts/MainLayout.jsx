import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ThemePicker from '../components/ThemePicker';
import LinkForgeLogo from '../components/LinkForgeLogo';
import { cn } from '../utils/cn';

const MainLayout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Floating navbar capsule */}
      <header className="fixed z-50 top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 nav-floating-capsule">
        <div className="h-14 sm:h-16 px-4 sm:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/dashboard" className="linkforge-logo-hover flex items-center gap-2 shrink-0">
              <LinkForgeLogo size={32} className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-lg sm:text-xl font-bold gradient-text hidden sm:inline">
                LinkForge
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemePicker />

            <div className="flex items-center gap-2 sm:gap-2.5 pl-1 sm:pl-2 pr-1 sm:pr-2 py-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] max-w-[140px] sm:max-w-none">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  color: 'var(--btn-on-accent)',
                }}
              >
                {initials || 'LF'}
              </div>
              <div className="min-w-0 hidden sm:block pr-1">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[100px] lg:max-w-[140px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[100px] lg:max-w-[140px] hidden md:block">
                  {user?.email}
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
              aria-label="Log out"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-[4.75rem] sm:pt-20 lg:pt-[5.25rem]">
        {/* Floating sidebar */}
        <aside
          className={cn(
            'fixed z-40 flex flex-col transition-transform duration-300 ease-out sidebar-floating',
            'top-[4.75rem] left-3 right-3 bottom-3 sm:top-20 sm:left-4 sm:right-auto sm:bottom-4',
            'w-auto sm:w-60 lg:w-[15.5rem] px-3 py-4',
            'lg:top-[5.75rem]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1.5rem)] sm:-translate-x-[calc(100%+2rem)] lg:translate-x-0'
          )}
        >
          <p className="hidden lg:block px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Workspace
          </p>
          <nav className="flex-1 space-y-1 px-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="relative block"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--accent-muted)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <motion.span
                    className={cn(
                      'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    )}
                    whileHover={{ x: isActive ? 0 : 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-dot"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">LinkForge Pro</p>
            <p className="text-[10px] text-[var(--text-muted)] opacity-80 mt-0.5">Smart links, premium analytics</p>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 lg:hidden"
            style={{ backgroundColor: 'var(--overlay)' }}
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 w-full min-w-0 px-3 pb-4 pt-2 sm:px-4 sm:pb-6 lg:pl-[calc(15.5rem+2rem)] lg:pr-6 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
