// Minimal inline icon set (stroke-based, inherits currentColor). No deps.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  home: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></svg>),
  users: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>),
  rss: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="6" cy="18" r="1.6" /><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" /></svg>),
  briefcase: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>),
  code: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="m9 8-4 4 4 4M15 8l4 4-4 4" /></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>),
  external: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>),
  spark: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>),
  db: (p) => (<svg viewBox="0 0 24 24" {...base} {...p}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>),
};
