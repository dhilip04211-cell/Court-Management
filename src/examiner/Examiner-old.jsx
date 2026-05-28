import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const CLIENT_ID = "879226759032-983f068npvn7t0npk72nbq8lp402q98a.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const SID = {
  fir:     "1sKmU8eXXz5iPG7qNvu-exKQOW_qxu3BbPQngqzVvF0k",
  pending: "1PWTUdw85POCan-aaqvZq8Z-ewq3pIuAGosSo-xiCC9I",
  disposal:"1OWoLwzLVANiAk8T2AthO_wy9hEhyLuFLcXVgJsCyhHY",
  nonval:  "1tUDCMzd_q3TbmiboJl7yYI9S7hFcrMb3K4vhIaP6dVk",
  casenum: "1eeQA75iuqNcsNwXygcx3JLJRamxuRI_1UrpetByr5nA",
};

const SMAP = [
  { sh:"JKM",     lb:"Jayankondam",      al:["jayankondam","jkm","jayankondam police station"] },
  { sh:"VKM",     lb:"Vikkiramangalam",  al:["vikkiramangalam","vikramangalam","vkm","venganam"] },
  { sh:"Sheet7",  lb:"VKM (Extra)",      al:["sheet7","vkm extra","vkm ps record"] },
  { sh:"T.PALUR", lb:"T.Palur",          al:["t.palur","tpalur","palur","t palur","t. palur","t.palur police"] },
  { sh:"PEW",     lb:"PEW Ariyalur",     al:["pew","pew ariyalur","nb cid","nb cid trichy"] },
  { sh:"AWPS",    lb:"AWPS Jayankondam", al:["awps","awps jayankondam","all women"] },
  { sh:"DCB",     lb:"DCB Ariyalur",     al:["dcb","dcb ariyalur","ariyalur dcb"] },
];

const ACTS = [
  { id:"IPC",    label:"IPC",             short:"IPC" },
  { id:"BNS",    label:"BNS",             short:"BNS" },
  { id:"MMD",    label:"M&M(D&R) Act",    short:"M&M Act" },
  { id:"COTPA",  label:"COTPA Act",       short:"COTPA" },
  { id:"NDPS",   label:"NDPS Act",        short:"NDPS" },
  { id:"TNPHW",  label:"TNPHW Act",       short:"TNPHW" },
  { id:"MVA",    label:"MV Act",          short:"MVA" },
  { id:"PC",     label:"PC Act",          short:"PC Act" },
];

const THEMES = [
  { id:"night",  label:"🌙 Night",    vars:{
    "--bg":"#0d1117","--bg2":"#161b22","--bg3":"#21262d","--bdr":"#30363d",
    "--txt":"#e6edf3","--txt2":"#8b949e","--txt3":"#6e7681",
    "--gold":"#C9A84C","--gold-l":"#F0D07A","--gold-d":"#8B6914",
    "--grn":"#3fb950","--red":"#f85149","--blu":"#58a6ff","--pur":"#bc8cff",
    "--accent":"#C9A84C","--shadow":"rgba(0,0,0,0.4)",
  }},
  { id:"day",    label:"☀️ Day",     vars:{
    "--bg":"#f5f5f0","--bg2":"#ffffff","--bg3":"#eaeae4","--bdr":"#d0d0c8",
    "--txt":"#1a1a18","--txt2":"#5a5a52","--txt3":"#8a8a82",
    "--gold":"#8B6914","--gold-l":"#C9A84C","--gold-d":"#5a4208",
    "--grn":"#2a7a35","--red":"#c0392b","--blu":"#1a5fa8","--pur":"#6a3fa8",
    "--accent":"#8B6914","--shadow":"rgba(0,0,0,0.12)",
  }},
  { id:"sepia",  label:"📜 Sepia",   vars:{
    "--bg":"#2c2416","--bg2":"#352c1a","--bg3":"#3f3420","--bdr":"#5a4a2a",
    "--txt":"#f0e0c0","--txt2":"#c0a878","--txt3":"#907858",
    "--gold":"#e8c060","--gold-l":"#f8d880","--gold-d":"#a07820",
    "--grn":"#6ab060","--red":"#e06040","--blu":"#80b0d8","--pur":"#c090e0",
    "--accent":"#e8c060","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"ocean",  label:"🌊 Ocean",   vars:{
    "--bg":"#040f1a","--bg2":"#071828","--bg3":"#0a2038","--bdr":"#0f3050",
    "--txt":"#c8e8f8","--txt2":"#6898b8","--txt3":"#406880",
    "--gold":"#40c8e8","--gold-l":"#80e0f8","--gold-d":"#2090b0",
    "--grn":"#40d880","--red":"#f85060","--blu":"#60a8f8","--pur":"#a060f8",
    "--accent":"#40c8e8","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"forest", label:"🌿 Forest",  vars:{
    "--bg":"#0a120a","--bg2":"#101a10","--bg3":"#162016","--bdr":"#204020",
    "--txt":"#d0e8c8","--txt2":"#7aaa70","--txt3":"#507848",
    "--gold":"#a8d050","--gold-l":"#c8e870","--gold-d":"#708820",
    "--grn":"#50d870","--red":"#e86050","--blu":"#60b8d8","--pur":"#c090e0",
    "--accent":"#a8d050","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"crimson",label:"🔴 Crimson", vars:{
    "--bg":"#120808","--bg2":"#1c0f0f","--bg3":"#261616","--bdr":"#401818",
    "--txt":"#f0d8d8","--txt2":"#b07878","--txt3":"#805050",
    "--gold":"#e84040","--gold-l":"#f87070","--gold-d":"#a02020",
    "--grn":"#50d870","--red":"#ff5040","--blu":"#80b0f8","--pur":"#d080f8",
    "--accent":"#e84040","--shadow":"rgba(0,0,0,0.5)",
  }},
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function isValidFIRCell(raw) {
  if (!raw && raw !== 0) return false;
  return /^\d+\/\d{4}$/.test(String(raw).trim());
}

function parseFIR(raw) {
  if (!raw && raw !== 0) return { num: "", yr: "" };
  const s = String(raw).trim();
  const parts = s.split(/\s*\/\s*/);
  const num = String(parseInt(parts[0], 10) || 0);
  const yr = parts[1] ? parts[1].trim() : "";
  return { num, yr };
}

function firMatch(raw, searchNum, searchYr) {
  if (!raw) return false;
  if (!isValidFIRCell(raw)) return false;
  const p = parseFIR(raw);
  if (p.num !== searchNum) return false;
  if (!searchYr) return true;
  if (!p.yr) return true;
  return p.yr === searchYr;
}

function firSortKey(cr) {
  const p = parseFIR(cr);
  return parseInt(p.yr || "0", 10) * 1000000 + parseInt(p.num || "0", 10);
}

function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0,2) + "." + digits.slice(2);
  return digits.slice(0,2) + "." + digits.slice(2,4) + "." + digits.slice(4);
}

/* ═══════════════════════════════════════════════
   SHEETS API UTILS
═══════════════════════════════════════════════ */
async function sheetsGet(tok, sid, range) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!r.ok) return [];
  const d = await r.json();
  return d.values || [];
}

async function sheetsUpdate(tok, sid, range, vals) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: vals }),
    }
  );
  return r.ok;
}

async function sheetsAppend(tok, sid, range, vals) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: vals }),
    }
  );
  return r.ok;
}

async function getSheetIdByName(tok, sid, tabName) {
  const m = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!m.ok) return null;
  const meta = await m.json();
  const sh = (meta.sheets || []).find(s => s.properties.title === tabName);
  return sh ? sh.properties.sheetId : null;
}

async function sheetsDeleteRow(tok, sid, tabName, oneBasedRow) {
  const sheetId = await getSheetIdByName(tok, sid, tabName);
  if (sheetId === null) return false;
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: {
          sheetId,
          dimension: "ROWS",
          startIndex: oneBasedRow - 1,
          endIndex: oneBasedRow,
        }}}],
      }),
    }
  );
  return r.ok;
}

async function sheetsInsertRow(tok, sid, tabName, oneBasedRow) {
  const sheetId = await getSheetIdByName(tok, sid, tabName);
  if (sheetId === null) return false;
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{ insertDimension: { range: {
          sheetId,
          dimension: "ROWS",
          startIndex: oneBasedRow - 1,
          endIndex: oneBasedRow,
        }, inheritFromBefore: false }}],
      }),
    }
  );
  return r.ok;
}

async function sheetsWriteRow(tok, sid, tabName, oneBasedRow, vals) {
  const range = `${tabName}!A${oneBasedRow}:D${oneBasedRow}`;
  return sheetsUpdate(tok, sid, range, [vals]);
}

async function sheetsBatchWriteRows(tok, sid, tabName, startRow, rowsData) {
  const range = `${tabName}!A${startRow}:D${startRow + rowsData.length - 1}`;
  return sheetsUpdate(tok, sid, range, rowsData);
}

/* ═══════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════ */
async function loadFIRSheet(tok, tabName) {
  const rows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const data = [];
  let yg = "";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const a = (r[0] || "").toString().trim();
    const b = (r[1] || "").toString().trim();
    const c = (r[2] || "").toString().trim();
    const d = (r[3] || "").toString().trim();

    if (a.toLowerCase().includes("sl") || c.toLowerCase().includes("section of law")) continue;
    if (b.toLowerCase().includes("cr.no")) continue;
    if (c.toLowerCase().includes("police station")) continue;
    if (a.toLowerCase().includes("fir pending")) continue;

    const isYearRow =
      (!a && !b && /^\d{4}$/.test(c) && !d) ||
      (!a && /^\d{4}$/.test(b) && !c && !d) ||
      (/^\d{4}$/.test(a) && !b && !c && !d);

    if (isYearRow) {
      yg = /^\d{4}$/.test(a) ? a : /^\d{4}$/.test(b) ? b : c;
      continue;
    }

    if (!isValidFIRCell(b)) continue;

    const crYr = parseFIR(b).yr || yg;
    data.push({ sl: a, cr: b, sec: c, dr: d, yr: crYr, ri: i + 1 });
  }
  return data;
}

