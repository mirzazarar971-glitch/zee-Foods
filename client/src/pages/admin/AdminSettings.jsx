import { useEffect, useState } from 'react';
import { Clock, Globe2, MapPin, RefreshCw, Save, Store, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import { Field, Input, PageSpinner, Textarea, Toggle } from '../../components/ui/Field';
import { AdminHeader, Panel } from '../../components/admin/ui';
import { formatPKR } from '../../lib/format';

const socialFields = [
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'tiktok', label: 'TikTok URL' },
  { key: 'youtube', label: 'YouTube URL' },
];

export default function AdminSettings() {
  usePageTitle('Admin settings');
  const { data, loading, error, reload, setData } = useFetch('/admin/settings');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const settings = data.settings;
    setForm({
      restaurantName: settings.restaurantName || '',
      tagline: settings.tagline || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      address: settings.address || '',
      city: settings.city || '',
      announcement: settings.announcement || '',
      deliveryFee: settings.deliveryFee ?? 0,
      freeDeliveryThreshold: settings.freeDeliveryThreshold ?? 0,
      minOrder: settings.minOrder ?? 0,
      deliveryTimeMins: settings.deliveryTimeMins ?? 35,
      onlinePaymentEnabled: settings.onlinePaymentEnabled !== false,
      openingHours: (settings.openingHours || []).map((entry) => ({
        day: entry.day,
        open: entry.open || '11:00',
        close: entry.close || '01:00',
        closed: Boolean(entry.closed),
      })),
      socials: {
        facebook: settings.socials?.facebook || '',
        instagram: settings.socials?.instagram || '',
        tiktok: settings.socials?.tiktok || '',
        youtube: settings.socials?.youtube || '',
      },
    });
  }, [data]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateSocial = (key, value) => setForm((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }));
  const updateHours = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)),
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.restaurantName.trim()) return toast.error('Restaurant name is required.');
    if (!form.phone.trim() || !form.whatsapp.trim()) return toast.error('Phone and WhatsApp numbers are required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return toast.error('Enter a valid contact email.');
    if (!form.address.trim() || !form.city.trim()) return toast.error('Address and city are required.');
    if (!form.openingHours.length) return toast.error('Add opening hours for each day.');
    if (form.openingHours.some((entry) => !entry.closed && (!entry.open || !entry.close))) {
      return toast.error('Every open day needs both an opening and closing time.');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        restaurantName: form.restaurantName.trim(),
        tagline: form.tagline.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        announcement: form.announcement.trim(),
        deliveryFee: Number(form.deliveryFee) || 0,
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
        minOrder: Number(form.minOrder) || 0,
        deliveryTimeMins: Number(form.deliveryTimeMins) || 35,
      };
      const { data: response } = await api.put('/admin/settings', payload);
      setData({ settings: response.settings });
      toast.success('Restaurant settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <PageSpinner label="Loading settings…" />;

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700">
        {error.message}{' '}
        <button type="button" onClick={reload} className="font-bold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Configuration"
        title="Restaurant settings"
        description="Contact details, delivery charges, opening hours and payment options — these power the storefront, footer and chatbot answers."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Reload
        </Button>
        <Button type="submit" form="settings-form" size="sm" loading={saving}>
          <Save size={14} /> Save changes
        </Button>
      </AdminHeader>

      <form id="settings-form" onSubmit={submit} className="grid gap-4 xl:grid-cols-2">
        <Panel title="Restaurant identity" description="Shown in the navbar, footer, chatbot and receipts." className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Restaurant name" htmlFor="s-name">
              <Input id="s-name" value={form.restaurantName} onChange={(event) => update('restaurantName', event.target.value)} />
            </Field>
            <Field label="Tagline" htmlFor="s-tagline">
              <Input id="s-tagline" value={form.tagline} onChange={(event) => update('tagline', event.target.value)} />
            </Field>
            <Field label="Address" htmlFor="s-address" className="sm:col-span-2">
              <Input id="s-address" value={form.address} onChange={(event) => update('address', event.target.value)} />
            </Field>
            <Field label="City" htmlFor="s-city">
              <Input id="s-city" value={form.city} onChange={(event) => update('city', event.target.value)} />
            </Field>
            <Field label="Announcement bar" htmlFor="s-announcement" hint="Leave blank to hide the top-of-site announcement.">
              <Input
                id="s-announcement"
                maxLength={160}
                value={form.announcement}
                onChange={(event) => update('announcement', event.target.value)}
              />
            </Field>
            <Field label="Contact email" htmlFor="s-email">
              <Input id="s-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <Input id="s-phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            </Field>
            <Field label="WhatsApp number" htmlFor="s-whatsapp" hint="Digits with country code, e.g. 923001234567.">
              <Input id="s-whatsapp" value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Delivery & orders" description="Charges are applied server-side at checkout.">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery fee (PKR)" htmlFor="s-fee">
                <Input id="s-fee" type="number" min="0" value={form.deliveryFee} onChange={(event) => update('deliveryFee', event.target.value)} />
              </Field>
              <Field label="Free delivery over (PKR)" htmlFor="s-free" hint="0 disables free delivery.">
                <Input
                  id="s-free"
                  type="number"
                  min="0"
                  value={form.freeDeliveryThreshold}
                  onChange={(event) => update('freeDeliveryThreshold', event.target.value)}
                />
              </Field>
              <Field label="Minimum order (PKR)" htmlFor="s-min">
                <Input id="s-min" type="number" min="0" value={form.minOrder} onChange={(event) => update('minOrder', event.target.value)} />
              </Field>
              <Field label="Delivery ETA (minutes)" htmlFor="s-eta">
                <Input
                  id="s-eta"
                  type="number"
                  min="5"
                  max="180"
                  value={form.deliveryTimeMins}
                  onChange={(event) => update('deliveryTimeMins', event.target.value)}
                />
              </Field>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <Toggle
                id="s-online"
                checked={form.onlinePaymentEnabled}
                onChange={(checked) => update('onlinePaymentEnabled', checked)}
                label="Enable online payment option"
                description="Shows an online payment choice alongside cash on delivery. Card processing requires your provider integration."
              />
            </div>
            <p className="text-[10px] leading-relaxed text-ink-400">
              Current storefront summary: {formatPKR(form.deliveryFee)} delivery · free over {formatPKR(form.freeDeliveryThreshold)} · minimum{' '}
              {formatPKR(form.minOrder)} · about {form.deliveryTimeMins} min.
            </p>
          </div>
        </Panel>

        <Panel
          title="Opening hours"
          description="Used on the home page and by Zara for delivery-cutoff questions."
          actions={<Clock size={15} className="text-ink-400" />}
        >
          <div className="space-y-2">
            {form.openingHours.map((entry, index) => (
              <div key={entry.day} className="flex flex-wrap items-center gap-2 rounded-xl bg-cream-50 px-3 py-2">
                <span className="w-24 text-[11px] font-bold text-ink-800">{entry.day}</span>
                <label className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                  <input
                    type="checkbox"
                    checked={entry.closed}
                    onChange={(event) => updateHours(index, 'closed', event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-ink-300 accent-brand-600"
                  />
                  Closed
                </label>
                <input
                  type="time"
                  value={entry.open}
                  disabled={entry.closed}
                  onChange={(event) => updateHours(index, 'open', event.target.value)}
                  className="rounded-lg border border-ink-900/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 outline-none focus:border-brand-400 disabled:opacity-40"
                />
                <span className="text-[10px] text-ink-400">to</span>
                <input
                  type="time"
                  value={entry.close}
                  disabled={entry.closed}
                  onChange={(event) => updateHours(index, 'close', event.target.value)}
                  className="rounded-lg border border-ink-900/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 outline-none focus:border-brand-400 disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Social links" description="Leave blank to hide an icon in the footer." actions={<Globe2 size={15} className="text-ink-400" />}>
          <div className="space-y-4">
            {socialFields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={`social-${field.key}`}>
                <Input
                  id={`social-${field.key}`}
                  value={form.socials[field.key]}
                  onChange={(event) => updateSocial(field.key, event.target.value)}
                  placeholder={`https://${field.key}.com/zeefoods`}
                />
              </Field>
            ))}
          </div>
        </Panel>

        <Panel
          title="Storefront preview"
          description="A quick reminder of what customers see before ordering."
          className="xl:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-ink-950 p-4 text-cream-50">
              <Store size={16} className="text-accent-400" />
              <p className="mt-2 font-display text-sm font-bold">{form.restaurantName || 'Zee Foods'}</p>
              <p className="text-[11px] text-cream-200/70">{form.tagline}</p>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <MapPin size={16} className="text-brand-600" />
              <p className="mt-2 text-[11px] font-bold text-ink-900">{form.address || 'Add an address'}</p>
              <p className="text-[11px] text-ink-500">{form.city}</p>
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <Truck size={16} className="text-accent-600" />
              <p className="mt-2 text-[11px] font-bold text-ink-900">
                {formatPKR(form.deliveryFee)} delivery · {form.deliveryTimeMins} min
              </p>
              <p className="text-[11px] text-ink-500">
                {form.onlinePaymentEnabled ? 'Cash & online payment' : 'Cash on delivery only'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end border-t border-ink-900/[0.06] pt-4">
            <Button type="submit" loading={saving}>
              <Save size={14} /> Save restaurant settings
            </Button>
          </div>
        </Panel>
      </form>
    </div>
  );
}
