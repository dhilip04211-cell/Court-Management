import { useState, useMemo } from "react";
import { isValidFIRCell, parseFIR } from "../utils/helpers.js";

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const MON_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON_SHORT = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;

/* ── helpers ── */
function lastDay(yyyy, mm) { return new Date(yyyy, mm, 0).getDate(); }
function pad2(n) { return String(n).padStart(2, "0"); }
function fmtDMY(d, m, y) { return `${pad2(d)}.${pad2(m)}.${y}`; }
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* Parse DD.MM.YYYY date string */

function parseDateFlex(s) {
  if (!s) return null;
  const norm = s.trim().replace(/-/g, ".");
  return parseDMY(norm);
}

/* Extract FIR year from a CR string like "123/2024" */
function firYear(cr) {
  if (!cr) return "";
  const m = cr.toString().match(/(\d{4})/g);
  if (!m) return "";
  // Last 4-digit group is the year
  return m[m.length - 1] || "";
}

/* Build year options 1999 → current+1 */
function buildYearOptions() {
  const cur = new Date().getFullYear();
  const out = [];
  for (let y = cur + 1; y >= 1999; y--) out.push(y);
  return out;
}

/* ─────────────────────────────────────────────────────────────────
   EXCEL EXPORT
───────────────────────────────────────────────────────────────── */
function exportExcel(filename, sheets) {
  try {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("XLSX not loaded");
    const wb = XLSX.utils.book_new();
    for (const { name, aoa } of sheets) {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename);
  } catch {
    // fallback CSV
    const { aoa } = sheets[0];
    const csv = aoa
      .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename.replace(/\.xlsx$/, ".csv");
    a.click();
  }
}

