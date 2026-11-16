import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Field, Input, Select, Textarea, Toggle } from '../../components/ui/Field';
import { AdminHeader, Pagination, SearchBox, StatusToggle, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { formatPKR } from '../../lib/format';
import { placeholderImage } from '../../lib/orders';

const emptyForm = {
  name: '',
  description: '',
  category: '',
  price: '',
  compareAtPrice: '',
  image: '',
  ingredients: '',
  tags: '',
  prepTime: 20,
  serves: '1 person',
  sortOrder: 0,
  isAvailable: true,
  isFeatured: false,
  isPopular: false,
  variants: [{ name: 'Regular', priceDelta: 0 }],
  addons: [],
};

const productToForm = (product) => ({
  name: product.name || '',
  description: product.description || '',
  category: product.category?._id || product.category || '',
  price: product.price ?? '',
  compareAtPrice: product.compareAtPrice ?? '',
  image: product.image || '',
  ingredients: (product.ingredients || []).join(', '),
  tags: (product.tags || []).join(', '),
  prepTime: product.prepTime ?? 20,
  serves: product.serves || '1 person',
  sortOrder: product.sortOrder ?? 0,
  isAvailable: product.isAvailable !== false,
  isFeatured: Boolean(product.isFeatured),
  isPopular: Boolean(product.isPopular),
  variants: product.variants?.length ? product.variants.map((entry) => ({ name: entry.name, priceDelta: entry.priceDelta || 0 })) : [{ name: 'Regular', priceDelta: 0 }],
  addons: product.addons?.map((entry) => ({ name: entry.name, price: entry.price || 0 })) || [],
});

function buildFormData(product, file) {
  const data = new FormData();
  data.append('name', product.name.trim());
  data.append('description', product.description.trim());
  data.append('category', product.category);
  data.append('price', String(product.price));
  data.append('compareAtPrice', String(product.compareAtPrice || 0));
  data.append('prepTime', String(product.prepTime || 20));
  data.append('serves', product.serves || '1 person');
  data.append('sortOrder', String(product.sortOrder || 0));
  data.append('isAvailable', String(Boolean(product.isAvailable)));
  data.append('isFeatured', String(Boolean(product.isFeatured)));
  data.append('isPopular', String(Boolean(product.isPopular)));
  data.append('ingredients', JSON.stringify(product.ingredients.map((entry) => entry.trim()).filter(Boolean)));
  data.append('tags', JSON.stringify(product.tags.map((entry) => entry.trim()).filter(Boolean)));
  data.append(
    'variants',
    JSON.stringify(product.variants.map((entry) => ({ name: entry.name.trim(), priceDelta: Number(entry.priceDelta) || 0 })).filter((entry) => entry.name))
  );
  data.append(
    'addons',
    JSON.stringify(product.addons.map((entry) => ({ name: entry.name.trim(), price: Number(entry.price) || 0 })).filter((entry) => entry.name))
  );
  if (file) data.append('image', file);
  else if (product.image) data.append('image', product.image);
  return data;
}

export default function AdminProducts() {
  usePageTitle('Admin products');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');

  const categoriesState = useFetch('/admin/categories');
  const categories = categoriesState.data?.categories || [];

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    return `/admin/products?${params.toString()}`;
  }, [page, search, category]);

  const { data, loading, reload } = useFetch(url, { deps: [url] });
  const products = data?.items || [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
    setFile(null);
    setPreview('');
    setEditorOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(productToForm(product));
    setFile(null);
    setPreview(product.image || '');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setFile(null);
    setPreview('');
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) {
      toast.error('Upload a JPG, PNG or WebP image.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Enter a product name.');
    if (form.description.trim().length < 5) return toast.error('Enter a product description.');
    if (!form.category) return toast.error('Choose a category.');
    if (form.price === '' || Number(form.price) < 0) return toast.error('Enter a valid price.');

    const payload = {
      ...form,
      ingredients: form.ingredients.split(','),
      tags: form.tags.split(','),
      variants: form.variants.filter((entry) => entry.name.trim()),
      addons: form.addons.filter((entry) => entry.name.trim()),
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/products/${editing._id}`, buildFormData(payload, file));
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', buildFormData(payload, file));
        toast.success('Product created');
      }
      setEditorOpen(false);
      setFile(null);
      setPreview('');
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (product, field) => {
    setBusyId(product._id);
    try {
      const payload = {
        ...productToForm(product),
        ingredients: product.ingredients || [],
        tags: product.tags || [],
        [field]: !product[field],
      };
      await api.put(`/admin/products/${product._id}`, buildFormData({ ...payload, image: product.image }, null));
      toast.success(`${product.name} updated`);
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
      await api.delete(`/admin/products/${deleteTarget._id}`);
      toast.success('Product deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const addVariant = () => set('variants', [...form.variants, { name: '', priceDelta: 0 }]);
  const addAddon = () => set('addons', [...form.addons, { name: '', price: 0 }]);

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Menu management"
        title="Products"
        description="Add dishes, upload photos, manage prices, sizes, add-ons and what appears as featured or popular."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
        <Button onClick={openCreate} size="sm" disabled={!categories.length}>
          <Plus size={14} /> Add product
        </Button>
      </AdminHeader>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search products by name or tag…" className="flex-1" />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-semibold text-ink-700 outline-none focus:border-brand-400"
        >
          <option value="all">All categories</option>
          {categories.map((entry) => (
            <option key={entry._id} value={entry._id}>
              {entry.name}
            </option>
          ))}
        </select>
        {(searchInput || category !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setCategory('all');
              setPage(1);
            }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold text-ink-500 transition hover:bg-cream-100 hover:text-brand-600"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <TableShell className="min-w-0">
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Options</Th>
            <Th>Visibility</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <Td colSpan={6}>
                  <div className="skeleton h-10 w-full" />
                </Td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="No products found"
              description="Add your first dish or clear the filters to see the full menu."
            />
          ) : (
            products.map((product) => (
              <tr key={product._id} className="transition hover:bg-cream-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image || placeholderImage}
                      alt=""
                      className="h-12 w-12 rounded-xl border border-ink-900/[0.06] object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-ink-900">{product.name}</p>
                      <p className="truncate text-[10px] text-ink-400">
                        {product.isAvailable ? 'In stock' : 'Unavailable'} · {product.prepTime} min
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="chip bg-cream-100 text-[10px] text-ink-600">{product.category?.name || '—'}</span>
                </Td>
                <Td>
                  <p className="font-bold text-ink-900">{formatPKR(product.price)}</p>
                  {product.compareAtPrice > product.price && (
                    <p className="text-[10px] text-ink-400 line-through">{formatPKR(product.compareAtPrice)}</p>
                  )}
                </Td>
                <Td className="text-[10px] text-ink-500">
                  {product.variants?.length || 0} sizes · {product.addons?.length || 0} add-ons
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusToggle
                      active={product.isAvailable}
                      onClick={() => quickToggle(product, 'isAvailable')}
                      title="Toggle availability"
                    >
                      Available
                    </StatusToggle>
                    <StatusToggle
                      active={product.isFeatured}
                      onClick={() => quickToggle(product, 'isFeatured')}
                      title="Toggle featured"
                    >
                      Featured
                    </StatusToggle>
                    <StatusToggle
                      active={product.isPopular}
                      onClick={() => quickToggle(product, 'isPopular')}
                      title="Toggle popular"
                    >
                      Popular
                    </StatusToggle>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      <div className="flex justify-end">
        <Pagination page={page} pages={data?.pages || 0} total={data?.total} onChange={setPage} />
      </div>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        size="xl"
        title={editing ? `Edit ${editing.name}` : 'Add a new product'}
        description="These details appear on the menu and product page instantly."
      >
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              <Field label="Product name" htmlFor="p-name">
                <Input id="p-name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Zee Signature Double Smash" />
              </Field>
              <Field label="Description" htmlFor="p-description">
                <Textarea
                  id="p-description"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="What makes this dish special?"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="p-category">
                  <Select id="p-category" value={form.category} onChange={(event) => set('category', event.target.value)}>
                    <option value="">Choose category</option>
                    {categories.map((entry) => (
                      <option key={entry._id} value={entry._id}>
                        {entry.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prep time (minutes)" htmlFor="p-prep">
                  <Input id="p-prep" type="number" min="1" max="120" value={form.prepTime} onChange={(event) => set('prepTime', event.target.value)} />
                </Field>
                <Field label="Price (PKR)" htmlFor="p-price">
                  <Input id="p-price" type="number" min="0" value={form.price} onChange={(event) => set('price', event.target.value)} />
                </Field>
                <Field label="Compare-at price (optional)" htmlFor="p-compare" hint="Shows a strikethrough original price.">
                  <Input
                    id="p-compare"
                    type="number"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={(event) => set('compareAtPrice', event.target.value)}
                  />
                </Field>
                <Field label="Serves" htmlFor="p-serves">
                  <Input id="p-serves" value={form.serves} onChange={(event) => set('serves', event.target.value)} placeholder="1 person" />
                </Field>
                <Field label="Sort order" htmlFor="p-sort" hint="Lower numbers appear first.">
                  <Input id="p-sort" type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} />
                </Field>
              </div>
            </div>

            <div>
              <p className="label">Product image</p>
              <div className="overflow-hidden rounded-2xl border border-dashed border-ink-900/15 bg-cream-50">
                <div className="aspect-square w-full bg-cream-100">
                  <img src={preview || placeholderImage} alt="" className="h-full w-full object-cover" />
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-ink-900/10 bg-white px-3 py-2.5 text-[11px] font-bold text-ink-600 transition hover:text-brand-600">
                  <ImagePlus size={14} /> Upload photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} className="sr-only" />
                </label>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-ink-400">JPG, PNG or WebP up to 5 MB. Square photos look best.</p>
              <Field label="Or image URL" htmlFor="p-image" className="mt-3">
                <Input
                  id="p-image"
                  value={form.image}
                  onChange={(event) => {
                    set('image', event.target.value);
                    if (!file) setPreview(event.target.value);
                  }}
                  placeholder="/images/burger.webp"
                />
              </Field>
              <div className="mt-4 space-y-3 rounded-2xl bg-cream-50 p-3">
                <Toggle
                  id="p-available"
                  checked={form.isAvailable}
                  onChange={(checked) => set('isAvailable', checked)}
                  label="Available"
                />
                <Toggle
                  id="p-featured"
                  checked={form.isFeatured}
                  onChange={(checked) => set('isFeatured', checked)}
                  label="Featured"
                />
                <Toggle
                  id="p-popular"
                  checked={form.isPopular}
                  onChange={(checked) => set('isPopular', checked)}
                  label="Popular"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ingredients" htmlFor="p-ingredients" hint="Comma separated. Used by the AI chatbot.">
              <Input
                id="p-ingredients"
                value={form.ingredients}
                onChange={(event) => set('ingredients', event.target.value)}
                placeholder="Beef, cheddar, lettuce, Zee sauce"
              />
            </Field>
            <Field label="Tags" htmlFor="p-tags" hint="Comma separated search tags.">
              <Input id="p-tags" value={form.tags} onChange={(event) => set('tags', event.target.value)} placeholder="bestseller, spicy" />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-900/[0.06] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink-800">Sizes / variants</p>
                <button type="button" onClick={addVariant} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {form.variants.length === 0 && <p className="text-[10px] text-ink-400">No variants — sold as-is.</p>}
                {form.variants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={variant.name}
                      onChange={(event) =>
                        set(
                          'variants',
                          form.variants.map((entry, i) => (i === index ? { ...entry, name: event.target.value } : entry))
                        )
                      }
                      placeholder="Regular"
                      className="input flex-1 py-2 text-xs"
                    />
                    <input
                      type="number"
                      value={variant.priceDelta}
                      onChange={(event) =>
                        set(
                          'variants',
                          form.variants.map((entry, i) => (i === index ? { ...entry, priceDelta: event.target.value } : entry))
                        )
                      }
                      placeholder="+ PKR"
                      className="input w-24 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => set('variants', form.variants.filter((_, i) => i !== index))}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-brand-600"
                      aria-label="Remove variant"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-ink-900/[0.06] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink-800">Add-ons / toppings</p>
                <button type="button" onClick={addAddon} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {form.addons.length === 0 && <p className="text-[10px] text-ink-400">No add-ons for this item.</p>}
                {form.addons.map((addon, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={addon.name}
                      onChange={(event) =>
                        set('addons', form.addons.map((entry, i) => (i === index ? { ...entry, name: event.target.value } : entry)))
                      }
                      placeholder="Extra cheese"
                      className="input flex-1 py-2 text-xs"
                    />
                    <input
                      type="number"
                      value={addon.price}
                      onChange={(event) =>
                        set('addons', form.addons.map((entry, i) => (i === index ? { ...entry, price: event.target.value } : entry)))
                      }
                      placeholder="PKR"
                      className="input w-24 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => set('addons', form.addons.filter((_, i) => i !== index))}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-brand-600"
                      aria-label="Remove add-on"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-ink-900/[0.06] pt-4">
            <Button type="button" variant="outline" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${deleteTarget?.name || 'this product'}?`}
        description="This also removes its reviews. Existing orders keep their history."
        confirmLabel="Delete product"
      />
    </div>
  );
}
