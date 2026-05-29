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
.et-fir-row{display:flex;gap:10px;padding:12p