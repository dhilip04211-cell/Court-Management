// ════════════════════════════════════════════════════════════════
//  AbstractTab.jsx  (orchestrator)
//  Each inner tab is rendered by its own dedicated component:
//    AbstractInner   → ./inner/AbstractInner.jsx
//    PendingFIRInner → ./inner/PendingFIRInner.jsx
//    StatementTab    → ./StatementTab.jsx
//    MaintenanceInner→ ./inner/MaintenanceInner.jsx
//
//  This file owns ALL shared state, derived data (useMemo), and
//  async handlers, then passes them down as props.
// ════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { isValidFIRCell, parseFIR, normalizeFIRCell } from "../utils/helpers.js";
import { sheetsGet, sheetsUpdate } from "../utils/sheets.js";
import { SID } from "../constants/config.js";
import { exportToExcel, exportToWord } from "../utils/exportUtils.js";
import StatementTab    from "./StatementTab.jsx";
import AbstractInner   from "./inner/AbstractInner.jsx";
import PendingFIRInner from "./inner/PendingFIRInner.jsx";
import MaintenanceInner from "./inner/MaintenanceInner.jsx";

const MON_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE_RE   = /^\d{2}\.\d{2}\.\d{4}$/;
const SKIP_HDR  = b => /cr\.no/i.test(b);

function parseDDMMYYYY(s) {
  const p = s.split("."); if (p.length < 3) return 0;
  return new Date(p[2], p[1] - 1, p[0]).getTime() || 0;
}

function robustFirSortKey(cr) {
  if (!cr) return 0;
  const s = cr.toString().trim();
  const slash = s.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (slash) return parseInt(slash[2], 10) * 100000 + parseInt(slash[1], 10);
  const concat = s.match(/^(\d+?)(\d{4})$/);
  if (concat) return parseInt(concat[2], 10) * 100000 + parseInt(concat[1], 10);
  return 0;
}

const INNER_TABS = [
  { id: "abstract",    icon: "📊", label: "Abstract"    },
  { id: "pending",     icon: "📋", label: "Pending FIR" },
  { id: "statement",   icon: "📄", label: "Statement"   },
  { id: "maintenance", icon: "🔧", label: "Maintenance" },
];

