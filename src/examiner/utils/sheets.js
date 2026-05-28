import { isValidFIRCell, parseFIR, firSortKey } from "./helpers.js";
import { SID, SMAP } from "../constants/config.js";

/**
 * Get values from a sheet range
 */
export async function sheetsGet(tok, sid, range) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!r.ok) return [];
  const d = await r.json();
  return d.values || [];
}

/**
 * Update values in a sheet range
 */
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

/**
 * Append values to a sheet range
 */
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

/**
 * Get sheet ID by name
 */
export async function getSheetIdByName(tok, sid, tabName) {
  const m = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  if (!m.ok) return null;
  const meta = await m.json();
  const sh = (meta.sheets || []).find(s => s.properties.title === tabName);
  return sh ? sh.properties.sheetId : null;
}

/**
 * Delete a row from sheet
 */
export async function sheetsDeleteRow(tok, sid, tabName, oneBasedRow) {
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

/**
 * Insert a row in sheet
 */
export async function sheetsInsertRow(tok, sid, tabName, oneBasedRow) {
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

/**
 * Write a single row
 */
export async function sheetsWriteRow(tok, sid, tabName, oneBasedRow, vals) {
  const range = `${tabName}!A${oneBasedRow}:D${oneBasedRow}`;
  return sheetsUpdate(tok, sid, range, [vals]);
}

/**
 * Write multiple rows in batch
 */
export async function sheetsBatchWriteRows(tok, sid, tabName, startRow, rowsData) {
  const range = `${tabName}!A${startRow}:D${startRow + rowsData.length - 1}`;
  return sheetsUpdate(tok, sid, range, rowsData);
}

/**
 * Load FIR sheet data
 */
export async function loadFIRSheet(tok, tabName) {
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

/**
 * Load all data from all sheets
 */
export async function loadAllData(tok) {
  const fir = {};
  for (const s of SMAP) {
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
 * Insert FIR with sorting
 */
export async function insertFIRSorted(tok, tabName, newCr, newSec, newDr, existingRows) {
  const allRows = [...existingRows, { cr: newCr, sec: newSec, dr: newDr, _new: true }];
  allRows.sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr));

  const newIdx = allRows.findIndex(r => r._new);
  const rawRows = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  let firstDataRow = 1;
  for (let i = 0; i < rawRows.length; i++) {
    const b = (rawRows[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) { firstDataRow = i + 1; break; }
  }

  const insertSheetRow = firstDataRow + newIdx;
  const inserted = await sheetsInsertRow(tok, SID.fir, tabName, insertSheetRow);
  if (!inserted) return { ok: false, ri: -1 };

  await sheetsWriteRow(tok, SID.fir, tabName, insertSheetRow, [newIdx + 1, newCr, newSec, newDr]);

  const rawAfter = await sheetsGet(tok, SID.fir, `${tabName}!A:D`);
  const slUpdates = [];
  let slCounter = 1;
  for (let i = 0; i < rawAfter.length; i++) {
    const b = (rawAfter[i][1] || "").toString().trim();
    if (isValidFIRCell(b)) {
      slUpdates.push({ row: i + 1, sl: slCounter++ });
    }
  }

  for (const u of slUpdates) {
    await sheetsUpdate(tok, SID.fir, `${tabName}!A${u.row}`, [[u.sl]]);
  }

  return { ok: true, ri: insertSheetRow, sl: newIdx + 1 };
}

/**
 * Update FIR row
 */
export async function updateFIRRow(tok, tabName, ri, sec, dr) {
  return sheetsUpdate(tok, SID.fir, `${tabName}!C${ri}:D${ri}`, [[sec, dr]]);
}
