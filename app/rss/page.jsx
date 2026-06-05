'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../_components/icons.jsx';
import { PageHeader, Modal, Field, Skeleton } from '../_components/ui.jsx';

const SOURCES = [
  ['psp', 'PSP.cz', 'bg-blue-500', 'ring-blue-200 text-blue-700 bg-blue-50'],
  ['mmr', 'MMR', 'bg-amber-500', 'ring-amber-200 text-amber-700 bg-amber-50'],
  ['csu', 'ČSÚ', 'bg-violet-500', 'ring-violet-200 text-violet-700 bg-violet-50'],
  ['cnb', 'ČNB', 'bg-rose-500', 'ring-rose-200 text-rose-700 bg-rose-50'],
];

const emptyItem = { title: '', description: '', link: '', guid: '', guid_is_permalink: false, pub_date: '' };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RssPage() {
  const [source, setSource] = useState('psp');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const year = new Date().getFullYear();
  const [period, setPeriod] = useState({ month: '', week: '', day: '' }); // '' = any

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('source');
    if (q && SOURCES.some(([s]) => s === q)) setSource(q);
  }, []);

  // Build the m/w/d path from the period (stops at the first unset level).
  const periodPath = (() => {
    if (!period.month) return '';
    let p = `/m${period.month}`;
    if (period.week) { p += `/w${period.week}`; if (period.day) p += `/d${period.day}`; }
    return p;
  })();
  const feedUrl = `/rss/${source}${periodPath}`;

  async function load() {
    setLoading(true);
    if (periodPath) {
      const data = await fetch(`/rss/${source}${periodPath}?format=json&year=${year}`).then((r) => r.json());
      setItems(data.items || []);
    } else {
      setItems(await fetch(`/api/rss/${source}`).then((r) => r.json()));
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [source, periodPath]);

  return (
    <div className="space-y-5">
      <PageHeader title="RSS feeds" subtitle="PSP · MMR · ČSÚ · ČNB"
        action={<button onClick={() => setEditing({ ...emptyItem })} className="btn btn-primary"><Icon.plus className="w-4 h-4" /> New item</button>} />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100/80 gap-1">
          {SOURCES.map(([s, label, dot]) => (
            <button key={s} onClick={() => setSource(s)}
              className={`flex items-center gap-2 text-sm px-3.5 py-1.5 rounded-xl transition
                ${source === s ? 'bg-white shadow-sm font-medium text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
            </button>
          ))}
        </div>
        <a href={`${feedUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost ml-auto text-sm">
          <Icon.external className="w-4 h-4" /> open XML
        </a>
      </div>

      {/* Time drill-down: month / week-of-month / day-of-week */}
      <div className="card p-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">Time filter</span>
        <Sel value={period.month} onChange={(v) => setPeriod({ month: v, week: '', day: '' })}
          placeholder="Month" options={MONTHS.map((m, i) => [String(i + 1), `m${i + 1} · ${m}`])} />
        <Sel value={period.week} disabled={!period.month} onChange={(v) => setPeriod((p) => ({ ...p, week: v, day: '' }))}
          placeholder="Week" options={[1, 2, 3, 4, 5].map((w) => [String(w), `w${w} · days ${(w - 1) * 7 + 1}–${w * 7}`])} />
        <Sel value={period.day} disabled={!period.week} onChange={(v) => setPeriod((p) => ({ ...p, day: v }))}
          placeholder="Day" options={[1, 2, 3, 4, 5, 6, 7].map((d) => [String(d), `d${d}`])} />
        {period.month && (
          <button onClick={() => setPeriod({ month: '', week: '', day: '' })} className="btn btn-soft text-xs">Clear</button>
        )}
        <code className="ml-auto text-xs text-slate-400 font-mono truncate">{feedUrl}{periodPath ? `  ·  ${year}` : ''}</code>
      </div>

      {loading ? <Skeleton /> : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{items.length} items</p>
          {items.map((it) => (
            <button key={it.id} onClick={() => setEditing(it)}
              className="card card-hover w-full text-left p-4 flex gap-4 items-start">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-slate-100 text-slate-400 shrink-0">
                <Icon.rss className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{it.title}</p>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{it.description}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                  <span>{it.pub_date ? new Date(it.pub_date).toLocaleString('cs-CZ') : '—'}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono truncate">{it.guid}</span>
                </p>
              </div>
              <span className="text-slate-300 group-hover:text-indigo-600 text-sm shrink-0">Edit</span>
            </button>
          ))}
          {items.length === 0 && <div className="card p-10 text-center text-slate-400">No items in this feed.</div>}
        </div>
      )}

      {editing && <ItemModal source={source} item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function Sel({ value, onChange, placeholder, options, disabled }) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-300
                 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
      <option value="">{placeholder}: any</option>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}

function toLocalInput(d) { if (!d) return ''; const dt = new Date(d); const off = dt.getTimezoneOffset(); return new Date(dt - off * 60000).toISOString().slice(0, 16); }

function ItemModal({ source, item, onClose, onSaved }) {
  const creating = !item.id;
  const [form, setForm] = useState({ ...item, pub_date: toLocalInput(item.pub_date) });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const payload = { ...form, pub_date: form.pub_date ? new Date(form.pub_date).toISOString() : null };
    if (creating) await fetch(`/api/rss/${source}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else await fetch(`/api/rss/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    onSaved();
  }
  async function del() { if (!confirm('Delete this item?')) return; await fetch(`/api/rss/items/${item.id}`, { method: 'DELETE' }); onSaved(); }

  return (
    <Modal onClose={onClose} wide title={creating ? `New ${source.toUpperCase()} item` : 'Edit item'}
      footer={<>
        <button onClick={save} className="btn btn-primary">Save</button>
        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        {!creating && <button onClick={del} className="btn btn-danger ml-auto">Delete</button>}
      </>}>
      <div className="space-y-3">
        <Field label="title"><input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} className="inp" /></Field>
        <Field label="description"><textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className="inp" rows={3} /></Field>
        <Field label="link"><input value={form.link ?? ''} onChange={(e) => set('link', e.target.value)} className="inp" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="guid"><input value={form.guid ?? ''} onChange={(e) => set('guid', e.target.value)} className="inp" /></Field>
          <Field label="pubDate"><input type="datetime-local" value={form.pub_date ?? ''} onChange={(e) => set('pub_date', e.target.value)} className="inp" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!form.guid_is_permalink} onChange={(e) => set('guid_is_permalink', e.target.checked)} className="accent-indigo-600" /> guid isPermaLink</label>
      </div>
    </Modal>
  );
}
