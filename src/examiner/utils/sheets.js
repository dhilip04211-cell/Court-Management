import { isValidFIRCell, parseFIR, firSortKey } from "./helpers.js";
import { SID } from "../constants/config.js";
import { isValidFIRCell, parseFIR, firSortKey, normalizeFIRCell } from "./helpers.js";

export async function sheetsGet(tok, sid, range) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!r.ok) return [];
  const d = await r.json();
  return d.values || [];
}

export async function sheetsUpdate(tok, sid, range, vals) {
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

export async function sheetsAppend(tok, sid, range, vals) {
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

export async function getSheetMeta(tok, sid) {
  const m = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!m.ok) return null;
  return await m.json();
}

export async function getSheetIdByName(tok, sid, tabName) {
  const meta = await getSheetMeta(tok, sid);
  if (!meta) return null;
  const sh = (meta.sheets || []).find(s => s.properties.title === tabName);
  return sh ? sh.properties.sheetId : null;
}

/**
 * Load tab names from the FIR spreadsheet as SMAP.
 * Skips known non-station tabs (Sheet1, Sheet2, etc. that are clearly not stations).
 * Returns array of { sh, lb } where sh = tab name, lb = tab name (display label).
 */
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
  const sheetId = await getSheetIdByName(tok, sid, tabName);
  if (sheetId === null) return false;
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId, dimension: "ROWS",
              startIndex: oneBasedRow - 1, endIndex: oneBasedRow,
            }
          }
        }],
      }),
    }
  );
  return r.ok;
}

export async function sheetsInsertRow(tok, sid, tabName, oneBasedRow) {
  const sheetId = await getSheetIdByName(tok, sid, tabName);
  if (sheetId === null) return false;
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          insertDimension: {
            range: {
              sheetId, dimension: "ROWS",
              startIndex: oneBasedRow - 1, endIndex: oneBasedRow,
            }, inheritFromBefore: false
          }
        }],
      }),
    }
  );
  return r.ok;
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

  const pr = await sheetsGet(tok, SID.pending, "Sheet1!A:L");
  const pend = pr.slice(1)
    .map((r, i) => ({
      sl: r[0] || "", cn: r[1] || "", pt: r[2] || "", adv: r[3] || "",
      dreg: r[4] || "", nxt: r[5] || "", pur: r[6] || "", sec: r[7] || "",
      sta: r[8] || "", fn: r[9] || "", nat: r[10] || "", des: r[11] || "",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const dr2 = await sheetsGet(tok, SID.disposal, "Sheet1!A:L");
  const disp = dr2.slice(1)
    .map((r, i) => ({
      sl: r[0] || "", cn: r[1] || "", pt: r[2] || "", adv: r[3] || "",
      dreg: r[4] || "", ddec: r[5] || "", dnat: r[6] || "", sec: r[7] || "",
      sta: r[8] || "", fn: r[9] || "", nat: r[10] || "", des: r[11] || "",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const nr = await sheetsGet(tok, SID.nonval, "Sheet1!A:G");
  const nv = nr.slice(1)
    .map((r, i) => ({
      sno: r[0] || "", cn: r[1] || "", fn: r[2] || "", rp: r[3] || "",
      sta: r[4] || "", desc: r[5] || "", rem: r[6] || "",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  const cnr = await sheetsGet(tok, SID.casenum, "Sheet1!A:M");
  const cnum = cnr.slice(1)
    .map((r, i) => ({
      fn: r[0] || "", sta: r[1] || "", sec: r[2] || "", dr: r[3] || "",
      cn: r[4] || "", pt: r[5] || "", adv: r[6] || "", dreg: r[7] || "",
      nxt: r[8] || "", type: r[9] || "", sec2: r[10] || "", nat: r[11] || "", des: r[12] || "",
      ri: i + 2,
    }))
    .filter(r => r.fn || r.cn);

  return { fir, pend, disp, nv, cnum };
}

/**
 * insertFIRSorted — FAST: 3 API calls always
 * append to bottom → read once → batch rewrite sl
 */
export async function insertFIRSorted(tok, tabName, newCr, newSec, newDr, existingRows) {
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SID.fir}/values/${encodeURIComponent(tabName + "!A:D")}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [["", newCr, newSec, newDr]] }),
    }
  );
  const appendJson = await appendRes.json();
  console.log("APPEND STATUS:", appendRes.status, appendJson);

  if (!appendRes.ok) return { ok: false, ri: -1 };

  const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const dataRows = [];
  for (let i = 0; i < rawRows.length; i++) {
    const b = (rawRows[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) {
      dataRows.push({
        ri: i + 1, cr: b,
        sec: (rawRows[i][2] || "").toString().trim(),
        dr: (rawRows[i][3] || "").toString().trim(),
      });
    }
  }
  dataRows.sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr));

  let newRi = -1;
  for (let i = dataRows.length - 1; i >= 0; i--) {
    if (dataRows[i].cr === newCr) { newRi = dataRows[i].ri; break; }
  }
  const newSl = dataRows.findIndex(r => r.ri === newRi) + 1;

  if (dataRows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SID.fir}/values:batchUpdate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: dataRows.map((r, i) => ({ range: `${tabName}!A${r.ri}`, values: [[i + 1]] })),
        }),
      }
    );
  }

  return { ok: true, ri: newRi, sl: newSl };
}

/**
 * Batch renumber all sl for a tab — 2 API calls
 */
export async function renumberFIRSheet(tok, tabName) {
  const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const slData = [];
  let sl = 1;
  for (let i = 0; i < rawRows.length; i++) {
    const b = (rawRows[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) {
      slData.push({ range: `${tabName}!A${i + 1}`, values: [[sl++]] });
    }
  }
  if (!slData.length) return 0;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SID.fir}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: slData }),
    }
  );
  return slData.length;
}

export async function updateFIRRow(tok, tabName, ri, sec, dr) {
  return sheetsUpdate(tok, SID.fir, `${tabName}!C${ri}:D${ri}`, [[sec, dr]]);
}