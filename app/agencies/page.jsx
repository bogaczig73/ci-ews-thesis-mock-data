'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, ErrBox, Skeleton } from '../_components/ui.jsx';

const empty = { id: '', name: '', url: '', logo_small: '' };

export default function AgenciesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setRows(await fetch('/api/agencies').then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Agencies" subtitle="Sreality" count={rows.length}
        action={<button onClick={() => setEditing(empty)} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New agency</button>} />

      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>id</th><th>Name</th><th>Slug / URL</th><th>Listings</th><th></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs text-slate-400">{a.id}</td>
                    <td className="font-medium text-slate-800">{a.name}</td>
                    <td className="text-slate-500">{a.url}</td>
                    <td><span className="badge bg-emerald-50 text-emerald-700">{a.listing_count}</span></td>
                    <td className="text-right"><button onClick={() => setEditing(a)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-10">No agencies yet.</td></tr>}
              </tbody>
            </table>
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
        <Field label="url / slug"><input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} className="inp" /></Field>
        <Field label="logo_small"><input value={form.logo_small ?? ''} onChange={(e) => set('logo_small', e.target.value)} className="inp" /></Field>
      </div>
    </Modal>
  );
}
