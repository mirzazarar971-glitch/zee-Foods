import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CircleUserRound,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/order/StatusBadge';
import AddressForm from '../components/account/AddressForm';
import { cn, formatDate, formatPKR, initials, normalizePhone } from '../lib/format';

const TABS = [
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'addresses', label: 'Addresses', icon: MapPin },
  { value: 'orders', label: 'My orders', icon: Package },
];

function ProfileSection({ user, updateUser }) {
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [changing, setChanging] = useState(false);
  const [errors, setErrors] = useState({});

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
      });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setErrors({ confirm: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setErrors({ newPassword: 'Use at least 6 characters.' });
      return;
    }
    setErrors({});
    setChanging(true);
    try {
      const { data } = await api.put('/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(data.message || 'Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={saveProfile} className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Personal details</h2>
            <p className="text-xs text-ink-400">This is how we&apos;ll address you and send updates.</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <CircleUserRound size={21} />
          </span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              autoComplete="name"
            />
          </Field>
          <Field label="Email address" htmlFor="profile-email">
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              autoComplete="email"
            />
          </Field>
          <Field label="Mobile number" htmlFor="profile-phone" className="sm:col-span-2">
            <Input
              id="profile-phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="0300 1234567"
              autoComplete="tel"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" loading={saving} size="sm">
            Save changes
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Change password</h2>
            <p className="text-xs text-ink-400">Use at least 6 characters. You&apos;ll stay signed in.</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-100 text-ink-500">
            <ShieldCheck size={21} />
          </span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="current-password">
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" htmlFor="new-password" error={errors.newPassword}>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-password" error={errors.confirm}>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" variant="dark" size="sm" loading={changing}>
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}

function AddressesSection({ user, updateUser }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const addresses = user.addresses || [];

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (address) => {
    setEditing(address);
    setEditorOpen(true);
  };

  const makeDefault = async (address) => {
    try {
      const payload = {
        label: address.label,
        line1: address.line1,
        city: address.city,
        area: address.area || '',
        phone: address.phone || '',
        isDefault: true,
      };
      const { data } = await api.put(`/users/me/addresses/${address._id}`, payload);
      updateUser({ ...user, addresses: data.addresses });
      toast.success('Default address updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeAddress = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/users/me/addresses/${deleteTarget._id}`);
      updateUser({ ...user, addresses: data.addresses });
      toast.success('Address removed');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Saved addresses</h2>
          <p className="text-xs text-ink-400">Pick one at checkout to order even faster.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Add your home or office address so checkout takes seconds next time."
          action={<Button onClick={openAdd}>Add your first address</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address._id}
              className={cn(
                'rounded-2xl border bg-white p-4 shadow-soft transition',
                address.isDefault ? 'border-brand-300 ring-1 ring-brand-500/10' : 'border-ink-900/[0.07]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-ink-800">
                  <MapPin size={14} className="text-brand-600" /> {address.label || 'Address'}
                  {address.isDefault && <span className="chip bg-brand-600 px-2 py-0.5 text-[9px] text-white">Default</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition hover:bg-cream-100 hover:text-ink-800"
                    aria-label="Edit address"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(address)}
                    className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                    aria-label="Delete address"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                {address.line1}
                {address.area ? `, ${address.area}` : ''}, {address.city}
              </p>
              {address.phone && <p className="mt-1 text-[11px] font-medium text-ink-400">{address.phone}</p>}
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(address)}
                  className="mt-3 text-[11px] font-bold text-brand-600 hover:text-brand-700"
                >
                  Set as default
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <AddressForm
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        onSaved={(nextAddresses) => updateUser({ ...user, addresses: nextAddresses })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeAddress}
        loading={deleting}
        title="Delete this address?"
        description="You can always add it again later."
        confirmLabel="Delete address"
      />
    </div>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = (page = 1) => {
    setLoading(true);
    setError('');
    api
      .get('/orders/mine', { params: { page } })
      .then(({ data }) => {
        setOrders(data.orders || []);
        setMeta({ total: data.total || 0, pages: data.pages || 0, page: data.page || 1 });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, []);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await api.patch(`/orders/mine/${cancelTarget._id}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled');
      setCancelTarget(null);
      load(meta.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Orders didn’t load"
        description={error}
        action={<Button onClick={() => load(1)}>Try again</Button>}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No orders yet"
        description="When you place your first order it will appear here with live tracking."
        action={<Button to="/menu">Browse the menu</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Order history</h2>
          <p className="text-xs text-ink-400">{meta.total} order{meta.total === 1 ? '' : 's'} placed with Zee Foods.</p>
        </div>
        <Button to="/menu" size="sm" variant="outline">
          Order again
        </Button>
      </div>

      {orders.map((order) => (
        <article key={order._id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/[0.06] px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-extrabold tracking-wider text-ink-900">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
              <span className="text-[11px] font-medium text-ink-400">{formatDate(order.createdAt)}</span>
            </div>
            <span className="font-display text-base font-extrabold text-ink-900">{formatPKR(order.total)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="flex -space-x-2">
              {order.items.slice(0, 4).map((item, index) => (
                <img
                  key={`${item.name}-${index}`}
                  src={item.image || '/images/burger-classic.webp'}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink-500">
              {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button to={`/account/orders/${order._id}`} size="sm" variant="outline">
                View details
              </Button>
              {['pending', 'confirmed'].includes(order.status) && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(order)}
                  className="rounded-full px-3 py-2 text-xs font-bold text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </article>
      ))}

      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: meta.pages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => load(index + 1)}
              className={cn(
                'h-9 min-w-9 rounded-full px-3 text-xs font-bold transition',
                meta.page === index + 1
                  ? 'bg-brand-600 text-white'
                  : 'border border-ink-900/10 bg-white text-ink-600 hover:border-ink-900/25'
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        description="Cancellation is only possible before the kitchen starts preparing. If we've already started, please call us."
        confirmLabel="Cancel order"
        tone="danger"
      />
    </div>
  );
}

export default function Account() {
  usePageTitle('My account');
  const { user, updateUser, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((entry) => entry.value === params.get('tab')) ? params.get('tab') : 'profile';

  const changeTab = (value) => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    setParams(next);
  };

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title={`Hi, ${user.name.split(' ')[0]}`}
        description="Manage your details, saved addresses and every Zee Foods order in one place."
        crumbs={[{ label: 'Account' }]}
      >
        <div className="flex flex-wrap gap-2">
          <Button to="/menu" size="sm">
            Start an order <ArrowRight size={14} />
          </Button>
          <Button to="/track" size="sm" variant="outline">
            <Truck size={14} /> Track order
          </Button>
        </div>
      </PageHeader>

      <section className="container-x grid gap-6 py-8 lg:grid-cols-[280px_1fr] lg:py-10">
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 font-display text-xl font-extrabold text-white shadow-glow">
              {initials(user.name)}
            </span>
            <p className="mt-3 font-display text-base font-bold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              <Star size={11} className="text-accent-500" /> {user.role === 'admin' ? 'Admin' : 'Zee Club member'}
            </div>
          </div>

          <nav className="card overflow-hidden p-2" aria-label="Account sections">
            {TABS.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => changeTab(entry.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition',
                  tab === entry.value ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-cream-50'
                )}
              >
                <entry.icon size={16} /> {entry.label}
                <ArrowRight size={13} className={cn('ml-auto transition', tab === entry.value ? 'opacity-100' : 'opacity-0')} />
              </button>
            ))}
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink-600 transition hover:bg-cream-50"
              >
                <ShieldCheck size={16} /> Admin dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink-500 transition hover:bg-rose-50 hover:text-brand-600"
            >
              <LogOut size={16} /> Sign out
            </button>
          </nav>
        </aside>

        <div>
          {tab === 'profile' && <ProfileSection user={user} updateUser={updateUser} />}
          {tab === 'addresses' && <AddressesSection user={user} updateUser={updateUser} />}
          {tab === 'orders' && <OrdersSection />}
        </div>
      </section>
    </>
  );
}