async function loadAllData(tok) {
  const fir = {};
  for (const s of SMAP) {
    fir[s.sh] = await loadFIRSheet(tok, s.sh);
  }

  const pr = await sheetsGet(tok, SID.pending, "Sheet1!A:L");
  const pend = pr.slice(1)
    .map((r, i) => ({
      sl:r[0]||"", cn:r[1]||"", pt:r[2]||"", adv:r[3]||"",
      dreg:r[4]||"", nxt:r[5]||"", pur:r[6]||"", sec:r[7]||"",
      sta:r[8]||"", fn:r[9]||"", nat:r[10]||"", des:r[11]||"",
      ri:i+2,
    }))
    .filter(r => r.fn || r.cn);

  const dr2 = await sheetsGet(tok, SID.disposal, "Sheet1!A:L");
  const disp = dr2.slice(1)
    .map((r, i) => ({
      sl:r[0]||"", cn:r[1]||"", pt:r[2]||"", adv:r[3]||"",
      dreg:r[4]||"", ddec:r[5]||"", dnat:r[6]||"", sec:r[7]||"",
      sta:r[8]||"", fn:r[9]||"", nat:r[10]||"", des:r[11]||"",
      ri:i+2,
    }))
    .filter(r => r.fn || r.cn);

  const nr = await sheetsGet(tok, SID.nonval, "Sheet1!A:G");
  const nv = nr.slice(1)
    .map((r, i) => ({
      sno:r[0]||"", cn:r[1]||"", fn:r[2]||"", rp:r[3]||"",
      sta:r[4]||"", desc:r[5]||"", rem:r[6]||"",
      ri:i+2,
    }))
    .filter(r => r.fn || r.cn);

  const cnr = await sheetsGet(tok, SID.casenum, "Sheet1!A:M");
  const cnum = cnr.slice(1)
    .map((r, i) => ({
      fn:r[0]||"", sta:r[1]||"", sec:r[2]||"", dr:r[3]||"",
      cn:r[4]||"", pt:r[5]||"", adv:r[6]||"", dreg:r[7]||"",
      nxt:r[8]||"", type:r[9]||"", sec2:r[10]||"", nat:r[11]||"", des:r[12]||"",
      ri:i+2,
    }))
    .filter(r => r.fn || r.cn);

  return { fir, pend, disp, nv, cnum };
}

/* ═══════════════════════════════════════════════
   SORTED INSERT + RENUMBER
═══════════════════════════════════════════════ */
async function insertFIRSorted(tok, tabName, newCr, newSec, newDr, existingRows) {
  // Sort existing + new together
  const allRows = [...existingRows, { cr: newCr, sec: newSec, dr: newDr, _new: true }];
  allRows.sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr));

  const newIdx = allRows.findIndex(r => r._new);
  // Sheet row index: need to find where data rows start
  // We write all rows back with renumbered Sl
  // First find sheet header rows count by reading raw
  const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  // Find first valid FIR row index (1-based)
  let firstDataRow = 1;
  for (let i = 0; i < rawRows.length; i++) {
    const b = (rawRows[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) { firstDataRow = i + 1; break; }
  }

  const insertSheetRow = firstDataRow + newIdx;

  // Insert blank row at correct position
  const inserted = await sheetsInsertRow(tok, SID.fir, tabName, insertSheetRow);
  if (!inserted) return { ok: false, ri: -1 };

  // Write new row data
  await sheetsWriteRow(tok, SID.fir, tabName, insertSheetRow, [newIdx + 1, newCr, newSec, newDr]);

  // Renumber all Sl values from firstDataRow
  // Re-read after insert
  const rawAfter = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const slUpdates = [];
  let slCounter = 1;
  for (let i = 0; i < rawAfter.length; i++) {
    const b = (rawAfter[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) {
      slUpdates.push({ row: i + 1, sl: slCounter++ });
    }
  }

  // Batch update Sl column
  for (const u of slUpdates) {
    await sheetsUpdate(tok, SID.fir, `${tabName}!A${u.row}`, [[u.sl]]);
  }

  return { ok: true, ri: insertSheetRow, sl: newIdx + 1 };
}

async function updateFIRRow(tok, tabName, ri, sec, dr) {
  return sheetsUpdate(tok, SID.fir, `${tabName}!C${ri}:D${ri}`, [[sec, dr]]);
}

/* ═══════════════════════════════════════════════
   SECTION BUILDER HELPER
═══════════════════════════════════════════════ */
function buildSectionString(groups) {
  // groups: [{actId, actLabel, sections:[{main,sub}]}]
  if (!groups.length) return "";
  return groups.map((g, i) => {
    const secStr = g.sections.map(s => s.sub ? `${s.main}(${s.sub})` : s.main).join(", ");
    const actName = ACTS.find(a => a.id === g.actId)?.label || g.actId;
    const prefix = i === 0 ? "" : " r/w ";
    return `${prefix}${secStr} ${actName}`;
  }).join("");
}

/* ═══════════════════════════════════════════════
   CSS GENERATOR
═══════════════════════════════════════════════ */
function getCSS(themeVars) {
  const varBlock = Object.entries(themeVars).map(([k,v]) => `${k}:${v}`).join(";");
  return `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{${varBlock};--r:8px;--rl:12px;}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--txt);font-family:'Crimson Pro',Georgia,serif;font-size:14px;min-height:100vh;transition:background .3s,color .3s}
.mono{font-family:'JetBrains Mono',monospace}

.app{display:flex;flex-direction:column;min-height:100vh}

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
.inp{background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px;outline:none;width:100%;transition:border-color .15s,background .3s;font-family:'Crimson Pro',serif;-webkit-appearance:none;appearance:none}
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

/* SECTION BUILDER */
.sec-builder{background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--rl);padding:12px;margin-bottom:10px}
.sec-preview{background:var(--bg);border:1px solid var(--gold-d);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--txt);font-family:'Crimson Pro',serif;margin-bottom:10px;min-height:36px;line-height:1.6;word-break:break-word}
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

/* VIEWER */
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

/* MODAL CONFIRM */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rl);padding:20px;max-width:360px;width:100%;box-shadow:0 20px 60px var(--shadow)}
.modal-title{font-size:14px;font-weight:700;color:var(--red);margin-bottom:8px;font-family:'Cinzel',serif}
.modal-body{font-size:13px;color:var(--txt2);margin-bottom:16px;line-height:1.6}
.modal-actions{display:flex;gap:8px;justify-content:flex-end}

@media(max-width:600px){
  .hdr{padding:8px 10px;gap:8px}
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
@media(max-width:380px){
  .frow{grid-template-columns:1fr}
  .det-grid{grid-template-columns:1fr}
  .stat-grid{grid-template-columns:1fr 1fr}
}
`;
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  const [tok, setTok] = useState(() => {
    try { return localStorage.getItem("goog_tok") || null; } catch { return null; }
  });
  const [tokExpiry, setTokExpiry] = useState(() => {
    try { return Number(localStorage.getItem("goog_tok_exp")) || 0; } catch { return 0; }
  });
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("entry");
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem("fir_theme") || "night"; } catch { return "night"; }
  });

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    let s = document.getElementById("fir-css");
    if (!s) { s = document.createElement("style"); s.id = "fir-css"; document.head.appendChild(s); }
    s.textContent = getCSS(theme.vars);
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport"; m.content = "width=device-width, initial-scale=1, maximum-scale=1";
      document.head.appendChild(m);
    }
  }, [themeId]);

  function switchTheme(id) {
    setThemeId(id);
    try { localStorage.setItem("fir_theme", id); } catch {}
  }

  useEffect(() => {
    if (tok && !db && !loading) fetchAll(tok);
  }, [tok]);

  useEffect(() => {
    if (!tokExpiry) return;
    const msLeft = tokExpiry - Date.now() - 5 * 60 * 1000;
    if (msLeft <= 0) { refreshToken(); return; }
    const t = setTimeout(refreshToken, msLeft);
    return () => clearTimeout(t);
  }, [tokExpiry]);

  function refreshToken() {
    if (!window.google) return;
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE,
      callback: (r) => {
        if (r.access_token) {
          const exp = Date.now() + (r.expires_in || 3600) * 1000;
          try { localStorage.setItem("goog_tok", r.access_token); localStorage.setItem("goog_tok_exp", String(exp)); } catch {}
          setTok(r.access_token); setTokExpiry(exp);
        }
      },
      prompt: "",
    }).requestAccessToken();
  }

  function signIn() {
    const load = () => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE,
        callback: (r) => {
          if (r.access_token) {
            const exp = Date.now() + (r.expires_in || 3600) * 1000;
            try { localStorage.setItem("goog_tok", r.access_token); localStorage.setItem("goog_tok_exp", String(exp)); } catch {}
            setTok(r.access_token); setTokExpiry(exp);
          }
        },
      }).requestAccessToken();
    };
    if (!window.google) {
      const sc = document.createElement("script");
      sc.src = "https://accounts.google.com/gsi/client";
      sc.onload = load;
      document.head.appendChild(sc);
    } else load();
  }

  function signOut() {
    try { localStorage.removeItem("goog_tok"); localStorage.removeItem("goog_tok_exp"); } catch {}
    setTok(null); setTokExpiry(0); setDb(null);
  }

  async function fetchAll(token) {
    setLoading(true);
    try { const data = await loadAllData(token); setDb(data); }
    catch (e) { console.error("Load error:", e); }
    setLoading(false);
  }

  const tabs = [
    { id:"entry",    label:"📝 FIR Entry" },
    { id:"viewer",   label:"🔍 Viewer" },
    { id:"ftc",      label:"📁 FIR→Case" },
    { id:"abstract", label:"📊 Abstract" },
  ];

  return (
    <div className="app">
      <div className="hdr">
        <div>
          <div className="hdr-logo">⚖ FIR Management</div>
          <div className="hdr-sub">Jayankondam Sub-Division · Police Records</div>
        </div>
        <div className="auth-area">
          <div className={`dot ${tok ? "on" : ""}`}/>
          <span style={{fontSize:10,color:"var(--txt3)"}}>{tok ? "Connected" : "Offline"}</span>
          {tok
            ? <button className="btn btn-o btn-sm" onClick={signOut}>Sign Out</button>
            : <button className="btn btn-g btn-sm" onClick={signIn}>Sign In</button>
          }
        </div>
      </div>

      <div className="theme-bar">
        <span className="theme-lbl">Theme:</span>
        {THEMES.map(t => (
          <div key={t.id} className={`theme-pill ${themeId===t.id?"act":""}`}
               onClick={() => switchTheme(t.id)}>{t.label}</div>
        ))}
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={`tab ${activeTab===t.id?"act":""}`}
               onClick={() => setActiveTab(t.id)}>{t.label}</div>
        ))}
      </div>

      <div className="pane">
        {!tok ? (
          <AuthPrompt onSignIn={signIn}/>
        ) : loading ? (
          <div className="spin-wrap"><div className="spin"/><span>Loading data from Google Sheets…</span></div>
        ) : !db ? (
          <div className="msg-err">Failed to load data. Check network / permissions.</div>
        ) : (
          <>
            {activeTab==="entry"    && <EntryTab    db={db} setDb={setDb} tok={tok}/>}
            {activeTab==="viewer"   && <ViewerTab   db={db}/>}
            {activeTab==="ftc"      && <FTCTab      db={db} setDb={setDb} tok={tok}/>}
            {activeTab==="abstract" && <AbstractTab db={db} tok={tok} setDb={setDb}/>}
          </>
        )}
      </div>
    </div>
  );
}

