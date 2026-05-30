import { SID } from "../constants/config.js";
import { isValidFIRCell, parseFIR, firSortKey, normalizeFIRCell } from "./helpers.js";

// ─── Call Google Sheets REST API directly from the browser.
//     No Vercel serverless proxy needed — the OAuth token is already in the client.
const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function authHeader(tok) {
  return { "Authorization": `Bearer ${tok}`, "Content-Type": "application/json" };
}

async function gGet(tok, sid, range) {
  const url = `${SHEETS_BASE}/${sid}/values/${encodeURIComponent(range)}`;
  const r = await fetch(url, { headers: authHeader(tok) });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`Sheets GET ${range} → ${r.status}: ${err?.error?.message || r.statusText}`);
  }
  const d = await r.json();
  return d.values || [];
}

async function gPut(tok, sid, range, values) {
  const url = `${SHEETS_BASE}/${sid}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const r = await fetch(url, {
    method:  "PUT",
    headers: authHeader(tok),
    body:    JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`Sheets PUT ${range} → ${r.status}: ${err?.error?.message || r.statusText}`);
  }
  return true;
}

async function gAppend(tok, sid, range, values) {
  const url = `${SHEETS_BASE}/${sid}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const r = await fetch(url, {
    method:  "POST",
    headers: authHeader(tok),
    body:    JSON.stringify({ majorDimension: "ROWS", values }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`Sheets APPEND ${range} → ${r.status}: ${err?.error?.message || r.statusText}`);
  }
  return true;
}

async function gMeta(tok, sid) {
  const url = `${SHEETS_BASE}/${sid}?fields=sheets.properties`;
  const r = await fetch(url, { headers: authHeader(tok) });
  if (!r.ok) return null;
  return r.json();
}

async function gDeleteRow(tok, sid, sheetId, oneBasedRow) {
  const url = `${SHEETS_BASE}/${sid}:batchUpdate`;
  const r = await fetch(url, {
    method:  "POST",
    headers: authHeader(tok),
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: oneBasedRow - 1, endIndex: oneBasedRow }
        }
      }]
    }),
  });
  return r.ok;
}

async function gInsertRow(tok, sid, sheetId, oneBasedRow) {
  const url = `${SHEETS_BASE}/${sid}:batchUpdate`;
  const r = await fetch(url, {
    method:  "POST",
    headers: authHeader(tok),
    body: JSON.stringify({
      requests: [{
        insertDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: oneBasedRow - 1, endIndex: oneBasedRow },
          inheritFromBefore: false,
        }
      }]
    }),
  });
  return r.ok;
}

// ────────────────────────────────────────────────────────────
//  Public API (same signatures as before — drop-in replacement)
// ────────────────────────────────────────────────────────────

export async function sheetsGet(tok, sid, range) {
  try { return await gGet(tok, sid, range); }
  catch (e) { console.error("sheetsGet error:", e); throw e; }
}

export async function sheetsUpdate(tok, sid, range, vals) {
  try { return await gPut(tok, sid, range, vals); }
  catch (e) { console.error("sheetsUpdate error:", e); return false; }
}

export async function sheetsAppend(tok, sid, range, vals) {
  try { return await gAppend(tok, sid, range, vals); }
  catch (e) { console.error("sheetsAppend error:", e); return false; }
}

export async function getSheetMeta(tok, sid) {
  try { return await gMeta(tok, sid); }
  catch (e) { console.error("getSheetMeta error:", e); return null; }
}

export async function getSheetIdByName(tok, sid, tabName) {
  try {
    const meta = await gMeta(tok, sid);
    if (!meta) return null;
    const sheet = (meta.sheets || []).find(s => s.properties.title === tabName);
    return sheet?.properties?.sheetId ?? null;
  } catch (e) { console.error("getSheetIdByName error:", e); return null; }
}

export async function loadStationsFromSheet(tok) {
  const meta = await getSheetMeta(tok, SID.fir);
  if (!meta) return null;
  const SKIP = /^(sheet1|sheet2|sheet3|sheet4|sheet5|sheet6)$/i;
  return (meta.sheets || [])
    .map(s => s.properties.title)
    .filter(t => t && !SKIP.test(t.trim()))
    .map(t => ({ sh: t, lb: t }));
}

export async function sheetsDeleteRow(tok, sid, tabName, oneBasedRow) {
  try {
    const sheetId = await getSheetIdByName(tok, sid, tabName);
    if (sheetId === null) return false;
    return await gDeleteRow(tok, sid, sheetId, oneBasedRow);
  } catch (e) { console.error("sheetsDeleteRow error:", e); return false; }
}

export async function sheetsInsertRow(tok, sid, tabName, oneBasedRow) {
  try {
    const sheetId = await getSheetIdByName(tok, sid, tabName);
    if (sheetId === null) return false;
    return await gInsertRow(tok, sid, sheetId, oneBasedRow);
  } catch (e) { console.error("sheetsInsertRow error:", e); return false; }
}

export async function sheetsWriteRow(tok, sid, tabName, oneBasedRow, vals) {
  return sheetsUpdate(tok, sid, `${tabName}!A${oneBasedRow}:D${oneBasedRow}`, [vals]);
}

export async function sheetsBatchWriteRows(tok, sid, tabName, startRow, rowsData) {
  return sheetsUpdate(tok, sid, `${tabName}!A${startRow}:D${startRow + rowsData.length - 1}`, rowsData);
}

