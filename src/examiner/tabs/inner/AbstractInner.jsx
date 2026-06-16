// ════════════════════════════════════════════════════════════════
//  AbstractInner.jsx
//  Renders the "Abstract" inner tab content.
//  All state & derived data come in as props from AbstractTab.jsx.
// ════════════════════════════════════════════════════════════════

import StationYearMatrix from "../../components/StationYearMatrix.jsx";
import { exportToWord } from "../../utils/exportUtils.js";

const MON_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AbstractInner({
  filterSt, setFilterSt,
  filterYr, setFilterYr,
  filterDate, setFilterDate,
  filterSec, setFilterSec,
  listSearch, setListSearch,
  secSearch, setSecSearch,
  hasFilters, resetFilters,
  grand, allFirs, allYears, stTot,
  yrSort, monSort, daySort,
  secAll, secShow,
  listFiltered, listFilteredSorted,
  matrixRows, matrixYears,
  filtered, SMAP,
  handleExportAll, handleExportList,
  handleExportStationExcel, handleExportStationWord,
  handleExportYearExcel, handleExportYearWord,
  handleExportMonthExcel, handleExportMonthWord,
  handleExportSectionExcel, handleExportSectionWord,
  handleExportMatrixExcel, handleExportMatrixWord,
  handleExportRecentExcel, handleExportRecentWord,
}) {
  return (
    <div>
      {/* Filters */}
      <div className="card">
        <div className="ctitle">
          🔦 Filters
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="btn btn-o btn-sm" onClick={handleExportAll}>⬇ Export All</button>
            <button className="btn btn-o btn-sm" onClick={() => exportToWord("FIR_Abstract.doc", "FIR Abstract - Pending List", ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"], listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]))}>⬇ Word</button>
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
            <input className="inp mono" type="text" value={filterDate} onChange={e => setFilterDate(e.target.value)} placeholder="e.g. 05.2026" />
          </div>
          <div className="fg">
            <label className="lbl">Section (keyword)</label>
            <div className="search-wrap">
              <input className="inp" type="text" value={filterSec} onChange={e => setFilterSec(e.target.value)} placeholder="e.g. 307 IPC" />
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
                  <tr key={s.sh} style={{ cursor: "pointer" }} onClick={() => setFilterSt(filterSt === s.sh ? "ALL" : s.sh)}>
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
                  <tr key={k} style={{ cursor: "pointer" }} onClick={() => setFilterYr(filterYr === k ? "ALL" : k)}>
                    <td><span className="yr-badge">{k}</span>{filterYr === k && <span style={{ marginLeft: 4, color: "var(--gold)", fontSize: 9 }}>▶</span>}</td>
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
                      <tr key={k} style={{ cursor: "pointer" }} onClick={() => setFilterDate(active ? "" : monthKey)}>
                        <td style={active ? { color: "var(--gold)" } : {}}>{MON_NAMES[+mn] || mn} {my}</td>
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
                    <tr key={k} style={{ cursor: "pointer" }} onClick={() => setFilterDate(filterDate === k ? "" : k)}>
                      <td className="mono" style={filterDate === k ? { color: "var(--gold)", fontWeight: 700 } : {}}>{k}</td>
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
              <span style={{ fontWeight: 400, color: "var(--txt3)", fontSize: 9 }}>{secShow.length}/{secAll.length}</span>
            </div>
          </div>
          <div className="search-wrap" style={{ marginBottom: 10 }}>
            <input className="inp" type="text" value={secSearch} onChange={e => setSecSearch(e.target.value)} placeholder="Search section…" />
            {secSearch && <button className="search-clear" onClick={() => setSecSearch("")}>✕</button>}
          </div>
          <div className="abs-tbl-wrap">
            <table className="abs-tbl">
              <thead><tr><th>#</th><th>Section U/s</th><th>FIRs</th></tr></thead>
              <tbody>
                {secShow.length === 0
                  ? <tr><td colSpan={3} className="no-data">No match</td></tr>
                  : secShow.map(([k, v], i) => (
                    <tr key={k} style={{ cursor: "pointer" }} onClick={() => setFilterSec(filterSec === k ? "" : k)}>
                      <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
                      <td style={filterSec && k.toLowerCase().includes(filterSec.toLowerCase()) ? { color: "var(--gold)" } : {}}>{k}</td>
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
          <StationYearMatrix allFirs={filtered} years={allYears} stTot={stTot} setFilterSt={setFilterSt} setFilterYr={setFilterYr} />
        </div>

        {/* FIR Pending List */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <div className="ctitle">
            📋 FIR Pending List
            {filterSt !== "ALL" && <span className="bdg bdg-a" style={{ marginLeft: 6 }}>{SMAP.find(s => s.sh === filterSt)?.lb}</span>}
            {filterYr !== "ALL" && <span className="yr-badge" style={{ marginLeft: 4 }}>{filterYr}</span>}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>{listFiltered.length} records</span>
              <button className="btn btn-o btn-sm" onClick={handleExportList}>⬇ Export</button>
              <button className="btn btn-o btn-sm" onClick={() => exportToWord("FIR_List.doc", "FIR List", ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"], listFilteredSorted.map(r => [r.sl, r.cr, r.yr || "", r.stLb, r.sec, r.dr || ""]))}>⬇ Word</button>
            </div>
          </div>
          <div className="search-wrap" style={{ marginBottom: 10 }}>
            <input className="inp" type="text" value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Search CR No., section, date, station…" />
            {listSearch && <button className="search-clear" onClick={() => setListSearch("")}>✕</button>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th><th>Section U/s</th><th>Date Received</th></tr>
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
  );
}