function AuthPrompt({ onSignIn }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"50px 20px",textAlign:"center"}}>
      <div style={{fontSize:32}}>🔐</div>
      <div style={{fontSize:16,fontWeight:700,color:"var(--gold)"}}>Authentication Required</div>
      <div style={{fontSize:13,color:"var(--txt2)",maxWidth:360}}>Sign in with Google to access FIR records.</div>
      <button className="btn btn-g" onClick={onSignIn}>Sign in with Google</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SECTION BUILDER
═══════════════════════════════════════════════ */
function SectionBuilder({ value, onChange }) {
  // groups: [{actId, sections:[{main,sub}]}]
  const [groups, setGroups] = useState([]);
  const [activeAct, setActiveAct] = useState(null);
  const [mainSec, setMainSec] = useState("");
  const [subSec, setSubSec] = useState("");
  const [subMode, setSubMode] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fir_sec_history") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    const str = buildSectionString(groups);
    onChange(str);
  }, [groups]);

  function addSection() {
    if (!activeAct || !mainSec) return;
    const entry = { main: mainSec, sub: subSec };
    setGroups(prev => {
      const existing = prev.findIndex(g => g.actId === activeAct);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], sections: [...updated[existing].sections, entry] };
        return updated;
      } else {
        return [...prev, { actId: activeAct, sections: [entry] }];
      }
    });
    setMainSec(""); setSubSec(""); setSubMode(false);
  }

  function removeSection(actId, secIdx) {
    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.actId !== actId) return g;
        const secs = g.sections.filter((_, i) => i !== secIdx);
        return secs.length ? { ...g, sections: secs } : null;
      }).filter(Boolean);
      return updated;
    });
  }

  function removeGroup(actId) {
    setGroups(prev => prev.filter(g => g.actId !== actId));
  }

  function saveToHistory() {
    const str = buildSectionString(groups);
    if (!str) return;
    const newHist = [str, ...history.filter(h => h !== str)].slice(0, 10);
    setHistory(newHist);
    try { localStorage.setItem("fir_sec_history", JSON.stringify(newHist)); } catch {}
  }

  function loadFromHistory(str) {
    onChange(str);
    // Can't reconstruct groups from string easily, just set preview
    setGroups([]);
    onChange(str);
  }

  function clearAll() {
    setGroups([]); setMainSec(""); setSubSec(""); setSubMode(false); setActiveAct(null);
  }

  const preview = buildSectionString(groups);

  return (
    <div className="sec-builder">
      <div className="lbl" style={{marginBottom:6}}>Section U/s Builder</div>

      {/* History */}
      {history.length > 0 && (
        <div style={{marginBottom:10}}>
          <div className="lbl" style={{marginBottom:4,fontSize:9}}>Recent Sections (tap to reuse)</div>
          <div className="hist-row">
            {history.map((h,i) => (
              <div key={i} className="hist-chip" onClick={() => loadFromHistory(h)}
                title={h}>{h.length > 30 ? h.slice(0,30)+"…" : h}</div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div style={{marginBottom:8}}>
        <div className="lbl" style={{marginBottom:4}}>Concatenated Output</div>
        <div className="sec-preview">
          {preview
            ? preview.split(/ r\/w /).map((part, i) => (
                <span key={i}>{i > 0 && <em> r/w </em>}{part}</span>
              ))
            : <span style={{color:"var(--txt3)"}}>Select Act → enter section → Add</span>
          }
        </div>
      </div>

      {/* Groups display */}
      {groups.map(g => {
        const actLabel = ACTS.find(a => a.id === g.actId)?.label || g.actId;
        return (
          <div key={g.actId} className="sec-group">
            <span className="sec-group-act">{actLabel}</span>
            <div className="sec-chips">
              {g.sections.map((s, si) => (
                <span key={si} className="sec-chip">
                  {s.sub ? `${s.main}(${s.sub})` : s.main}
                  <span className="sec-chip-del" onClick={() => removeSection(g.actId, si)}>✕</span>
                </span>
              ))}
            </div>
            <button className="btn btn-r btn-sm" style={{padding:"2px 8px",fontSize:10}} onClick={() => removeGroup(g.actId)}>✕ Act</button>
          </div>
        );
      })}

      <div className="sec-divider">Select Act</div>

      {/* Act pills */}
      <div className="pill-row" style={{marginBottom:10}}>
        {ACTS.map(a => (
          <div key={a.id}
            className={`pill ${activeAct===a.id?"active-act":""}`}
            onClick={() => setActiveAct(activeAct===a.id ? null : a.id)}>
            {a.short}
          </div>
        ))}
      </div>

      {activeAct && (
        <>
          <div className="sec-divider">
            Enter Section for {ACTS.find(a=>a.id===activeAct)?.label}
          </div>
          <div className="sec-numpad-wrap">
            <NumPad2 label="Main Section" value={mainSec} onChange={setMainSec} maxLen={8}/>
            <NumPad2 label="Sub-Section (optional)" value={subSec} onChange={setSubSec} maxLen={6} withBrackets/>
          </div>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            <button className="btn btn-g btn-sm"
              disabled={!mainSec}
              onClick={addSection}>
              ＋ Add Section
            </button>
            <button className="btn btn-o btn-sm" onClick={() => { setMainSec(""); setSubSec(""); }}>
              Clear
            </button>
          </div>
        </>
      )}

      {preview && (
        <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
          <button className="btn btn-o btn-sm" onClick={saveToHistory}>💾 Save to History</button>
          <button className="btn btn-r btn-sm" onClick={clearAll}>✕ Clear All</button>
        </div>
      )}
    </div>
  );
}

/* ── NumPad2 — no system keyboard, with optional brackets toggle ── */
function NumPad2({ label, value, onChange, maxLen=8, withBrackets=false }) {
  function tap(ch) { if (value.replace(/\D/g,"").length >= maxLen) return; onChange(value + ch); }
  function bs() { onChange(value.slice(0,-1)); }
  const nums = [1,2,3,4,5,6,7,8,9];
  return (
    <div style={{flex:"1 1 130px",minWidth:0}}>
      <div className="lbl" style={{marginBottom:4}}>{label}</div>
      <div className="val-display">{value || <span style={{color:"var(--txt3)"}}>—</span>}</div>
      <div className="numpad">
        {nums.map(n=><div key={n} className="np" onClick={()=>tap(String(n))}>{n}</div>)}
        <div className="np" onClick={()=>tap("0")}>0</div>
        {withBrackets
          ? <><div className="np accent" onClick={()=>tap("(")}>( )</div><div className="np" onClick={bs}>⌫</div></>
          : <div className="np w2" onClick={bs}>⌫</div>
        }
      </div>
    </div>
  );
}

/* ── Date NumPad with auto-dot ── */
function DateNumPad({ value, onChange }) {
  function tapDigit(d) {
    const digits = value.replace(/\D/g,"");
    if (digits.length >= 8) return;
    const next = autoFormatDate(digits + d);
    onChange(next);
  }
  function bs() {
    const digits = value.replace(/\D/g,"");
    const next = autoFormatDate(digits.slice(0,-1));
    onChange(next);
  }
  const nums = [1,2,3,4,5,6,7,8,9];
  return (
    <div style={{flex:"1 1 130px",minWidth:0}}>
      <div className="lbl" style={{marginBottom:4}}>Date Received (DD.MM.YYYY)</div>
      <div className="val-display mono">{value || <span style={{color:"var(--txt3)"}}>—</span>}</div>
      <div className="numpad">
        {nums.map(n=><div key={n} className="np" onClick={()=>tapDigit(String(n))}>{n}</div>)}
        <div className="np" onClick={()=>tapDigit("0")}>0</div>
        <div className="np w2" onClick={bs}>⌫</div>
      </div>
    </div>
  );
}

/* ── FIR NumPad ── */
function FIRNumPad({ value, onChange }) {
  function tap(d) { if (value.length >= 6) return; onChange(value + d); }
  function bs() { onChange(value.slice(0,-1)); }
  const nums = [1,2,3,4,5,6,7,8,9];
  return (
    <div style={{flex:"1 1 130px",minWidth:0}}>
      <div className="lbl" style={{marginBottom:4}}>FIR Number</div>
      <div className="val-display mono">{value || <span style={{color:"var(--txt3)"}}>—</span>}</div>
      <div className="numpad">
        {nums.map(n=><div key={n} className="np" onClick={()=>tap(String(n))}>{n}</div>)}
        <div className="np" onClick={()=>tap("0")}>0</div>
        <div className="np w2" onClick={bs}>⌫</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FIR ENTRY TAB
═══════════════════════════════════════════════ */
function EntryTab({ db, setDb, tok }) {
  const curYr = String(new Date().getFullYear());
  const [fn,  setFn]  = useState(() => { try { return localStorage.getItem("fir_draft_fn")||""; } catch { return ""; } });
  const [yr,  setYr]  = useState(() => { try { return localStorage.getItem("fir_draft_yr")||curYr; } catch { return curYr; } });
  const [st,  setSt]  = useState(() => { try { return localStorage.getItem("fir_draft_st")||""; } catch { return ""; } });
  const [uns, setUns] = useState(() => { try { return localStorage.getItem("fir_draft_uns")||""; } catch { return ""; } });
  const [dt,  setDt]  = useState(() => { try { return localStorage.getItem("fir_draft_dt")||""; } catch { return ""; } });
  const [msg, setMsg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [existingRow, setExistingRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-save draft
  useEffect(() => {
    try {
      localStorage.setItem("fir_draft_fn", fn);
      localStorage.setItem("fir_draft_yr", yr);
      localStorage.setItem("fir_draft_st", st);
      localStorage.setItem("fir_draft_uns", uns);
      localStorage.setItem("fir_draft_dt", dt);
    } catch {}
  }, [fn, yr, st, uns, dt]);

  // Check duplicate / existing when fn + yr + st are all set
  useEffect(() => {
    if (!fn || !yr || !st) { setEditMode(false); setExistingRow(null); return; }
    const sNum = String(parseInt(fn, 10) || fn);
    const rows = (db.fir[st] || []).filter(r => firMatch(r.cr, sNum, yr));
    if (rows.length) {
      setExistingRow(rows[0]);
      setEditMode(true);
    } else {
      setExistingRow(null);
      setEditMode(false);
    }
  }, [fn, yr, st]);

  function loadExisting() {
    if (!existingRow) return;
    setUns(existingRow.sec || "");
    setDt(existingRow.dr || "");
    setMsg({ type:"info", text:`Loaded FIR ${existingRow.cr} for editing.` });
  }

  function clearDraft() {
    setFn(""); setUns(""); setDt(""); setMsg(null); setEditMode(false); setExistingRow(null);
    setYr(curYr); setSt("");
    try {
      localStorage.removeItem("fir_draft_fn"); localStorage.removeItem("fir_draft_yr");
      localStorage.removeItem("fir_draft_st"); localStorage.removeItem("fir_draft_uns");
      localStorage.removeItem("fir_draft_dt");
    } catch {}
  }

  async function save() {
    if (!fn || !yr || !st) { setMsg({type:"err",text:"Enter FIR Number, Year, and select a Station."}); return; }
    if (!uns) { setMsg({type:"err",text:"Section U/s is required."}); return; }
    if (!dt || dt.length < 10) { setMsg({type:"err",text:"Enter a valid date (DD.MM.YYYY)."}); return; }
    const cr = `${parseInt(fn,10)}/${yr}`;

    if (editMode && existingRow) {
      // UPDATE existing row
      setMsg({type:"loading",text:"Updating…"});
      const ok = await updateFIRRow(tok, st, existingRow.ri, uns, dt);
      if (ok) {
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [st]: prev.fir[st].map(r => r.ri === existingRow.ri ? {...r, sec:uns, dr:dt} : r)
          }
        }));
        setMsg({type:"ok",text:`✓ FIR ${cr} updated in ${SMAP.find(s=>s.sh===st)?.lb}.`});
      } else {
        setMsg({type:"err",text:"Update failed."});
      }
      return;
    }

    // NEW: sorted insert
    setMsg({type:"loading",text:"Saving with sorted insert…"});
    const existingRows = db.fir[st] || [];
    const result = await insertFIRSorted(tok, st, cr, uns, dt, existingRows);
    if (result.ok) {
      const newRow = { sl: String(result.sl), cr, sec: uns, dr: dt, yr, ri: result.ri };
      // Re-sort local db
      const updated = [...existingRows, newRow].sort((a,b) => firSortKey(a.cr) - firSortKey(b.cr))
        .map((r,i) => ({...r, sl:String(i+1)}));
      setDb(prev => ({...prev, fir:{...prev.fir, [st]: updated}}));
      setMsg({type:"ok",text:`✓ FIR ${cr} saved (Sl ${result.sl}) to ${SMAP.find(s=>s.sh===st)?.lb}.`});
      setFn(""); setUns(""); setDt(""); setEditMode(false); setExistingRow(null);
      try {
        localStorage.removeItem("fir_draft_fn"); localStorage.removeItem("fir_draft_uns");
        localStorage.removeItem("fir_draft_dt");
      } catch {}
    } else {
      setMsg({type:"err",text:"Save failed. Check permissions."});
    }
  }

  async function deleteFIR() {
    if (!existingRow) return;
    setShowDeleteConfirm(false);
    setMsg({type:"loading",text:"Deleting…"});
    const ok = await sheetsDeleteRow(tok, SID.fir, st, existingRow.ri);
    if (ok) {
      setDb(prev => ({
        ...prev,
        fir: {...prev.fir, [st]: prev.fir[st].filter(r => r.ri !== existingRow.ri)}
      }));
      setMsg({type:"ok",text:`✓ FIR ${existingRow.cr} deleted.`});
      clearDraft();
    } else {
      setMsg({type:"err",text:"Delete failed."});
    }
  }

  const stObj = SMAP.find(s => s.sh === st);
  const recent = st ? (db.fir[st] || []).slice(-3).reverse() : [];
  const firReady = fn && yr;

  return (
    <div>
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">⚠ Confirm Delete</div>
            <div className="modal-body">
              Delete FIR <strong style={{color:"var(--red)"}}>{fn}/{yr}</strong> from{" "}
              <strong>{stObj?.lb}</strong>? This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-o btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-r btn-sm" onClick={deleteFIR}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="ctitle">
          {editMode ? "✏️ Edit FIR" : "📝 New FIR Entry"}
          {editMode && <span className="bdg bdg-b" style={{marginLeft:4}}>Edit Mode</span>}
        </div>

        {/* STEP 1: FIR Number + Year — numpad */}
        <div className="sec-divider">Step 1 — FIR Number & Year</div>
        <div className="numpad-row" style={{marginBottom:12}}>
          <FIRNumPad value={fn} onChange={setFn}/>
          <div style={{flex:"1 1 130px",minWidth:0}}>
            <div className="lbl" style={{marginBottom:4}}>Year</div>
            <div className="val-display mono" style={{marginBottom:6}}>{yr}</div>
            <div className="yr-ctrl" style={{marginBottom:6}}>
              <button className="btn btn-o btn-sm" onClick={()=>setYr(y=>String(parseInt(y)-1))}>◀</button>
              <span className="yr-val">{yr}</span>
              <button className="btn btn-o btn-sm" onClick={()=>setYr(y=>String(parseInt(y)+1))}>▶</button>
              {yr!==curYr && <span className="rst" onClick={()=>setYr(curYr)}>reset</span>}
            </div>
            {fn && yr && (
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
                  {parseInt(fn,10)}/{yr}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Police Station — inline pills (shown only when FIR + year entered) */}
        {firReady && (
          <>
            <div className="sec-divider">Step 2 — Select Police Station</div>
            <div className="pill-row" style={{marginBottom:8}}>
              {SMAP.map(s => {
                const sNum = String(parseInt(fn,10)||fn);
                const exists = (db.fir[s.sh]||[]).some(r => firMatch(r.cr, sNum, yr));
                return (
                  <div key={s.sh}
                    className={`pill ${st===s.sh?"active":""} ${exists && st!==s.sh?"warn":""}`}
                    onClick={() => setSt(st===s.sh?"":s.sh)}>
                    {s.lb}
                    {exists && <span style={{fontSize:9,marginLeft:2}}>{st===s.sh?"✏":"⚠"}</span>}
                  </div>
                );
              })}
            </div>
            {st && existingRow && !editMode && (
              <div className="msg-err" style={{marginBottom:8}}>
                ⚠ FIR {fn}/{yr} already exists in {stObj?.lb}.
                <button className="btn btn-edit btn-sm" style={{marginLeft:8}} onClick={loadExisting}>✏ Edit it</button>
              </div>
            )}
            {st && editMode && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span className="st-badge gold">✏ Editing {fn}/{yr} in {stObj?.lb}</span>
                {!uns && <button className="btn btn-edit btn-sm" onClick={loadExisting}>Load Data</button>}
              </div>
            )}
          </>
        )}

        {/* STEP 3: Section Builder */}
        {firReady && st && (
          <>
            <div className="sec-divider">Step 3 — Section U/s</div>
            <SectionBuilder value={uns} onChange={setUns}/>
            {uns && (
              <div style={{fontSize:11,color:"var(--txt2)",marginBottom:8,padding:"6px 10px",
                background:"var(--bg3)",borderRadius:6,border:"1px solid var(--gold-d)",
                fontFamily:"Crimson Pro,serif",lineHeight:1.6}}>
                <span style={{color:"var(--txt3)",fontSize:9,display:"block",marginBottom:2}}>FINAL OUTPUT:</span>
                {uns}
              </div>
            )}
          </>
        )}

        {/* STEP 4: Date */}
        {firReady && st && (
          <>
            <div className="sec-divider">Step 4 — Date Received</div>
            <div style={{marginBottom:12}}>
              <DateNumPad value={dt} onChange={setDt}/>
            </div>
          </>
        )}

        {/* Actions */}
        {firReady && st && (
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-g" onClick={save}
              disabled={!uns || !dt || dt.length < 10}>
              {editMode ? "💾 Update FIR" : "💾 Save FIR"}
            </button>
            {editMode && (
              <button className="btn btn-r" onClick={() => setShowDeleteConfirm(true)}>🗑 Delete</button>
            )}
            <button className="btn btn-o" onClick={clearDraft}>✕ Clear</button>
          </div>
        )}

        {msg && (
          <div className={msg.type==="ok"?"msg-ok":msg.type==="err"?"msg-err":"msg-info"} style={{marginTop:8}}>
            {msg.type==="loading" && <span className="spin" style={{display:"inline-block",marginRight:6}}/>}
            {msg.text}
          </div>
        )}
      </div>

      {/* Recent FIRs */}
      {recent.length > 0 && (
        <div className="card">
          <div className="ctitle">🕐 Recent FIRs — {stObj?.lb}</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Section U/s</th><th>Date Received</th></tr>
              </thead>
              <tbody>
                {recent.map((r,i)=>(
                  <tr key={i}>
                    <td className="mono">{r.sl}</td>
                    <td className="mono" style={{color:"var(--gold)"}}>{r.cr}</td>
                    <td>{r.sec}</td>
                    <td className="mono">{r.dr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FIR VIEWER TAB
═══════════════════════════════════════════════ */
function ViewerTab({ db }) {
  const [fn, setFn]             = useState("");
  const [yr, setYr]             = useState("");
  const [searched, setSearched] = useState(false);

  const [pendHits, setPendHits] = useState([]);
  const [dispHits, setDispHits] = useState([]);
  const [nvHits,   setNvHits]   = useState([]);
  const [cnHits,   setCnHits]   = useState([]);
  const [firHits,  setFirHits]  = useState([]);

  const [activeSt,     setActiveSt]     = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);

  function doSearch() {
    const trimmed = fn.trim();
    if (!trimmed) return;
    const sNum = String(parseInt(trimmed, 10) || trimmed);
    const sYr  = yr.trim();

    const fh = [];
    for (const s of SMAP) {
      const rows = (db.fir[s.sh] || []).filter(r => firMatch(r.cr, sNum, sYr));
      if (rows.length) fh.push({ s, rows });
    }

    const ph = db.pend.filter(r => firMatch(r.fn, sNum, sYr));
    const dh = db.disp.filter(r => firMatch(r.fn, sNum, sYr));
    const nh = db.nv.filter(r   => firMatch(r.fn, sNum, sYr));
    const ch = db.cnum.filter(r => firMatch(r.fn, sNum, sYr));

    setFirHits(fh); setPendHits(ph); setDispHits(dh); setNvHits(nh); setCnHits(ch);
    setSearched(true); setActiveSt(null); setActiveCaseId(null);
  }

  function doClear() {
    setFn(""); setYr(""); setSearched(false);
    setFirHits([]); setPendHits([]); setDispHits([]);
    setNvHits([]); setCnHits([]);
    setActiveSt(null); setActiveCaseId(null);
  }

  const displayFIR = yr ? `${fn}/${yr}` : fn;

  const allCaseRows = [
    ...pendHits.map(r => ({ ...r, _src: "pend" })),
    ...dispHits.map(r => ({ ...r, _src: "disp" })),
    ...nvHits.map(r   => ({ ...r, _src: "nv"   })),
    ...cnHits.map(r   => ({ ...r, _src: "cnum" })),
  ];

  const stationNames = [];
  const seenSt = new Set();
  for (const r of allCaseRows) {
    const ps = (r.sta || "").trim() || "(Blank Station)";
    if (!seenSt.has(ps)) { seenSt.add(ps); stationNames.push(ps); }
  }

  function getRowsForStation(stName) {
    if (!stName) return [];
    const isBlank = stName === "(Blank Station)";
    const stL = stName.toLowerCase();
    return allCaseRows.filter(r => {
      const ps = (r.sta || "").trim();
      const pt = (r.pt  || "").toLowerCase();
      if (isBlank) return !ps;
      return ps.toLowerCase() === stL
          || ps.toLowerCase().includes(stL)
          || (stL.includes(ps.toLowerCase()) && ps.length > 3)
          || pt.includes(stL);
    });
  }

  const stationRows = (activeSt && !activeSt.startsWith("fir::")) ? getRowsForStation(activeSt) : [];
  const totalHits = firHits.reduce((a, b) => a + b.rows.length, 0) + allCaseRows.length;

  return (
    <div>
      <div className="v-search-box">
        <div className="ctitle">🔍 FIR Search</div>
        <div className="v-inputs">
          <div className="fg" style={{ flex:"1 1 100px" }}>
            <label className="lbl">FIR Number</label>
            <input className="inp mono" type="tel" inputMode="numeric"
              value={fn} onChange={e => setFn(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="e.g. 12"/>
          </div>
          <div className="fg" style={{ flex:"1 1 80px" }}>
            <label className="lbl">Year (optional)</label>
            <input className="inp mono" type="tel" inputMode="numeric"
              value={yr} onChange={e => setYr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="2025"/>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button className="btn btn-g" style={{height:36}} onClick={doSearch}>Search</button>
            <button className="btn btn-o btn-sm" style={{height:36}} onClick={doClear}>✕</button>
          </div>
        </div>
      </div>

      {searched && totalHits === 0 && (
        <div style={{textAlign:"center",padding:"28px 20px"}}>
          <div style={{fontSize:22,marginBottom:8}}>🔍</div>
          <div style={{fontSize:13,fontWeight:600,color:"var(--txt2)",marginBottom:4}}>
            No records found for <span style={{color:"var(--gold)"}}>{displayFIR}</span>
          </div>
        </div>
      )}

      {searched && totalHits > 0 && (
        <>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:10}}>
            <b style={{color:"var(--gold)"}}>{totalHits}</b> record{totalHits>1?"s":""} for{" "}
            <b style={{color:"var(--gold)"}}>{displayFIR}</b>
          </div>

          {firHits.length > 0 && (
            <div style={{marginBottom:14}}>
              <div className="lbl" style={{marginBottom:6}}>📋 FIR Pending Register</div>
              <div className="pill-row">
                {firHits.map(({ s, rows }) => {
                  const key = "fir::" + s.sh;
                  return (
                    <div key={key}
                      className={`pill ${activeSt===key?"active":""}`}
                      onClick={() => { setActiveSt(activeSt===key?null:key); setActiveCaseId(null); }}>
                      {s.lb}
                      <span style={{fontSize:9,opacity:.6,marginLeft:1}}>FIR</span>
                      <span className="pill-cnt">{rows.length}</span>
                    </div>
                  );
                })}
              </div>

              {activeSt && activeSt.startsWith("fir::") && (() => {
                const shKey = activeSt.replace("fir::","");
                const sObj  = SMAP.find(s => s.sh===shKey);
                const rows  = (firHits.find(x => x.s.sh===shKey)||{}).rows||[];
                return (
                  <div className="v-panel">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"var(--gold)"}}>{sObj?.lb}</span>
                      <span className="bdg bdg-r">📋 FIR Pending Register</span>
                    </div>
                    {rows.map((r,i) => (
                      <div key={i} className="v-fir-row">
                        <div className="det-grid">
                          <div><div className="df-lbl">CR Number</div><div className="df-val hi mono">{r.cr}</div></div>
                          <div><div className="df-lbl">Section U/s</div><div className="df-val">{r.sec||"—"}</div></div>
                          <div><div className="df-lbl">Date Received</div><div className="df-val mono">{r.dr||"—"}</div></div>
                          <div><div className="df-lbl">Year</div><div className="df-val mono">{r.yr||"—"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {stationNames.length > 0 && (
            <div style={{marginBottom:14}}>
              <div className="lbl" style={{marginBottom:6}}>⚖ Cases — tap a station</div>
              <div className="pill-row">
                {stationNames.map(ps => {
                  const cnt = getRowsForStation(ps).length;
                  return (
                    <div key={ps}
                      className={`pill ${activeSt===ps?"active":""}`}
                      onClick={() => { setActiveSt(activeSt===ps?null:ps); setActiveCaseId(null); }}>
                      {ps}<span className="pill-cnt">{cnt}</span>
                    </div>
                  );
                })}
              </div>

              {activeSt && !activeSt.startsWith("fir::") && (
                <div className="v-panel">
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--gold)"}}>{activeSt}</span>
                    {stationRows.filter(r=>r._src==="pend").length>0 &&
                      <span className="bdg bdg-b">⚖ {stationRows.filter(r=>r._src==="pend").length} Pending</span>}
                    {stationRows.filter(r=>r._src==="disp").length>0 &&
                      <span className="bdg bdg-g">✓ {stationRows.filter(r=>r._src==="disp").length} Disposed</span>}
                    {stationRows.filter(r=>r._src==="nv").length>0 &&
                      <span className="bdg bdg-a">🏷 {stationRows.filter(r=>r._src==="nv").length} NV</span>}
                    {stationRows.filter(r=>r._src==="cnum").length>0 &&
                      <span className="bdg bdg-p">📁 {stationRows.filter(r=>r._src==="cnum").length} Case#</span>}
                  </div>

                  {[
                    { src:"pend", title:"⚖ Case Pending",          bdg:"bdg-b" },
                    { src:"disp", title:"✅ Disposed Cases",        bdg:"bdg-g" },
                    { src:"nv",   title:"🏷 Non-Valuable Property", bdg:"bdg-a" },
                    { src:"cnum", title:"📁 Case Numbered",         bdg:"bdg-p" },
                  ].map(({ src, title, bdg }) => {
                    const srcRows = stationRows.filter(r => r._src===src);
                    if (!srcRows.length) return null;
                    return (
                      <div key={src} className="v-sheet-sec">
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <span className="lbl">{title}</span>
                          <span className={`bdg ${bdg}`}>{srcRows.length}</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
                          {srcRows.map((r,i) => {
                            const caseId = `${src}::${r.ri}::${i}`;
                            const label = (r.cn||"").trim()||(r.rp||"").trim()||`#${r.sl||r.sno||r.ri}`;
                            return (
                              <div key={caseId}
                                className={`cn-pill ${activeCaseId===caseId?"active":""}`}
                                onClick={() => setActiveCaseId(activeCaseId===caseId?null:caseId)}>
                                {label}
                              </div>
                            );
                          })}
                        </div>
                        {srcRows.map((r,i) => {
                          const caseId = `${src}::${r.ri}::${i}`;
                          if (activeCaseId!==caseId) return null;
                          return <CaseDetail key={caseId} r={r} srcKey={src}/>;
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CaseDetail({ r, srcKey }) {
  const fields = {
    pend: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Petitioner VS Respondent",r.pt,null,true],["Advocate",r.adv],
      ["Date of Registration",r.dreg,"mono"],["Next Hearing Date",r.nxt,"mono"],
      ["Purpose",r.pur],["Act / Section",r.sec],["Police Station",r.sta],
      ["Nature",r.nat],["Designation",r.des],
    ],
    disp: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Petitioner VS Respondent",r.pt,null,true],["Advocate",r.adv],
      ["Date of Registration",r.dreg,"mono"],["Date of Decision",r.ddec,"mono"],
      ["Nature of Disposal",r.dnat],["Act / Section",r.sec],["Police Station",r.sta],
      ["Nature",r.nat],["Designation",r.des],
    ],
    nv: [
      ["RP Number",r.rp,"hi mono"],["Case Number",r.cn,"mono"],
      ["FIR Number",r.fn,"mono"],["Police Station",r.sta],
      ["Description",r.desc,null,true],["Remarks",r.rem,null,true],
    ],
    cnum: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Parties",r.pt,null,true],["Police Station",r.sta],
      ["Advocate",r.adv],["Date of Registration",r.dreg,"mono"],
      ["Next Date",r.nxt,"mono"],["Case Type",r.type],
      ["Section U/s (FIR)",r.sec],["Section (Case)",r.sec2],
      ["Nature",r.nat],["Designation",r.des],
    ],
  }[srcKey]||[];

  const bdgMap = {pend:"bdg-b",disp:"bdg-g",nv:"bdg-a",cnum:"bdg-p"};
  const lbMap  = {pend:"Case Pending",disp:"Disposed",nv:"Non-Valuable Property",cnum:"Case Numbered"};

  return (
    <div className="v-det">
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
          {r.cn||r.rp||"—"}
        </span>
        <span className={`bdg ${bdgMap[srcKey]}`}>{lbMap[srcKey]}</span>
      </div>
      <div className="det-grid">
        {fields.map(([lbl,val,cls,full],i) => (
          <div key={i} style={full?{gridColumn:"1/-1"}:{}}>
            <div className="df-lbl">{lbl}</div>
            <div className={`df-val ${cls||""}`}>{val||"—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FIR → CASE NUMBERED TAB
═══════════════════════════════════════════════ */
function FTCTab({ db, setDb, tok }) {
  const curYr = String(new Date().getFullYear());
  const [step,setStep]       = useState(1);
  const [fn,setFn]           = useState("");
  const [yr,setYr]           = useState(curYr);
  const [st,setSt]           = useState("JKM");
  const [firRow,setFirRow]   = useState(null);
  const [selCase,setSelCase] = useState(null);
  const [msg,setMsg]         = useState(null);

  function reset() {
    setStep(1);setFn("");setYr(curYr);setSt("JKM");
    setFirRow(null);setSelCase(null);setMsg(null);
  }

  function searchFIR() {
    if (!fn) { setMsg({type:"err",text:"Enter FIR Number."}); return; }
    const sNum = String(parseInt(fn,10)||fn);
    const rows = (db.fir[st]||[]).filter(r=>firMatch(r.cr,sNum,yr));
    if (!rows.length) {
      setMsg({type:"err",text:`FIR ${fn}/${yr} not found in ${SMAP.find(s=>s.sh===st)?.lb}.`});
      return;
    }
    setFirRow(rows[0]); setStep(2); setMsg(null);
  }

  function buildCases() {
    const sNum = String(parseInt(fn,10)||fn);
    return [
      ...db.pend.filter(c=>firMatch(c.fn,sNum,yr)).map(c=>({...c,_type:"pending"})),
      ...db.disp.filter(c=>firMatch(c.fn,sNum,yr)).map(c=>({...c,_type:"disposal"})),
    ];
  }

  async function execute() {
    setMsg({type:"loading",text:"Processing…"});
    const sc=selCase;
    const stLb=SMAP.find(x=>x.sh===st)?.lb||st;
    const row=[
      `${fn}/${yr}`,stLb,firRow?.sec||"",firRow?.dr||"",
      sc.cn||"",sc.pt||"",sc.adv||"",sc.dreg||"",
      sc.nxt||sc.ddec||"",sc._type||"",sc.sec||"",sc.nat||"",sc.des||""
    ];
    const saved=await sheetsAppend(tok,SID.casenum,"Sheet1!A:M",[row]);
    if (!saved) { setMsg({type:"err",text:"Failed to save to Case Numbered sheet."}); return; }
    if (firRow?.ri && firRow.ri!==999999) {
      await sheetsDeleteRow(tok,SID.fir,st,firRow.ri);
    }
    const idx=(db.fir[st]||[]).findIndex(r=>r.cr===firRow?.cr);
    if (idx>=0) {
      const newFir=[...(db.fir[st]||[])];
      newFir.splice(idx,1);
      setDb(prev=>({...prev,fir:{...prev.fir,[st]:newFir},cnum:[...prev.cnum,{fn:`${fn}/${yr}`,sta:stLb,...sc}]}));
    }
    setMsg({type:"ok",text:`✓ FIR ${fn}/${yr} moved to Case Numbered.`});
    setTimeout(reset,1600);
  }

  const allCases=step>=2?buildCases():[];
  const stLb=SMAP.find(x=>x.sh===st)?.lb||st;

  return (
    <div className="card">
      <div className="ctitle">📁 FIR → Case Numbered</div>
      <div className="step-row">
        {[1,2,3].map((n,i) => (
          <div key={n} style={{display:"flex",alignItems:"center",flex:i<2?"1":"initial",gap:4}}>
            <div className={`step-dot ${step>n?"done":step===n?"act":""}`}>{step>n?"✓":n}</div>
            {i<2 && <div className="step-line"/>}
          </div>
        ))}
      </div>

      {step===1 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 1 — Enter FIR details</div>
          <div className="frow">
            <div className="fg">
              <label className="lbl">FIR Number</label>
              <input className="inp mono" type="tel" inputMode="numeric" value={fn}
                onChange={e=>setFn(e.target.value)} placeholder="e.g. 561"/>
            </div>
            <div className="fg">
              <label className="lbl">Year</label>
              <input className="inp mono" type="tel" inputMode="numeric" value={yr}
                onChange={e=>setYr(e.target.value)} placeholder={curYr}/>
            </div>
            <div className="fg">
              <label className="lbl">Police Station</label>
              <select className="inp" value={st} onChange={e=>setSt(e.target.value)}>
                {SMAP.map(s=><option key={s.sh} value={s.sh}>{s.lb}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-g" onClick={searchFIR}>🔍 Search FIR</button>
        </div>
      )}

      {step===2 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 2 — Select linked case</div>
          {firRow && (
            <div className="msg-info" style={{marginBottom:10}}>
              ✓ FIR {firRow.cr} — {firRow.sec} | Received: {firRow.dr}
            </div>
          )}
          <div style={{fontSize:11,color:"var(--txt2)",marginBottom:6}}>
            Matched cases ({allCases.length})
          </div>
          {allCases.length===0
            ? <div className="no-data">No pending/disposal cases found for FIR {fn}/{yr}.</div>
            : allCases.map((c,i) => (
              <div key={i}
                className={`case-sel ${selCase?.cn===c.cn&&selCase?._type===c._type?"sel":""}`}
                onClick={()=>setSelCase(c)}>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:"JetBrains Mono,monospace"}}>{c.cn||"—"}</div>
                  <div style={{color:"var(--txt2)",fontSize:12,marginTop:2,wordBreak:"break-word"}}>{c.pt}</div>
                  <div style={{color:"var(--txt3)",fontSize:11,marginTop:2}}>{c.sta||""}{c.dreg?` · ${c.dreg}`:""}</div>
                </div>
                <span className={`bdg ${c._type==="pending"?"bdg-b":"bdg-g"}`} style={{flexShrink:0}}>
                  {c._type==="pending"?"Pending":"Disposed"}
                </span>
              </div>
            ))
          }
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button className="btn btn-o" onClick={()=>{setStep(1);setSelCase(null);}}>← Back</button>
            <button className="btn btn-g" disabled={!selCase} onClick={()=>setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 3 — Confirm & Execute</div>
          <div className="confirm-box">
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
                FIR: {fn}/{yr}
              </span>
              <span className="bdg bdg-a">{stLb}</span>
              <span style={{color:"var(--txt2)"}}>→</span>
              <span className="bdg bdg-p">{selCase?.cn||"N/A"}</span>
            </div>
            <div className="det-grid">
              <div><div className="df-lbl">Section U/s</div><div className="df-val">{firRow?.sec||"—"}</div></div>
              <div><div className="df-lbl">Date Received</div><div className="df-val mono">{firRow?.dr||"—"}</div></div>
              <div><div className="df-lbl">Case Number</div>
                <div className="df-val mono" style={{color:"var(--pur)"}}>{selCase?.cn||"—"}</div>
              </div>
              <div><div className="df-lbl">Police Station</div><div className="df-val">{selCase?.sta||"—"}</div></div>
              <div style={{gridColumn:"1/-1"}}>
                <div className="df-lbl">Petitioner VS Respondent</div>
                <div className="df-val">{selCase?.pt||"—"}</div>
              </div>
            </div>
          </div>
          <div className="warn-box">
            ⚠ This will delete FIR {fn}/{yr} from the "{st}" sheet and save to Case Numbered.
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-o" onClick={()=>setStep(2)}>← Back</button>
            <button className="btn btn-r" onClick={execute}>🗂 Move to Case Numbered</button>
          </div>
        </div>
      )}

      {msg && (
        <div className={msg.type==="ok"?"msg-ok":msg.type==="err"?"msg-err":"msg-info"} style={{marginTop:10}}>
          {msg.type==="loading"&&<span className="spin" style={{display:"inline-block",marginRight:6}}/>}
          {msg.text}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABSTRACT TAB
═══════════════════════════════════════════════ */
function AbstractTab({ db, tok, setDb }) {
  const [filterSt,  setFilterSt]  = useState("ALL");
  const [filterYr,  setFilterYr]  = useState("ALL");
  const [filterDate,setFilterDate]= useState("");
  const [filterSec, setFilterSec] = useState("");
  const [listSearch,setListSearch]= useState("");
  const [renumMsg,  setRenumMsg]  = useState(null);

  const allFirs = [];
  for (const s of SMAP) {
    for (const r of (db.fir[s.sh]||[])) {
      if (!isValidFIRCell(r.cr)) continue;
      const yr = parseFIR(r.cr).yr || "";
      allFirs.push({ ...r, yr, stSh: s.sh, stLb: s.lb });
    }
  }

  const allYears = [...new Set(allFirs.map(r=>r.yr).filter(Boolean))].sort();

  const filtered = allFirs.filter(r => {
    if (filterSt!=="ALL" && r.stSh!==filterSt) return false;
    if (filterYr!=="ALL" && r.yr!==filterYr)   return false;
    if (filterDate && !((r.dr||"").includes(filterDate))) return false;
    if (filterSec  && !(r.sec||"").toLowerCase().includes(filterSec.toLowerCase())) return false;
    return true;
  });

  const grand = filtered.length;
  const stTot = SMAP.map(s=>({ sh:s.sh, lb:s.lb, cnt:filtered.filter(r=>r.stSh===s.sh).length }));

  // Conflict detection: FIRs in multiple stations
  const firStationMap = {};
  for (const r of allFirs) {
    if (!firStationMap[r.cr]) firStationMap[r.cr] = new Set();
    firStationMap[r.cr].add(r.stSh);
  }
  const conflicts = Object.entries(firStationMap)
    .filter(([,v]) => v.size > 1)
    .map(([cr, stations]) => ({ cr, stations: [...stations] }));

  const byYr={};
  for (const r of filtered) { const k=r.yr||"?"; byYr[k]=(byYr[k]||0)+1; }
  const yrSort=Object.entries(byYr).sort((a,b)=>a[0].localeCompare(b[0]));

  const byMon={};
  for (const r of filtered) {
    if (r.dr) {
      const pts=r.dr.trim().split(".");
      if (pts.length>=3) { const k=`${pts[2].trim()}-${pts[1].trim().padStart(2,"0")}`; byMon[k]=(byMon[k]||0)+1; }
    }
  }
  const monNames=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monSort=Object.entries(byMon).sort((a,b)=>a[0].localeCompare(b[0]));

  const byDay={};
  for (const r of filtered) { if (r.dr&&r.dr.trim()) { const k=r.dr.trim(); byDay[k]=(byDay[k]||0)+1; } }
  function parseDDMMYYYY(s) {
    const p=s.split("."); if(p.length<3) return 0;
    return new Date(p[2],p[1]-1,p[0]).getTime()||0;
  }
  const daySort=Object.entries(byDay).sort((a,b)=>parseDDMMYYYY(a[0])-parseDDMMYYYY(b[0])).slice(-30).reverse();

  const [secSearch,setSecSearch]=useState("");
  const bySec={};
  for (const r of filtered) { const k=(r.sec||"Unknown").trim(); bySec[k]=(bySec[k]||0)+1; }
  const secAll=Object.entries(bySec).sort((a,b)=>b[1]-a[1]);
  const secShow=secSearch ? secAll.filter(([k])=>k.toLowerCase().includes(secSearch.toLowerCase())) : secAll.slice(0,40);

  const listFiltered=filtered.filter(r => {
    if (!listSearch) return true;
    const q=listSearch.toLowerCase();
    return (r.cr||"").toLowerCase().includes(q)||(r.sec||"").toLowerCase().includes(q)
      ||(r.dr||"").toLowerCase().includes(q)||(r.stLb||"").toLowerCase().includes(q);
  });

  function resetAll() { setFilterSt("ALL");setFilterYr("ALL");setFilterDate("");setFilterSec("");setListSearch(""); }
  const hasFilters=filterSt!=="ALL"||filterYr!=="ALL"||filterDate||filterSec;

  // Batch renumber all stations
  async function batchRenumber() {
    setRenumMsg({type:"loading",text:"Renumbering all sheets…"});
    let totalFixed=0;
    for (const s of SMAP) {
      const rawRows = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      let slCounter=1;
      for (let i=0; i<rawRows.length; i++) {
        const b=(rawRows[i][1]||"").toString().trim();
        if (isValidFIRCell(b)) {
          const currentSl=(rawRows[i][0]||"").toString().trim();
          if (currentSl!==String(slCounter)) {
            await sheetsUpdate(tok, SID.fir, `${s.sh}!A${i+1}`, [[slCounter]]);
            totalFixed++;
          }
          slCounter++;
        }
      }
    }
    setRenumMsg({type:"ok",text:`✓ Fixed ${totalFixed} serial number(s) across all sheets.`});
    setTimeout(()=>setRenumMsg(null),3000);
  }

  return (
    <div>
      <div className="card">
        <div className="ctitle">
          🔦 Filters
          {hasFilters && (
            <button className="btn btn-o btn-sm" style={{marginLeft:"auto"}} onClick={resetAll}>✕ Reset All</button>
          )}
        </div>
        <div className="frow">
          <div className="fg">
            <label className="lbl">Station</label>
            <select className="inp" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
              <option value="ALL">All Stations</option>
              {SMAP.map(s=><option key={s.sh} value={s.sh}>{s.lb}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Year</label>
            <select className="inp" value={filterYr} onChange={e=>setFilterYr(e.target.value)}>
              <option value="ALL">All Years</option>
              {allYears.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Date (partial)</label>
            <input className="inp mono" type="text" value={filterDate}
              onChange={e=>setFilterDate(e.target.value)} placeholder="e.g. 05.2026"/>
          </div>
          <div className="fg">
            <label className="lbl">Section (keyword)</label>
            <div className="search-wrap">
              <input className="inp" type="text" value={filterSec}
                onChange={e=>setFilterSec(e.target.value)} placeholder="e.g. 307 IPC"/>
              {filterSec && <button className="search-clear" onClick={()=>setFilterSec("")}>✕</button>}
            </div>
          </div>
        </div>
        {hasFilters && (
          <div style={{fontSize:11,color:"var(--gold)",marginTop:4}}>
            Showing <b>{grand}</b> of <b>{allFirs.length}</b> FIRs
          </div>
        )}
      </div>

      {/* Conflict Indicator */}
      {conflicts.length > 0 && (
        <div className="card" style={{borderColor:"var(--red)"}}>
          <div className="ctitle" style={{color:"var(--red)"}}>⚠ Data Conflicts — FIRs in Multiple Stations ({conflicts.length})</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>CR Number</th><th>Found In Stations</th></tr></thead>
              <tbody>
                {conflicts.map(({cr,stations}) => (
                  <tr key={cr}>
                    <td className="mono" style={{color:"var(--red)",fontWeight:700}}>{cr}</td>
                    <td>{stations.map(sh=><span key={sh} className="bdg bdg-r" style={{marginRight:4}}>{sh}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-lbl">Total Pending FIRs</div>
          <div className="stat-val">{grand}</div>
          <div className="stat-sub">{hasFilters?"Filtered":allFirs.length+" total"}</div>
        </div>
        {stTot.filter(s=>s.cnt>0).map(s=>(
          <div key={s.sh}
            className={`stat ${filterSt===s.sh?"active-st":""}`}
            onClick={()=>setFilterSt(filterSt===s.sh?"ALL":s.sh)}>
            <div className="stat-lbl">{s.lb}</div>
            <div className="stat-val">{s.cnt}</div>
            <div className="stat-sub mono" style={{fontSize:9}}>{s.sh}</div>
          </div>
        ))}
      </div>

      <div className="abs-grid">
        <div className="card">
          <div className="ctitle">📍 Station-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Tab</th><th>Station</th><th>FIRs</th><th>%</th></tr></thead>
            <tbody>
              {stTot.map(s=>(
                <tr key={s.sh} style={{cursor:"pointer"}} onClick={()=>setFilterSt(filterSt===s.sh?"ALL":s.sh)}>
                  <td className="mono" style={{color:"var(--txt3)"}}>{s.sh}</td>
                  <td>{s.lb}</td>
                  <td><b className="mono" style={{color:s.cnt>0?"var(--gold)":"var(--txt3)"}}>{s.cnt}</b></td>
                  <td className="mono">{grand?((s.cnt/grand)*100).toFixed(1):0}%</td>
                </tr>
              ))}
              <tr className="tot-row"><td colSpan={2}>Total</td><td><b className="mono">{grand}</b></td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📅 Year-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Year</th><th>FIRs</th><th>%</th></tr></thead>
            <tbody>
              {yrSort.map(([k,v])=>(
                <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterYr(filterYr===k?"ALL":k)}>
                  <td><span className="yr-badge">{k}</span>{filterYr===k&&<span style={{marginLeft:4,color:"var(--gold)",fontSize:9}}>▶</span>}</td>
                  <td className="mono"><b>{v}</b></td>
                  <td className="mono">{grand?((v/grand)*100).toFixed(1):0}%</td>
                </tr>
              ))}
              <tr className="tot-row"><td>Total</td><td className="mono"><b>{grand}</b></td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📆 Month-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Month</th><th>FIRs</th></tr></thead>
            <tbody>
              {monSort.length===0
                ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                : monSort.map(([k,v])=>{
                  const [my,mn]=k.split("-");
                  return <tr key={k}><td>{monNames[parseInt(mn,10)]||mn} {my}</td><td className="mono"><b>{v}</b></td></tr>;
                })
              }
              {monSort.length>0&&<tr className="tot-row"><td>Total</td><td className="mono"><b>{monSort.reduce((a,b)=>a+b[1],0)}</b></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📋 Recent 30 Dates</div>
          <table className="abs-tbl">
            <thead><tr><th>Date</th><th>FIRs</th></tr></thead>
            <tbody>
              {daySort.length===0
                ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                : daySort.map(([k,v])=>(
                  <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterDate(filterDate===k?"":k)}>
                    <td className="mono" style={filterDate===k?{color:"var(--gold)",fontWeight:700}:{}}>{k}</td>
                    <td className="mono"><b>{v}</b></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">
            ⚖ Section U/s-wise
            <span style={{marginLeft:"auto",fontWeight:400,color:"var(--txt3)",fontSize:9}}>
              {secShow.length}/{secAll.length}
            </span>
          </div>
          <div className="search-wrap" style={{marginBottom:10}}>
            <input className="inp" type="text" value={secSearch}
              onChange={e=>setSecSearch(e.target.value)} placeholder="Search section…"/>
            {secSearch&&<button className="search-clear" onClick={()=>setSecSearch("")}>✕</button>}
          </div>
          <table className="abs-tbl">
            <thead><tr><th>#</th><th>Section U/s</th><th>FIRs</th></tr></thead>
            <tbody>
              {secShow.length===0
                ? <tr><td colSpan={3} className="no-data">No match</td></tr>
                : secShow.map(([k,v],i)=>(
                  <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterSec(filterSec===k?"":k)}>
                    <td className="mono" style={{color:"var(--txt3)"}}>{i+1}</td>
                    <td style={filterSec&&k.toLowerCase().includes(filterSec.toLowerCase())?{color:"var(--gold)"}:{}}>{k}</td>
                    <td className="mono"><b>{v}</b></td>
                  </tr>
                ))
              }
              <tr className="tot-row"><td colSpan={2}>Total</td><td className="mono"><b>{grand}</b></td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">🔧 Maintenance</div>
          <div style={{fontSize:12,color:"var(--txt2)",marginBottom:10,lineHeight:1.6}}>
            Renumber all Sl (serial number) columns across every station sheet in ascending order.
            Use this if Sl numbers are out of sync after edits or deletions.
          </div>
          <button className="btn btn-o" onClick={batchRenumber}>🔢 Fix All Serial Numbers</button>
          {renumMsg && (
            <div className={renumMsg.type==="ok"?"msg-ok":"msg-info"} style={{marginTop:8}}>
              {renumMsg.type==="loading"&&<span className="spin" style={{display:"inline-block",marginRight:6}}/>}
              {renumMsg.text}
            </div>
          )}
        </div>

        <div className="card" style={{gridColumn:"1/-1"}}>
          <div className="ctitle">📊 Station × Year Matrix</div>
          <StationYearMatrix allFirs={filtered} years={allYears} stTot={stTot}
            setFilterSt={setFilterSt} setFilterYr={setFilterYr}/>
        </div>

        <div className="card" style={{gridColumn:"1/-1"}}>
          <div className="ctitle">
            📋 FIR Pending List
            {filterSt!=="ALL"&&<span className="bdg bdg-a" style={{marginLeft:6}}>{SMAP.find(s=>s.sh===filterSt)?.lb}</span>}
            {filterYr!=="ALL"&&<span className="yr-badge" style={{marginLeft:4}}>{filterYr}</span>}
            <span style={{marginLeft:"auto",fontWeight:400,color:"var(--txt3)",fontSize:10}}>{listFiltered.length} records</span>
          </div>
          <div className="search-wrap" style={{marginBottom:10}}>
            <input className="inp" type="text" value={listSearch}
              onChange={e=>setListSearch(e.target.value)} placeholder="Search CR No., section, date, station…"/>
            {listSearch&&<button className="search-clear" onClick={()=>setListSearch("")}>✕</button>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th><th>Section U/s</th><th>Date Received</th></tr>
              </thead>
              <tbody>
                {listFiltered.slice(0,300).map((r,i)=>(
                  <tr key={i}>
                    <td className="mono" style={{color:"var(--txt3)"}}>{r.sl}</td>
                    <td className="mono" style={{color:"var(--gold)",fontWeight:700}}>{r.cr}</td>
                    <td><span className="yr-badge">{r.yr||"?"}</span></td>
                    <td><span style={{color:"var(--txt2)",fontSize:11}}>{r.stLb}</span><span style={{color:"var(--txt3)",fontSize:9,marginLeft:4}}>({r.stSh})</span></td>
                    <td style={{maxWidth:220,wordBreak:"break-word"}}>{r.sec}</td>
                    <td className="mono">{r.dr||"—"}</td>
                  </tr>
                ))}
                {listFiltered.length===0&&<tr><td colSpan={6} className="no-data">No FIRs match filters.</td></tr>}
                {listFiltered.length>300&&(
                  <tr><td colSpan={6} style={{textAlign:"center",padding:10,color:"var(--txt3)",fontSize:11}}>
                    Showing 300 of {listFiltered.length} — apply filters to narrow.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationYearMatrix({ allFirs, years, stTot, setFilterSt, setFilterYr }) {
  const yrList=years.slice(-15);
  if (!yrList.length||!allFirs.length) return <div className="no-data">No data.</div>;
  const matrix={};
  for (const r of allFirs) { const key=`${r.stSh}::${r.yr}`; matrix[key]=(matrix[key]||0)+1; }
  const yrTotals={};
  for (const y of yrList) yrTotals[y]=allFirs.filter(r=>r.yr===y).length;
  return (
    <div className="tbl-wrap">
      <table className="abs-tbl" style={{fontSize:11}}>
        <thead>
          <tr>
            <th>Station</th>
            {yrList.map(y=>(
              <th key={y} style={{cursor:"pointer",textAlign:"center"}} onClick={()=>setFilterYr(y)}>
                <span className="yr-badge">{y}</span>
              </th>
            ))}
            <th style={{color:"var(--gold-l)"}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {stTot.map(s=>{
            const rowTotal=yrList.reduce((a,y)=>a+(matrix[`${s.sh}::${y}`]||0),0);
            if (!rowTotal) return null;
            return (
              <tr key={s.sh} style={{cursor:"pointer"}} onClick={()=>setFilterSt(s.sh)}>
                <td style={{fontWeight:600}}>{s.lb}<span style={{color:"var(--txt3)",fontSize:9,marginLeft:4}}>({s.sh})</span></td>
                {yrList.map(y=>{
                  const v=matrix[`${s.sh}::${y}`]||0;
                  return <td key={y} className="mono" style={{textAlign:"center",color:v>0?"var(--txt)":"var(--txt3)"}}>{v||"—"}</td>;
                })}
                <td className="mono" style={{textAlign:"center",color:"var(--gold)",fontWeight:700}}>{rowTotal}</td>
              </tr>
            );
          })}
          <tr className="tot-row">
            <td>Year Total</td>
            {yrList.map(y=><td key={y} className="mono" style={{textAlign:"center"}}>{yrTotals[y]||0}</td>)}
            <td className="mono" style={{textAlign:"center"}}>{yrList.reduce((a,y)=>a+(yrTotals[y]||0),0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}