export async function loadFIRSheet(tok, tabName) {
  const rows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const data = [];
  let yg = "";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const a = (r[0] || "").toString().trim();
    const b = normalizeFIRCell((r[1] || "").toString().trim());
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

export async function loadAllData(tok, smap) {
  const fir = {};
  for (const s of smap) {
    fir[s.sh] = await loadFIRSheet(tok, s.sh);
  }

  const [pr, dr2, nr, cnr] = await Promise.all([
    sheetsGet(tok, SID.pending,  "Sheet1!A:L"),
    sheetsGet(tok, SID.disposal, "Sheet1!A:L"),
    sheetsGet(tok, SID.nonval,   "Sheet1!A:G"),
    sheetsGet(tok, SID.casenum,  "Sheet1!A:M"),
  ]);

  const pend = pr.slice(1)
    .map((r, i) => ({
      sl: r[0]||"", cn: r[1]||"", pt: r[2]||"", adv: r[3]||"",
      dreg: r[4]||"", nxt: r[5]||"", pur: r[6]||"", sec: r[7]||"",
      sta: r[8]||"", fn: r[9]||"", nat: r[10]||"", des: r[11]||"",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const disp = dr2.slice(1)
    .map((r, i) => ({
      sl: r[0]||"", cn: r[1]||"", pt: r[2]||"", adv: r[3]||"",
      dreg: r[4]||"", ddec: r[5]||"", dnat: r[6]||"", sec: r[7]||"",
      sta: r[8]||"", fn: r[9]||"", nat: r[10]||"", des: r[11]||"",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const nv = nr.slice(1)
    .map((r, i) => ({
      sno: r[0]||"", cn: r[1]||"", fn: r[2]||"", rp: r[3]||"",
      sta: r[4]||"", desc: r[5]||"", rem: r[6]||"",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const cnum = cnr.slice(1)
    .map((r, i) => ({
      fn: r[0]||"", sta: r[1]||"", sec: r[2]||"", dr: r[3]||"",
      cn: r[4]||"", pt: r[5]||"", adv: r[6]||"", dreg: r[7]||"",
      nxt: r[8]||"", type: r[9]||"", sec2: r[10]||"", nat: r[11]||"", des: r[12]||"",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  return { fir, pend, disp, nv, cnum };
}

export async function insertFIRSorted(tok, tabName, newCr, newSec, newDr) {
  try {
    const appendRes = await sheetsAppend(tok, SID.fir, `${tabName}!A:D`, [["", newCr, newSec, newDr]]);
    if (!appendRes) return { ok: false, ri: -1 };

    const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
    const dataRows = [];
    for (let i = 0; i < rawRows.length; i++) {
      const b = (rawRows[i][1] || "").toString().trim();
      if (isValidFIRCell(b)) {
        dataRows.push({
          ri: i + 1, cr: b,
          sec: (rawRows[i][2] || "").toString().trim(),
          dr:  (rawRows[i][3] || "").toString().trim(),
        });
      }
    }
    dataRows.sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr));

    let newRi = -1;
    for (let i = dataRows.length - 1; i >= 0; i--) {
      if (dataRows[i].cr === newCr) { newRi = dataRows[i].ri; break; }
    }
    const newSl = dataRows.findIndex(r => r.ri === newRi) + 1;

    // Batch all sl updates in a single batchUpdate call — 1 API call instead of N
    const slUpdates = [];
    for (let i = 0; i < dataRows.length; i++) {
      const expectedSl = String(i + 1);
      const currentSl  = (rawRows[dataRows[i].ri - 1][0] || "").toString().trim();
      if (currentSl !== expectedSl) {
        slUpdates.push({ range: `${tabName}!A${dataRows[i].ri}`, values: [[i + 1]] });
      }
    }

    if (slUpdates.length > 0) {
      const url = `${SHEETS_BASE}/${SID.fir}/values:batchUpdate`;
      await fetch(url, {
        method:  "POST",
        headers: authHeader(tok),
        body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: slUpdates }),
      });
    }

    return { ok: true, ri: newRi, sl: newSl };
  } catch (e) {
    console.error("insertFIRSorted error:", e);
    return { ok: false, ri: -1 };
  }
}

export async function renumberFIRSheet(tok, tabName) {
  try {
    const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
    let sl = 1;
    const data = [];
    for (let i = 0; i < rawRows.length; i++) {
      const b = (rawRows[i][1] || "").toString().trim();
      if (isValidFIRCell(b)) {
        data.push({ range: `${tabName}!A${i + 1}`, values: [[sl++]] });
      }
    }
    if (!data.length) return 0;

    // Single batchUpdate call for all serial numbers
    const url = `${SHEETS_BASE}/${SID.fir}/values:batchUpdate`;
    const r = await fetch(url, {
      method:  "POST",
      headers: authHeader(tok),
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    });
    return r.ok ? sl - 1 : 0;
  } catch (e) {
    console.error("renumberFIRSheet error:", e);
    return 0;
  }
}

export async function updateFIRRow(tok, tabName, ri, sec, dr) {
  try {
    return await sheetsUpdate(tok, SID.fir, `${tabName}!C${ri}:D${ri}`, [[sec, dr]]);
  } catch (e) {
    console.error("updateFIRRow error:", e);
    return false;
  }
}