import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Settings,
  ShoppingBag,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { PageSpinner } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { cn, initials } from '../../lib/format';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/chatbot', label: 'Chatbot', icon: Bot },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES = {
  '/admin': 'Overview',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/customers': 'Customers',
  '/admin/coupons': 'Coupons',
  '/admin/chatbot': 'Chatbot',
  '/admin/settings': 'Settings',
};

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-6">
        <Logo light to="/admin" />
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream-100/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Admin console
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-cream-100/55 hover:bg-white/[0.06] hover:text-cream-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="admin-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-400"
                  />
                )}
                <item.icon size={17} className={cn(isActive ? 'text-accent-400' : 'text-cream-100/40 group-hover:text-cream-100/70')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 px-4 pb-5">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-cream-100/70 transition hover:border-white/20 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} /> View store
          </span>
          <ArrowUpRight size={14} />
        </a>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{user?.name}</p>
            <p className="truncate text-[10px] text-cream-100/40">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cream-100/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream-50">
        <PageSpinner label="Checking admin access…" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  const title = PAGE_TITLES[location.pathname] || (location.pathname.startsWith('/admin/orders/') ? 'Order details' : 'Admin');
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-ink-950 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-ink-950 lg:hidden"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
                aria-label="Close navigation"
              >
                <X size={17} />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-ink-900/[0.06] bg-[#F7F3EC]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 lg:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon size={18} />
              </button>
              <div>
                <h1 className="font-display text-lg font-bold text-ink-900">{title}</h1>
                <p className="hidden text-[11px] font-medium text-ink-400 sm:block">{today}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink-600 transition hover:border-ink-900/20 hover:text-ink-900 sm:inline-flex"
              >
                <ExternalLink size={13} /> View store
              </a>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-[11px] font-bold text-cream-50">
                {initials(user.name)}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
