'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, ErrBox, Skeleton } from '../_components/ui.jsx';

const empty = { id: '', name: '', url: '', logo_small: '', locality: '' };

export default function AgenciesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [pg, setPg] = useState({ page: 1, per_page: 5, total: 0, total_pages: 1, has_prev: false, has_next: false });

  async function load() {
    setLoading(true);
    // Paginated mode (per_page capped at 5 server-side) — simulates a real companies API.
    const res = await fetch(`/api/agencies?page=${page}`).then((r) => r.json());
    setRows(res.data ?? []);
    setPg(res.pagination ?? { page: 1, per_page: 5, total: (res.data ?? []).length, total_pages: 1, has_prev: false, has_next: false });
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  // If the current page emptied out (e.g. after a delete), step back.
  useEffect(() => { if (!loading && rows.length === 0 && page > 1) setPage((p) => p - 1); }, [loading, rows, page]);

  const from = pg.total === 0 ? 0 : (pg.page - 1) * pg.per_page + 1;
  const to = (pg.page - 1) * pg.per_page + rows.length;

  return (
    <div className="space-y-5">
      <PageHeader title="Agencies" subtitle="Sreality" count={pg.total}
        action={<button onClick={() => setEditing(empty)} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New agency</button>} />

      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>id</th><th>Name</th><th>Locality</th><th>Slug / URL</th><th>Adverts</th><th></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs text-slate-400">{a.id}</td>
                    <td className="font-medium text-slate-800">{a.name}</td>
                    <td className="text-slate-500">{a.locality ?? '—'}</td>
                    <td className="text-slate-500">{a.url}</td>
                    <td><span className="badge bg-emerald-50 text-emerald-700">{a.num_adverts}</span></td>
                    <td className="text-right"><button onClick={() => setEditing(a)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-10">No agencies yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">
              {from}–{to} of {pg.total} · page {pg.page}/{pg.total_pages} · {pg.per_page}/page
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={!pg.has_prev}
                className="btn btn-soft text-xs disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!pg.has_next}
                className="btn btn-soft text-xs disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      )}

      {editing && <AgencyModal agency={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AgencyModal({ agency, onClose, onSaved }) {
  const creating = agency.id === '';
  const [form, setForm] = useState(agency);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr('');
    const payload = { ...form, id: Number(form.id) };
    const res = creating
      ? await fetch('/api/agencies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/agencies/${agency.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() {
    if (!confirm('Delete this agency?')) return;
    const res = await fetch(`/api/agencies/${agency.id}`, { method: 'DELETE' });
    if (!res.ok) { setErr((await res.json()).error || 'Delete failed'); return; }
    onSaved();
  }

  return (
    <Modal onClose={onClose} title={creating ? 'New agency' : `Edit ${agency.name}`}
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!creating && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <div className="space-y-3">
        <Field label="id"><input disabled={!creating} value={form.id} onChange={(e) => set('id', e.target.value)} className="inp" /></Field>
        <Field label="name"><input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="inp" /></Field>
        <Field label="locality"><input value={form.locality ?? ''} onChange={(e) => set('locality', e.target.value)} placeholder="leave empty to auto-derive from listings" className="inp" /></Field>
        <Field label="url / slug"><input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} className="inp" /></Field>
        <Field label="logo_small"><input value={form.logo_small ?? ''} onChange={(e) => set('logo_small', e.target.value)} className="inp" /></Field>
      </div>
    </Modal>
  );
}
