import { useState, useMemo } from "react";
import { isValidFIRCell, parseFIR, normalizeFIRCell, firSortKey } from "../utils/helpers.js";
import { renumberFIRSheet, sheetsGet, sheetsUpdate, updateFIRRow } from "../utils/sheets.js";
import { SID } from "../constants/config.js";
import StationYearMatrix from "../components/StationYearMatrix.jsx";

const MON_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;
const SKIP_HDR = b => /cr\.no/i.test(b);

function parseDDMMYYYY(s) {
  const p = s.split("."); if (p.length < 3) return 0;
  return new Date(p[2], p[1] - 1, p[0]).getTime() || 0;
}

/**
 * Robust FIR sort key — handles "123/2024", "123/ 2024", "123 / 2024", "1232024" etc.
 * Returns a single number: year * 100000 + firNumber
 * So 1/2025 = 202500001, 999/2025 = 202500999, 1/2026 = 202600001
 */
function robustFirSortKey(cr) {
  if (!cr) return 0;
  const s = cr.toString().trim();
  const slash = s.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (slash) return parseInt(slash[2], 10) * 100000 + parseInt(slash[1], 10);
  const concat = s.match(/^(\d+?)(\d{4})$/);
  if (concat) return parseInt(concat[2], 10) * 100000 + parseInt(concat[1], 10);
  return 0;
}

function exportToExcel(filename, sheetsData) {
  try {
    const XLSX = window.XLSX; if (!XLSX) throw new Error("no xlsx");
    const wb = XLSX.utils.book_new();
    for (const { name, headers, rows } of sheetsData) {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename);
  } catch {
    const { headers, rows } = sheetsData[0];
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename.replace(/\.xlsx$/, ".csv"); a.click();
  }
}

