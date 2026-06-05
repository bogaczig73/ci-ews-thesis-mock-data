'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, ErrBox, Skeleton } from '../_components/ui.jsx';

const empty = { ico: '', obchodni_jmeno: '', dic: '', pravni_forma: '', datum_vzniku: '', datum_zaniku: '', sidlo: '', nace: '', financni_urad: '', is_active: true };

export default function AresPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setRows(await fetch('/api/ares').then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const shown = rows.filter((s) => !q.trim() || [s.obchodni_jmeno, s.ico].some((x) => String(x ?? '').toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-5">
      <PageHeader title="ARES" subtitle="Economic subjects" count={rows.length}
        action={<button onClick={() => setEditing({ ...empty })} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New subject</button>} />

      <div className="relative">
        <Icon.search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or IČO…" className="inp pl-9" />
      </div>

      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>IČO</th><th>Obchodní jméno</th><th>NACE</th><th>Stav</th><th></th></tr></thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.ico}>
                    <td className="font-mono text-xs text-slate-500">{s.ico}</td>
                    <td className="font-medium text-slate-800">{s.obchodni_jmeno}</td>
                    <td className="text-xs">{(s.nace || []).map((n) => <span key={n} className="badge bg-cyan-50 text-cyan-700 mr-1">{n}</span>)}</td>
                    <td>{s.is_active
                      ? <span className="badge bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> aktivní</span>
                      : <span className="badge bg-slate-100 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> zaniklý</span>}</td>
                    <td className="text-right"><button onClick={() => setEditing(s)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-10">No subjects match.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <SubjectModal subject={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function jf(v) { return v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v, null, 0)); }
function dstr(d) { return d ? String(d).slice(0, 10) : ''; }

function SubjectModal({ subject, onClose, onSaved }) {
  const isCreate = subject.ico === '';
  const [form, setForm] = useState({
    ...subject,
    datum_vzniku: dstr(subject.datum_vzniku),
    datum_zaniku: dstr(subject.datum_zaniku),
    sidlo: jf(subject.sidlo),
    nace: Array.isArray(subject.nace) ? subject.nace.join(', ') : (subject.nace ?? ''),
  });
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr('');
    let sidlo = null;
    if (form.sidlo && form.sidlo.trim()) { try { sidlo = JSON.parse(form.sidlo); } catch { setErr('sidlo must be valid JSON'); return; } }
    const payload = {
      ...form,
      datum_vzniku: form.datum_vzniku || null,
      datum_zaniku: form.datum_zaniku || null,
      sidlo,
      nace: form.nace.split(',').map((x) => x.trim()).filter(Boolean),
      is_active: !!form.is_active,
    };
    const res = isCreate
      ? await fetch('/api/ares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/ares/${subject.ico}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() { if (!confirm('Delete this subject?')) return; await fetch(`/api/ares/${subject.ico}`, { method: 'DELETE' }); onSaved(); }

  return (
    <Modal onClose={onClose} wide title={isCreate ? 'New subject' : `Edit ${subject.obchodni_jmeno}`}
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!isCreate && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="IČO"><input disabled={!isCreate} value={form.ico} onChange={(e) => set('ico', e.target.value)} className="inp" /></Field>
        <Field label="DIČ"><input value={form.dic ?? ''} onChange={(e) => set('dic', e.target.value)} className="inp" /></Field>
        <Field label="obchodní jméno" wide><input value={form.obchodni_jmeno ?? ''} onChange={(e) => set('obchodni_jmeno', e.target.value)} className="inp" /></Field>
        <Field label="právní forma (kód)"><input value={form.pravni_forma ?? ''} onChange={(e) => set('pravni_forma', e.target.value)} className="inp" /></Field>
        <Field label="NACE (čárkou)"><input value={form.nace} onChange={(e) => set('nace', e.target.value)} className="inp" /></Field>
        <Field label="datum vzniku"><input type="date" value={form.datum_vzniku} onChange={(e) => set('datum_vzniku', e.target.value)} className="inp" /></Field>
        <Field label="datum zániku"><input type="date" value={form.datum_zaniku} onChange={(e) => set('datum_zaniku', e.target.value)} className="inp" /></Field>
        <Field label="finanční úřad" wide><input value={form.financni_urad ?? ''} onChange={(e) => set('financni_urad', e.target.value)} className="inp" /></Field>
        <Field label="sídlo (JSON)" wide><textarea value={form.sidlo} onChange={(e) => set('sidlo', e.target.value)} className="inp font-mono text-xs" rows={3} /></Field>
        <label className="flex items-center gap-2 col-span-2 text-sm text-slate-600"><input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-indigo-600" /> aktivní subjekt</label>
      </div>
    </Modal>
  );
}
