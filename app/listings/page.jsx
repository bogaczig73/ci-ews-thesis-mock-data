'use client';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, ErrBox, Skeleton } from '../_components/ui.jsx';

const CATEGORY = { 1: 'apartment', 2: 'house', 3: 'land', 4: 'commercial', 5: 'other' };
const TYPE = { 1: 'sale', 2: 'rent', 3: 'auction' };

const empty = {
  hash_id: '', company_id: '', category: 1, type: 1, name: '', locality: '',
  price: '', price_czk: '', auction_price: '', attractive_offer: 0, region_tip: 0, is_new: false, gps: '',
};

export default function ListingsPage() {
  const [rows, setRows] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const [l, a] = await Promise.all([
      fetch('/api/listings').then((r) => r.json()),
      fetch('/api/agencies').then((r) => r.json()),
    ]);
    setRows(l); setAgencies(a); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const agencyName = useMemo(() => Object.fromEntries(agencies.map((a) => [a.id, a.name])), [agencies]);
  const shown = rows.filter((r) => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return [r.name, r.locality, agencyName[r.company_id]].some((x) => String(x ?? '').toLowerCase().includes(f));
  });

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShown = shown.length > 0 && shown.every((r) => selected.has(r.hash_id));
  const toggleAll = () => setSelected(allShown ? new Set() : new Set(shown.map((r) => r.hash_id)));

  async function bulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} listing(s)?`)) return;
    await fetch('/api/listings/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash_ids: [...selected], action: 'delete' }),
    });
    setSelected(new Set()); load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Listings" subtitle="Sreality" count={rows.length}
        action={<button onClick={() => setEditing(empty)} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New listing</button>} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Icon.search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, locality, agency…" className="inp pl-9" />
        </div>
        {selected.size > 0 && (
          <button onClick={bulkDelete} className="btn btn-danger whitespace-nowrap">Delete {selected.size}</button>
        )}
      </div>

      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-10"><input type="checkbox" checked={allShown} onChange={toggleAll} className="accent-indigo-600" /></th>
                  <th>hash_id</th><th>Name</th><th>Locality</th><th>Agency</th><th>Category</th><th className="text-right">Price</th><th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.hash_id} className={selected.has(r.hash_id) ? 'bg-indigo-50/60' : ''}>
                    <td><input type="checkbox" checked={selected.has(r.hash_id)} onChange={() => toggle(r.hash_id)} className="accent-indigo-600" /></td>
                    <td className="font-mono text-xs text-slate-400">{r.hash_id}</td>
                    <td className="font-medium text-slate-800 max-w-xs truncate">{r.name}</td>
                    <td className="text-slate-500">{r.locality}</td>
                    <td>{agencyName[r.company_id] ? <span className="badge bg-slate-100 text-slate-600">{agencyName[r.company_id]}</span> : <span className="text-slate-300">—</span>}</td>
                    <td><span className="badge bg-indigo-50 text-indigo-600">{CATEGORY[r.category] ?? r.category}</span> <span className="badge bg-slate-100 text-slate-500">{TYPE[r.type] ?? r.type}</span></td>
                    <td className="text-right tabular-nums font-medium">{r.price?.toLocaleString('cs-CZ')}</td>
                    <td className="text-right"><button onClick={() => setEditing(r)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-10">No listings match.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <ListingModal listing={editing} agencies={agencies} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function jsonField(v) { return v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v)); }
function parseJson(s) { if (!s || !String(s).trim()) return null; try { return JSON.parse(s); } catch { return s; } }

function ListingModal({ listing, agencies, onClose, onSaved }) {
  const creating = listing.hash_id === '';
  const [form, setForm] = useState({
    ...listing,
    price_czk: jsonField(listing.price_czk),
    auction_price: jsonField(listing.auction_price),
    gps: jsonField(listing.gps),
  });
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr('');
    const payload = {
      ...form, hash_id: Number(form.hash_id),
      company_id: form.company_id === '' ? null : Number(form.company_id),
      category: Number(form.category), type: Number(form.type),
      price: form.price === '' ? null : Number(form.price),
      attractive_offer: Number(form.attractive_offer) || 0,
      region_tip: Number(form.region_tip) || 0,
      is_new: !!form.is_new,
      price_czk: parseJson(form.price_czk), auction_price: parseJson(form.auction_price), gps: parseJson(form.gps),
    };
    const res = creating
      ? await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/listings/${listing.hash_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() {
    if (!confirm('Delete this listing?')) return;
    await fetch(`/api/listings/${listing.hash_id}`, { method: 'DELETE' });
    onSaved();
  }

  return (
    <Modal onClose={onClose} title={creating ? 'New listing' : `Edit ${listing.hash_id}`} wide
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!creating && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="hash_id"><input disabled={!creating} value={form.hash_id} onChange={(e) => set('hash_id', e.target.value)} className="inp" /></Field>
        <Field label="Agency">
          <select value={form.company_id ?? ''} onChange={(e) => set('company_id', e.target.value)} className="inp">
            <option value="">— none —</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </select>
        </Field>
        <Field label="Name" wide><input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="inp" /></Field>
        <Field label="Locality" wide><input value={form.locality ?? ''} onChange={(e) => set('locality', e.target.value)} className="inp" /></Field>
        <Field label="Category">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className="inp">
            {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="inp">
            {Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
          </select>
        </Field>
        <Field label="Price"><input type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} className="inp" /></Field>
        <Field label="Flags">
          <label className="flex items-center gap-2 h-9 text-sm text-slate-600"><input type="checkbox" checked={!!form.is_new} onChange={(e) => set('is_new', e.target.checked)} className="accent-indigo-600" /> is_new</label>
        </Field>
        <Field label="attractive_offer"><input type="number" value={form.attractive_offer ?? 0} onChange={(e) => set('attractive_offer', e.target.value)} className="inp" /></Field>
        <Field label="region_tip"><input type="number" value={form.region_tip ?? 0} onChange={(e) => set('region_tip', e.target.value)} className="inp" /></Field>
        <Field label="price_czk (JSON)" wide><textarea value={form.price_czk} onChange={(e) => set('price_czk', e.target.value)} className="inp font-mono text-xs" rows={2} /></Field>
        <Field label="gps (JSON)" wide><textarea value={form.gps} onChange={(e) => set('gps', e.target.value)} className="inp font-mono text-xs" rows={2} /></Field>
        <Field label="auction_price (JSON or number)" wide><textarea value={form.auction_price} onChange={(e) => set('auction_price', e.target.value)} className="inp font-mono text-xs" rows={1} /></Field>
      </div>
    </Modal>
  );
}