function exportToWord(filename, title, headers, rows, options = {}) {
  const pageSize = options.pageSize || 'A4';
  const orientation = options.orientation || 'portrait';
  const fontSize = options.fontSize || 12;
  const cellPadding = options.cellPadding || 6;
  const pageRule = options.pageSize || options.orientation
    ? `@page { size: ${pageSize} ${orientation}; margin: 12mm; }` : '';
  const style = `
    <style>${pageRule} body{font-family:'Times New Roman', Times, serif; color:#000; margin: 12mm;}
    table{border-collapse:collapse;width:100%;table-layout:fixed;}
    th,td{border:1px solid #444;padding:${cellPadding}px;text-align:left;font-size:${fontSize}px;word-wrap:break-word;}
    th{background:#f3f3f3;} h2{margin-bottom:16px;}</style>`;
  const thead = `<tr>${headers.map(h => `<th>${String(h)}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${r.map(c => `<td>${String(c ?? '')}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body><h2>${title}</h2><table>${thead}${tbody}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.replace(/\.xlsx$|\.csv$/i, '.doc');
  a.click();
}

const INNER_TABS = [
  { id: "abstract", icon: "📊", label: "Abstract" },
  { id: "pending", icon: "📋", label: "Pending FIR" },
  { id: "maintenance", icon: "🔧", label: "Maintenance" },
];

export default function AbstractTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const [inner, setInner] = useState("abstract");

  /* ── Abstract state ── */
  const [filterSt, setFilterSt] = useState("ALL");
  const [filterYr, setFilterYr] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [filterSec, setFilterSec] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [secSearch, setSecSearch] = useState("");

  /* ── Pending FIR state ── */
  const [pendSt, setPendSt] = useState(() => SMAP[0]?.sh || "");
  const [pendSearch, setPendSearch] = useState("");
  const [pendFilterStatus, setPendFilterStatus] = useState("ALL");

  /* ── Maintenance state ── */
  const [issues, setIssues] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [maintMsg, setMaintMsg] = useState(null);
  const [renumMsg, setRenumMsg] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [concatSortAsc, setConcatSortAsc] = useState(true);

  /* ══════════════════════════════════════════════════════════
     ABSTRACT — derived data
  ══════════════════════════════════════════════════════════ */
  const allFirs = useMemo(() => {
    const out = [];
    for (const s of SMAP)
      for (const r of (db.fir[s.sh] || []))
        if (isValidFIRCell(r.cr)) {
          const yr = parseFIR(r.cr).yr || r.yr || "";
          out.push({ ...r, yr, stSh: s.sh, stLb: s.lb });
        }
    return out;
  }, [db, SMAP]);

  const allYears = useMemo(() =>
    [...new Set(allFirs.map(r => r.yr).filter(Boolean))].sort(), [allFirs]);

  const filtered = useMemo(() => allFirs.filter(r => {
    if (filterSt !== "ALL" && r.stSh !== filterSt) return false;
    if (filterYr !== "ALL" && r.yr !== filterYr) return false;
    if (filterDate && !(r.dr || "").includes(filterDate)) return false;
    if (filterSec && !(r.sec || "").toLowerCase().includes(filterSec.toLowerCase())) return false;
    return true;
  }), [allFirs, filterSt, filterYr, filterDate, filterSec]);

  const grand = filtered.length;
  const stTot = SMAP.map(s => ({ sh: s.sh, lb: s.lb, cnt: filtered.filter(r => r.stSh === s.sh).length }));

  const yrSort = useMemo(() => {
    const m = {}; for (const r of filtered) { const k = r.yr || "?"; m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const monSort = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      if (!r.dr) continue;
      const p = r.dr.trim().split(".");
      if (p.length >= 3 && p[2].length === 4 && /^\d{2}$/.test(p[1].padStart(2, "0"))) {
        const k = `${p[2]}-${p[1].padStart(2, "0")}`; m[k] = (m[k] || 0) + 1;
      }
    }
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const daySort = useMemo(() => {
    const m = {}; for (const r of filtered) if (r.dr?.trim()) m[r.dr.trim()] = (m[r.dr.trim()] || 0) + 1;
    return Object.entries(m).sort((a, b) => parseDDMMYYYY(a[0]) - parseDDMMYYYY(b[0])).slice(-30).reverse();
  }, [filtered]);

  const secAll = useMemo(() => {
    const m = {}; for (const r of filtered) { const k = (r.sec || "Unknown").trim(); m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const secShow = secSearch
    ? secAll.filter(([k]) => k.toLowerCase().includes(secSearch.toLowerCase()))
    : secAll.slice(0, 40);

  const listFiltered = useMemo(() => {
    if (!listSearch) return filtered;
    const q = listSearch.toLowerCase();
    return filtered.filter(r =>
      (r.cr || "").toLowerCase().includes(q) || (r.sec || "").toLowerCase().includes(q) ||
      (r.dr || "").toLowerCase().includes(q) || (r.stLb || "").toLowerCase().includes(q));
  }, [filtered, listSearch]);

  const listFilteredSorted = useMemo(() => {
    const arr = listFiltered.slice();
    arr.sort((a, b) => robustFirSortKey(a.cr) - robustFirSortKey(b.cr));
    return arr;
  }, [listFiltered]);

  function resetFilters() {
    setFilterSt("ALL"); setFilterYr("ALL"); setFilterDate(""); setFilterSec(""); setListSearch("");
  }
  const hasFilters = filterSt !== "ALL" || filterYr !== "ALL" || filterDate || filterSec;

  /* ══════════════════════════════════════════════════════════
     PENDING FIR
  ══════════════════════════════════════════════════════════ */
  const pendRows = useMemo(() => {
    const rows = db.fir[pendSt] || [];
    const q = pendSearch.toLowerCase();
    return rows.filter(r => {
      if (pendSearch) {
        const match = (r.cr || "").toLowerCase().includes(q) ||
          (r.sec || "").toLowerCase().includes(q) ||
          (r.dr || "").includes(q);
        if (!match) return false;
      }
      if (pendFilterStatus === "MISSING") return !r.dr;
      if (pendFilterStatus === "FORMAT") return r.dr && !DATE_RE.test(r.dr);
      return true;
    });
  }, [db, pendSt, pendSearch, pendFilterStatus]);

  const pendRowsSorted = useMemo(() => {
    const rows = pendRows.slice();
    rows.sort((a, b) => robustFirSortKey(a.cr) - robustFirSortKey(b.cr));
    return rows;
  }, [pendRows]);

  const pendMissingCount = useMemo(() =>
    (db.fir[pendSt] || []).filter(r => !r.dr).length, [db, pendSt]);
  const pendFormatCount = useMemo(() =>
    (db.fir[pendSt] || []).filter(r => r.dr && !DATE_RE.test(r.dr)).length, [db, pendSt]);

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — classify a raw sheet row
  ══════════════════════════════════════════════════════════ */
  function classifyRow(row) {
    const a = (row[0] || "").toString().trim();
    const b = (row[1] || "").toString().trim();
    const c = (row[2] || "").toString().trim();
    const d = (row[3] || "").toString().trim();

    if (!b) return { type: "blank", a, b, c, d };
    if (SKIP_HDR(b)) return { type: "header", a, b, c, d };
    if (
      a.toLowerCase().includes("fir pending") ||
      c.toLowerCase().includes("section of law") ||
      c.toLowerCase().includes("police station")
    ) return { type: "header", a, b, c, d };
    if (/^\d{4}$/.test(b) || /^\d{4}$/.test(a) || /^\d{4}$/.test(c))
      return { type: "banner", a, b, c, d };

    const norm = normalizeFIRCell(b);
    if (!isValidFIRCell(norm)) return { type: "other", a, b, c, d };

    return { type: "fir", sl: a, cr: norm, sec: c, dr: d };
  }

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — scan
  ══════════════════════════════════════════════════════════ */
  async function doScan() {
    setScanning(true); setIssues(null); setMaintMsg(null); setRenumMsg(null);
    const concat = [], dateBad = [], slBad = [], firOOO = [];

    for (const s of SMAP) {
      const raw = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      if (!raw?.length) continue;

      let expectedSl = 1;
      let lastKey = -1;
      let lastCR = "";

      for (let i = 0; i < raw.length; i++) {
        const info = classifyRow(raw[i]);
        if (info.type !== "fir") continue;

        const { sl, cr, sec, dr } = info;
        const key = robustFirSortKey(cr);

        // ── Concatenated CR? ──
        const original = (raw[i][1] || "").toString().trim();
        if (cr !== original)
          concat.push({ sh: s.sh, lb: s.lb, row: i + 1, original, fixed: cr, sec, dr });

        // ── Date issue? ──
        if (!dr) {
          dateBad.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, dr: "(missing)", issue: "missing" });
        } else if (!DATE_RE.test(dr)) {
          dateBad.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, dr, issue: "format" });
        }

        // ── FIR out-of-order? ──
        if (key > 0 && lastKey > 0 && key < lastKey) {
          firOOO.push({
            sh: s.sh, lb: s.lb, row: i + 1,
            cr, prevCR: lastCR, prevKey: lastKey, currKey: key,
          });
        }
        if (key > 0) { lastKey = key; lastCR = cr; }

        // ── Serial number? ──
        const slNum = parseInt(sl, 10);
        if (sl && !isNaN(slNum) && slNum !== expectedSl)
          slBad.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, slActual: sl, slExpected: expectedSl });
        expectedSl++;
      }
    }

    concat.sort((a, b) => robustFirSortKey(a.fixed) - robustFirSortKey(b.fixed));
    setIssues({ concat, date: dateBad, sl: slBad, fir: firOOO });
    setScanning(false);
  }

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — fix concatenated
  ══════════════════════════════════════════════════════════ */
  async function fixConcatenated() {
    if (!issues?.concat?.length) return;
    setFixing(true);
    setMaintMsg({ type: "loading", text: `Fixing ${issues.concat.length} concatenated CR numbers…` });
    let fixed = 0;
    for (const iss of issues.concat) {
      const ok = await sheetsUpdate(tok, SID.fir, `${iss.sh}!B${iss.row}`, [[iss.fixed]]);
      if (ok) {
        fixed++;
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [iss.sh]: (prev.fir[iss.sh] || []).map(r =>
              r.ri === iss.row ? { ...r, cr: iss.fixed } : r
            )
          }
        }));
      }
    }
    setMaintMsg({ type: "ok", text: `✓ Fixed ${fixed}/${issues.concat.length} concatenated CR numbers.` });
    setIssues(prev => ({ ...prev, concat: [] }));
    setFixing(false);
  }

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — fix serial numbers
     BUG FIX: was sorting by sl (serial) and then checking
     alreadyOk incorrectly. Now sorts by FIR sort key to keep
     in proper order, and the alreadyOk guard is a deep comparison.
  ══════════════════════════════════════════════════════════ */
  async function fixSerialNumbers() {
    setFixing(true);
    setRenumMsg({ type: "loading", text: "Re-numbering serial numbers across all sheets…" });
    let totalWritten = 0;

    for (const s of SMAP) {
      const raw = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      if (!raw?.length) continue;

      const structure = raw.map((row, rowIdx) => ({
        ...classifyRow(row),
        rowIdx,
      }));

      // Pull out FIR rows in their CURRENT physical order
      const firSlots = structure.filter(r => r.type === "fir");
      if (firSlots.length === 0) continue;

      // ── BUG FIX: assign sequential serials 1,2,3… in CURRENT order.
      //    (The old code sorted by sl value which could scramble FIR order;
      //     serial fix should only renumber, not reorder — use fixFIROrder for that)
      const needsUpdate = firSlots.some((slot, i) => {
        const currentSl = parseInt(slot.sl, 10);
        return isNaN(currentSl) || currentSl !== i + 1;
      });
      if (!needsUpdate) continue;

      // Write corrected serials back, one row at a time for safety
      for (let i = 0; i < firSlots.length; i++) {
        const slot = firSlots[i];
        const correctSl = String(i + 1);
        if (slot.sl === correctSl) continue; // skip rows already correct
        const sheetRow = slot.rowIdx + 1;
        await sheetsUpdate(
          tok, SID.fir,
          `${s.sh}!A${sheetRow}`,
          [[correctSl]]
        );
        totalWritten++;
      }

      // Mirror into React state
      setDb(prev => {
        const newRows = (prev.fir[s.sh] || []).map(r => {
          const slotIndex = firSlots.findIndex(sl => sl.rowIdx + 1 === r.ri);
          if (slotIndex === -1) return r;
          return { ...r, sl: String(slotIndex + 1) };
        });
        return { ...prev, fir: { ...prev.fir, [s.sh]: newRows } };
      });
    }

    setRenumMsg({
      type: "ok",
      text: totalWritten > 0
        ? `✓ Renumbered ${totalWritten} serial cells across all sheets.`
        : `✓ All serial numbers were already correct — no changes needed.`
    });
    setIssues(prev => prev ? { ...prev, sl: [] } : prev);
    setFixing(false);
    setTimeout(() => setRenumMsg(null), 3500);
  }

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — fix FIR order
     BUG FIX: original had a duplicate "Step 8" comment label and
     the db state mirror was using slotIndex from sheetFirSlots but
     that index is the physical slot index, and sorted[slotIndex] is
     correct — the physical slot i should get the i-th sorted FIR.
     Also added a guard: skip station entirely if already ordered.
  ══════════════════════════════════════════════════════════ */
  async function fixFIROrder() {
    if (!issues?.fir?.length) return;
    setFixing(true);
    setMaintMsg({ type: "loading", text: "Re-ordering FIR rows across all sheets…" });
    let totalWritten = 0;

    for (const s of SMAP) {
      const raw = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      if (!raw?.length) continue;

      const structure = raw.map((row, rowIdx) => ({
        ...classifyRow(row),
        rowIdx,
      }));

      const firRows = structure
        .filter(r => r.type === "fir")
        .map(r => ({ sl: r.sl, cr: r.cr, sec: r.sec, dr: r.dr }));

      if (firRows.length === 0) continue;

      // Sort by year then by FIR number
      const sorted = [...firRows].sort(
        (a, b) => robustFirSortKey(a.cr) - robustFirSortKey(b.cr)
      );

      // Assign fresh serial numbers
      sorted.forEach((r, i) => { r.sl = String(i + 1); });

      // Check if already in correct order (compare cr values position by position)
      const alreadyOk = firRows.every((r, i) => r.cr === sorted[i].cr);
      if (alreadyOk) continue;

      // Build the full new sheet values (headers/banners preserved, fir slots replaced)
      const newSheetValues = [];
      let si = 0;
      for (const item of structure) {
        if (item.type === "fir") {
          const src = sorted[si++];
          newSheetValues.push([src.sl, src.cr, src.sec, src.dr]);
        } else {
          // ── BUG FIX: preserve ALL columns of non-fir rows, not just A:D ──
          newSheetValues.push(raw[item.rowIdx].slice(0, 4));
        }
      }

      // Batch write back in ONE API call
      await sheetsUpdate(tok, SID.fir, `${s.sh}!A1:D${raw.length}`, newSheetValues);
      totalWritten += firRows.length;

      // Mirror into React state
      setDb(prev => {
        const sheetFirSlots = structure.filter(r => r.type === "fir");
        const newRows = (prev.fir[s.sh] || []).map(r => {
          // match the db row to its physical sheet slot by row index
          const slotIndex = sheetFirSlots.findIndex(sl => sl.rowIdx + 1 === r.ri);
          if (slotIndex === -1) return r;
          // the physical slot at slotIndex now holds sorted[slotIndex]
          const src = sorted[slotIndex];
          return { ...r, sl: src.sl, cr: src.cr, sec: src.sec, dr: src.dr };
        });
        return { ...prev, fir: { ...prev.fir, [s.sh]: newRows } };
      });
    }

    setMaintMsg({
      type: "ok",
      text: totalWritten > 0
        ? `✓ Re-ordered ${totalWritten} FIR rows. All sheets are now in ascending order.`
        : `✓ All FIR rows were already in correct order — no changes needed.`
    });
    setIssues(prev => prev ? { ...prev, fir: [], sl: [] } : prev);
    setFixing(false);
    setTimeout(() => setMaintMsg(null), 4000);
  }

  /* ══════════════════════════════════════════════════════════
     EXPORTS
  ══════════════════════════════════════════════════════════ */
  const matrixYears = allYears;

  const matrixMap = useMemo(() => {
    const map = {};
    for (const r of filtered) {
      const key = `${r.stSh}::${r.yr}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [filtered]);

  const matrixYearTotals = useMemo(() => {
    const totals = {};
    for (const r of filtered) {
      if (!r.yr) continue;
      totals[r.yr] = (totals[r.yr] || 0) + 1;
    }
    return totals;
  }, [filtered]);

  const matrixRows = useMemo(() => {
    const rows = [];
    const activeStations = stTot.filter(s =>
      matrixYears.some(y => (matrixMap[`${s.sh}::${y}`] || 0) > 0)
    );
    for (const s of activeStations) {
      const row = [s.lb, ...matrixYears.map(y => matrixMap[`${s.sh}::${y}`] || 0)];
      const total = row.slice(1).reduce((a, v) => a + v, 0);
      rows.push([...row, total]);
    }
    const grandTotal = matrixYears.reduce((sum, y) => sum + (matrixYearTotals[y] || 0), 0);
    if (matrixYears.length)
      rows.push(["Year Total", ...matrixYears.map(y => matrixYearTotals[y] || 0), grandTotal]);
    return rows;
  }, [matrixYears, matrixMap, matrixYearTotals, stTot]);

  function handleExportAll() {
    exportToExcel("FIR_Abstract.xlsx", [
      {
        name: "FIR Pending List",
        headers: ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
        rows: listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""])
      },
      {
        name: "Station-wise", headers: ["Code", "Station", "FIRs", "%"],
        rows: stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"])
      },
      {
        name: "Year-wise", headers: ["Year", "FIRs", "%"],
        rows: yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"])
      },
      {
        name: "Month-wise", headers: ["Month", "FIRs"],
        rows: monSort.map(([k, v]) => {
          const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v];
        })
      },
      {
        name: "Section-wise", headers: ["#", "Section U/s", "FIRs"],
        rows: secAll.map(([k, v], i) => [i + 1, k, v])
      },
      {
        name: "Station-Year Matrix", headers: ["Station", ...matrixYears, "Total"],
        rows: matrixRows
      }
    ]);
  }
  function handleExportList() {
    exportToExcel("FIR_List.xlsx", [{
      name: "FIR List",
      headers: ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
      rows: listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""])
    }]);
  }
  function handleExportWord(filename, title, headers, rows, opts) {
    exportToWord(filename, title, headers, rows, opts);
  }

  const concatList = useMemo(() => {
    if (!issues?.concat) return [];
    const arr = [...issues.concat];
    arr.sort((a, b) => concatSortAsc
      ? robustFirSortKey(a.fixed) - robustFirSortKey(b.fixed)
      : robustFirSortKey(b.fixed) - robustFirSortKey(a.fixed));
    return arr;
  }, [issues?.concat, concatSortAsc]);

  function handleExportStationExcel() {
    exportToExcel("FIR_Station_Wise.xlsx", [{
      name: "Station-wise", headers: ["Code", "Station", "FIRs", "%"],
      rows: stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"])
    }]);
  }
  function handleExportStationWord() {
    handleExportWord("FIR_Station_Wise.doc", "Station-wise FIR Summary", ["Code", "Station", "FIRs", "%"],
      stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"]));
  }
  function handleExportYearExcel() {
    exportToExcel("FIR_Year_Wise.xlsx", [{
      name: "Year-wise", headers: ["Year", "FIRs", "%"],
      rows: yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"])
    }]);
  }
  function handleExportYearWord() {
    handleExportWord("FIR_Year_Wise.doc", "Year-wise FIR Summary", ["Year", "FIRs", "%"],
      yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"]));
  }
  function handleExportMonthExcel() {
    exportToExcel("FIR_Month_Wise.xlsx", [{
      name: "Month-wise", headers: ["Month", "FIRs"],
      rows: monSort.map(([k, v]) => {
        const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v];
      })
    }]);
  }
  function handleExportMonthWord() {
    handleExportWord("FIR_Month_Wise.doc", "Month-wise FIR Summary", ["Month", "FIRs"],
      monSort.map(([k, v]) => {
        const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v];
      }));
  }
  function handleExportSectionExcel() {
    exportToExcel("FIR_Section_Wise.xlsx", [{
      name: "Section-wise", headers: ["#", "Section U/s", "FIRs"],
      rows: secAll.map(([k, v], i) => [i + 1, k, v])
    }]);
  }
  function handleExportSectionWord() {
    handleExportWord("FIR_Section_Wise.doc", "Section-wise FIR Summary", ["#", "Section U/s", "FIRs"],
      secAll.map(([k, v], i) => [i + 1, k, v]));
  }
  function handleExportMatrixExcel() {
    exportToExcel("Station_Year_Matrix.xlsx", [{
      name: "Station-Year Matrix", headers: ["Station", ...matrixYears, "Total"],
      rows: matrixRows
    }]);
  }
  function handleExportMatrixWord() {
    handleExportWord("Station_Year_Matrix.doc", "Station × Year Matrix",
      ["Station", ...matrixYears, "Total"], matrixRows,
      { pageSize: "A4", orientation: "landscape", fontSize: 10, cellPadding: 5 });
  }
  function handleExportRecentExcel() {
    exportToExcel("FIR_Recent_Dates.xlsx", [{
      name: "Recent Dates", headers: ["Date", "FIRs"],
      rows: daySort.map(([k, v]) => [k, v])
    }]);
  }
  function handleExportRecentWord() {
    handleExportWord("FIR_Recent_Dates.doc", "Recent FIR Dates", ["Date", "FIRs"],
      daySort.map(([k, v]) => [k, v]));
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="abt-root">
      {!window.XLSX && (
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
          onLoad={() => { }}
        />
      )}

      {/* ── Inner tab bar ── */}
      <div className="abt-tabbar">
        {INNER_TABS.map(t => (
          <button
            key={t.id}
            className={`abt-tab${inner === t.id ? " abt-tab-active" : ""}`}
            onClick={() => setInner(t.id)}
          >
            <span className="abt-tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          TAB 1 — ABSTRACT
      ════════════════════════════════════════════════════ */}
      {inner === "abstract" && (
        <div>
          {/* Filters */}
          <div className="card">
            <div className="ctitle">
              🔦 Filters
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button className="btn btn-o btn-sm" onClick={handleExportAll}>⬇ Export All</button>
                <button className="btn btn-o btn-sm" onClick={() =>
                  exportToWord("FIR_Abstract.doc", "FIR Abstract - Pending List",
                    ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
                    listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]))}>
                  ⬇ Word
                </button>
                {hasFilters && <button className="btn btn-o btn-sm" onClick={resetFilters}>✕ Reset</button>}
              </div>
            </div>
            <div className="frow">
              <div className="fg">
                <label className="lbl">Station</label>
                <select className="inp" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
                  <option value="ALL">All Stations</option>
                  {SMAP.map(s => <option key={s.sh} value={s.sh}>{s.lb}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Year</label>
                <select className="inp" value={filterYr} onChange={e => setFilterYr(e.target.value)}>
                  <option value="ALL">All Years</option>
                  {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Date (partial)</label>
                <input className="inp mono" type="text" value={filterDate}
                  onChange={e => setFilterDate(e.target.value)} placeholder="e.g. 05.2026" />
              </div>
              <div className="fg">
                <label className="lbl">Section (keyword)</label>
                <div className="search-wrap">
                  <input className="inp" type="text" value={filterSec}
                    onChange={e => setFilterSec(e.target.value)} placeholder="e.g. 307 IPC" />
                  {filterSec && <button className="search-clear" onClick={() => setFilterSec("")}>✕</button>}
                </div>
              </div>
            </div>
            {hasFilters && (
              <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>
                Showing <b>{grand}</b> of <b>{allFirs.length}</b> FIRs
              </div>
            )}
          </div>

          {/* Stat grid */}
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-lbl">Total Pending FIRs</div>
              <div className="stat-val">{grand}</div>
              <div className="stat-sub">{hasFilters ? `Filtered of ${allFirs.length}` : `${allFirs.length} total`}</div>
            </div>
            {stTot.filter(s => s.cnt > 0).map(s => (
              <div key={s.sh} className={`stat ${filterSt === s.sh ? "active-st" : ""}`}
                onClick={() => setFilterSt(filterSt === s.sh ? "ALL" : s.sh)}>
                <div className="stat-lbl">{s.lb}</div>
                <div className="stat-val">{s.cnt}</div>
                <div className="stat-sub mono" style={{ fontSize: 9 }}>{s.sh}</div>
              </div>
            ))}
          </div>

          <div className="abs-grid">
            {/* Station-wise */}
            <div className="card">
              <div className="ctitle" style={{ display: "flex", alignItems: "center" }}>
                <span>📍 Station-wise</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportStationExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportStationWord}>⬇ Word</button>
                </div>
              </div>
              <div className="abs-tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Code</th><th>Station</th><th>FIRs</th><th>%</th></tr></thead>
                  <tbody>
                    {stTot.map(s => (
                      <tr key={s.sh} style={{ cursor: "pointer" }}
                        onClick={() => setFilterSt(filterSt === s.sh ? "ALL" : s.sh)}>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{s.sh}</td>
                        <td>{s.lb}</td>
                        <td><b className="mono" style={{ color: s.cnt > 0 ? "var(--gold)" : "var(--txt3)" }}>{s.cnt}</b></td>
                        <td className="mono">{grand ? ((s.cnt / grand) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    <tr className="tot-row"><td colSpan={2}>Total</td><td><b className="mono">{grand}</b></td><td>100%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Year-wise */}
            <div className="card">
              <div className="ctitle" style={{ display: "flex", alignItems: "center" }}>
                <span>📅 Year-wise</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportYearExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportYearWord}>⬇ Word</button>
                </div>
              </div>
              <div className="abs-tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Year</th><th>FIRs</th><th>%</th></tr></thead>
                  <tbody>
                    {yrSort.map(([k, v]) => (
                      <tr key={k} style={{ cursor: "pointer" }}
                        onClick={() => setFilterYr(filterYr === k ? "ALL" : k)}>
                        <td>
                          <span className="yr-badge">{k}</span>
                          {filterYr === k && <span style={{ marginLeft: 4, color: "var(--gold)", fontSize: 9 }}>▶</span>}
                        </td>
                        <td className="mono"><b>{v}</b></td>
                        <td className="mono">{grand ? ((v / grand) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    <tr className="tot-row"><td>Total</td><td className="mono"><b>{grand}</b></td><td>100%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Month-wise */}
            <div className="card">
              <div className="ctitle" style={{ display: "flex", alignItems: "center" }}>
                <span>📆 Month-wise</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportMonthExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportMonthWord}>⬇ Word</button>
                </div>
              </div>
              <div className="abs-tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Month</th><th>FIRs</th></tr></thead>
                  <tbody>
                    {monSort.length === 0
                      ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                      : monSort.map(([k, v]) => {
                        const [my, mn] = k.split("-"); const monthKey = `${mn}.${my}`;
                        const active = filterDate === monthKey;
                        return (
                          <tr key={k} style={{ cursor: "pointer" }}
                            onClick={() => setFilterDate(active ? "" : monthKey)}>
                            <td style={active ? { color: "var(--gold)" } : {}}>
                              {MON_NAMES[+mn] || mn} {my}
                            </td>
                            <td className="mono"><b>{v}</b></td>
                          </tr>
                        );
                      })
                    }
                    {monSort.length > 0 && (
                      <tr className="tot-row">
                        <td>Total</td>
                        <td className="mono"><b>{monSort.reduce((a, [, v]) => a + v, 0)}</b></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent 30 dates */}
            <div className="card">
              <div className="ctitle" style={{ display: "flex", alignItems: "center" }}>
                <span>📋 Recent 30 Dates</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportRecentExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportRecentWord}>⬇ Word</button>
                </div>
              </div>
              <div className="abs-tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Date</th><th>FIRs</th></tr></thead>
                  <tbody>
                    {daySort.length === 0
                      ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                      : daySort.map(([k, v]) => (
                        <tr key={k} style={{ cursor: "pointer" }}
                          onClick={() => setFilterDate(filterDate === k ? "" : k)}>
                          <td className="mono"
                            style={filterDate === k ? { color: "var(--gold)", fontWeight: 700 } : {}}>
                            {k}
                          </td>
                          <td className="mono"><b>{v}</b></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section-wise */}
            <div className="card">
              <div className="ctitle" style={{ display: "flex", alignItems: "center" }}>
                <span>⚖ Section U/s-wise</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportSectionExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportSectionWord}>⬇ Word</button>
                  <span style={{ fontWeight: 400, color: "var(--txt3)", fontSize: 9 }}>
                    {secShow.length}/{secAll.length}
                  </span>
                </div>
              </div>
              <div className="search-wrap" style={{ marginBottom: 10 }}>
                <input className="inp" type="text" value={secSearch}
                  onChange={e => setSecSearch(e.target.value)} placeholder="Search section…" />
                {secSearch && <button className="search-clear" onClick={() => setSecSearch("")}>✕</button>}
              </div>
              <div className="abs-tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>#</th><th>Section U/s</th><th>FIRs</th></tr></thead>
                  <tbody>
                    {secShow.length === 0
                      ? <tr><td colSpan={3} className="no-data">No match</td></tr>
                      : secShow.map(([k, v], i) => (
                        <tr key={k} style={{ cursor: "pointer" }}
                          onClick={() => setFilterSec(filterSec === k ? "" : k)}>
                          <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
                          <td style={filterSec && k.toLowerCase().includes(filterSec.toLowerCase())
                            ? { color: "var(--gold)" } : {}}>
                            {k}
                          </td>
                          <td className="mono"><b>{v}</b></td>
                        </tr>
                      ))
                    }
                    <tr className="tot-row"><td colSpan={2}>Total</td><td className="mono"><b>{grand}</b></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Station × Year Matrix */}
            <div className="card" style={{ gridColumn: "1/-1" }}>
              <div className="ctitle" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span>📊 Station × Year Matrix</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn btn-o btn-sm" onClick={handleExportMatrixExcel}>⬇ Excel</button>
                  <button className="btn btn-o btn-sm" onClick={handleExportMatrixWord}>⬇ Word</button>
                </div>
              </div>
              <StationYearMatrix
                allFirs={filtered}
                years={allYears}
                stTot={stTot}
                setFilterSt={setFilterSt}
                setFilterYr={setFilterYr}
              />
            </div>

            {/* FIR Pending List */}
            <div className="card" style={{ gridColumn: "1/-1" }}>
              <div className="ctitle">
                📋 FIR Pending List
                {filterSt !== "ALL" && (
                  <span className="bdg bdg-a" style={{ marginLeft: 6 }}>
                    {SMAP.find(s => s.sh === filterSt)?.lb}
                  </span>
                )}
                {filterYr !== "ALL" && (
                  <span className="yr-badge" style={{ marginLeft: 4 }}>{filterYr}</span>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                    {listFiltered.length} records
                  </span>
                  <button className="btn btn-o btn-sm" onClick={handleExportList}>⬇ Export</button>
                  <button className="btn btn-o btn-sm" onClick={() =>
                    exportToWord("FIR_List.doc", "FIR List",
                      ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
                      listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]))}>
                    ⬇ Word
                  </button>
                </div>
              </div>
              <div className="search-wrap" style={{ marginBottom: 10 }}>
                <input className="inp" type="text" value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                  placeholder="Search CR No., section, date, station…" />
                {listSearch && <button className="search-clear" onClick={() => setListSearch("")}>✕</button>}
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th>
                      <th>Section U/s</th><th>Date Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listFilteredSorted.slice(0, 300).map((r, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{r.sl}</td>
                        <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{r.cr}</td>
                        <td><span className="yr-badge">{r.yr || "?"}</span></td>
                        <td>
                          <span style={{ color: "var(--txt2)", fontSize: 11 }}>{r.stLb}</span>
                          <span style={{ color: "var(--txt3)", fontSize: 9, marginLeft: 4 }}>({r.stSh})</span>
                        </td>
                        <td style={{ maxWidth: 220, wordBreak: "break-word" }}>{r.sec}</td>
                        <td className="mono">{r.dr || "—"}</td>
                      </tr>
                    ))}
                    {listFilteredSorted.length === 0 && (
                      <tr><td colSpan={6} className="no-data">No FIRs match filters.</td></tr>
                    )}
                    {listFilteredSorted.length > 300 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 10, color: "var(--txt3)", fontSize: 11 }}>
                          Showing 300 of {listFilteredSorted.length} — apply filters to narrow.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 2 — PENDING FIR
      ════════════════════════════════════════════════════ */}
      {inner === "pending" && (
        <div className="abt-pend-root">
          <div className="abt-st-bar">
            {SMAP.map(s => {
              const cnt = (db.fir[s.sh] || []).length;
              const badDates = (db.fir[s.sh] || []).filter(r =>
                (r.dr && !DATE_RE.test(r.dr)) || !r.dr
              ).length;
              return (
                <button key={s.sh}
                  className={`abt-st-chip${pendSt === s.sh ? " abt-st-active" : ""}`}
                  onClick={() => {
                    setPendSt(s.sh);
                    setPendSearch("");
                    setPendFilterStatus("ALL");
                  }}>
                  <span className="abt-st-name">{s.lb}</span>
                  <span className="abt-st-cnt">{cnt}</span>
                  {badDates > 0 && <span className="abt-st-warn">{badDates}⚠</span>}
                </button>
              );
            })}
          </div>

          {pendSt && (
            <div className="abt-pend-panel">
              <div className="abt-pend-hdr">
                <span className="abt-pend-title">{SMAP.find(s => s.sh === pendSt)?.lb}</span>
                <span className="abt-pend-count">{(db.fir[pendSt] || []).length} FIRs</span>
              </div>

              <div className="abt-legend" style={{ alignItems: "center", gap: 10 }}>
                <button
                  className={`abt-leg-item${pendFilterStatus === "FORMAT" ? " active" : ""}`}
                  onClick={() => setPendFilterStatus(pendFilterStatus === "FORMAT" ? "ALL" : "FORMAT")}
                  style={{
                    cursor: "pointer",
                    background: pendFilterStatus === "FORMAT" ? "rgba(255, 85, 85, .12)" : undefined,
                    borderColor: pendFilterStatus === "FORMAT" ? "rgba(255,85,85,.45)" : undefined
                  }}>
                  <span className="abt-date-badge abt-date-bad">format</span>
                  {` Wrong format (${pendFormatCount})`}
                </button>
                <button
                  className={`abt-leg-item${pendFilterStatus === "MISSING" ? " active" : ""}`}
                  onClick={() => setPendFilterStatus(pendFilterStatus === "MISSING" ? "ALL" : "MISSING")}
                  style={{
                    cursor: "pointer",
                    background: pendFilterStatus === "MISSING" ? "rgba(255, 166, 87, .12)" : undefined,
                    borderColor: pendFilterStatus === "MISSING" ? "rgba(255, 166, 87, .45)" : undefined
                  }}>
                  <span className="abt-date-badge abt-date-missing">missing</span>
                  {` No date (${pendMissingCount})`}
                </button>
                {pendFilterStatus !== "ALL" && (
                  <button className="btn btn-o btn-sm" onClick={() => setPendFilterStatus("ALL")}>
                    Clear filter
                  </button>
                )}
              </div>

              <div className="search-wrap" style={{ marginBottom: 8 }}>
                <input className="inp" type="text" value={pendSearch}
                  onChange={e => setPendSearch(e.target.value)}
                  placeholder="Search CR No., section, date…" />
                {pendSearch && <button className="search-clear" onClick={() => setPendSearch("")}>✕</button>}
              </div>

              <div className="tbl-wrap">
                <table className="abs-tbl">
                  <thead>
                    <tr><th>Sl</th><th>CR No.</th><th>Section U/s</th><th>Date Received</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {pendRowsSorted.length === 0
                      ? <tr><td colSpan={5} className="no-data">No FIRs found.</td></tr>
                      : pendRowsSorted.map((r, i) => {
                        const missing = !r.dr;
                        const badFmt = r.dr && !DATE_RE.test(r.dr);
                        return (
                          <tr key={i} className={missing ? "abt-row-missing" : badFmt ? "abt-row-bad" : ""}>
                            <td className="mono" style={{ color: "var(--txt3)" }}>{r.sl}</td>
                            <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{r.cr}</td>
                            <td style={{ maxWidth: 200, wordBreak: "break-word", fontSize: 12 }}>{r.sec}</td>
                            <td>
                              {missing
                                ? <span className="abt-date-badge abt-date-missing">Missing</span>
                                : badFmt
                                  ? <span className="abt-date-badge abt-date-bad" title="Expected DD.MM.YYYY">{r.dr}</span>
                                  : <span className="mono">{r.dr}</span>
                              }
                            </td>
                            <td style={{ width: 120 }}>
                              {/* ── BUG FIX: always use r.ri for editing; fallback only when ri is
                                  genuinely absent, using the original unsorted db index not sorted i ── */}
                              <button
                                className="btn btn-o btn-sm"
                                onClick={() => setEditingRow({
                                  ri: r.ri,           // real sheet row index (1-based)
                                  cr: r.cr || "",     // for display only
                                  sec: r.sec || "",
                                  dr: r.dr || ""
                                })}
                                disabled={!r.ri}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit modal */}
          {editingRow && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-title">
                  Edit FIR row
                  {editingRow.cr && (
                    <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--gold)" }}>
                      {editingRow.cr}
                    </span>
                  )}
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Section U/s</label>
                    <input
                      className="inp"
                      value={editingRow.sec}
                      onChange={e => setEditingRow(prev => ({ ...prev, sec: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                      Date Received (DD.MM.YYYY)
                    </label>
                    <input
                      className="inp mono"
                      value={editingRow.dr}
                      onChange={e => setEditingRow(prev => ({ ...prev, dr: e.target.value }))}
                      placeholder="e.g. 15.06.2025"
                    />
                    {/* ── BUG FIX: show format validation hint inline ── */}
                    {editingRow.dr && !DATE_RE.test(editingRow.dr) && (
                      <div style={{ fontSize: 11, color: "var(--c-red)", marginTop: 4 }}>
                        ⚠ Format must be DD.MM.YYYY (e.g. 15.06.2025)
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-o" onClick={() => setEditingRow(null)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-g"
                    disabled={!!(editingRow.dr && !DATE_RE.test(editingRow.dr))}
                    onClick={async () => {
                      // ── BUG FIX: guard against missing ri before calling API ──
                      if (!editingRow.ri) {
                        setMaintMsg({ type: "err", text: "Cannot update: missing sheet row index." });
                        setEditingRow(null);
                        return;
                      }
                      const ok = await updateFIRRow(
                        tok, pendSt, editingRow.ri, editingRow.sec, editingRow.dr
                      );
                      if (ok) {
                        setDb(prev => ({
                          ...prev,
                          fir: {
                            ...prev.fir,
                            [pendSt]: (prev.fir[pendSt] || []).map(r =>
                              r.ri === editingRow.ri
                                ? { ...r, sec: editingRow.sec, dr: editingRow.dr }
                                : r
                            )
                          }
                        }));
                        setEditingRow(null);
                        setMaintMsg({ type: "ok", text: "✓ Row updated successfully." });
                        setTimeout(() => setMaintMsg(null), 2500);
                      } else {
                        setMaintMsg({ type: "err", text: "Failed to update sheet. Please try again." });
                      }
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 3 — MAINTENANCE
      ════════════════════════════════════════════════════ */}
      {inner === "maintenance" && (
        <div className="abt-maint-root">

          <div className="abt-scan-card">
            <div className="abt-scan-icon">🔍</div>
            <div className="abt-scan-body">
              <div className="abt-scan-title">Data Scanner</div>
              <div className="abt-scan-sub">
                Checks all sheets for concatenated CR numbers, bad dates, and out-of-order FIR / serial numbers.
              </div>
            </div>
            <button
              className="btn btn-g"
              onClick={doScan}
              disabled={scanning || fixing}
              style={{ flexShrink: 0 }}
            >
              {scanning ? "⏳ Scanning…" : "🔍 Scan All"}
            </button>
          </div>

          {!issues && !scanning && (
            <div className="abt-maint-empty">
              <div className="abt-maint-empty-icon">🛠</div>
              <div className="abt-maint-empty-title">Run a scan to check data health</div>
              <div className="abt-maint-empty-sub">Tap "Scan All" to analyse every station sheet</div>
            </div>
          )}

          {issues && (
            <>
              {/* Summary chips */}
              <div className="abt-issue-summary">
                <div className={`abt-issue-chip ${issues.concat.length > 0 ? "abt-issue-red" : "abt-issue-green"}`}>
                  <div className="abt-issue-num">{issues.concat.length}</div>
                  <div className="abt-issue-lbl">Concatenated CR</div>
                </div>
                <div className={`abt-issue-chip ${issues.date.length > 0 ? "abt-issue-red" : "abt-issue-green"}`}>
                  <div className="abt-issue-num">{issues.date.length}</div>
                  <div className="abt-issue-lbl">Date Issues</div>
                </div>
                <div className={`abt-issue-chip ${issues.fir?.length > 0 ? "abt-issue-red" : "abt-issue-green"}`}>
                  <div className="abt-issue-num">{issues.fir?.length ?? 0}</div>
                  <div className="abt-issue-lbl">FIR Out of Order</div>
                </div>
                <div className={`abt-issue-chip ${issues.sl.length > 0 ? "abt-issue-amber" : "abt-issue-green"}`}>
                  <div className="abt-issue-num">{issues.sl.length}</div>
                  <div className="abt-issue-lbl">Sl. Out of Order</div>
                </div>
              </div>

              {issues.concat.length === 0 && issues.date.length === 0 &&
                issues.sl.length === 0 && !issues.fir?.length && (
                  <div className="msg-ok" style={{ marginBottom: 10 }}>
                    ✓ All sheets are clean — no data issues found.
                  </div>
                )}

              {/* Fix: Concatenated CR */}
              {issues.concat.length > 0 && (
                <div className="card">
                  <div className="ctitle">
                    ⚠ Concatenated CR Numbers
                    <button className="btn btn-o btn-sm" style={{ marginLeft: 8 }}
                      onClick={() => setConcatSortAsc(prev => !prev)}>
                      {concatSortAsc ? "Sort Desc" : "Sort Asc"}
                    </button>
                    <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }}
                      onClick={fixConcatenated} disabled={fixing}>
                      ✦ Fix All ({issues.concat.length})
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                    These CR numbers are missing the "/" separator (e.g. "1232024" → "123/2024").
                  </div>
                  <div className="tbl-wrap">
                    <table className="abs-tbl">
                      <thead><tr><th>Station</th><th>Row</th><th>As Found</th><th>→ Fixed</th></tr></thead>
                      <tbody>
                        {concatList.map((iss, i) => (
                          <tr key={i}>
                            <td><span style={{ fontSize: 11 }}>{iss.lb}</span></td>
                            <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                            <td><span className="abt-cr-bad">{iss.original}</span></td>
                            <td><span className="abt-cr-good">{iss.fixed}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Date issues */}
              {issues.date.length > 0 && (
                <div className="card">
                  <div className="ctitle">
                    📅 Date Format Issues
                    <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                      Requires manual correction — use Edit button in Pending FIR tab
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                    Expected format: <b className="mono">DD.MM.YYYY</b>
                  </div>
                  <div className="tbl-wrap">
                    <table className="abs-tbl">
                      <thead>
                        <tr><th>Station</th><th>Row</th><th>CR No.</th><th>Date (as found)</th><th>Issue</th></tr>
                      </thead>
                      <tbody>
                        {issues.date.map((iss, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: 11 }}>{iss.lb}</td>
                            <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                            <td className="mono" style={{ color: "var(--gold)" }}>{iss.cr}</td>
                            <td>
                              <span className={`abt-date-badge ${iss.issue === "missing" ? "abt-date-missing" : "abt-date-bad"}`}>
                                {iss.dr}
                              </span>
                            </td>
                            <td style={{ fontSize: 10, color: "var(--txt3)" }}>
                              {iss.issue === "missing" ? "No date entered" : "Wrong format"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FIR Out of Order */}
              {issues.fir?.length > 0 && (
                <div className="card">
                  <div className="ctitle">
                    ⚠ FIR Numbers Out of Order
                    <button
                      className="btn btn-g btn-sm"
                      style={{ marginLeft: "auto" }}
                      onClick={fixFIROrder}
                      disabled={fixing}
                    >
                      {fixing ? "⏳ Fixing…" : `✦ Fix All (${issues.fir.length})`}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                    FIRs are not in ascending order by year → number.
                    Click <b>Fix All</b> — every sheet's FIR rows will be sorted
                    <b> year first, then number</b>; headers and year banners stay in place.
                    Serial numbers will be rewritten too.
                  </div>
                  <div className="tbl-wrap">
                    <table className="abs-tbl">
                      <thead>
                        <tr>
                          <th>Station</th>
                          <th>Row</th>
                          <th>Previous CR</th>
                          <th>↓ This CR (wrong)</th>
                          <th>Expected order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.fir.map((iss, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: 11 }}>{iss.lb}</td>
                            <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                            <td className="mono" style={{ color: "var(--txt2)" }}>{iss.prevCR}</td>
                            <td><span className="abt-cr-bad">{iss.cr}</span></td>
                            <td style={{ fontSize: 10, color: "var(--txt3)" }}>
                              {iss.cr} should come before {iss.prevCR}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Serial numbers */}
              <div className="card">
                <div className="ctitle">
                  🔢 Serial Numbers
                  {issues.sl.length > 0 && (
                    <button
                      className="btn btn-g btn-sm"
                      style={{ marginLeft: "auto" }}
                      onClick={fixSerialNumbers}
                      disabled={fixing}
                    >
                      {fixing ? "⏳ Fixing…" : "✦ Fix All"}
                    </button>
                  )}
                </div>
                {issues.sl.length === 0
                  ? <div className="msg-ok">✓ All serial numbers are in correct ascending order.</div>
                  : <>
                    <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                      {issues.sl.length} rows have incorrect serial numbers.
                      {" "}<span style={{ color: "var(--txt3)" }}>
                        Note: Fix FIR Order first if FIRs are out of order,
                        then fix serials to avoid conflicts.
                      </span>
                    </div>
                    <div className="tbl-wrap">
                      <table className="abs-tbl">
                        <thead>
                          <tr><th>Station</th><th>Row</th><th>CR No.</th><th>Current Sl</th><th>Expected</th></tr>
                        </thead>
                        <tbody>
                          {issues.sl.slice(0, 60).map((iss, i) => (
                            <tr key={i}>
                              <td style={{ fontSize: 11 }}>{iss.lb}</td>
                              <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                              <td className="mono" style={{ color: "var(--gold)" }}>{iss.cr}</td>
                              <td><span className="abt-cr-bad">{iss.slActual}</span></td>
                              <td><span className="abt-cr-good">{iss.slExpected}</span></td>
                            </tr>
                          ))}
                          {issues.sl.length > 60 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", color: "var(--txt3)", fontSize: 11, padding: 10 }}>
                                …and {issues.sl.length - 60} more
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                }
                {renumMsg && (
                  <div className={renumMsg.type === "ok" ? "msg-ok" : "msg-info"} style={{ marginTop: 8 }}>
                    {renumMsg.type === "loading" && (
                      <span className="spin" style={{ display: "inline-block", marginRight: 6 }} />
                    )}
                    {renumMsg.text}
                  </div>
                )}
              </div>
            </>
          )}

          {maintMsg && (
            <div
              className={`${maintMsg.type === "ok" ? "msg-ok" : maintMsg.type === "err" ? "msg-err" : "msg-info"}`}
              style={{ marginTop: 8 }}
            >
              {maintMsg.type === "loading" && (
                <span className="spin" style={{ display: "inline-block", marginRight: 6 }} />
              )}
              {maintMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}