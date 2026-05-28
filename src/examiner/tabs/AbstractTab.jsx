import { useState, useMemo } from "react";
import { isValidFIRCell, parseFIR } from "../utils/helpers.js";
import { renumberFIRSheet } from "../utils/sheets.js";
import StationYearMatrix from "../components/StationYearMatrix.jsx";

/* ─── Excel export helper (SheetJS via window.XLSX or CSV fallback) ─────── */
function exportToExcel(filename, sheetsData) {
  try {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("no xlsx");
    const wb = XLSX.utils.book_new();
    for (const { name, headers, rows } of sheetsData) {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename);
  } catch {
    // Single-sheet CSV fallback using first sheet
    const { headers, rows } = sheetsData[0];
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename.replace(/\.xlsx$/, ".csv");
    a.click();
  }
}

const MON_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDDMMYYYY(s) {
  const p = s.split(".");
  if (p.length < 3) return 0;
  return new Date(p[2], p[1] - 1, p[0]).getTime() || 0;
}

export default function AbstractTab({ db, tok, smap }) {
  // smap is now passed as prop (loaded from sheet names)
  const SMAP = smap || [];

  const [filterSt, setFilterSt] = useState("ALL");
  const [filterYr, setFilterYr] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [filterSec, setFilterSec] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [secSearch, setSecSearch] = useState("");
  const [renumMsg, setRenumMsg] = useState(null);

  /* ── Flatten all FIRs from db ─────────────────────────────────────────── */
  const allFirs = useMemo(() => {
    const out = [];
    for (const s of SMAP) {
      for (const r of (db.fir[s.sh] || [])) {
        if (!isValidFIRCell(r.cr)) continue;
        const yr = parseFIR(r.cr).yr || r.yr || "";
        out.push({ ...r, yr, stSh: s.sh, stLb: s.lb });
      }
    }
    return out;
  }, [db, SMAP]);

  const allYears = useMemo(() =>
    [...new Set(allFirs.map(r => r.yr).filter(Boolean))].sort(), [allFirs]);

  /* ── Filtered set ─────────────────────────────────────────────────────── */
  const filtered = useMemo(() => allFirs.filter(r => {
    if (filterSt !== "ALL" && r.stSh !== filterSt) return false;
    if (filterYr !== "ALL" && r.yr !== filterYr) return false;
    if (filterDate && !(r.dr || "").includes(filterDate)) return false;
    if (filterSec && !(r.sec || "").toLowerCase().includes(filterSec.toLowerCase())) return false;
    return true;
  }), [allFirs, filterSt, filterYr, filterDate, filterSec]);

  const grand = filtered.length;
  const stTot = SMAP.map(s => ({ sh: s.sh, lb: s.lb, cnt: filtered.filter(r => r.stSh === s.sh).length }));

  /* ── Year breakdown ───────────────────────────────────────────────────── */
  const yrSort = useMemo(() => {
    const byYr = {};
    for (const r of filtered) { const k = r.yr || "?"; byYr[k] = (byYr[k] || 0) + 1; }
    return Object.entries(byYr).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  /* ── Month breakdown — fixed: parse DD.MM.YYYY correctly ─────────────── */
  const monSort = useMemo(() => {
    const byMon = {};
    for (const r of filtered) {
      if (!r.dr) continue;
      const pts = r.dr.trim().split(".");
      if (pts.length >= 3) {
        const yr = pts[2].trim();
        const mon = pts[1].trim().padStart(2, "0");
        if (yr.length === 4 && /^\d{2}$/.test(mon)) {
          const k = `${yr}-${mon}`;
          byMon[k] = (byMon[k] || 0) + 1;
        }
      }
    }
    return Object.entries(byMon).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  /* ── Recent 30 dates ──────────────────────────────────────────────────── */
  const daySort = useMemo(() => {
    const byDay = {};
    for (const r of filtered) {
      if (r.dr && r.dr.trim()) byDay[r.dr.trim()] = (byDay[r.dr.trim()] || 0) + 1;
    }
    return Object.entries(byDay)
      .sort((a, b) => parseDDMMYYYY(a[0]) - parseDDMMYYYY(b[0]))
      .slice(-30).reverse();
  }, [filtered]);

  /* ── Section breakdown ────────────────────────────────────────────────── */
  const secAll = useMemo(() => {
    const bySec = {};
    for (const r of filtered) { const k = (r.sec || "Unknown").trim(); bySec[k] = (bySec[k] || 0) + 1; }
    return Object.entries(bySec).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const secShow = secSearch
    ? secAll.filter(([k]) => k.toLowerCase().includes(secSearch.toLowerCase()))
    : secAll.slice(0, 40);

  /* ── List search ──────────────────────────────────────────────────────── */
  const listFiltered = useMemo(() => {
    if (!listSearch) return filtered;
    const q = listSearch.toLowerCase();
    return filtered.filter(r =>
      (r.cr || "").toLowerCase().includes(q) ||
      (r.sec || "").toLowerCase().includes(q) ||
      (r.dr || "").toLowerCase().includes(q) ||
      (r.stLb || "").toLowerCase().includes(q)
    );
  }, [filtered, listSearch]);

  function resetAll() {
    setFilterSt("ALL"); setFilterYr("ALL");
    setFilterDate(""); setFilterSec(""); setListSearch("");
  }
  const hasFilters = filterSt !== "ALL" || filterYr !== "ALL" || filterDate || filterSec;

  /* ── Maintenance: batch renumber ──────────────────────────────────────── */
  async function batchRenumber() {
    setRenumMsg({ type: "loading", text: "Renumbering all sheets…" });
    let total = 0;
    for (const s of SMAP) total += await renumberFIRSheet(tok, s.sh);
    setRenumMsg({ type: "ok", text: `✓ Renumbered ${total} row(s) across all sheets.` });
    setTimeout(() => setRenumMsg(null), 3000);
  }

  /* ── Export: full abstract ────────────────────────────────────────────── */
  function handleExportAll() {
    // Sheet 1: FIR Pending List (current filtered)
    const listHeaders = ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"];
    const listRows = listFiltered.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]);

    // Sheet 2: Station-wise
    const stHeaders = ["Station Code", "Station Name", "FIR Count", "%"];
    const stRows = stTot.map(s => [s.sh, s.lb, s.cnt, grand ? ((s.cnt / grand) * 100).toFixed(1) + "%" : "0%"]);

    // Sheet 3: Year-wise
    const yrHeaders = ["Year", "FIR Count", "%"];
    const yrRows = yrSort.map(([k, v]) => [k, v, grand ? ((v / grand) * 100).toFixed(1) + "%" : "0%"]);

    // Sheet 4: Month-wise
    const monHeaders = ["Month", "FIR Count"];
    const monRows = monSort.map(([k, v]) => {
      const [my, mn] = k.split("-");
      return [`${MON_NAMES[parseInt(mn, 10)] || mn} ${my}`, v];
    });

    // Sheet 5: Section-wise
    const secHeaders = ["#", "Section U/s", "FIR Count"];
    const secRows = secAll.map(([k, v], i) => [i + 1, k, v]);

    exportToExcel("FIR_Abstract.xlsx", [
      { name: "FIR Pending List", headers: listHeaders, rows: listRows },
      { name: "Station-wise", headers: stHeaders, rows: stRows },
      { name: "Year-wise", headers: yrHeaders, rows: yrRows },
      { name: "Month-wise", headers: monHeaders, rows: monRows },
      { name: "Section-wise", headers: secHeaders, rows: secRows },
    ]);
  }

  /* ── Export: filtered list only ───────────────────────────────────────── */
  function handleExportList() {
    const headers = ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"];
    const rows = listFiltered.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]);
    exportToExcel("FIR_List.xlsx", [{ name: "FIR List", headers, rows }]);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* XLSX script — load once */}
      {!window.XLSX && (
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
          onLoad={() => { }}
        />
      )}

      {/* Filters */}
      <div className="card">
        <div className="ctitle">
          🔦 Filters
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="btn btn-o btn-sm" onClick={handleExportAll}>⬇ Export All</button>
            {hasFilters && (
              <button className="btn btn-o btn-sm" onClick={resetAll}>✕ Reset</button>
            )}
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
          <div className="stat-sub">{hasFilters ? "Filtered" : `${allFirs.length} total`}</div>
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
          <div className="ctitle">📍 Station-wise</div>
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
              <tr className="tot-row">
                <td colSpan={2}>Total</td>
                <td><b className="mono">{grand}</b></td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Year-wise */}
        <div className="card">
          <div className="ctitle">📅 Year-wise</div>
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
              <tr className="tot-row">
                <td>Total</td><td className="mono"><b>{grand}</b></td><td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Month-wise — now shows real counts */}
        <div className="card">
          <div className="ctitle">📆 Month-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Month</th><th>FIRs</th></tr></thead>
            <tbody>
              {monSort.length === 0
                ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                : monSort.map(([k, v]) => {
                  const [my, mn] = k.split("-");
                  return (
                    <tr key={k}>
                      <td>{MON_NAMES[parseInt(mn, 10)] || mn} {my}</td>
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

        {/* Recent 30 dates */}
        <div className="card">
          <div className="ctitle">📋 Recent 30 Dates</div>
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

        {/* Section-wise */}
        <div className="card">
          <div className="ctitle">
            ⚖ Section U/s-wise
            <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 9 }}>
              {secShow.length}/{secAll.length}
            </span>
          </div>
          <div className="search-wrap" style={{ marginBottom: 10 }}>
            <input className="inp" type="text" value={secSearch}
              onChange={e => setSecSearch(e.target.value)} placeholder="Search section…" />
            {secSearch && <button className="search-clear" onClick={() => setSecSearch("")}>✕</button>}
          </div>
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
              <tr className="tot-row">
                <td colSpan={2}>Total</td>
                <td className="mono"><b>{grand}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Maintenance */}
        <div className="card">
          <div className="ctitle">🔧 Maintenance</div>
          <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 10, lineHeight: 1.6 }}>
            Renumber all Sl columns across every station sheet in ascending order.
            Use this if Sl numbers are out of sync after edits or deletions.
          </div>
          <button className="btn btn-o" onClick={batchRenumber}>🔢 Fix All Serial Numbers</button>
          {renumMsg && (
            <div className={renumMsg.type === "ok" ? "msg-ok" : "msg-info"} style={{ marginTop: 8 }}>
              {renumMsg.type === "loading" && <span className="spin" style={{ display: "inline-block", marginRight: 6 }} />}
              {renumMsg.text}
            </div>
          )}
        </div>

        {/* Station × Year Matrix */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <div className="ctitle">📊 Station × Year Matrix</div>
          <StationYearMatrix
            allFirs={filtered} years={allYears} stTot={stTot}
            setFilterSt={setFilterSt} setFilterYr={setFilterYr}
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
                  <th>Sl</th><th>CR No.</th><th>Year</th>
                  <th>Station</th><th>Section U/s</th><th>Date Received</th>
                </tr>
              </thead>
              <tbody>
                {listFiltered.slice(0, 300).map((r, i) => (
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
                {listFiltered.length === 0 && (
                  <tr><td colSpan={6} className="no-data">No FIRs match filters.</td></tr>
                )}
                {listFiltered.length > 300 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 10, color: "var(--txt3)", fontSize: 11 }}>
                      Showing 300 of {listFiltered.length} — apply filters to narrow.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}