import { useState } from 'react';
import { FolderTree, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Field, Input, Textarea, Toggle } from '../../components/ui/Field';
import { AdminHeader, StatusToggle } from '../../components/admin/ui';

const emptyForm = { name: '', description: '', image: '', sortOrder: 0, isActive: true };

export default function AdminCategories() {
  usePageTitle('Admin categories');
  const { data, loading, reload } = useFetch('/admin/categories');
  const categories = data?.categories || [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: categories.length });
    setEditorOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
    });
    setEditorOpen(true);
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Enter a category name.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.put(`/admin/categories/${editing._id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setEditorOpen(false);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    setBusyId(category._id);
    try {
      await api.put(`/admin/categories/${category._id}`, { isActive: !category.isActive });
      toast.success(`${category.name} ${category.isActive ? 'hidden' : 'visible'}`);
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
      await api.delete(`/admin/categories/${deleteTarget._id}`);
      toast.success('Category deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Menu structure"
        title="Categories"
        description="Organise the menu into sections. Hidden categories disappear from the customer menu but keep their products."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} /> Add category
        </Button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white px-6 py-16 text-center">
          <FolderTree className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-4 font-display text-lg font-bold text-ink-900">No categories yet</p>
          <p className="mt-1 text-sm text-ink-500">Create your first category to start building the menu.</p>
          <Button onClick={openCreate} className="mt-5" size="sm">
            <Plus size={14} /> Add category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category._id} className="card flex flex-col overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream-100">
                  {category.image ? (
                    <img src={category.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FolderTree size={20} className="text-ink-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-sm font-bold text-ink-900">{category.name}</h3>
                    <StatusToggle active={category.isActive !== false} onClick={() => toggleActive(category)} title="Toggle visibility">
                      {category.isActive !== false ? 'Visible' : 'Hidden'}
                    </StatusToggle>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-ink-400">/{category.slug}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                    {category.description || 'No description yet.'}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-ink-900/[0.06] px-4 py-3">
                <span className="chip bg-cream-100 text-[10px] text-ink-600">{category.productCount} products</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    disabled={busyId === category._id}
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-ink-900 disabled:opacity-40"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
                    disabled={category.productCount > 0}
                    title={category.productCount > 0 ? 'Move or delete products first' : 'Delete category'}
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'New category'}
        description="Categories power the menu filters and PDF-free menu sections."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" htmlFor="c-name">
            <Input id="c-name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Burgers" />
          </Field>
          <Field label="Description" htmlFor="c-description" hint="Optional. Shown under the category on the menu.">
            <Textarea
              id="c-description"
              rows={3}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Flame-grilled patties, toasted brioche buns."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image URL" htmlFor="c-image" hint="Use an image from /images or a full URL.">
              <Input id="c-image" value={form.image} onChange={(event) => set('image', event.target.value)} placeholder="/images/cat-burgers.webp" />
            </Field>
            <Field label="Sort order" htmlFor="c-sort">
              <Input id="c-sort" type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} />
            </Field>
          </div>
          <div className="rounded-2xl bg-cream-50 p-4">
            <Toggle id="c-active" checked={form.isActive} onChange={(checked) => set('isActive', checked)} label="Visible on the menu" description="Turn off to hide this category from customers without deleting it." />
          </div>
          <div className="flex justify-end gap-3 border-t border-ink-900/[0.06] pt-4">
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${deleteTarget?.name || 'this category'}?`}
        description="Only empty categories can be deleted. This cannot be undone."
        confirmLabel="Delete category"
      />
    </div>
  );
}
