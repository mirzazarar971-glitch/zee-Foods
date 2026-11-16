import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Input, Toggle } from '../ui/Field';

const empty = { label: 'Home', line1: '', city: 'Lahore', area: '', phone: '', isDefault: false };

export default function AddressForm({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      initial
        ? {
            label: initial.label || 'Home',
            line1: initial.line1 || '',
            city: initial.city || 'Lahore',
            area: initial.area || '',
            phone: initial.phone || '',
            isDefault: Boolean(initial.isDefault),
          }
        : empty
    );
  }, [open, initial]);

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.line1.trim().length < 5) next.line1 = 'Enter your complete address.';
    if (form.city.trim().length < 2) next.city = 'Enter your city.';
    if (form.phone && !/^(\+?92|0)?3\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      next.phone = 'Enter a valid mobile number.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim() || 'Home',
        line1: form.line1.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        phone: form.phone.replace(/[\s-]/g, ''),
        isDefault: form.isDefault,
      };
      const { data } = initial
        ? await api.put(`/users/me/addresses/${initial._id}`, payload)
        : await api.post('/users/me/addresses', payload);
      toast.success(initial ? 'Address updated' : 'Address saved');
      onSaved(data.addresses);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit address' : 'Add a new address'}
      description="Save the places you order to most often."
    >
      <form onSubmit={submit} className="space-y-4" id="address-form">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="label" hint="e.g. Home, Office">
            <Input id="label" value={form.label} onChange={set('label')} maxLength={30} placeholder="Home" />
          </Field>
          <Field label="Phone (optional)" htmlFor="addressPhone" error={errors.phone}>
            <Input id="addressPhone" value={form.phone} onChange={set('phone')} placeholder="0300 1234567" inputMode="tel" />
          </Field>
        </div>
        <Field label="Street address" htmlFor="line1" error={errors.line1}>
          <Input id="line1" value={form.line1} onChange={set('line1')} placeholder="House / flat, street, block" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="addressCity" error={errors.city}>
            <Input id="addressCity" value={form.city} onChange={set('city')} placeholder="Lahore" />
          </Field>
          <Field label="Area / phase" htmlFor="addressArea">
            <Input id="addressArea" value={form.area} onChange={set('area')} placeholder="e.g. Gulberg III" />
          </Field>
        </div>
        <Toggle
          id="isDefault"
          checked={form.isDefault}
          onChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked }))}
          label="Make this my default address"
          description="It will be pre-selected at checkout."
        />
        <div className="flex justify-end gap-3 border-t border-ink-900/[0.06] pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {initial ? 'Save changes' : 'Save address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