export default function AbstractTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const [inner, setInner] = useState("abstract");

  /* ── Abstract state ── */
  const [filterSt,   setFilterSt]   = useState("ALL");
  const [filterYr,   setFilterYr]   = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [filterSec,  setFilterSec]  = useState("");
  const [listSearch, setListSearch] = useState("");
  const [secSearch,  setSecSearch]  = useState("");

  /* ── Pending FIR state ── */
  const [pendSt,           setPendSt]           = useState(() => SMAP[0]?.sh || "");
  const [pendSearch,       setPendSearch]       = useState("");
  const [pendFilterStatus, setPendFilterStatus] = useState("ALL");

  /* ── Maintenance state ── */
  const [issues,     setIssues]     = useState(null);
  const [scanning,   setScanning]   = useState(false);
  const [fixing,     setFixing]     = useState(false);
  const [maintMsg,   setMaintMsg]   = useState(null);
  const [renumMsg,   setRenumMsg]   = useState(null);
  const [editingRow, setEditingRow] = useState(null);

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
    if (filterYr !== "ALL" && r.yr  !== filterYr)  return false;
    if (filterDate && !(r.dr  || "").includes(filterDate)) return false;
    if (filterSec  && !(r.sec || "").toLowerCase().includes(filterSec.toLowerCase())) return false;
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
      (r.cr  || "").toLowerCase().includes(q) || (r.sec  || "").toLowerCase().includes(q) ||
      (r.dr  || "").toLowerCase().includes(q) || (r.stLb || "").toLowerCase().includes(q));
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
     PENDING FIR — derived data
  ══════════════════════════════════════════════════════════ */
  const pendRows = useMemo(() => {
    const rows = db.fir[pendSt] || [];
    const q    = pendSearch.toLowerCase();
    return rows.filter(r => {
      if (pendSearch) {
        const match = (r.cr  || "").toLowerCase().includes(q) ||
                      (r.sec || "").toLowerCase().includes(q) ||
                      (r.dr  || "").includes(q);
        if (!match) return false;
      }
      if (pendFilterStatus === "MISSING") return !r.dr;
      if (pendFilterStatus === "FORMAT")  return r.dr && !DATE_RE.test(r.dr);
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
  const pendFormatCount  = useMemo(() =>
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

      let expectedSl = 1, lastKey = -1, lastCR = "";

      for (let i = 0; i < raw.length; i++) {
        const info = classifyRow(raw[i]);
        if (info.type !== "fir") continue;

        const { sl, cr, sec, dr } = info;
        const key      = robustFirSortKey(cr);
        const original = (raw[i][1] || "").toString().trim();

        if (cr !== original)
          concat.push({ sh: s.sh, lb: s.lb, row: i + 1, original, fixed: cr, sec, dr });

        if (!dr) {
          dateBad.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, dr: "(missing)", issue: "missing" });
        } else if (!DATE_RE.test(dr)) {
          dateBad.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, dr, issue: "format" });
        }

        if (key > 0 && lastKey > 0 && key < lastKey)
          firOOO.push({ sh: s.sh, lb: s.lb, row: i + 1, cr, prevCR: lastCR, prevKey: lastKey, currKey: key });
        if (key > 0) { lastKey = key; lastCR = cr; }

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
     Bug fix: added setTimeout to auto-clear maintMsg after 4000 ms
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
          fir: { ...prev.fir, [iss.sh]: (prev.fir[iss.sh] || []).map(r => r.ri === iss.row ? { ...r, cr: iss.fixed } : r) }
        }));
      }
    }
    setMaintMsg({ type: "ok", text: `✓ Fixed ${fixed}/${issues.concat.length} concatenated CR numbers.` });
    setIssues(prev => ({ ...prev, concat: [] }));
    setFixing(false);
    setTimeout(() => setMaintMsg(null), 4000);
  }

  /* ══════════════════════════════════════════════════════════
     MAINTENANCE — fix serial numbers
  ══════════════════════════════════════════════════════════ */
  async function fixSerialNumbers() {
    setFixing(true);
    setRenumMsg({ type: "loading", text: "Re-numbering serial numbers across all sheets…" });
    let totalWritten = 0;

    for (const s of SMAP) {
      const raw = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      if (!raw?.length) continue;

      const structure = raw.map((row, rowIdx) => ({ ...classifyRow(row), rowIdx }));
      const firSlots  = structure.filter(r => r.type === "fir");
      if (firSlots.length === 0) continue;

      const needsUpdate = firSlots.some((slot, i) => {
        const currentSl = parseInt(slot.sl, 10);
        return isNaN(currentSl) || currentSl !== i + 1;
      });
      if (!needsUpdate) continue;

      for (let i = 0; i < firSlots.length; i++) {
        const slot     = firSlots[i];
        const correctSl = String(i + 1);
        if (slot.sl === correctSl) continue;
        await sheetsUpdate(tok, SID.fir, `${s.sh}!A${slot.rowIdx + 1}`, [[correctSl]]);
        totalWritten++;
      }

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
  ══════════════════════════════════════════════════════════ */
  async function fixFIROrder() {
    if (!issues?.fir?.length) return;
    setFixing(true);
    setMaintMsg({ type: "loading", text: "Re-ordering FIR rows across all sheets…" });
    let totalWritten = 0;

    for (const s of SMAP) {
      const raw = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      if (!raw?.length) continue;

      const structure = raw.map((row, rowIdx) => ({ ...classifyRow(row), rowIdx }));
      const firRows   = structure.filter(r => r.type === "fir").map(r => ({ sl: r.sl, cr: r.cr, sec: r.sec, dr: r.dr }));
      if (firRows.length === 0) continue;

      const sorted    = [...firRows].sort((a, b) => robustFirSortKey(a.cr) - robustFirSortKey(b.cr));
      sorted.forEach((r, i) => { r.sl = String(i + 1); });
      if (firRows.every((r, i) => r.cr === sorted[i].cr)) continue;

      const newSheetValues = []; let si = 0;
      for (const item of structure) {
        if (item.type === "fir") {
          const src = sorted[si++];
          newSheetValues.push([src.sl, src.cr, src.sec, src.dr]);
        } else {
          newSheetValues.push(raw[item.rowIdx].slice(0, 4));
        }
      }

      await sheetsUpdate(tok, SID.fir, `${s.sh}!A1:D${raw.length}`, newSheetValues);
      totalWritten += firRows.length;

      setDb(prev => {
        const sheetFirSlots = structure.filter(r => r.type === "fir");
        const newRows = (prev.fir[s.sh] || []).map(r => {
          const slotIndex = sheetFirSlots.findIndex(sl => sl.rowIdx + 1 === r.ri);
          if (slotIndex === -1) return r;
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
     EXPORT handlers
  ══════════════════════════════════════════════════════════ */
  const matrixYears = allYears;

  const matrixMap = useMemo(() => {
    const map = {};
    for (const r of filtered) { const key = `${r.stSh}::${r.yr}`; map[key] = (map[key] || 0) + 1; }
    return map;
  }, [filtered]);

  const matrixYearTotals = useMemo(() => {
    const totals = {};
    for (const r of filtered) { if (!r.yr) continue; totals[r.yr] = (totals[r.yr] || 0) + 1; }
    return totals;
  }, [filtered]);

  const matrixRows = useMemo(() => {
    const rows = [];
    const activeStations = stTot.filter(s => matrixYears.some(y => (matrixMap[`${s.sh}::${y}`] || 0) > 0));
    for (const s of activeStations) {
      const row   = [s.lb, ...matrixYears.map(y => matrixMap[`${s.sh}::${y}`] || 0)];
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
      { name: "FIR Pending List", headers: ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"], rows: listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]) },
      { name: "Station-wise",     headers: ["Code", "Station", "FIRs", "%"], rows: stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"]) },
      { name: "Year-wise",        headers: ["Year", "FIRs", "%"],            rows: yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"]) },
      { name: "Month-wise",       headers: ["Month", "FIRs"],                rows: monSort.map(([k, v]) => { const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v]; }) },
      { name: "Section-wise",     headers: ["#", "Section U/s", "FIRs"],     rows: secAll.map(([k, v], i) => [i + 1, k, v]) },
      { name: "Station-Year Matrix", headers: ["Station", ...matrixYears, "Total"], rows: matrixRows },
    ]);
  }
  function handleExportList()         { exportToExcel("FIR_List.xlsx",         [{ name: "FIR List",          headers: ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"], rows: listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]) }]); }
  function handleExportStationExcel() { exportToExcel("FIR_Station_Wise.xlsx", [{ name: "Station-wise",      headers: ["Code", "Station", "FIRs", "%"],  rows: stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"]) }]); }
  function handleExportStationWord()  { exportToWord("FIR_Station_Wise.doc",  "Station-wise FIR Summary",   ["Code", "Station", "FIRs", "%"],  stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"])); }
  function handleExportYearExcel()    { exportToExcel("FIR_Year_Wise.xlsx",    [{ name: "Year-wise",         headers: ["Year", "FIRs", "%"],            rows: yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"]) }]); }
  function handleExportYearWord()     { exportToWord("FIR_Year_Wise.doc",    "Year-wise FIR Summary",        ["Year", "FIRs", "%"],            yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"])); }
  function handleExportMonthExcel()   { exportToExcel("FIR_Month_Wise.xlsx",   [{ name: "Month-wise",        headers: ["Month", "FIRs"],                rows: monSort.map(([k, v]) => { const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v]; }) }]); }
  function handleExportMonthWord()    { exportToWord("FIR_Month_Wise.doc",   "Month-wise FIR Summary",       ["Month", "FIRs"],                monSort.map(([k, v]) => { const [my, mn] = k.split("-"); return [`${MON_NAMES[+mn] || mn} ${my}`, v]; })); }
  function handleExportSectionExcel() { exportToExcel("FIR_Section_Wise.xlsx", [{ name: "Section-wise",      headers: ["#", "Section U/s", "FIRs"],     rows: secAll.map(([k, v], i) => [i + 1, k, v]) }]); }
  function handleExportSectionWord()  { exportToWord("FIR_Section_Wise.doc", "Section-wise FIR Summary",    ["#", "Section U/s", "FIRs"],     secAll.map(([k, v], i) => [i + 1, k, v])); }
  function handleExportMatrixExcel()  { exportToExcel("Station_Year_Matrix.xlsx", [{ name: "Station-Year Matrix", headers: ["Station", ...matrixYears, "Total"], rows: matrixRows }]); }
  function handleExportMatrixWord()   { exportToWord("Station_Year_Matrix.doc", "Station × Year Matrix",    ["Station", ...matrixYears, "Total"], matrixRows, { pageSize: "A4", orientation: "landscape", fontSize: 10, cellPadding: 5 }); }
  function handleExportRecentExcel()  { exportToExcel("FIR_Recent_Dates.xlsx",  [{ name: "Recent Dates",     headers: ["Date", "FIRs"],                 rows: daySort.map(([k, v]) => [k, v]) }]); }
  function handleExportRecentWord()   { exportToWord("FIR_Recent_Dates.doc",  "Recent FIR Dates",            ["Date", "FIRs"],                 daySort.map(([k, v]) => [k, v])); }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="abt-root">
      {!window.XLSX && (
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" onLoad={() => {}} />
      )}

      {/* ── Inner tab bar ── */}
      <div className="abt-tabbar">
        {INNER_TABS.map(t => (
          <button key={t.id}
            className={`abt-tab${inner === t.id ? " abt-tab-active" : ""}`}
            onClick={() => setInner(t.id)}>
            <span className="abt-tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1 — ABSTRACT ── */}
      {inner === "abstract" && (
        <AbstractInner
          filterSt={filterSt}   setFilterSt={setFilterSt}
          filterYr={filterYr}   setFilterYr={setFilterYr}
          filterDate={filterDate} setFilterDate={setFilterDate}
          filterSec={filterSec}  setFilterSec={setFilterSec}
          listSearch={listSearch} setListSearch={setListSearch}
          secSearch={secSearch}  setSecSearch={setSecSearch}
          hasFilters={hasFilters} resetFilters={resetFilters}
          grand={grand} allFirs={allFirs} allYears={allYears} stTot={stTot}
          yrSort={yrSort} monSort={monSort} daySort={daySort}
          secAll={secAll} secShow={secShow}
          listFiltered={listFiltered} listFilteredSorted={listFilteredSorted}
          matrixRows={matrixRows} matrixYears={matrixYears}
          filtered={filtered} SMAP={SMAP}
          handleExportAll={handleExportAll}           handleExportList={handleExportList}
          handleExportStationExcel={handleExportStationExcel} handleExportStationWord={handleExportStationWord}
          handleExportYearExcel={handleExportYearExcel}       handleExportYearWord={handleExportYearWord}
          handleExportMonthExcel={handleExportMonthExcel}     handleExportMonthWord={handleExportMonthWord}
          handleExportSectionExcel={handleExportSectionExcel} handleExportSectionWord={handleExportSectionWord}
          handleExportMatrixExcel={handleExportMatrixExcel}   handleExportMatrixWord={handleExportMatrixWord}
          handleExportRecentExcel={handleExportRecentExcel}   handleExportRecentWord={handleExportRecentWord}
        />
      )}

      {/* ── TAB 2 — PENDING FIR ── */}
      {inner === "pending" && (
        <PendingFIRInner
          db={db} setDb={setDb} tok={tok} SMAP={SMAP}
          pendSt={pendSt}           setPendSt={setPendSt}
          pendSearch={pendSearch}   setPendSearch={setPendSearch}
          pendFilterStatus={pendFilterStatus} setPendFilterStatus={setPendFilterStatus}
          pendRowsSorted={pendRowsSorted}
          pendMissingCount={pendMissingCount} pendFormatCount={pendFormatCount}
          editingRow={editingRow}   setEditingRow={setEditingRow}
          setMaintMsg={setMaintMsg}
        />
      )}

      {/* ── TAB 3 — STATEMENT ── */}
      {inner === "statement" && (
        <StatementTab db={db} setDb={setDb} tok={tok} smap={SMAP} />
      )}

      {/* ── TAB 4 — MAINTENANCE ── */}
      {inner === "maintenance" && (
        <MaintenanceInner
          issues={issues}   scanning={scanning} fixing={fixing}
          maintMsg={maintMsg} renumMsg={renumMsg}
          doScan={doScan}           fixConcatenated={fixConcatenated}
          fixSerialNumbers={fixSerialNumbers} fixFIROrder={fixFIROrder}
        />
      )}
    </div>
  );
}
