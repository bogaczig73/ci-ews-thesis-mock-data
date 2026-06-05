'use client';

export function PageHeader({ title, subtitle, count, action }) {
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div>
        {subtitle && <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500">{subtitle}</div>}
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {title}
          {count != null && <span className="badge bg-slate-100 text-slate-500 text-sm font-medium">{count}</span>}
        </h1>
      </div>
      <div className="ml-auto flex gap-2">{action}</div>
    </div>
  );
}

export function Modal({ title, children, footer, onClose, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
        {footer && <div className="flex gap-2 pt-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, wide, children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? 'col-span-2' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function ErrBox({ children }) {
  return <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{children}</div>;
}

export function Skeleton({ rows = 6 }) {
  return (
    <div className="card p-4 space-y-3">
      {[...Array(rows)].map((_, i) => <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse" />)}
    </div>
  );
}
