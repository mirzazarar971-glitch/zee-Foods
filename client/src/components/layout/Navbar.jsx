import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Phone,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { cn, initials, todayHours } from '../../lib/format';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Menu', to: '/menu' },
  { label: 'Deals', to: '/menu?category=deals' },
  { label: 'Track order', to: '/track' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const hours = todayHours(settings.openingHours);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const params = new URLSearchParams(location.search);
  const isActive = (link) => {
    if (link.to === '/') return location.pathname === '/';
    if (link.label === 'Deals') return location.pathname === '/menu' && params.get('category') === 'deals';
    if (link.to === '/menu') {
      return (
        (location.pathname === '/menu' && params.get('category') !== 'deals') ||
        location.pathname.startsWith('/product')
      );
    }
    return location.pathname === link.to;
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50">
      {settings.announcement && (
        <div className="bg-ink-950 text-cream-100/85">
          <div className="container-x flex items-center justify-between gap-3 py-2 text-[11px] font-medium">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
              {settings.announcement}
            </p>
            <div className="hidden items-center gap-4 sm:flex">
              <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 transition hover:text-white">
                <Phone size={11} /> {settings.phone}
              </a>
              {hours && !hours.closed && (
                <span className="flex items-center gap-1.5 text-cream-100/70">
                  <Clock3 size={11} /> Today {hours.open} – {hours.close}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-ink-900/[0.06] bg-cream-50/85 backdrop-blur-xl">
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-[13px] font-semibold transition',
                    isActive(link) ? 'text-brand-600' : 'text-ink-600 hover:text-ink-900'
                  )}
                >
                  {link.label}
                  {isActive(link) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand-600"
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-white"
              aria-label={`Cart${count ? `, ${count} items` : ''}`}
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden sm:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink-800 transition hover:border-ink-900/20"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <span className="max-w-24 truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={cn('text-ink-400 transition', accountOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white p-2 shadow-card"
                      role="menu"
                    >
                      <div className="border-b border-ink-900/[0.06] px-3 py-2.5">
                        <p className="text-sm font-bold text-ink-900">{user.name}</p>
                        <p className="truncate text-xs text-ink-400">{user.email}</p>
                      </div>
                      <Link to="/account" className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-cream-100">
                        <User size={15} /> My account
                      </Link>
                      <Link to="/account?tab=orders" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-cream-100">
                        <ShoppingBag size={15} /> My orders
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50">
                          <LayoutDashboard size={15} /> Admin dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-cream-100 hover:text-brand-700"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button to="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button to="/menu" size="sm" className="shadow-glow">
                  Order now
                </Button>
              </div>
            )}

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-white lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-ink-900/[0.06] bg-cream-50 lg:hidden"
            >
              <div className="container-x space-y-1 py-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-sm font-semibold transition',
                      isActive(link) ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-white'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3">
                  {user ? (
                    <div className="space-y-1 border-t border-ink-900/[0.06] pt-3">
                      <Link to="/account" className="block rounded-xl px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-white">
                        My account
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-white">
                          Admin dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink-500 hover:bg-white"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 border-t border-ink-900/[0.06] pt-4">
                      <Button to="/login" variant="outline" className="flex-1">
                        Sign in
                      </Button>
                      <Button to="/register" className="flex-1">
                        Create account
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