/* ─────────────────────────────────────────────────────────────────
   WORD EXPORT  — Times New Roman, bordered table, A4 landscape
───────────────────────────────────────────────────────────────── */
function buildWordDoc(disposalAOA, pendingAOA, monthLabel, districtName, courtName) {
  function tblHTML(aoa, caption) {
    if (!aoa || aoa.length < 2) return "";
    const [hdr, ...body] = aoa;
    const ths = hdr.map(h => `<th>${String(h ?? "").replace(/\n/g, "<br>")}</th>`).join("");
    const trs = body
      .map(r => `<tr>${r.map((c, ci) => `<td style="${ci === 0 ? "text-align:left;font-weight:600" : ""}">${String(c ?? "")}</td>`).join("")}</tr>`)
      .join("");
    return `
      <p class="cap">${caption}</p>
      <table>
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; margin: 0; }
  h1 { font-size: 12pt; text-align: center; font-weight: bold; margin: 0 0 3px; }
  .sub { font-size: 11pt; font-weight: bold; margin: 0 0 2px; }
  .cap { font-size: 11.5pt; font-weight: bold; text-decoration: underline; margin: 14px 0 4px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
  th, td {
    border: 1px solid #333; padding: 4px 5px;
    font-family: 'Times New Roman', Times, serif;
    font-size: 8.5pt; text-align: center; vertical-align: middle;
  }
  th { background: #f0f0f0; font-weight: bold; white-space: pre-wrap; }
</style>
</head>
<body>
  <h1>IN THE FILE OF THE JUDICIAL MAGISTRATE COURT NO.I, JAYANKONDAM</h1>
  <p class="sub">NAME OF THE DISTRICT: ${districtName}</p>
  <p class="sub">STATEMENT AS ON ${monthLabel}</p>
  ${tblHTML(disposalAOA, "Disposal of FIR (Yearwise-Courtwise)")}
  ${tblHTML(pendingAOA, "Pending of FIR (Yearwise-Courtwise)")}
</body>
</html>`;
}

function exportWord(disposalAOA, pendingAOA, monthLabel, districtName, courtName, filename) {
  const html = buildWordDoc(disposalAOA, pendingAOA, monthLabel, districtName, courtName);
  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function StatementTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const COURT_NAME = "Judicial Magistrate No.I, Jayankondam";
  const DISTRICT   = "Ariyalur";

  /* form state */
  const now = new Date();
  const [selMonth, setSelMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selYear,  setSelYear]  = useState(String(now.getFullYear()));
  const [submitted, setSubmitted] = useState(false);
  const [filterYr, setFilterYr] = useState(null); // year chip filter for pending list

  const mm   = parseInt(selMonth, 10);
  const yyyy = parseInt(selYear,  10);

  /* prev month */
  const prevMM   = mm === 1 ? 12 : mm - 1;
  const prevYYYY = mm === 1 ? yyyy - 1 : yyyy;
  const prevEnd  = fmtDMY(lastDay(prevYYYY, prevMM), prevMM, prevYYYY);
  const thisEnd  = fmtDMY(lastDay(yyyy, mm), mm, yyyy);

  /* ── All FIRs flat (pending register) ── */
  const allFirs = useMemo(() => {
    const out = [];
    for (const s of SMAP)
      for (const r of (db.fir[s.sh] || []))
        if (isValidFIRCell(r.cr))
          out.push({ ...r, stSh: s.sh, stLb: s.lb, firYr: firYear(r.cr) });
    return out;
  }, [db.fir, SMAP]);

  /* ── All case-numbered records (disposed cases) ── */
  const allCnum = useMemo(() => db.cnum || [], [db.cnum]);

  /* ── INSTITUTION = FIRs in pending register whose dr is in selected MM/YYYY ── */
  const institutionFirs = useMemo(() => {
    if (!submitted) return [];
    return allFirs.filter(r => {
      const p = parseDMY(r.dr);
      return p && p.mm === mm && p.yyyy === yyyy;
    });
  }, [allFirs, mm, yyyy, submitted]);

  /* ── DISPOSAL = Case Numbered entries whose dr (FIR date received) is in selected MM/YYYY ── */
  const disposalCases = useMemo(() => {
    if (!submitted) return [];
    return allCnum.filter(r => {
      const p = parseDMY(r.dr);
      return p && p.mm === mm && p.yyyy === yyyy;
    });
  }, [allCnum, mm, yyyy, submitted]);

  /* ── PENDING as on this month end = all FIRs currently in register ── */
  const totalPending = allFirs.length;

  /* ── PENDING as on prev month end = totalPending - institutionFirs (not yet added last month) ── */
  const prevPending = totalPending - institutionFirs.length;

  /* ── All unique FIR years (for yearwise columns) ── */
  const allYears = useMemo(() => {
    const ys = new Set();
    allFirs.forEach(r => { if (r.firYr) ys.add(r.firYr); });
    return [...ys].sort((a, b) => Number(b) - Number(a)); // newest first
  }, [allFirs]);

  /* ── Yearwise pending count ── */
  const pendingByYear = useMemo(() => {
    const m = {};
    allFirs.forEach(r => { m[r.firYr] = (m[r.firYr] || 0) + 1; });
    return m;
  }, [allFirs]);

  /* ── Yearwise disposal count (from cnum, keyed by FIR year = fn split) ── */
  const disposalByYear = useMemo(() => {
    const m = {};
    disposalCases.forEach(r => {
      const yr = firYear(r.fn);
      if (yr) m[yr] = (m[yr] || 0) + 1;
    });
    return m;
  }, [disposalCases]);

  /* ── Build header row for both tables ── */
  /* Fixed columns differ slightly: disposal has current year + all prev; pending same */
  function buildHeader(type) {
    const prevMonthEndLabel = `FIR pending\nAs on\n${prevEnd}`;
    const thisMonthEndLabel = `NO. OF FIR's\nPENDING AS ON\n${thisEnd}`;
    const currYrLabel       = `${yyyy}\n(AS ON\n${thisEnd})`;

    const fixed = [
      "Name of the\nCourt",
      prevMonthEndLabel,
      "No. of FIR's\nADDED DURING\nTHIS MONTH",
      "No. OF FIR's\nCASES FINALIZED\nDURING THIS MONTH",
      thisMonthEndLabel,
      currYrLabel,
    ];

    // remaining years excluding current year, newest first
    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    return [...fixed, ...restYears];
  }

  /* ── Build data row ── */
  function buildDisposalRow() {
    const currYrDisposal = disposalByYear[String(yyyy)] || "-";
    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    const restVals  = restYears.map(y => disposalByYear[y] || "-");
    return [
      COURT_NAME,
      prevPending,
      institutionFirs.length,
      disposalCases.length,
      totalPending,
      currYrDisposal,
      ...restVals,
    ];
  }

  function buildPendingRow() {
    const currYrPending = pendingByYear[String(yyyy)] || "-";
    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    const restVals  = restYears.map(y => pendingByYear[y] || "-");
    return [
      COURT_NAME,
      prevPending,
      institutionFirs.length,
      disposalCases.length,
      totalPending,
      currYrPending,
      ...restVals,
    ];
  }

  const disposalAOA = useMemo(() => {
    if (!submitted) return [];
    return [buildHeader("disposal"), buildDisposalRow()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allYears, disposalByYear, institutionFirs, disposalCases, totalPending, prevPending, yyyy, thisEnd, prevEnd, COURT_NAME]);

  const pendingAOA = useMemo(() => {
    if (!submitted) return [];
    return [buildHeader("pending"), buildPendingRow()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allYears, pendingByYear, institutionFirs, disposalCases, totalPending, prevPending, yyyy, thisEnd, prevEnd, COURT_NAME]);

  /* ── Month label strings ── */
  const monthLabel     = `${ordinal(lastDay(yyyy, mm))}.${pad2(mm)}.${yyyy}`;
  const monthLabelFull = `${MON_NAMES[mm]} ${yyyy}`;
  const fileLabel      = `${pad2(mm)}_${yyyy}`;

  /* ── Institution list sorted ── */
  const institutionSorted = useMemo(() => {
    return [...institutionFirs].sort((a, b) => {
      const ka = Number(firYear(a.cr)) * 100000 + parseInt(a.cr, 10);
      const kb = Number(firYear(b.cr)) * 100000 + parseInt(b.cr, 10);
      return ka - kb;
    });
  }, [institutionFirs]);

  /* ── Disposal list sorted ── */
const disposalCases = useMemo(() => {
  if (!submitted) return [];
  return allCnum.filter(r => {
    const p = parseDateFlex(r.dreg);   // col H: Date of Reg (when case was numbered)
    return p && p.mm === mm && p.yyyy === yyyy;
  });
}, [allCnum, mm, yyyy, submitted]);

  /* ── Pending list (filterable by year) ── */
  const pendingFiltered = useMemo(() => {
    const base = filterYr ? allFirs.filter(r => r.firYr === filterYr) : allFirs;
    return [...base].sort((a, b) => {
      const ka = Number(a.firYr) * 100000 + parseInt(a.cr, 10);
      const kb = Number(b.firYr) * 100000 + parseInt(b.cr, 10);
      return ka - kb;
    });
  }, [allFirs, filterYr]);

  /* ── Export handlers ── */
  function handleExportWord() {
    exportWord(disposalAOA, pendingAOA, monthLabel, DISTRICT, COURT_NAME,
      `FIR_Statement_${fileLabel}.doc`);
  }

  function handleExportExcel() {
    exportExcel(`FIR_Statement_${fileLabel}.xlsx`, [
      { name: "Disposal Statement",  aoa: disposalAOA },
      { name: "Pending Statement",   aoa: pendingAOA  },
      {
        name: "FIR Institution",
        aoa: [
          ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
          ...institutionSorted.map((r, i) => [i + 1, r.cr, r.firYr || "", r.stLb, r.sec || "", r.dr || ""]),
        ],
      },
      {
        name: "FIR Disposal",
        aoa: [
          ["Sl", "FIR No.", "Year", "Station", "Case No.", "Parties", "Section", "Date Received"],
          ...disposalSorted.map((r, i) => [
            i + 1, r.fn || "", firYear(r.fn) || "", r.sta || "",
            r.cn || "", r.pt || "", r.sec || "", r.dr || "",
          ]),
        ],
      },
      {
        name: "Pending FIRs",
        aoa: [
          ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
          ...allFirs.map((r, i) => [i + 1, r.cr, r.firYr || "", r.stLb, r.sec || "", r.dr || ""]),
        ],
      },
    ]);
  }

  /* ── Render a statement table from AOA ── */
  function renderStmtTable(aoa, caption) {
    if (!aoa || aoa.length < 2) return null;
    const [hdr, ...rows] = aoa;
    return (
      <div className="stmt-section">
        <div className="stmt-cap">{caption}</div>
        <div className="stmt-scroll">
          <table className="stmt-tbl">
            <thead>
              <tr>
                {hdr.map((h, i) => (
                  <th key={i}>{String(h ?? "").split("\n").map((line, li) =>
                    <span key={li}>{line}{li < String(h).split("\n").length - 1 && <br />}</span>
                  )}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} style={{ textAlign: ci === 0 ? "left" : "center",
                      fontWeight: ci === 0 ? 600 : 400 }}>
                      {String(c ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── RENDER ── */
  return (
    <div className="stmt-root">
      {/* ── Form ── */}
      <div className="card">
        <div className="ctitle">📄 Monthly FIR Statement</div>
        <div className="frow" style={{ alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <div className="fg">
            <label className="lbl">Month</label>
            <select className="inp" value={selMonth}
              onChange={e => { setSelMonth(e.target.value); setSubmitted(false); setFilterYr(null); }}>
              {Array.from({ length: 12 }, (_, i) => {
                const v = pad2(i + 1);
                return <option key={v} value={v}>{MON_NAMES[i + 1]}</option>;
              })}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Year</label>
            <select className="inp" value={selYear}
              onChange={e => { setSelYear(e.target.value); setSubmitted(false); setFilterYr(null); }}>
              {buildYearOptions().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-g" style={{ marginBottom: 1 }}
            onClick={() => { setSubmitted(true); setFilterYr(null); }}>
            🔍 Generate Statement
          </button>
        </div>
      </div>

      {submitted && (
        <>
          {/* ── Court / District Header ── */}
          <div className="stmt-hdr-block">
            <div className="stmt-title-main">IN THE FILE OF THE JUDICIAL MAGISTRATE COURT NO.I, JAYANKONDAM</div>
            <div className="stmt-title-sub">NAME OF THE DISTRICT: {DISTRICT}</div>
            <div className="stmt-title-ason">STATEMENT AS ON {monthLabel} — {monthLabelFull}</div>
          </div>

          {/* ── Export buttons ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={handleExportWord}>⬇ Export Word (.doc)</button>
            <button className="btn btn-o" onClick={handleExportExcel}>⬇ Export Excel (.xlsx)</button>
          </div>

          {/* ── Summary stats ── */}
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <div className="stat">
              <div className="stat-lbl">Pending (Prev Month End)</div>
              <div className="stat-val">{prevPending}</div>
              <div className="stat-sub">As on {prevEnd}</div>
            </div>
            <div className="stat" style={{ cursor: "default" }}>
              <div className="stat-lbl">FIR Institution (Added)</div>
              <div className="stat-val" style={{ color: "var(--gold)" }}>{institutionFirs.length}</div>
              <div className="stat-sub">Received in {MON_SHORT[mm]} {yyyy}</div>
            </div>
            <div className="stat" style={{ cursor: "default" }}>
              <div className="stat-lbl">FIR Disposal (Finalized)</div>
              <div className="stat-val" style={{ color: "#4caf50" }}>{disposalCases.length}</div>
              <div className="stat-sub">Case Numbered in {MON_SHORT[mm]} {yyyy}</div>
            </div>
            <div className="stat" style={{ cursor: "default" }}>
              <div className="stat-lbl">Total Pending (This Month End)</div>
              <div className="stat-val">{totalPending}</div>
              <div className="stat-sub">As on {thisEnd}</div>
            </div>
          </div>

          {/* ── Disposal Statement Table ── */}
          {renderStmtTable(disposalAOA, "Disposal of FIR (Yearwise-Courtwise)")}

          {/* ── Pending Statement Table ── */}
          {renderStmtTable(pendingAOA, "Pending of FIR (Yearwise-Courtwise)")}

          {/* ── FIR Institution List ── */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="ctitle">
              ➕ FIR Institution — Received in {monthLabelFull}
              <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                {institutionSorted.length} FIRs
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button className="btn btn-o btn-sm" onClick={() =>
                  exportExcel(`FIR_Institution_${fileLabel}.xlsx`, [{
                    name: "Institution",
                    aoa: [
                      ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
                      ...institutionSorted.map((r, i) =>
                        [i + 1, r.cr, r.firYr || "", r.stLb, r.sec || "", r.dr || ""]),
                    ],
                  }])}>⬇ Excel</button>
              </div>
            </div>
            {institutionSorted.length === 0 ? (
              <div className="no-data">
                No FIRs with "Date Received" in {monthLabelFull} found in the FIR Pending Register.
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}>
                  Institution count comes from FIRs whose Date Received (Column D) matches {pad2(mm)}.{yyyy}
                </div>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr><th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th><th>Section U/s</th><th>Date Received</th></tr>
                  </thead>
                  <tbody>
                    {institutionSorted.map((r, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
                        <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{r.cr}</td>
                        <td><span className="yr-badge">{r.firYr || "?"}</span></td>
                        <td style={{ fontSize: 11 }}>{r.stLb}</td>
                        <td style={{ maxWidth: 200, wordBreak: "break-word", fontSize: 11 }}>{r.sec || "—"}</td>
                        <td className="mono">{r.dr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── FIR Disposal List ── */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="ctitle">
              ✅ FIR Disposal — Case Numbered in {monthLabelFull}
              <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                {disposalSorted.length} cases
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button className="btn btn-o btn-sm" onClick={() =>
                  exportExcel(`FIR_Disposal_${fileLabel}.xlsx`, [{
                    name: "Disposal",
                    aoa: [
                      ["Sl", "FIR No.", "Year", "Station", "Case No.", "Parties", "Section", "Date Received"],
                      ...disposalSorted.map((r, i) => [
                        i + 1, r.fn || "", firYear(r.fn) || "", r.sta || "",
                        r.cn || "", r.pt || "", r.sec || "", r.dr || "",
                      ]),
                    ],
                  }])}>⬇ Excel</button>
              </div>
            </div>
            {disposalSorted.length === 0 ? (
              <div className="no-data">
                No Case Numbered entries with FIR "Date Received" in {monthLabelFull}.
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}>
                  Disposal count = cases in Case Numbered register whose FIR Date Received matches {pad2(mm)}.{yyyy}
                </div>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr><th>Sl</th><th>FIR No.</th><th>Year</th><th>Station</th><th>Case No.</th><th>Parties</th><th>Section</th><th>Date Received</th></tr>
                  </thead>
                  <tbody>
                    {disposalSorted.map((r, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
                        <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{r.fn || "—"}</td>
                        <td><span className="yr-badge">{firYear(r.fn) || "?"}</span></td>
                        <td style={{ fontSize: 11 }}>{r.sta || "—"}</td>
                        <td className="mono" style={{ color: "var(--c-purple)", fontWeight: 600 }}>{r.cn || "—"}</td>
                        <td style={{ maxWidth: 160, wordBreak: "break-word", fontSize: 11 }}>{r.pt || "—"}</td>
                        <td style={{ fontSize: 11 }}>{r.sec || "—"}</td>
                        <td className="mono">{r.dr || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── All Pending FIRs (yearwise filterable) ── */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="ctitle">
              📂 All Pending FIRs as on {thisEnd}
              <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                {pendingFiltered.length}{filterYr ? ` (${filterYr})` : " total"}
              </span>
              {filterYr && (
                <button className="btn btn-o btn-sm" style={{ marginLeft: 8 }}
                  onClick={() => setFilterYr(null)}>✕ Clear</button>
              )}
            </div>
            {/* Year filter chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {allYears.map(y => {
                const cnt = pendingByYear[y] || 0;
                if (!cnt) return null;
                const active = filterYr === y;
                return (
                  <button key={y} onClick={() => setFilterYr(active ? null : y)} style={{
                    padding: "3px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer",
                    fontWeight: 700, border: "1px solid var(--brd)",
                    background: active ? "var(--gold)" : "var(--c3)",
                    color: active ? "#000" : "var(--txt2)",
                  }}>{y} ({cnt})</button>
                );
              })}
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th><th>Section U/s</th><th>Date Received</th></tr>
                </thead>
                <tbody>
                  {pendingFiltered.length === 0 ? (
                    <tr><td colSpan={6} className="no-data">No FIRs found.</td></tr>
                  ) : pendingFiltered.slice(0, 500).map((r, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
                      <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{r.cr}</td>
                      <td><span className="yr-badge">{r.firYr || "?"}</span></td>
                      <td style={{ fontSize: 11 }}>{r.stLb}</td>
                      <td style={{ maxWidth: 200, wordBreak: "break-word", fontSize: 11 }}>{r.sec || "—"}</td>
                      <td className="mono">{r.dr || "—"}</td>
                    </tr>
                  ))}
                  {pendingFiltered.length > 500 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 10, color: "var(--txt3)", fontSize: 11 }}>
                      Showing 500 of {pendingFiltered.length} — use year filter to narrow.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* scoped styles */}
      <style>{`
        .stmt-root { padding-bottom: 32px; }

        .stmt-hdr-block {
          background: var(--c2);
          border: 1px solid var(--brd);
          border-radius: 6px;
          padding: 14px 18px;
          margin-bottom: 14px;
          font-family: 'Times New Roman', Times, serif;
        }
        .stmt-title-main {
          font-size: 13px; font-weight: bold; text-align: center;
          letter-spacing: .3px; margin-bottom: 4px;
        }
        .stmt-title-sub {
          font-size: 12px; font-weight: 600; margin-bottom: 2px;
        }
        .stmt-title-ason {
          font-size: 11px; color: var(--txt2);
        }

        .stmt-section { margin-bottom: 20px; }
        .stmt-cap {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13px; font-weight: bold; text-decoration: underline;
          margin-bottom: 6px; color: var(--txt1);
        }
        .stmt-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .stmt-tbl {
          border-collapse: collapse;
          min-width: 500px; width: 100%;
          font-family: 'Times New Roman', Times, serif;
        }
        .stmt-tbl th, .stmt-tbl td {
          border: 1px solid var(--brd);
          padding: 5px 7px; text-align: center; vertical-align: middle;
        }
        .stmt-tbl thead th {
          background: var(--c3); font-size: 9.5px; font-weight: bold;
          white-space: pre-wrap; line-height: 1.4;
        }
        .stmt-tbl tbody td { font-size: 11px; }
        .stmt-tbl tbody td:first-child { text-align: left; min-width: 150px; }
      `}</style>
    </div>
  );
}
