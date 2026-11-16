import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { AdminHeader, Pagination, SearchBox, StatCard, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { formatDate, formatPKR, initials } from '../../lib/format';
import Button from '../../components/ui/Button';

export default function AdminCustomers() {
  usePageTitle('Admin customers');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    return `/admin/customers?${params.toString()}`;
  }, [page, search]);

  const { data, loading, reload } = useFetch(url, { deps: [url] });
  const customers = data?.customers || [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const pageSpend = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
  const repeatCustomers = customers.filter((customer) => customer.orderCount > 1).length;

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="People"
        title="Customers"
        description="Everyone who has registered on Zee Foods, with their lifetime spend and order history."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
      </AdminHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Customers" value={data?.total ?? '—'} hint="Registered accounts" accent="brand" />
        <StatCard icon={Users} label="Repeat customers" value={repeatCustomers} hint="On this page · 2+ orders" accent="emerald" />
        <StatCard icon={Users} label="Revenue · this page" value={formatPKR(pageSpend)} hint="Lifetime spend of listed customers" accent="accent" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by name, email or phone…" className="flex-1" />
        {search && (
          <p className="text-[11px] font-semibold text-ink-400">
            Results for “{search}”
            <button type="button" onClick={() => setSearchInput('')} className="ml-2 font-bold text-brand-600">
              Clear
            </button>
          </p>
        )}
      </div>

      <TableShell>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Contact</Th>
            <Th>Orders</Th>
            <Th>Total spent</Th>
            <Th>Last order</Th>
            <Th>Joined</Th>
            <Th className="text-right">Profile</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <Td colSpan={7}>
                  <div className="skeleton h-9 w-full" />
                </Td>
              </tr>
            ))
          ) : customers.length === 0 ? (
            <TableEmpty colSpan={7} title="No customers found" description="Try a different search, or wait for your first sign-up." />
          ) : (
            customers.map((customer) => (
              <tr key={customer._id} className="transition hover:bg-cream-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-bold text-cream-50">
                      {initials(customer.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-ink-900">{customer.name}</p>
                      <p className="truncate text-[10px] text-ink-400">{customer.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-[11px] text-ink-600">{customer.phone || '—'}</Td>
                <Td>
                  <span className="chip bg-cream-100 text-[10px] text-ink-700">{customer.orderCount}</span>
                </Td>
                <Td className="text-[11px] font-bold text-ink-900">{formatPKR(customer.totalSpent)}</Td>
                <Td className="text-[10px] text-ink-500">{customer.lastOrderAt ? formatDate(customer.lastOrderAt, { time: false }) : 'No orders yet'}</Td>
                <Td className="text-[10px] text-ink-500">{formatDate(customer.createdAt, { time: false })}</Td>
                <Td>
                  <div className="flex justify-end">
                    <Link
                      to={`/admin/customers/${customer._id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 px-2.5 py-1.5 text-[10px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-600"
                    >
                      View <ArrowUpRight size={11} />
                    </Link>
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
    </div>
  );
}
