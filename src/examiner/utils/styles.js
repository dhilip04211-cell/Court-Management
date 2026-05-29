export function getCSS(themeVars) {
  const varBlock = Object.entries(themeVars).map(([k, v]) => `${k}:${v}`).join(";");
  return `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Nunito:wght@400;600;700;800&display=swap');

/* ============================================================
   EXAMINER APP — BASE
   ============================================================ */
.examiner-app{
  background:var(--bg);
  color:var(--txt);
  font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:14px;
  min-height:100vh;
  transition:background .3s,color .3s;
  display:flex;
  flex-direction:column;
  --r:8px;
  --rl:12px;
  /* Semantic color tokens */
  --c-blue:#58a6ff;
  --c-green:#3fb950;
  --c-amber:#e8b84b;
  --c-red:#f85149;
  --c-purple:#bc8cff;
  ${varBlock};
}
.examiner-app *{box-sizing:border-box}
.mono{font-family:'JetBrains Mono',monospace}

/* HEADER */
.hdr{background:var(--bg2);border-bottom:2px solid var(--gold-d);padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:200;backdrop-filter:blur(8px)}
.hdr-logo{font-size:15px;font-weight:600;color:var(--gold);letter-spacing:1px;font-family:'Cinzel',serif;white-space:nowrap}
.hdr-sub{font-size:9px;color:var(--txt3);margin-top:1px;font-family:'JetBrains Mono',monospace;white-space:nowrap}
.auth-area{margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0}

/* THEME BAR */
.theme-bar{background:var(--bg2);border-bottom:1px solid var(--bdr);padding:4px 8px;display:flex;align-items:center;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.theme-bar::-webkit-scrollbar{display:none}
.theme-pill{padding:3px 10px;border-radius:12px;font-size:10px;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--txt3);white-space:nowrap;transition:all .2s;font-family:'JetBrains Mono',monospace;flex-shrink:0;touch-action:manipulation}
.theme-pill:hover{border-color:var(--gold-d);color:var(--txt)}
.theme-pill.act{border-color:var(--gold);background:rgba(201,168,76,.12);color:var(--gold)}
.theme-lbl{font-size:9px;color:var(--txt3);white-space:nowrap;font-family:'JetBrains Mono',monospace;flex-shrink:0}

/* TABS */
.tabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--bdr);padding:0 8px;overflow-x:auto;gap:2px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:9px 12px;font-size:11px;cursor:pointer;border-bottom:2px solid transparent;color:var(--txt2);white-space:nowrap;transition:color .15s;font-family:'JetBrains Mono',monospace;flex-shrink:0}
.tab:hover{color:var(--txt)}
.tab.act{color:var(--gold);border-bottom-color:var(--gold)}
.pane{padding:12px;max-width:1200px;margin:0 auto;width:100%}

.card{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rl);padding:14px;margin-bottom:12px;transition:background .3s,border-color .3s}
.ctitle{font-size:10px;font-weight:700;color:var(--gold);margin-bottom:12px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.7px;font-family:'JetBrains Mono',monospace;flex-wrap:wrap}

.fg{display:flex;flex-direction:column;gap:3px;min-width:0}
.lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace}
.inp{background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px;outline:none;width:100%;transition:border-color .15s,background .3s;font-family:inherit;-webkit-appearance:none;appearance:none}
.inp:focus{border-color:var(--gold)}
select.inp{cursor:pointer}
.frow{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:10px}

.btn{padding:8px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .15s;font-family:'JetBrains Mono',monospace;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn-g{background:var(--gold);color:#000}.btn-g:hover{background:var(--gold-l)}
.btn-g:disabled{opacity:.4;cursor:not-allowed}
.btn-o{background:transparent;border:1px solid var(--bdr);color:var(--txt2)}.btn-o:hover{border-color:var(--gold);color:var(--gold)}
.btn-r{background:transparent;border:1px solid var(--red);color:var(--red)}.btn-r:hover{background:var(--red);color:#fff}
.btn-sm{padding:5px 10px;font-size:11px}
.btn-edit{background:rgba(88,166,255,.12);border:1px solid var(--blu);color:var(--blu)}.btn-edit:hover{background:var(--blu);color:#000}

/* INLINE PILLS */
.pill-row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.pill{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--bdr);background:var(--bg3);color:var(--txt2);transition:all .18s;user-select:none;font-family:'JetBrains Mono',monospace;touch-action:manipulation;-webkit-tap-highlight-color:transparent;white-space:nowrap}
.pill:hover{border-color:var(--gold-d);color:var(--txt)}
.pill.active{border-color:var(--gold);background:rgba(201,168,76,.12);color:var(--gold)}
.pill.active-act{border-color:var(--accent);background:rgba(201,168,76,.18);color:var(--accent)}
.pill.warn{border-color:var(--red);background:rgba(248,81,73,.08);color:var(--red)}
.pill-cnt{background:rgba(201,168,76,.25);color:var(--gold);border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700}
.pill.active .pill-cnt{background:var(--gold);color:#000}

/* STATUS BADGE */
.st-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:5px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:700}
.st-badge.ok{background:rgba(63,185,80,.12);border:1px solid var(--grn);color:var(--grn)}
.st-badge.warn{background:rgba(248,81,73,.12);border:1px solid var(--red);color:var(--red)}
.st-badge.info{background:rgba(88,166,255,.12);border:1px solid var(--blu);color:var(--blu)}
.st-badge.gold{background:rgba(201,168,76,.12);border:1px solid var(--gold);color:var(--gold)}

.yr-ctrl{display:inline-flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--gold-d);border-radius:6px;padding:6px 10px}
.yr-val{font-size:13px;font-weight:700;color:var(--gold);min-width:36px;text-align:center;font-family:'JetBrains Mono',monospace}
.rst{font-size:10px;color:var(--txt3);cursor:pointer;text-decoration:underline;margin-left:4px}

.msg-ok{background:rgba(63,185,80,.1);border:1px solid var(--grn);color:var(--grn);padding:8px 10px;border-radius:6px;font-size:12px;margin-top:8px}
.msg-err{background:rgba(248,81,73,.1);border:1px solid var(--red);color:var(--red);padding:8px 10px;border-radius:6px;font-size:12px;margin-top:8px}
.msg-info{background:rgba(88,166,255,.1);border:1px solid var(--blu);color:var(--blu);padding:8px 10px;border-radius:6px;font-size:12px;margin-top:8px}
.spin-wrap{display:flex;align-items:center;gap:8px;color:var(--txt2);font-size:12px;padding:20px 0;justify-content:center}
@keyframes sp{to{transform:rotate(360deg)}}
.spin{width:16px;height:16px;border:2px solid var(--bdr);border-top-color:var(--gold);border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0}

/* SECTION BUILDER (legacy .sec-* — kept for other tabs) */
.sec-builder{background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--rl);padding:12px;margin-bottom:10px}
.sec-preview{background:var(--bg);border:1px solid var(--gold-d);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--txt);font-family:inherit;margin-bottom:10px;min-height:36px;line-height:1.6;word-break:break-word}
.sec-preview em{color:var(--gold);font-style:normal;font-weight:700}
.sec-group{background:var(--bg2);border:1px solid var(--bdr);border-radius:6px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
.sec-group-act{font-size:10px;font-weight:700;color:var(--accent);font-family:'JetBrains Mono',monospace;flex-shrink:0;padding-top:3px}
.sec-chips{display:flex;flex-wrap:wrap;gap:4px;flex:1}
.sec-chip{display:inline-flex;align-items:center;gap:4px;background:rgba(201,168,76,.1);border:1px solid var(--gold-d);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--gold);font-family:'JetBrains Mono',monospace}
.sec-chip-del{cursor:pointer;color:var(--red);font-size:12px;line-height:1}
.sec-chip-del:hover{color:var(--red)}
.sec-input-row{display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap;margin-top:8px}
.sec-numpad-wrap{display:flex;gap:12px;flex-wrap:wrap}

/* HISTORY */
.hist-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.hist-chip{background:var(--bg3);border:1px solid var(--bdr);border-radius:4px;padding:3px 8px;font-size:10px;color:var(--txt2);cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s}
.hist-chip:hover{border-color:var(--gold);color:var(--gold)}

/* NUMPAD */
.numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;width:100%;max-width:160px}
.np{background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;padding:11px 8px;font-size:14px;cursor:pointer;text-align:center;color:var(--txt);transition:all .15s;font-family:'JetBrains Mono',monospace;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
.np:hover,.np:active{border-color:var(--gold);color:var(--gold);background:rgba(201,168,76,.08)}
.np.w2{grid-column:span 2}
.np.accent{background:rgba(201,168,76,.1);border-color:var(--gold-d);color:var(--gold)}
.numpad-row{display:flex;gap:16px;flex-wrap:wrap}

/* DISPLAY */
.val-display{background:var(--bg);border:1px solid var(--bdr);border-radius:6px;padding:6px 10px;font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--gold);min-height:34px;letter-spacing:1px;margin-bottom:6px;transition:border-color .15s}
.val-display:focus-within{border-color:var(--gold)}

/* TABLE */
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:var(--bg3);color:var(--gold);padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid var(--bdr);white-space:nowrap;font-family:'JetBrains Mono',monospace}
td{padding:6px 8px;border-bottom:1px solid rgba(48,54,61,.5);color:var(--txt);vertical-align:top}
tr:hover td{background:rgba(201,168,76,.04)}

.bdg{padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;display:inline-block;font-family:'JetBrains Mono',monospace}
.bdg-g{background:rgba(63,185,80,.15);color:var(--grn)}
.bdg-a{background:rgba(201,168,76,.15);color:var(--gold)}
.bdg-b{background:rgba(88,166,255,.15);color:var(--blu)}
.bdg-r{background:rgba(248,81,73,.15);color:var(--red)}
.bdg-p{background:rgba(188,140,255,.15);color:var(--pur)}

.dot{width:7px;height:7px;border-radius:50%;background:var(--red);flex-shrink:0}
.dot.on{background:var(--grn)}

.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:12px}
.stat{background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--r);padding:12px;cursor:pointer;transition:border-color .15s}
.stat:hover{border-color:var(--gold-d)}
.stat.active-st{border-color:var(--gold)}
.stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;font-family:'JetBrains Mono',monospace}
.stat-val{font-size:20px;font-weight:700;color:var(--gold);font-family:'JetBrains Mono',monospace}
.stat-sub{font-size:10px;color:var(--txt3);margin-top:2px}

/* ── Keep old viewer classes for backward compat ── */
.v-search-box{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.v-inputs{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}
.v-panel{background:var(--bg3);border:1px solid var(--gold-d);border-radius:var(--rl);padding:12px;margin-bottom:10px}
.v-sheet-sec{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--bdr)}
.v-sheet-sec:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
.v-fir-row{background:rgba(248,81,73,.06);border:1px solid rgba(248,81,73,.25);border-radius:6px;padding:10px;margin-bottom:6px}
.cn-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--bdr);background:var(--bg2);color:var(--txt2);transition:all .15s;user-select:none;font-family:'JetBrains Mono',monospace;touch-action:manipulation}
.cn-pill:hover{border-color:var(--blu);color:var(--blu)}
.cn-pill.active{border-color:var(--gold);background:rgba(201,168,76,.08);color:var(--gold)}
.v-det{background:var(--bg);border:1px solid var(--gold-d);border-radius:var(--r);padding:12px;margin-top:10px}
.det-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.df-lbl{font-size:9px;color:var(--txt3);margin-bottom:2px;text-transform:uppercase;letter-spacing:.4px;font-family:'JetBrains Mono',monospace}
.df-val{font-size:13px;color:var(--txt);word-break:break-word}
.df-val.hi{color:var(--gold);font-weight:700}

/* FTC */
.step-row{display:flex;align-items:center;gap:4px;margin-bottom:14px}
.step-dot{width:24px;height:24px;border-radius:50%;border:2px solid var(--bdr);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--txt3);flex-shrink:0;font-family:'JetBrains Mono',monospace}
.step-dot.act{border-color:var(--gold);color:var(--gold)}
.step-dot.done{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
.step-line{flex:1;height:1px;background:var(--bdr)}
.case-sel{background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;padding:10px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;transition:all .15s;touch-action:manipulation}
.case-sel:hover,.case-sel.sel{border-color:var(--gold);background:rgba(201,168,76,.07)}
.warn-box{background:rgba(248,81,73,.07);border:1px solid rgba(248,81,73,.3);border-radius:6px;padding:10px;font-size:12px;color:var(--red);margin-bottom:10px}
.confirm-box{background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--r);padding:14px;margin-bottom:10px}

/* ABSTRACT */
.abs-tbl{width:100%;border-collapse:collapse;font-size:12px}
.abs-tbl th{background:var(--bg3);color:var(--gold);padding:7px 8px;text-align:left;font-size:10px;border:1px solid var(--bdr);font-family:'JetBrains Mono',monospace}
.abs-tbl td{padding:7px 8px;border:1px solid var(--bdr);color:var(--txt)}
.abs-tbl tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.tot-row td{background:rgba(201,168,76,.09)!important;color:var(--gold);font-weight:700}
.no-data{text-align:center;padding:28px;color:var(--txt3);font-size:13px}
.yr-badge{display:inline-block;background:rgba(201,168,76,.15);color:var(--gold);padding:1px 6px;border-radius:4px;font-size:10px;font-family:'JetBrains Mono',monospace;margin-left:4px}
.abs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}

.search-wrap{position:relative;display:flex;align-items:center}
.search-wrap .inp{padding-right:30px}
.search-clear{position:absolute;right:8px;background:none;border:none;color:var(--txt3);cursor:pointer;font-size:14px;padding:0;line-height:1}
.search-clear:hover{color:var(--txt)}

/* DIVIDER */
.sec-divider{display:flex;align-items:center;gap:8px;margin:10px 0;font-size:10px;color:var(--txt3);font-family:'JetBrains Mono',monospace}
.sec-divider::before,.sec-divider::after{content:'';flex:1;height:1px;background:var(--bdr)}

/* MODAL CONFIRM (legacy) */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rl);padding:20px;max-width:360px;width:100%;box-shadow:0 20px 60px var(--shadow)}
.modal-title{font-size:14px;font-weight:700;color:var(--red);margin-bottom:8px;font-family:inherit}
.modal-body{font-size:13px;color:var(--txt2);margin-bottom:16px;line-height:1.6}
.modal-actions{display:flex;gap:8px;justify-content:flex-end}

@media(max-width:768px){
  .hdr{padding:8px 12px}
  .hdr-logo{font-size:13px}
  .hdr-sub{display:none}
  .pane{padding:8px}
  .card{padding:10px;margin-bottom:10px}
  .frow{grid-template-columns:1fr 1fr;gap:8px}
  .v-inputs{flex-direction:column;align-items:stretch}
  .v-inputs .btn{width:100%}
  .det-grid{grid-template-columns:1fr 1fr}
  .stat-grid{grid-template-columns:repeat(2,1fr)}
  .abs-grid{grid-template-columns:1fr}
  .numpad-row{flex-direction:column;gap:10px}
  .numpad{max-width:100%}
  .np{padding:13px 8px;font-size:15px}
  .btn{padding:10px 14px;font-size:12px}
  table{font-size:11px}
  th,td{padding:5px 6px}
  .sec-numpad-wrap{flex-direction:column}
}

@media(max-width:480px){
  .pane{padding:6px}
  .card{padding:8px}
  .btn{padding:8px 12px;font-size:11px}
  .frow{grid-template-columns:1fr}
}

/* ============================================================
   ENTRY TAB — Android Material You Speed Entry (et-*)
   ============================================================ */

.et-root{
  --et-bg0:#0d1117;
  --et-bg1:#161b27;
  --et-bg2:#1c2333;
  --et-bg3:#252d3f;
  --et-gold:#e8b84b;
  --et-gold2:#f5d07a;
  --et-gold3:rgba(232,184,75,.10);
  --et-gold-bdr:rgba(232,184,75,.22);
  --et-txt:#e2e8f0;
  --et-txt2:#94a3b8;
  --et-txt3:#4a5568;
  --et-bdr:rgba(255,255,255,.07);
  --et-bdr2:rgba(255,255,255,.12);
  --et-red:#f87171;
  --et-grn:#4ade80;
  --et-blu:#60a5fa;
  --et-pur:#a78bfa;
  --et-r:16px;
  --et-rs:10px;
  --et-shadow:0 4px 32px rgba(0,0,0,.5);
  font-family:'Nunito',-apple-system,BlinkMacSystemFont,sans-serif;
  background:var(--et-bg0);
  color:var(--et-txt);
  min-height:100vh;
  -webkit-tap-highlight-color:transparent;
}
.et-root *{box-sizing:border-box}

/* Top bar */
.et-topbar{background:var(--et-bg1);padding:11px 16px 10px;border-bottom:1px solid var(--et-gold-bdr);display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:200;backdrop-filter:blur(12px)}
.et-topbar-icon{width:34px;height:34px;background:var(--et-gold3);border:1px solid var(--et-gold-bdr);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.et-topbar-title{font-size:12px;font-weight:800;color:var(--et-gold);letter-spacing:1.2px;font-family:'JetBrains Mono',monospace}
.et-topbar-sub{font-size:9px;color:var(--et-txt3);margin-top:1px;font-family:'JetBrains Mono',monospace}
.et-save-count{margin-left:auto;background:var(--et-gold3);border:1px solid var(--et-gold-bdr);border-radius:20px;padding:3px 11px;font-size:11px;font-weight:700;color:var(--et-gold);font-family:'JetBrains Mono',monospace;flex-shrink:0}

/* Pane */
.et-pane{padding:12px 12px 24px;max-width:600px;margin:0 auto;width:100%}

/* Step labels */
.et-step-lbl{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;color:var(--et-txt3);text-transform:uppercase;letter-spacing:.9px;font-family:'JetBrains Mono',monospace;margin:14px 0 7px}
.et-step-lbl::after{content:'';flex:1;height:1px;background:var(--et-bdr)}
.et-step-num{width:20px;height:20px;border-radius:50%;background:var(--et-gold3);border:1px solid var(--et-gold-bdr);color:var(--et-gold);font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'JetBrains Mono',monospace}
.et-step-sel{color:var(--et-gold);font-size:10px;font-weight:700}
.et-step-note{color:var(--et-grn);font-size:9px;font-weight:600}

/* Card */
.et-card{background:var(--et-bg2);border:1px solid var(--et-bdr2);border-radius:var(--et-r);overflow:hidden;margin-bottom:4px}
.et-card-title{font-size:10px;font-weight:700;color:var(--et-gold);padding:10px 14px 6px;text-transform:uppercase;letter-spacing:.7px;font-family:'JetBrains Mono',monospace}

/* FIR number row */
.et-fir-row{display:flex;gap:10px;padding:12px 14px 10px}
.et-fg{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1 1 0}
.et-fg-wide{flex:1.5 1 0}
.et-cr-badge{padding:0 14px 12px;font-size:12px;font-weight:700;color:var(--et-txt2);font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:4px}
.et-cr-badge strong{color:var(--et-gold)}

/* Labels & Inputs */
.et-lbl{font-size:9px;font-weight:700;color:var(--et-txt3);text-transform:uppercase;letter-spacing:.7px;font-family:'JetBrains Mono',monospace}
.et-inp{background:var(--et-bg3);border:1.5px solid var(--et-bdr2);border-radius:var(--et-rs);color:var(--et-txt);padding:9px 12px;font-size:14px;font-family:inherit;outline:none;width:100%;transition:border-color .15s,background .15s;-webkit-appearance:none;appearance:none}
.et-inp:focus{border-color:var(--et-gold);background:rgba(232,184,75,.04)}
.et-inp::placeholder{color:var(--et-txt3);font-weight:400;font-size:13px}
.et-inp-lg{font-size:16px;font-weight:700;padding:11px 13px}
.et-mono{font-family:'JetBrains Mono',monospace!important}

/* Station pills */
.et-pill-row{display:flex;flex-wrap:wrap;gap:7px;padding:10px 12px 12px}
.et-pill{display:inline-flex;align-items:center;gap:4px;padding:8px 14px;border-radius:22px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--et-bdr2);background:var(--et-bg3);color:var(--et-txt2);transition:all .15s;user-select:none;font-family:'JetBrains Mono',monospace;touch-action:manipulation;white-space:nowrap}
.et-pill:hover{border-color:var(--et-gold-bdr);color:var(--et-txt)}
.et-pill-active{border-color:var(--et-gold)!important;background:var(--et-gold3)!important;color:var(--et-gold)!important}
.et-pill-warn{border-color:rgba(248,113,113,.4)!important;background:rgba(248,113,113,.07)!important;color:var(--et-red)!important}

/* Date row */
.et-date-row{display:flex;gap:8px;align-items:flex-end;padding:10px 14px 12px}
.et-cal-wrap{display:flex;flex-direction:column;gap:4px;flex-shrink:0}
.et-cal-btn{width:42px;height:44px;border-radius:var(--et-rs);background:var(--et-bg3);border:1.5px solid var(--et-bdr2);color:var(--et-txt2);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:all .15s}
.et-cal-btn:hover{border-color:var(--et-gold-bdr)}
.et-date-ok{font-size:13px;color:var(--et-grn);font-family:'JetBrains Mono',monospace;font-weight:700;padding-bottom:10px;align-self:flex-end}

/* Edit mode banner */
.et-edit-banner{background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.22);border-radius:var(--et-rs);padding:9px 12px;margin-bottom:10px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--et-txt2);flex-wrap:wrap}
.et-edit-banner-icon{font-size:13px}

/* Action row */
.et-action-row{display:flex;gap:8px;margin-top:12px;margin-bottom:4px}

/* FAB Save */
.et-fab{flex:1;padding:14px 20px;border-radius:var(--et-r);background:var(--et-gold);color:#000;font-size:14px;font-weight:800;cursor:pointer;border:none;font-family:'JetBrains Mono',monospace;letter-spacing:.4px;transition:all .15s;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:7px}
.et-fab:hover:not(:disabled){background:var(--et-gold2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,184,75,.3)}
.et-fab:active:not(:disabled){transform:scale(.98)}
.et-fab:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.et-fab-edit{background:var(--et-blu)!important}
.et-fab-edit:hover:not(:disabled){background:#93c5fd!important;box-shadow:0 6px 20px rgba(96,165,250,.3)!important}

/* Buttons */
.et-btn{padding:10px 16px;border-radius:var(--et-rs);font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .15s;font-family:'JetBrains Mono',monospace;touch-action:manipulation}
.et-btn-sm{padding:6px 11px;font-size:11px}
.et-btn-o{background:var(--et-bg3);border:1.5px solid var(--et-bdr2);color:var(--et-txt2)}
.et-btn-o:hover{border-color:var(--et-gold-bdr);color:var(--et-txt)}
.et-btn-r{background:transparent;border:1.5px solid rgba(248,113,113,.35);color:var(--et-red)}
.et-btn-r:hover{background:rgba(248,113,113,.1)}
.et-btn-edit{background:rgba(96,165,250,.1);border:1.5px solid rgba(96,165,250,.35);color:var(--et-blu)}
.et-btn-edit:hover{background:rgba(96,165,250,.18)}

/* Badges */
.et-bdg{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;display:inline-block;font-family:'JetBrains Mono',monospace}
.et-bdg-b{background:rgba(96,165,250,.15);color:var(--et-blu)}

/* Status messages */
.et-msg{padding:10px 12px;border-radius:var(--et-rs);font-size:12px;margin-top:10px;font-family:'JetBrains Mono',monospace;line-height:1.5}
.et-msg-ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.28);color:var(--et-grn)}
.et-msg-err{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.28);color:var(--et-red)}
.et-msg-info{background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.28);color:var(--et-blu)}

/* Table */
.et-tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:0 4px 10px}
.et-table{width:100%;border-collapse:collapse;font-size:12px}
.et-table th{background:var(--et-bg3);color:var(--et-gold);padding:7px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--et-bdr);white-space:nowrap;font-family:'JetBrains Mono',monospace}
.et-table td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--et-txt);vertical-align:top}
.et-table tr:hover td{background:rgba(232,184,75,.03)}
.et-gold{color:var(--et-gold)}

/* Modal (bottom sheet style) */
.et-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999;display:flex;align-items:flex-end;justify-content:center;padding:12px}
.et-modal{background:var(--et-bg2);border:1px solid var(--et-bdr2);border-radius:20px 20px 16px 16px;padding:22px 20px 20px;max-width:460px;width:100%;box-shadow:var(--et-shadow)}
.et-modal-title{font-size:15px;font-weight:800;color:var(--et-red);margin-bottom:8px;font-family:'JetBrains Mono',monospace}
.et-modal-body{font-size:13px;color:var(--et-txt2);margin-bottom:18px;line-height:1.7}
.et-modal-actions{display:flex;gap:8px;justify-content:flex-end}

/* Responsive */
@media(max-width:480px){
  .et-pane{padding:8px 8px 24px}
  .et-card{border-radius:14px}
  .et-inp-lg{font-size:16px;padding:11px 12px}
  .et-fab{font-size:13px;padding:13px 16px}
  .et-fir-row{padding:10px 12px 8px}
  .et-pill{padding:7px 11px;font-size:11px}
}
@media(max-width:360px){
  .et-topbar-title{font-size:11px}
  .et-pill{padding:6px 9px;font-size:10px}
}

/* ============================================================
   SECTION BUILDER — Speed Entry (sb-*)
   ============================================================ */

.sb-root{background:var(--et-bg2);border:1px solid var(--et-bdr2);border-radius:var(--et-r);padding:12px 14px 14px;margin-bottom:4px}

/* History */
.sb-hist-area{margin-bottom:10px}
.sb-hist-lbl{font-size:9px;font-weight:700;color:var(--et-txt3);text-transform:uppercase;letter-spacing:.7px;font-family:'JetBrains Mono',monospace;margin-bottom:5px}
.sb-hist-scroll{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.sb-hist-scroll::-webkit-scrollbar{display:none}
.sb-hist-chip{flex-shrink:0;padding:5px 11px;border-radius:7px;border:1px solid var(--et-bdr2);background:var(--et-bg3);color:var(--et-txt2);font-size:10px;font-family:'JetBrains Mono',monospace;cursor:pointer;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;transition:all .12s;touch-action:manipulation}
.sb-hist-chip:hover{border-color:var(--et-gold-bdr);color:var(--et-gold);background:var(--et-gold3)}

/* Preview */
.sb-preview{background:var(--et-bg3);border:1px solid var(--et-gold-bdr);border-radius:var(--et-rs);padding:10px 12px;font-size:13px;color:var(--et-txt);font-family:'JetBrains Mono',monospace;margin-bottom:10px;min-height:38px;line-height:1.6;word-break:break-word}
.sb-rwb{color:var(--et-gold);font-style:normal;font-weight:700}
.sb-preview-hint{color:var(--et-txt3);font-size:12px}

/* Chips */
.sb-chips-area{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.sb-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(167,139,250,.10);border:1px solid rgba(167,139,250,.30);border-radius:6px;padding:4px 9px;font-size:11px;color:var(--et-pur);font-family:'JetBrains Mono',monospace}
.sb-chip-raw{background:rgba(74,222,128,.07);border-color:rgba(74,222,128,.25);color:var(--et-grn);font-size:11px;max-width:100%;word-break:break-word}
.sb-chip-act{font-size:9px;font-weight:700;color:rgba(167,139,250,.6);margin-right:2px}
.sb-chip-del{cursor:pointer;color:rgba(248,113,113,.5);font-size:12px;line-height:1;transition:color .1s;flex-shrink:0}
.sb-chip-del:hover{color:var(--et-red)}
.sb-chip-action{background:var(--et-bg3);border-color:var(--et-bdr2);color:var(--et-txt2);cursor:pointer;transition:all .12s}
.sb-chip-action:hover{border-color:var(--et-gold-bdr);color:var(--et-gold)}
.sb-chip-clear:hover{border-color:rgba(248,113,113,.35);color:var(--et-red)}

/* Act pills */
.sb-act-scroll{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:10px;padding-bottom:2px}
.sb-act-scroll::-webkit-scrollbar{display:none}
.sb-act-pill{flex-shrink:0;padding:7px 14px;border-radius:22px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--et-bdr2);background:var(--et-bg3);color:var(--et-txt2);white-space:nowrap;transition:all .15s;font-family:'JetBrains Mono',monospace;touch-action:manipulation;user-select:none}
.sb-act-pill:hover{border-color:rgba(167,139,250,.35);color:var(--et-pur)}
.sb-act-pill-active{border-color:var(--et-pur)!important;background:rgba(167,139,250,.10)!important;color:var(--et-pur)!important}

/* Section input area */
.sb-input-area{background:var(--et-bg3);border:1px solid var(--et-bdr2);border-radius:var(--et-rs);padding:10px 12px}
.sb-input-lbl{font-size:10px;font-weight:700;color:var(--et-pur);font-family:'JetBrains Mono',monospace;margin-bottom:8px}
.sb-input-row{display:flex;gap:8px;align-items:flex-end}
.sb-add-btn{width:44px;height:44px;border-radius:var(--et-rs);background:var(--et-gold);border:none;color:#000;font-size:22px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;touch-action:manipulation}
.sb-add-btn:hover:not(:disabled){background:var(--et-gold2);transform:scale(1.06)}
.sb-add-btn:active:not(:disabled){transform:scale(.95)}
.sb-add-btn:disabled{opacity:.3;cursor:not-allowed;transform:none}

@media(max-width:480px){
  .sb-root{padding:10px 12px 12px}
}

/* ============================================================
   VIEWER TAB — Android Material You (vt-*)
   ============================================================ */

/* Root */
.vt-root{
  --vt-bg:#0d1117;
  --vt-bg1:#13181f;
  --vt-bg2:#181e27;
  --vt-bg3:#1e2636;
  --vt-bg4:#242e41;
  --vt-bdr:rgba(255,255,255,.07);
  --vt-bdr2:rgba(255,255,255,.11);
  --vt-txt:#dde3ec;
  --vt-txt2:#8a97aa;
  --vt-txt3:#4a5668;
  --vt-gold:#e8b84b;
  --vt-gold-a:rgba(232,184,75,.12);
  --vt-gold-bdr:rgba(232,184,75,.25);
  --vt-blue:#58a6ff;
  --vt-blue-a:rgba(88,166,255,.10);
  --vt-green:#3fb950;
  --vt-green-a:rgba(63,185,80,.10);
  --vt-amber:#f0a500;
  --vt-amber-a:rgba(240,165,0,.10);
  --vt-red:#f85149;
  --vt-red-a:rgba(248,81,73,.10);
  --vt-purple:#bc8cff;
  --vt-purple-a:rgba(188,140,255,.10);
  --vt-r:16px;
  --vt-rs:10px;
  font-family:'Nunito',-apple-system,sans-serif;
  color:var(--vt-txt);
}
.vt-root *{box-sizing:border-box}
.vt-mono{font-family:'JetBrains Mono',monospace!important}
.vt-gold{color:var(--vt-gold)}

/* Search card — elevated surface with left accent bar */
.vt-search-card{
  background:var(--vt-bg2);
  border:1px solid var(--vt-bdr2);
  border-radius:var(--vt-r);
  padding:14px 14px 12px;
  margin-bottom:12px;
  position:relative;
  overflow:hidden;
}
.vt-search-card::before{
  content:'';
  position:absolute;
  left:0;top:0;bottom:0;
  width:3px;
  background:linear-gradient(180deg,var(--vt-gold) 0%,transparent 100%);
  border-radius:3px 0 0 3px;
}
.vt-search-eyebrow{
  font-size:9px;
  font-weight:800;
  color:var(--vt-gold);
  letter-spacing:1.6px;
  text-transform:uppercase;
  font-family:'JetBrains Mono',monospace;
  margin-bottom:10px;
  padding-left:4px;
}
.vt-search-row{
  display:flex;
  gap:8px;
  align-items:flex-end;
  flex-wrap:wrap;
}
.vt-fg{display:flex;flex-direction:column;gap:4px;min-width:0}
.vt-fg-grow{flex:1 1 80px}
.vt-lbl{
  font-size:9px;
  font-weight:700;
  color:var(--vt-txt3);
  text-transform:uppercase;
  letter-spacing:.8px;
  font-family:'JetBrains Mono',monospace;
}
.vt-inp{
  background:var(--vt-bg3);
  border:1.5px solid var(--vt-bdr2);
  border-radius:var(--vt-rs);
  color:var(--vt-txt);
  padding:9px 12px;
  font-size:14px;
  font-family:inherit;
  outline:none;
  width:100%;
  transition:border-color .15s;
  -webkit-appearance:none;
}
.vt-inp:focus{border-color:var(--vt-gold);background:rgba(232,184,75,.04)}
.vt-inp::placeholder{color:var(--vt-txt3);font-size:13px}
.vt-search-actions{display:flex;gap:6px;align-items:center;flex-shrink:0}

/* Buttons */
.vt-btn{
  padding:10px 18px;
  border-radius:var(--vt-rs);
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  border:none;
  font-family:'JetBrains Mono',monospace;
  letter-spacing:.3px;
  transition:all .15s;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
}
.vt-btn-primary{
  background:var(--vt-gold);
  color:#000;
}
.vt-btn-primary:hover{
  background:#f5d07a;
  box-shadow:0 4px 16px rgba(232,184,75,.35);
  transform:translateY(-1px);
}
.vt-btn-ghost{
  background:var(--vt-bg4);
  border:1.5px solid var(--vt-bdr2);
  color:var(--vt-txt2);
}
.vt-btn-ghost:hover{border-color:var(--vt-red-a);color:var(--vt-red)}

/* Empty state */
.vt-empty{
  text-align:center;
  padding:40px 20px;
}
.vt-empty-icon{font-size:28px;margin-bottom:10px;opacity:.5}
.vt-empty-title{font-size:14px;font-weight:700;color:var(--vt-txt2);margin-bottom:4px}
.vt-empty-sub{font-size:12px;color:var(--vt-txt3)}

/* Summary strip */
.vt-summary{
  display:flex;
  align-items:center;
  gap:6px;
  margin-bottom:12px;
  padding:8px 12px;
  background:var(--vt-gold-a);
  border:1px solid var(--vt-gold-bdr);
  border-radius:10px;
  font-size:12px;
  font-family:'JetBrains Mono',monospace;
}
.vt-summary-count{font-size:16px;font-weight:800;color:var(--vt-gold)}
.vt-summary-label{color:var(--vt-txt2)}
.vt-summary-fir{font-weight:700;color:var(--vt-gold)}

/* Results container */
.vt-results{display:flex;flex-direction:column;gap:10px}

/* Section block */
.vt-section{
  background:var(--vt-bg2);
  border:1px solid var(--vt-bdr2);
  border-radius:var(--vt-r);
  overflow:hidden;
}

/* Section header */
.vt-section-header{
  display:flex;
  align-items:center;
  gap:12px;
  padding:12px 14px 10px;
  border-bottom:1px solid var(--vt-bdr);
}
.vt-section-icon{
  width:36px;
  height:36px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:17px;
  flex-shrink:0;
}
.vt-icon-fir{background:var(--vt-red-a);border:1px solid rgba(248,81,73,.2)}
.vt-icon-case{background:var(--vt-blue-a);border:1px solid rgba(88,166,255,.2)}
.vt-icon-nv{background:var(--vt-amber-a);border:1px solid rgba(240,165,0,.2)}
.vt-icon-cn{background:var(--vt-purple-a);border:1px solid rgba(188,140,255,.2)}

.vt-section-title{
  font-size:13px;
  font-weight:800;
  color:var(--vt-txt);
  letter-spacing:.2px;
}
.vt-section-sub{
  font-size:11px;
  color:var(--vt-txt3);
  margin-top:2px;
  display:flex;
  gap:5px;
  flex-wrap:wrap;
  align-items:center;
}

/* Sub-pills in section header */
.vt-sub-pill{
  padding:1px 7px;
  border-radius:6px;
  font-size:10px;
  font-weight:700;
  font-family:'JetBrains Mono',monospace;
}
.vt-sub-blue{background:var(--vt-blue-a);color:var(--vt-blue)}
.vt-sub-green{background:var(--vt-green-a);color:var(--vt-green)}

/* Chip row (station selector) */
.vt-chip-row{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  padding:10px 12px;
}
.vt-chip{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:7px 12px;
  border-radius:22px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
  border:1.5px solid var(--vt-bdr2);
  background:var(--vt-bg3);
  color:var(--vt-txt2);
  transition:all .15s;
  user-select:none;
  font-family:'JetBrains Mono',monospace;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
  white-space:nowrap;
}
.vt-chip:hover{border-color:var(--vt-bdr2);color:var(--vt-txt)}
.vt-chip-label{}
.vt-chip-count{
  background:rgba(255,255,255,.08);
  color:var(--vt-txt2);
  border-radius:8px;
  padding:1px 7px;
  font-size:10px;
  font-weight:700;
  transition:all .15s;
}

/* FIR chips */
.vt-chip-fir:hover{border-color:rgba(248,81,73,.4);color:var(--vt-red)}
.vt-chip-active-fir{
  border-color:var(--vt-red)!important;
  background:var(--vt-red-a)!important;
  color:var(--vt-red)!important;
}
.vt-chip-active-fir .vt-chip-count{background:var(--vt-red);color:#fff}

/* Case chips */
.vt-chip-case:hover{border-color:rgba(88,166,255,.4);color:var(--vt-blue)}
.vt-chip-active-case{
  border-color:var(--vt-blue)!important;
  background:var(--vt-blue-a)!important;
  color:var(--vt-blue)!important;
}
.vt-chip-active-case .vt-chip-count{background:var(--vt-blue);color:#000}

/* NV chips */
.vt-chip-nv:hover{border-color:rgba(240,165,0,.4);color:var(--vt-amber)}
.vt-chip-active-nv{
  border-color:var(--vt-amber)!important;
  background:var(--vt-amber-a)!important;
  color:var(--vt-amber)!important;
}
.vt-chip-active-nv .vt-chip-count{background:var(--vt-amber);color:#000}

/* Expanded panel */
.vt-panel{
  margin:0 10px 10px;
  border-radius:12px;
  padding:12px 12px 10px;
  border:1px solid var(--vt-bdr2);
}
.vt-panel-fir{background:rgba(248,81,73,.05);border-color:rgba(248,81,73,.18)}
.vt-panel-case{background:rgba(88,166,255,.04);border-color:rgba(88,166,255,.15)}
.vt-panel-nv{background:rgba(240,165,0,.04);border-color:rgba(240,165,0,.15)}

.vt-panel-heading{
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:6px;
  margin-bottom:10px;
}
.vt-panel-title{font-size:13px;font-weight:800;color:var(--vt-txt)}

/* Tags */
.vt-tag{
  display:inline-flex;
  align-items:center;
  padding:2px 8px;
  border-radius:6px;
  font-size:10px;
  font-weight:700;
  font-family:'JetBrains Mono',monospace;
  white-space:nowrap;
}
.vt-tag-red{background:var(--vt-red-a);color:var(--vt-red);border:1px solid rgba(248,81,73,.25)}
.vt-tag-blue{background:var(--vt-blue-a);color:var(--vt-blue);border:1px solid rgba(88,166,255,.25)}
.vt-tag-green{background:var(--vt-green-a);color:var(--vt-green);border:1px solid rgba(63,185,80,.25)}
.vt-tag-amber{background:var(--vt-amber-a);color:var(--vt-amber);border:1px solid rgba(240,165,0,.25)}

/* FIR card inside FIR panel */
.vt-fir-list{display:flex;flex-direction:column;gap:7px}
.vt-fir-card{
  background:var(--vt-bg3);
  border:1px solid rgba(248,81,73,.18);
  border-radius:10px;
  padding:10px 12px;
}
.vt-fir-row-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:6px;
  margin-bottom:6px;
}
.vt-fir-cr{
  font-size:15px;
  font-weight:800;
  color:var(--vt-red);
  font-family:'JetBrains Mono',monospace;
  letter-spacing:.5px;
}
.vt-fir-meta{
  display:flex;
  flex-wrap:wrap;
  gap:6px 16px;
}
  .vt-fir-nv-block,
.cd-nv-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(245, 158, 11, 0.2);
}

/* ============================================================
   FTC TAB — ftc-*
   ============================================================ */
.ftc-fir-info{background:rgba(248,81,73,.07);border:1px solid rgba(248,81,73,.2);border-radius:10px;padding:10px 12px;margin-bottom:10px}
.ftc-fir-cr{font-size:18px;font-weight:800;color:var(--vt-red);font-family:'JetBrains Mono',monospace;letter-spacing:.5px;margin-bottom:6px}
.ftc-fir-fields{display:flex;flex-wrap:wrap;gap:6px 18px}
.ftc-field{display:flex;align-items:baseline;gap:5px}
.ftc-flbl{font-size:9px;color:var(--vt-txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace;white-space:nowrap}
.ftc-fval{font-size:12px;color:var(--vt-txt2);font-family:'JetBrains Mono',monospace;word-break:break-word}

.ftc-cases-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.ftc-cases-title{font-size:11px;font-weight:800;color:var(--vt-txt2);text-transform:uppercase;letter-spacing:.6px;font-family:'JetBrains Mono',monospace}
.ftc-no-cases{font-size:12px;color:var(--vt-txt3);padding:12px 0;text-align:center}

.ftc-case-list{display:flex;flex-direction:column;gap:7px;margin-bottom:8px}
.ftc-case-card{background:var(--vt-bg3);border:1.5px solid var(--vt-bdr2);border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .14s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.ftc-case-card:hover{border-color:rgba(88,166,255,.4)}
.ftc-case-sel{border-color:var(--vt-blue)!important;background:rgba(88,166,255,.08)!important}
.ftc-case-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
.ftc-case-cn{font-size:14px;font-weight:800;color:var(--vt-txt);font-family:'JetBrains Mono',monospace;letter-spacing:.3px}
.ftc-case-pt{font-size:12px;color:var(--vt-txt2);margin-bottom:4px;line-height:1.4;word-break:break-word}
.ftc-case-meta{display:flex;gap:10px;font-size:11px;color:var(--vt-txt3);font-family:'JetBrains Mono',monospace;flex-wrap:wrap}
.ftc-sel-tick{font-size:11px;font-weight:700;color:var(--vt-blue);margin-top:6px;font-family:'JetBrains Mono',monospace}

.ftc-proceed-btn{width:100%;padding:12px;border-radius:10px;background:var(--vt-blue);color:#000;font-size:13px;font-weight:800;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;transition:all .15s;touch-action:manipulation}
.ftc-proceed-btn:hover{background:#7dc8ff;transform:translateY(-1px);box-shadow:0 4px 16px rgba(88,166,255,.3)}

.ftc-confirm{background:rgba(248,81,73,.05);border:1px solid rgba(248,81,73,.2);border-radius:10px;padding:12px;margin-top:10px}
.ftc-confirm-title{font-size:12px;font-weight:800;color:var(--vt-red);font-family:'JetBrains Mono',monospace;margin-bottom:10px}
.ftc-confirm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.ftc-cf{display:flex;flex-direction:column;gap:2px}
.ftc-cf-lbl{font-size:9px;color:var(--vt-txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace}
.ftc-cf-val{font-size:13px;color:var(--vt-txt);word-break:break-word;line-height:1.4}
.ftc-warn-note{font-size:11px;color:var(--vt-red);background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.18);border-radius:7px;padding:8px 10px;margin-bottom:10px;line-height:1.5}
.ftc-confirm-actions{display:flex;gap:8px}
.ftc-execute-btn{flex:1;padding:11px 16px;border-radius:10px;background:var(--vt-red);color:#fff;font-size:12px;font-weight:800;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;transition:all .15s;touch-action:manipulation}
.ftc-execute-btn:hover:not(:disabled){background:#ff7a73;transform:translateY(-1px)}
.ftc-execute-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

@media(max-width:480px){
  .ftc-confirm-grid{grid-template-columns:1fr}
}
.vt-fir-nv-heading,
.cd-nv-heading {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-amber);
  margin-bottom: 6px;
}
.vt-fir-field{display:flex;align-items:baseline;gap:5px}
.vt-fir-flbl{
  font-size:9px;
  color:var(--vt-txt3);
  text-transform:uppercase;
  letter-spacing:.5px;
  font-family:'JetBrains Mono',monospace;
  white-space:nowrap;
}
.vt-fir-fval{
  font-size:12px;
  color:var(--vt-txt2);
  font-family:'JetBrains Mono',monospace;
  word-break:break-word;
}

/* Case group (pending / disposed within station panel) */
.vt-case-group{
  background:var(--vt-bg3);
  border:1px solid var(--vt-bdr);
  border-radius:10px;
  padding:10px 10px 8px;
  margin-bottom:7px;
}
.vt-case-group:last-child{margin-bottom:0}
.vt-case-group-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:9px;
}
.vt-case-group-title{font-size:11px;font-weight:800;letter-spacing:.3px}

/* Case number pill row */
.vt-cn-pills{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}
.vt-cn-pill{
  padding:5px 11px;
  border-radius:8px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
  border:1.5px solid var(--vt-bdr2);
  background:var(--vt-bg2);
  color:var(--vt-txt2);
  transition:all .14s;
  font-family:'JetBrains Mono',monospace;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
  user-select:none;
}
.vt-cn-pill:hover{border-color:rgba(88,166,255,.4);color:var(--vt-blue)}
.vt-cn-active{border-color:var(--vt-blue)!important;background:var(--vt-blue-a)!important;color:var(--vt-blue)!important}

/* NV pill variant */
.vt-cn-amber{background:var(--vt-bg2)}
.vt-cn-amber:hover{border-color:rgba(240,165,0,.4);color:var(--vt-amber)}
.vt-cn-active-amber{border-color:var(--vt-amber)!important;background:var(--vt-amber-a)!important;color:var(--vt-amber)!important}

/* Case numbered pill variant */
.vt-cn-purple{background:var(--vt-bg2)}
.vt-cn-purple:hover{border-color:rgba(188,140,255,.4);color:var(--vt-purple)}
.vt-cn-active-purple{border-color:var(--vt-purple)!important;background:var(--vt-purple-a)!important;color:var(--vt-purple)!important}

/* Responsive */
@media(max-width:600px){
  .vt-search-row{flex-direction:row}
  .vt-search-actions{flex-shrink:0}
  .vt-btn{padding:10px 14px;font-size:12px}
}
@media(max-width:400px){
  .vt-search-row{flex-wrap:wrap}
  .vt-search-actions{width:100%}
  .vt-btn{flex:1}
}

/* ============================================================
   CASE DETAIL — Material You card (cd-*)
   ============================================================ */

.cd-root{
  background:var(--cd-bg,rgba(88,166,255,.06));
  border:1px solid var(--cd-border,rgba(88,166,255,.2));
  border-radius:12px;
  margin-top:10px;
  overflow:hidden;
}

/* Header strip */
.cd-header{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px 9px;
  background:rgba(0,0,0,.12);
  border-bottom:1px solid var(--cd-border,rgba(88,166,255,.15));
}
.cd-header-icon{
  font-size:18px;
  flex-shrink:0;
  width:32px;
  height:32px;
  background:rgba(0,0,0,.18);
  border-radius:8px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.cd-header-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.cd-primary-id{
  font-size:16px;
  font-weight:800;
  color:var(--cd-color,var(--c-blue));
  font-family:'JetBrains Mono',monospace;
  letter-spacing:.5px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.cd-type-label{
  font-size:9px;
  font-weight:700;
  color:var(--vt-txt3,#4a5668);
  text-transform:uppercase;
  letter-spacing:1px;
  font-family:'JetBrains Mono',monospace;
}

/* Fields grid */
.cd-fields{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
  gap:1px;
  background:var(--cd-border,rgba(88,166,255,.1));
}
.cd-field{
  background:var(--vt-bg3,#1e2636);
  padding:9px 11px;
}
.cd-field-full{grid-column:1/-1}
.cd-field-lbl{
  font-size:8px;
  font-weight:700;
  color:var(--vt-txt3,#4a5668);
  text-transform:uppercase;
  letter-spacing:.7px;
  font-family:'JetBrains Mono',monospace;
  margin-bottom:3px;
}
.cd-field-val{
  font-size:13px;
  color:var(--vt-txt,#dde3ec);
  word-break:break-word;
  line-height:1.4;
}
.cd-field-val.hi{
  color:var(--cd-color,var(--c-blue));
  font-weight:700;
}
.cd-field-val.mono{font-family:'JetBrains Mono',monospace}
.cd-field-val.hi.mono{font-family:'JetBrains Mono',monospace}
.cd-empty{color:var(--vt-txt3,#4a5668);font-size:12px}

@media(max-width:480px){
  .cd-fields{grid-template-columns:1fr 1fr}
  .cd-primary-id{font-size:14px}
}
@media(max-width:340px){
  .cd-fields{grid-template-columns:1fr}
}
`;
}
