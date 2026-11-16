import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Ticket, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Field, Input, Select, Textarea, Toggle } from '../../components/ui/Field';
import { AdminHeader, Pagination, SearchBox, StatCard, StatusToggle, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { formatDate, formatPKR } from '../../lib/format';

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrder: 0,
  maxDiscount: 0,
  expiresAt: '',
  usageLimit: 0,
  isActive: true,
};

const defaultExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

export default function AdminCoupons() {
  usePageTitle('Admin coupons');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    return `/admin/coupons?${params.toString()}`;
  }, [page, search]);

  const { data, loading, reload } = useFetch(url, { deps: [url] });
  const coupons = data?.coupons || [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, expiresAt: defaultExpiry() });
    setEditorOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder || 0,
      maxDiscount: coupon.maxDiscount || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : defaultExpiry(),
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive !== false,
    });
    setEditorOpen(true);
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,}$/.test(code)) return toast.error('Code must be at least 3 letters/numbers.');
    if (!form.value || Number(form.value) <= 0) return toast.error('Enter a discount value.');
    if (form.type === 'percentage' && Number(form.value) > 100) return toast.error('Percentage cannot exceed 100.');
    if (!form.expiresAt) return toast.error('Choose an expiry date.');

    setSaving(true);
    try {
      const payload = {
        code,
        description: form.description.trim(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.type === 'percentage' ? Number(form.maxDiscount) || 0 : 0,
        expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
        usageLimit: Number(form.usageLimit) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.put(`/admin/coupons/${editing._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created');
      }
      setEditorOpen(false);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    setBusyId(coupon._id);
    try {
      await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(`${coupon.code} ${coupon.isActive ? 'paused' : 'enabled'}`);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/coupons/${deleteTarget._id}`);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = coupons.filter((coupon) => coupon.isActive && new Date(coupon.expiresAt) > new Date()).length;
  const redemptions = coupons.reduce((sum, coupon) => sum + (coupon.usedCount || 0), 0);

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Promotions"
        title="Coupons"
        description="Create percentage or fixed discounts, set minimum orders and limits, and pause codes without deleting them."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} /> New coupon
        </Button>
      </AdminHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Ticket} label="Coupons" value={data?.total ?? '—'} hint="All-time codes" accent="brand" />
        <StatCard icon={Ticket} label="Active on page" value={activeCount} hint="Enabled and not expired" accent="emerald" />
        <StatCard icon={Ticket} label="Redemptions · page" value={redemptions} hint="Times these codes were used" accent="accent" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search coupon codes…" className="flex-1" />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold text-ink-500 transition hover:bg-cream-100 hover:text-brand-600"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <TableShell>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Discount</Th>
            <Th>Conditions</Th>
            <Th>Expiry</Th>
            <Th>Usage</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <Td colSpan={7}>
                  <div className="skeleton h-9 w-full" />
                </Td>
              </tr>
            ))
          ) : coupons.length === 0 ? (
            <TableEmpty colSpan={7} title="No coupons yet" description="Create a welcome offer or a weekend deal to boost orders." />
          ) : (
            coupons.map((coupon) => {
              const expired = new Date(coupon.expiresAt) <= new Date();
              return (
                <tr key={coupon._id} className="transition hover:bg-cream-50/60">
                  <Td>
                    <p className="font-mono text-[11px] font-bold tracking-wider text-ink-900">{coupon.code}</p>
                    <p className="max-w-[180px] truncate text-[10px] text-ink-400">{coupon.description || 'No description'}</p>
                  </Td>
                  <Td>
                    <p className="text-[11px] font-bold text-ink-900">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatPKR(coupon.value)} off`}
                    </p>
                    {coupon.type === 'percentage' && coupon.maxDiscount > 0 && (
                      <p className="text-[10px] text-ink-400">up to {formatPKR(coupon.maxDiscount)}</p>
                    )}
                  </Td>
                  <Td className="text-[10px] text-ink-500">
                    Min {formatPKR(coupon.minOrder)}
                    {coupon.usageLimit > 0 ? ` · limit ${coupon.usageLimit}` : ' · unlimited'}
                  </Td>
                  <Td>
                    <p className={expired ? 'text-[10px] font-semibold text-brand-600' : 'text-[10px] text-ink-500'}>
                      {formatDate(coupon.expiresAt, { time: false })}
                    </p>
                    {expired && <p className="text-[9px] font-bold uppercase tracking-wider text-brand-600">Expired</p>}
                  </Td>
                  <Td className="text-[11px] text-ink-600">
                    {coupon.usedCount || 0}
                    {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}
                  </Td>
                  <Td>
                    <StatusToggle
                      active={coupon.isActive}
                      onClick={() => toggleActive(coupon)}
                      title="Toggle coupon"
                    >
                      {coupon.isActive ? 'Active' : 'Paused'}
                    </StatusToggle>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(coupon)}
                        disabled={busyId === coupon._id}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-ink-900 disabled:opacity-40"
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(coupon)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableShell>

      <div className="flex justify-end">
        <Pagination page={page} pages={data?.pages || 0} total={data?.total} onChange={setPage} />
      </div>

      <Modal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'New coupon'}
        description="Codes are automatically upper-cased and validated server-side at checkout."
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="coupon-code">
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(event) => set('code', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ZEE10"
                className="font-mono uppercase tracking-wider"
                maxLength={20}
              />
            </Field>
            <Field label="Expires on" htmlFor="coupon-expiry">
              <Input id="coupon-expiry" type="date" value={form.expiresAt} onChange={(event) => set('expiresAt', event.target.value)} />
            </Field>
          </div>
          <Field label="Description" htmlFor="coupon-description" hint="Shown to customers when the coupon applies.">
            <Textarea
              id="coupon-description"
              rows={2}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="10% off your first order"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="coupon-type">
              <Select id="coupon-type" value={form.type} onChange={(event) => set('type', event.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (PKR)</option>
              </Select>
            </Field>
            <Field label={form.type === 'percentage' ? 'Discount %' : 'Discount PKR'} htmlFor="coupon-value">
              <Input id="coupon-value" type="number" min="1" value={form.value} onChange={(event) => set('value', event.target.value)} />
            </Field>
            <Field label="Minimum order (PKR)" htmlFor="coupon-min">
              <Input id="coupon-min" type="number" min="0" value={form.minOrder} onChange={(event) => set('minOrder', event.target.value)} />
            </Field>
            <Field
              label="Max discount (PKR)"
              htmlFor="coupon-max"
              hint={form.type === 'percentage' ? 'Caps a % coupon. 0 = no cap.' : 'Only applies to percentage coupons.'}
            >
              <Input
                id="coupon-max"
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={(event) => set('maxDiscount', event.target.value)}
                disabled={form.type !== 'percentage'}
              />
            </Field>
            <Field label="Usage limit" htmlFor="coupon-limit" hint="0 means unlimited redemptions.">
              <Input id="coupon-limit" type="number" min="0" value={form.usageLimit} onChange={(event) => set('usageLimit', event.target.value)} />
            </Field>
          </div>
          <div className="rounded-2xl bg-cream-50 p-4">
            <Toggle id="coupon-active" checked={form.isActive} onChange={(checked) => set('isActive', checked)} label="Active" description="Inactive coupons are rejected at checkout." />
          </div>
          <div className="flex justify-end gap-3 border-t border-ink-900/[0.06] pt-4">
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${deleteTarget?.code || 'this coupon'}?`}
        description="Customers will no longer be able to redeem this code. Past orders are unaffected."
        confirmLabel="Delete coupon"
      />
    </div>
  );
}
