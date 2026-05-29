/**
 * examinerCSS.js — Shared theme CSS for all sub-pages
 * 
 * USAGE:
 *   import { getCSS } from "./examinerCSS";
 *   // inside your component:
 *   <style>{getCSS()}</style>
 *
 * All font sizes are >= 13px. Labels >= 13px. Body text >= 14px.
 * Works in both light and dark mode using CSS custom properties from body[data-theme].
 */

export function getCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');

/* ============================================================
   SHARED SUB-PAGE BASE
   All tokens inherit from body[data-theme] set in App.jsx
   ============================================================ */

/* Re-expose App-level tokens locally for convenience */
.examiner-app, .mc-app, .rc-app, .headclerk-app {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-base);
  min-height: 100vh;
  -webkit-tap-highlight-color: transparent;
}

.mono { font-family: 'DM Mono', monospace; }

/* ── HEADER (sub-page) ── */
.hdr {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: sticky;
  top: 60px; /* below main nav */
  z-index: 100;
  backdrop-filter: blur(8px);
}

.hdr-logo {
  font-size: 16px;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 0.5px;
}

.hdr-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 1px;
  font-family: 'DM Mono', monospace;
}

.auth-area {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── TABS ── */
.tabs {
  display: flex;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  padding: 4px 12px 0;
  gap: 2px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  color: var(--text-muted);
  white-space: nowrap;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.tab:hover { color: var(--text-primary); }
.tab.act   { color: var(--gold); border-bottom-color: var(--gold); }

/* ── PANE ── */
.pane {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* ── CARD ── */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-card);
}

.ctitle {
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-family: 'DM Mono', monospace;
}

/* ── FORM FIELDS ── */
.fg {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.lbl {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.2px;
}

.inp {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 11px 14px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  width: 100%;
  transition: border-color 0.15s, background 0.15s;
  -webkit-appearance: none;
  appearance: none;
}

.inp:focus { border-color: var(--gold); background: var(--bg-surface); }
.inp::placeholder { color: var(--text-muted); }
select.inp { cursor: pointer; }

.frow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

/* ── BUTTONS ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.18s;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.btn-g   { background: var(--gold); color: #000; border-color: var(--gold); }
.btn-g:hover { filter: brightness(1.1); }
.btn-g:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-o   { background: transparent; color: var(--text-secondary); border-color: var(--border); }
.btn-o:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }

.btn-r   { background: transparent; color: #F87171; border-color: #F87171; }
.btn-r:hover { background: rgba(248,113,113,0.12); }

.btn-edit { background: rgba(96,165,250,0.1); border-color: #60A5FA; color: #60A5FA; }
.btn-edit:hover { background: #60A5FA; color: #000; }

.btn-sm { padding: 7px 12px; font-size: 13px; }

/* ── BADGES ── */
.bdg {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  font-family: 'DM Mono', monospace;
}
.bdg-g { background: rgba(52,211,153,0.12); color: #34D399; border: 1px solid #34D399; }
.bdg-a { background: rgba(244,200,66,0.12);  color: var(--gold); border: 1px solid var(--gold); }
.bdg-b { background: rgba(96,165,250,0.12);  color: #60A5FA; border: 1px solid #60A5FA; }
.bdg-r { background: rgba(248,113,113,0.12); color: #F87171; border: 1px solid #F87171; }
.bdg-p { background: rgba(192,132,252,0.12); color: #C084FC; border: 1px solid #C084FC; }

/* ── PILLS ── */
.pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  transition: all 0.18s;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.pill:hover      { border-color: var(--gold); color: var(--text-primary); }
.pill.active     { border-color: var(--gold); background: var(--gold-dim); color: var(--gold); }
.pill.warn       { border-color: #F87171; background: rgba(248,113,113,0.08); color: #F87171; }
.pill-cnt {
  background: var(--gold-dim);
  color: var(--gold);
  border-radius: 8px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
}
.pill.active .pill-cnt { background: var(--gold); color: #000; }

/* ── STATUS BADGE ── */
.st-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'DM Mono', monospace;
  font-weight: 700;
}
.st-badge.ok   { background: rgba(52,211,153,0.1); border: 1px solid #34D399; color: #34D399; }
.st-badge.warn { background: rgba(248,113,113,0.1); border: 1px solid #F87171; color: #F87171; }
.st-badge.info { background: rgba(96,165,250,0.1);  border: 1px solid #60A5FA; color: #60A5FA; }
.st-badge.gold { background: var(--gold-dim);       border: 1px solid var(--gold); color: var(--gold); }

/* ── YEAR CONTROL ── */
.yr-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
}
.yr-val {
  font-size: 16px;
  font-weight: 800;
  color: var(--gold);
  min-width: 48px;
  text-align: center;
  font-family: 'DM Mono', monospace;
}

/* ── MESSAGES ── */
.msg-ok   { background: rgba(52,211,153,0.1); border: 1px solid #34D399; color: #34D399; padding: 12px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-top: 8px; }
.msg-err  { background: rgba(248,113,113,0.1); border: 1px solid #F87171; color: #F87171; padding: 12px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-top: 8px; }
.msg-info { background: rgba(96,165,250,0.1); border: 1px solid #60A5FA; color: #60A5FA; padding: 12px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-top: 8px; }

/* ── SPINNER ── */
@keyframes sp { to { transform: rotate(360deg); } }
.spin { width: 18px; height: 18px; border: 2.5px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: sp 0.7s linear infinite; display: inline-block; }
.spin-wrap { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 14px; padding: 24px 0; justify-content: center; }

/* ── TABLE ── */
.tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 10px; border: 1px solid var(--border); }

table { width: 100%; border-collapse: collapse; font-size: 14px; }

th {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  padding: 11px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1.5px solid var(--border);
  white-space: nowrap;
  font-family: 'DM Mono', monospace;
}

td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 14px;
  vertical-align: middle;
}

tr:hover td { background: var(--bg-elevated); }
tr:last-child td { border-bottom: none; }

/* ── STAT GRID ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.stat:hover, .stat.active-st { border-color: var(--gold); }
.stat-lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-family: 'DM Mono', monospace; }
.stat-val { font-size: 26px; font-weight: 800; color: var(--gold); line-height: 1; font-family: 'DM Mono', monospace; }
.stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* ── NUMPAD ── */
.numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 200px; }
.np { background: var(--bg-elevated); border: 1.5px solid var(--border); border-radius: 10px; padding: 13px 8px; font-size: 16px; font-weight: 700; cursor: pointer; text-align: center; color: var(--text-primary); transition: all 0.15s; font-family: 'DM Mono', monospace; -webkit-tap-highlight-color: transparent; }
.np:hover, .np:active { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
.np.w2 { grid-column: span 2; }
.np.accent { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }
.numpad-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }

/* ── VAL DISPLAY ── */
.val-display {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 16px;
  color: var(--gold);
  min-height: 42px;
  letter-spacing: 1px;
  margin-bottom: 8px;
  transition: border-color 0.15s;
}
.val-display:focus-within { border-color: var(--gold); }

/* ── SECTION BUILDER ── */
.sec-builder { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
.sec-preview {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 12px;
  min-height: 44px;
  line-height: 1.6;
  word-break: break-word;
}
.sec-preview em { color: var(--gold); font-style: normal; font-weight: 700; }
.sec-group { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.sec-group-act { font-size: 12px; font-weight: 700; color: var(--gold); font-family: 'DM Mono', monospace; flex-shrink: 0; padding-top: 2px; }
.sec-chips { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; }
.sec-chip { display: inline-flex; align-items: center; gap: 5px; background: var(--gold-dim); border: 1px solid var(--gold); border-radius: 5px; padding: 3px 9px; font-size: 12px; color: var(--gold); font-family: 'DM Mono', monospace; }
.sec-chip-del { cursor: pointer; color: #F87171; font-size: 13px; line-height: 1; }
.sec-input-row { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; margin-top: 10px; }

/* ── SEARCH BOX ── */
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap .inp { padding-right: 36px; }
.search-clear { position: absolute; right: 10px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 15px; padding: 0; line-height: 1; }
.search-clear:hover { color: var(--text-primary); }

/* ── VIEWER ── */
.v-search-box { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 14px; }
.v-inputs { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.v-panel { background: var(--bg-elevated); border: 1px solid var(--gold); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
.v-sheet-sec { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.v-sheet-sec:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.v-fir-row { background: rgba(248,113,113,0.06); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 12px; margin-bottom: 8px; }

.cn-pill { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: var(--bg-surface); color: var(--text-secondary); transition: all 0.15s; font-family: 'DM Mono', monospace; -webkit-tap-highlight-color: transparent; }
.cn-pill:hover { border-color: #60A5FA; color: #60A5FA; }
.cn-pill.active { border-color: var(--gold); background: var(--gold-dim); color: var(--gold); }

.v-det { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 12px; }
.det-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.df-lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.4px; font-family: 'DM Mono', monospace; }
.df-val { font-size: 14px; color: var(--text-primary); word-break: break-word; }
.df-val.hi { color: var(--gold); font-weight: 700; }

/* ── FTC STEPS ── */
.step-row { display: flex; align-items: center; gap: 4px; margin-bottom: 16px; }
.step-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--text-muted); flex-shrink: 0; font-family: 'DM Mono', monospace; }
.step-dot.act  { border-color: var(--gold); color: var(--gold); }
.step-dot.done { background: var(--gold); border-color: var(--gold); color: #000; }
.step-line { flex: 1; height: 1px; background: var(--border); }

.case-sel { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; transition: all 0.15s; }
.case-sel:hover, .case-sel.sel { border-color: var(--gold); background: var(--gold-dim); }

.warn-box { background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; padding: 12px 14px; font-size: 14px; color: #F87171; margin-bottom: 12px; }
.confirm-box { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }

/* ── ABSTRACT ── */
.abs-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.abs-tbl th { background: var(--bg-elevated); color: var(--text-secondary); padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; border: 1px solid var(--border); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.4px; }
.abs-tbl td { padding: 10px 12px; border: 1px solid var(--border); color: var(--text-primary); font-size: 14px; }
.abs-tbl tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
.tot-row td { background: var(--gold-dim) !important; color: var(--gold); font-weight: 700; }
.no-data { text-align: center; padding: 36px; color: var(--text-muted); font-size: 15px; }
.yr-badge { display: inline-block; background: var(--gold-dim); color: var(--gold); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-family: 'DM Mono', monospace; margin-left: 5px; }
.abs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }

/* ── SECTION DIVIDER ── */
.sec-divider { display: flex; align-items: center; gap: 10px; margin: 14px 0; font-size: 12px; font-weight: 600; color: var(--text-muted); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
.sec-divider::before, .sec-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
.modal { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; padding: 24px; max-width: 400px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.4); }
.modal-title { font-size: 18px; font-weight: 800; color: #F87171; margin-bottom: 10px; }
.modal-body { font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

/* ── DOT ── */
.dot { width: 8px; height: 8px; border-radius: 50%; background: #F87171; flex-shrink: 0; display: inline-block; }
.dot.on { background: #34D399; }

/* ── HISTORY CHIPS ── */
.hist-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.hist-chip { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Mono', monospace; transition: all 0.15s; }
.hist-chip:hover { border-color: var(--gold); color: var(--gold); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .hdr { padding: 10px 14px; }
  .pane { padding: 12px; }
  .card { padding: 12px; }
  .frow { grid-template-columns: 1fr 1fr; gap: 10px; }
  .v-inputs { flex-direction: column; align-items: stretch; }
  .v-inputs .btn { width: 100%; }
  .det-grid { grid-template-columns: 1fr 1fr; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .abs-grid { grid-template-columns: 1fr; }
  .numpad-row { flex-direction: column; gap: 12px; }
  .numpad { max-width: 100%; }
  .np { padding: 15px 8px; font-size: 16px; }
  table { font-size: 13px; }
  th, td { padding: 9px 10px; }
}

@media (max-width: 480px) {
  .pane { padding: 8px; }
  .card { padding: 10px; }
  .frow { grid-template-columns: 1fr; }
  .btn { padding: 10px 14px; }
}
`;
}