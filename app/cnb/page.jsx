'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, ErrBox, Skeleton } from '../_components/ui.jsx';

const PERIODS = ['ONE_DAY', 'ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH', 'THREE_MONTH', 'SIX_MONTH', 'NINE_MONTH', 'ONE_YEAR'];

const emptyPribor = { valid_for: '', period: 'ONE_DAY', pribid: '', pribor: '' };
const emptyOmo = {
  operation_type: '', liquidity_impact: '', trade_date: '', settlement_date: '', maturity_date: '',
  marginal_rate_in_percent: '', total_bid_volume_in_czk_bln: '', total_number_of_bids: '',
  minimum_bid_rate_in_percent: '', average_bid_rate_in_percent: '', maximum_bid_rate_in_percent: '',
  total_alloted_volume_in_czk_bln: '', total_number_of_alloted_bids: '', minimum_alloted_rate_in_percent: '',
  average_alloted_rate_in_percent: '', maximum_alloted_rate_in_percent: '', allotment_percentage: '',
};

export default function CnbPage() {
  const [tab, setTab] = useState('pribor');
  return (
    <div className="space-y-5">
      <PageHeader title="ČNB" subtitle="Czech National Bank" />
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[['pribor', 'PRIBOR'], ['omo', 'Open-market ops']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'pribor' ? <PriborTab /> : <OmoTab />}
    </div>
  );
}

// ---- PRIBOR ------------------------------------------------------------

function PriborTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setRows(await fetch('/api/cnb/pribor').then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...emptyPribor })} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New fixing</button>
      </div>
      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>validFor</th><th>period</th><th>pribid</th><th className="text-right">pribor %</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500">{r.valid_for}</td>
                    <td><span className="badge bg-rose-50 text-rose-700">{r.period}</span></td>
                    <td className="text-xs text-slate-400">{r.pribid ?? '—'}</td>
                    <td className="text-right tabular-nums font-medium">{r.pribor}</td>
                    <td className="text-right"><button onClick={() => setEditing(r)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-10">No PRIBOR rows.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <PriborModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function PriborModal({ row, onClose, onSaved }) {
  const isCreate = row.id == null;
  const [form, setForm] = useState({ ...row, valid_for: dstr(row.valid_for), pribid: row.pribid ?? '', pribor: row.pribor ?? '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr('');
    const payload = { valid_for: form.valid_for || null, period: form.period, pribid: form.pribid || null, pribor: numOrNull(form.pribor) };
    const res = isCreate
      ? await fetch('/api/cnb/pribor', { method: 'POST', headers: J, body: JSON.stringify(payload) })
      : await fetch(`/api/cnb/pribor/${row.id}`, { method: 'PATCH', headers: J, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() { if (!confirm('Delete this fixing?')) return; await fetch(`/api/cnb/pribor/${row.id}`, { method: 'DELETE' }); onSaved(); }

  return (
    <Modal onClose={onClose} title={isCreate ? 'New PRIBOR fixing' : `Edit ${form.period} @ ${dstr(row.valid_for)}`}
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!isCreate && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="validFor"><input type="date" value={form.valid_for} onChange={(e) => set('valid_for', e.target.value)} className="inp" /></Field>
        <Field label="period">
          <select value={form.period} onChange={(e) => set('period', e.target.value)} className="inp">
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="pribor (% p.a.)"><input type="number" step="0.01" value={form.pribor} onChange={(e) => set('pribor', e.target.value)} className="inp" /></Field>
        <Field label="pribid (usually null)"><input value={form.pribid} onChange={(e) => set('pribid', e.target.value)} className="inp" /></Field>
      </div>
    </Modal>
  );
}

// ---- OMO ---------------------------------------------------------------

function OmoTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setRows(await fetch('/api/cnb/omo').then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...emptyOmo })} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New operation</button>
      </div>
      {loading ? <Skeleton /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>tradeDate</th><th>type</th><th>impact</th><th className="text-right">marginal %</th><th className="text-right">alloted (CZK bln)</th><th className="text-right">allot %</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500">{r.trade_date}</td>
                    <td className="font-medium text-slate-800">{r.operation_type}</td>
                    <td className="text-xs">{r.liquidity_impact}</td>
                    <td className="text-right tabular-nums">{r.marginal_rate_in_percent}</td>
                    <td className="text-right tabular-nums">{r.total_alloted_volume_in_czk_bln}</td>
                    <td className="text-right tabular-nums">{r.allotment_percentage}</td>
                    <td className="text-right"><button onClick={() => setEditing(r)} className="text-slate-400 hover:text-indigo-600 font-medium">Edit</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-10">No operations.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <OmoModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

const OMO_NUM_FIELDS = [
  ['marginal_rate_in_percent', 'marginal rate %'],
  ['total_bid_volume_in_czk_bln', 'total bid vol (CZK bln)'],
  ['total_number_of_bids', 'number of bids'],
  ['minimum_bid_rate_in_percent', 'min bid rate %'],
  ['average_bid_rate_in_percent', 'avg bid rate %'],
  ['maximum_bid_rate_in_percent', 'max bid rate %'],
  ['total_alloted_volume_in_czk_bln', 'alloted vol (CZK bln)'],
  ['total_number_of_alloted_bids', 'alloted bids'],
  ['minimum_alloted_rate_in_percent', 'min alloted rate %'],
  ['average_alloted_rate_in_percent', 'avg alloted rate %'],
  ['maximum_alloted_rate_in_percent', 'max alloted rate %'],
  ['allotment_percentage', 'allotment %'],
];
const OMO_INT_FIELDS = new Set(['total_number_of_bids', 'total_number_of_alloted_bids']);

function OmoModal({ row, onClose, onSaved }) {
  const isCreate = row.id == null;
  const init = { ...row };
  for (const [k] of OMO_NUM_FIELDS) init[k] = row[k] ?? '';
  ['trade_date', 'settlement_date', 'maturity_date'].forEach((k) => { init[k] = dstr(row[k]); });
  const [form, setForm] = useState(init);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr('');
    const payload = {
      operation_type: form.operation_type,
      liquidity_impact: form.liquidity_impact || null,
      trade_date: form.trade_date || null,
      settlement_date: form.settlement_date || null,
      maturity_date: form.maturity_date || null,
    };
    for (const [k] of OMO_NUM_FIELDS) payload[k] = numOrNull(form[k]);
    const res = isCreate
      ? await fetch('/api/cnb/omo', { method: 'POST', headers: J, body: JSON.stringify(payload) })
      : await fetch(`/api/cnb/omo/${row.id}`, { method: 'PATCH', headers: J, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json()).error || 'Save failed'); return; }
    onSaved();
  }
  async function del() { if (!confirm('Delete this operation?')) return; await fetch(`/api/cnb/omo/${row.id}`, { method: 'DELETE' }); onSaved(); }

  return (
    <Modal onClose={onClose} wide title={isCreate ? 'New operation' : `Edit ${form.operation_type} @ ${dstr(row.trade_date)}`}
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!isCreate && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      {err && <ErrBox>{err}</ErrBox>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="operationType"><input value={form.operation_type} onChange={(e) => set('operation_type', e.target.value)} className="inp" placeholder="Repo / Depozitní facilita" /></Field>
        <Field label="liquidityImpact"><input value={form.liquidity_impact} onChange={(e) => set('liquidity_impact', e.target.value)} className="inp" placeholder="Stažení / Dodání" /></Field>
        <Field label="tradeDate"><input type="date" value={form.trade_date} onChange={(e) => set('trade_date', e.target.value)} className="inp" /></Field>
        <Field label="settlementDate"><input type="date" value={form.settlement_date} onChange={(e) => set('settlement_date', e.target.value)} className="inp" /></Field>
        <Field label="maturityDate"><input type="date" value={form.maturity_date} onChange={(e) => set('maturity_date', e.target.value)} className="inp" /></Field>
        <div />
        {OMO_NUM_FIELDS.map(([k, label]) => (
          <Field key={k} label={label}>
            <input type="number" step={OMO_INT_FIELDS.has(k) ? '1' : '0.001'} value={form[k]} onChange={(e) => set(k, e.target.value)} className="inp" />
          </Field>
        ))}
      </div>
    </Modal>
  );
}

// ---- helpers -----------------------------------------------------------

const J = { 'Content-Type': 'application/json' };
function dstr(d) { return d ? String(d).slice(0, 10) : ''; }
function numOrNull(v) { return v === '' || v == null ? null : Number(v); }
