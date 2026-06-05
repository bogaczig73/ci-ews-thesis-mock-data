'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, ErrBox, Skeleton } from '../_components/ui.jsx';

export default function SellersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setRows(await fetch('/api/sellers').then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Sellers" subtitle="Sreality brokers" count={rows.length}
        action={<button onClick={() => setEditing({ user_id: '', active: true })} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New seller</button>} />

      <p className="text-sm text-slate-500">Served at <code className="badge bg-slate-100 text-slate-600 font-mono">GET /cs/v2/seller/{'{user_id}'}</code> — stored as raw JSON.</p>

      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>user_id</th><th>Name</th><th>IČO</th><th>Active</th><th></th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.user_id}>
                    <td className="font-mono text-xs text-slate-500">{s.user_id}</td>
                    <td className="font-medium text-slate-800">{s.user_name ?? '—'}</td>
                    <td className="font-mono text-xs text-slate-500">{s.broker_ico ?? '—'}</td>
                    <td>{s.active
                      ? <span className="badge bg-emerald-50 text-emerald-700">yes</span>
                      : <span className="badge bg-slate-100 text-slate-500">no</span>}</td>
                    <td className="text-right"><button onClick={() => setEditing(s)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit JSON</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-10">No sellers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <SellerModal seller={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function SellerModal({ seller, onClose, onSaved }) {
  const [text, setText] = useState(JSON.stringify(seller, null, 2));
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    let payload;
    try { payload = JSON.parse(text); } catch { setErr('Invalid JSON'); return; }
    if (payload.user_id == null || payload.user_id === '') { setErr('user_id is required'); return; }
    const res = await fetch('/api/sellers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() {
    if (!seller.user_id || !confirm('Delete this seller?')) return;
    await fetch(`/api/sellers/${seller.user_id}`, { method: 'DELETE' });
    onSaved();
  }

  return (
    <Modal onClose={onClose} wide title="Seller JSON"
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {seller.user_id !== '' && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="inp font-mono text-xs leading-relaxed" rows={20} spellCheck={false} />
    </Modal>
  );
}
