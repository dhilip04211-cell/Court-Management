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

/* Parse DD.MM.YYYY */
function parseDMY(s) {
  if (!s || !DATE_RE.test(s.trim())) return null;
  const [dd, mm, yyyy] = s.trim().split(".").map(Number);
  return { dd, mm, yyyy };
}

/* Parse DD.MM.YYYY or DD-MM-YYYY */
function parseDateFlex(s) {
  if (!s) return null;
  const norm = s.trim().replace(/-/g, ".");
  return parseDMY(norm);
}

/* Convert parsed date to numeric YYYYMMDD for comparison */
function dateNum(p) {
  if (!p) return 0;
  return p.yyyy * 10000 + p.mm * 100 + p.dd;
}

/* Extract FIR year from a CR string like "123/2024" */
function firYear(cr) {
  if (!cr) return "";
  const m = cr.toString().match(/(\d{4})/g);
  if (!m) return "";
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
   WORD EXPORT — Times New Roman, bordered table, A4 landscape
───────────────────────────────────────────────────────────────── */
function buildWordDoc(disposalAOA, pendingAOA, monthLabel, districtName, courtName) {
  function tblHTML(aoa, caption) {
    if (!aoa || aoa.length < 2) return "";
    const [hdr, ...body] = aoa;
    const ths = hdr.map(h => `<th>${String(h ?? "").replace(/\n/g, "<br>")}</th>`).join("");
    const trs = body
      .map(r => `<tr>${r.map((c, ci) =>
        `<td style="${ci === 0 ? "text-align:left;font-weight:600" : ""}">${String(c ?? "")}</td>`
      ).join("")}</tr>`)
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
  const [filterYr, setFilterYr] = useState(null);

  const mm   = parseInt(selMonth, 10);
  const yyyy = parseInt(selYear,  10);

  /* ── Date boundary numerics ──
     prevEnd  = last date of previous month  e.g. 30.04.2026
     thisEnd  = last date of selected month  e.g. 31.05.2026
  */
  const prevMM    = mm === 1 ? 12 : mm - 1;
  const prevYYYY  = mm === 1 ? yyyy - 1 : yyyy;
  const prevEndDD = lastDay(prevYYYY, prevMM);
  const thisEndDD = lastDay(yyyy, mm);

  const prevEnd    = fmtDMY(prevEndDD, prevMM, prevYYYY);
  const thisEnd    = fmtDMY(thisEndDD, mm, yyyy);

  /* numeric YYYYMMDD boundaries for fast comparison */
  const prevEndNum = prevYYYY * 10000 + prevMM * 100 + prevEndDD;  // ≤ this → prev pending
  const thisEndNum = yyyy     * 10000 + mm     * 100 + thisEndDD;  // ≤ this → current pending

  /* ── All FIRs flat (from FIR Pending register) ── */
  const allFirs = useMemo(() => {
    const out = [];
    for (const s of SMAP)
      for (const r of (db.fir[s.sh] || []))
        if (isValidFIRCell(r.cr))
          out.push({ ...r, stSh: s.sh, stLb: s.lb, firYr: firYear(r.cr) });
    return out;
  }, [db.fir, SMAP]);

  /* ── All case-numbered records ── */
  const allCnum = useMemo(() => db.cnum || [], [db.cnum]);

  /* ─────────────────────────────────────────────────────────────
     PENDING (PREV MONTH END)
     = FIRs in pending register whose dr ≤ last day of prev month
     Source: FIR Pending list only
  ───────────────────────────────────────────────────────────
*/
const prevPendingFirs = useMemo(() => {
  if (!submitted) return [];

  // All FIRs received on/before prev month end — from BOTH lists
  const fromPending = allFirs.filter(r => {
    const p = parseDateFlex(r.dr);
    return p && dateNum(p) <= prevEndNum;
  });

  const fromCnum = allCnum.filter(r => {
    const p = parseDateFlex(r.dr);
    return p && dateNum(p) <= prevEndNum;
  });

  // Union by FIR number (cr == fn)
  const seen = new Set(fromPending.map(r => r.cr));
  const extra = fromCnum.filter(r => r.fn && !seen.has(r.fn));
  const allReceived = [...fromPending, ...extra];

  // SUBTRACT: FIRs that are already disposed (exist in cnum)
  // where their received date is ≤ prev month end
  const disposedFnSet = new Set(
    allCnum
      .filter(r => {
        const p = parseDateFlex(r.dr);
        return p && dateNum(p) <= prevEndNum;
      })
      .map(r => r.fn)
      .filter(Boolean)
  );

  // Pending = those in allReceived that are NOT yet disposed
  return allReceived.filter(r => {
    const firNo = r.cr || r.fn;
    return !disposedFnSet.has(firNo);
  });

}, [allFirs, allCnum, prevEndNum, submitted]); ─────────────────────────────────────────────────────────────
     INSTITUTION (ADDED THIS MONTH)
     = FIRs in pending register whose dr is within selected MM/YYYY
     Source: FIR Pending list only
  ───────────────────────────────────────────────────────────── */
const institutionFirs = useMemo(() => {
  if (!submitted) return [];

  // FIRs still in FIR Pending register received in selected month
  const fromPending = allFirs.filter(r => {
    const p = parseDateFlex(r.dr);
    return p && p.mm === mm && p.yyyy === yyyy;
  });

  // FIRs already case-numbered received in selected month
  const fromCnum = allCnum.filter(r => {
    const p = parseDateFlex(r.dr);
    return p && p.mm === mm && p.yyyy === yyyy;
  });

  // Deduplicate — cnum fn matches pending cr
  const seen = new Set(fromPending.map(r => r.cr));
  const extra = fromCnum.filter(r => r.fn && !seen.has(r.fn));

  return [...fromPending, ...extra];
}, [allFirs, allCnum, mm, yyyy, submitted]);

  /* ─────────────────────────────────────────────────────────────
     DISPOSAL (FINALIZED THIS MONTH)
     = Case Numbered entries whose dreg (Date of Registration)
       is within selected MM/YYYY
     Source: Case Numbered list only
  ───────────────────────────────────────────────────────────── */
  const disposalCases = useMemo(() => {
    if (!submitted) return [];
    return allCnum.filter(r => {
      const p = parseDateFlex(r.dreg);
      return p && p.mm === mm && p.yyyy === yyyy;
    });
  }, [allCnum, mm, yyyy, submitted]);

  /* ─────────────────────────────────────────────────────────────
     PENDING (THIS MONTH END)
     = ALL FIRs currently present in FIR Pending register
     Source: FIR Pending list only (live count)
  ───────────────────────────────────────────────────────────── */
  const totalPending = allFirs.length;

  /* ── Derived counts ── */
  const prevPendingCount = prevPendingFirs.length;

  /* ── All unique FIR years (for yearwise columns) ── */
  const allYears = useMemo(() => {
    const ys = new Set();
    allFirs.forEach(r => { if (r.firYr) ys.add(r.firYr); });
    return [...ys].sort((a, b) => Number(b) - Number(a));
  }, [allFirs]);

  /* ── Yearwise PENDING count (from FIR pending list — live) ── */
  const pendingByYear = useMemo(() => {
    const m = {};
    allFirs.forEach(r => { m[r.firYr] = (m[r.firYr] || 0) + 1; });
    return m;
  }, [allFirs]);

  /* ── Yearwise DISPOSAL count (from cnum, keyed by FIR year from fn) ── */
  const disposalByYear = useMemo(() => {
    const m = {};
    disposalCases.forEach(r => {
      const yr = firYear(r.fn);
      if (yr) m[yr] = (m[yr] || 0) + 1;
    });
    return m;
  }, [disposalCases]);

  /* ── Build header row ── */
  function buildHeader() {
    const prevMonthEndLabel = `FIR Pending\nAs on\n${prevEnd}`;
    const thisMonthEndLabel = `No. of FIR's\nPending as on\n${thisEnd}`;
    const currYrLabel       = `${yyyy}\n(As on\n${thisEnd})`;

    const fixed = [
      "Name of the\nCourt",
      prevMonthEndLabel,
      "No. of FIR's\nAdded During\nThis Month",
      "No. of FIR's\nCases Finalized\nDuring This Month",
      thisMonthEndLabel,
      currYrLabel,
    ];

    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    return [...fixed, ...restYears];
  }

  /* ── Build disposal data row ── */
  function buildDisposalRow() {
    const currYrDisposal = disposalByYear[String(yyyy)] || "-";
    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    const restVals  = restYears.map(y => disposalByYear[y] || "-");
    return [
      COURT_NAME,
      prevPendingCount,
      institutionFirs.length,
      disposalCases.length,
      totalPending,
      currYrDisposal,
      ...restVals,
    ];
  }

  /* ── Build pending data row ── */
  function buildPendingRow() {
    const currYrPending = pendingByYear[String(yyyy)] || "-";
    const restYears = allYears.filter(y => String(y) !== String(yyyy));
    const restVals  = restYears.map(y => pendingByYear[y] || "-");
    return [
      COURT_NAME,
      prevPendingCount,
      institutionFirs.length,
      disposalCases.length,
      totalPending,
      currYrPending,
      ...restVals,
    ];
  }

  const disposalAOA = useMemo(() => {
    if (!submitted) return [];
    return [buildHeader(), buildDisposalRow()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allYears, disposalByYear, institutionFirs, disposalCases,
      totalPending, prevPendingCount, yyyy, thisEnd, prevEnd, COURT_NAME]);

  const pendingAOA = useMemo(() => {
    if (!submitted) return [];
    return [buildHeader(), buildPendingRow()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allYears, pendingByYear, institutionFirs, disposalCases,
      totalPending, prevPendingCount, yyyy, thisEnd, prevEnd, COURT_NAME]);

  /* ── Month label strings ── */
  const monthLabel     = `${ordinal(thisEndDD)}.${pad2(mm)}.${yyyy}`;
  const monthLabelFull = `${MON_NAMES[mm]} ${yyyy}`;
  const fileLabel      = `${pad2(mm)}_${yyyy}`;

  /* ── Institution list sorted ── */
 const institutionSorted = useMemo(() => {
  return [...institutionFirs].sort((a, b) => {
    const na = a.cr || a.fn || "";
    const nb = b.cr || b.fn || "";
    const ka = Number(firYear(na)) * 100000 + parseInt(na, 10);
    const kb = Number(firYear(nb)) * 100000 + parseInt(nb, 10);
    return ka - kb;
  });
}, [institutionFirs]);

  /* ── Disposal list sorted ── */
  const disposalSorted = useMemo(() => {
    return [...disposalCases].sort((a, b) => {
      const ka = Number(firYear(a.fn)) * 100000 + parseInt(a.fn, 10);
      const kb = Number(firYear(b.fn)) * 100000 + parseInt(b.fn, 10);
      return ka - kb;
    });
  }, [disposalCases]);

  /* ── Pending list (filterable by year) — live from FIR pending register ── */
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
      { name: "Disposal Statement", aoa: disposalAOA },
      { name: "Pending Statement",  aoa: pendingAOA  },
      {
        name: "FIR Institution",
        aoa: [
          ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
          ...institutionSorted.map((r, i) =>
            [i + 1, r.cr, r.firYr || "", r.stLb, r.sec || "", r.dr || ""]),
        ],
      },
      {
        name: "FIR Disposal",
        aoa: [
          ["Sl", "FIR No.", "Year", "Station", "Case No.", "Parties", "Section", "Date Received", "Date of Reg"],
          ...disposalSorted.map((r, i) => [
            i + 1, r.fn || "", firYear(r.fn) || "", r.sta || "",
            r.cn || "", r.pt || "", r.sec || "", r.dr || "", r.dreg || "",
          ]),
        ],
      },
      {
        name: "Pending FIRs",
        aoa: [
          ["Sl", "CR No.", "Year", "Station", "Section U/s", "Date Received"],
          ...allFirs.map((r, i) =>
            [i + 1, r.cr, r.firYr || "", r.stLb, r.sec || "", r.dr || ""]),
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
                  <th key={i}>
                    {String(h ?? "").split("\n").map((line, li, arr) =>
                      <span key={li}>{line}{li < arr.length - 1 && <br />}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} style={{
                      textAlign: ci === 0 ? "left" : "center",
                      fontWeight: ci === 0 ? 600 : 400,
                    }}>
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
            <div className="stmt-title-main">
              IN THE FILE OF THE JUDICIAL MAGISTRATE COURT NO.I, JAYANKONDAM
            </div>
            <div className="stmt-title-sub">NAME OF THE DISTRICT: {DISTRICT}</div>
            <div className="stmt-title-ason">
              STATEMENT AS ON {monthLabel} — {monthLabelFull}
            </div>
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
              <div className="stat-val">{prevPendingCount}</div>
              <div className="stat-sub">
                FIRs received on or before {prevEnd}
              </div>
            </div>
            <div className="stat">
              <div className="stat-lbl">FIR Institution (Added)</div>
              <div className="stat-val" style={{ color: "var(--gold)" }}>
                {institutionFirs.length}
              </div>
              <div className="stat-sub">Received in {MON_SHORT[mm]} {yyyy}</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">FIR Disposal (Finalized)</div>
              <div className="stat-val" style={{ color: "#4caf50" }}>
                {disposalCases.length}
              </div>
              <div className="stat-sub">Case Numbered in {MON_SHORT[mm]} {yyyy}</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Total Pending (This Month End)</div>
              <div className="stat-val">{totalPending}</div>
              <div className="stat-sub">
                All FIRs in Pending Register (live)
              </div>
            </div>
          </div>

          {/* ── Logic note ── */}
          <div style={{
            background: "var(--c2)", border: "1px solid var(--brd)",
            borderRadius: 6, padding: "8px 14px", marginBottom: 14,
            fontSize: 11, color: "var(--txt2)", lineHeight: 1.7,
          }}>
            <strong style={{ color: "var(--txt1)" }}>📌 Calculation logic:</strong>
            &nbsp; Prev Pending = FIRs (dr ≤ {prevEnd}) &nbsp;|&nbsp;
            Institution = FIRs received in {MON_SHORT[mm]} {yyyy} &nbsp;|&nbsp;
            Disposal = Case Numbered (dreg) in {MON_SHORT[mm]} {yyyy} &nbsp;|&nbsp;
            This Month Pending = live count from FIR Pending Register
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
              <div style={{ marginLeft: "auto" }}>
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
                No FIRs with Date Received in {monthLabelFull} found in the FIR Pending Register.
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sl</th><th>CR No.</th><th>Year</th>
                      <th>Station</th><th>Section U/s</th><th>Date Received</th>
                    </tr>
                  </thead>
                  <tbody>
                {institutionSorted.map((r, i) => {
  const firNo = r.cr || r.fn || "—";
  const yr    = r.firYr || firYear(r.fn) || "?";
  const sta   = r.stLb || r.sta || "—";
  return (
    <tr key={i}>
      <td className="mono" style={{ color: "var(--txt3)" }}>{i + 1}</td>
      <td className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{firNo}</td>
      <td><span className="yr-badge">{yr}</span></td>
      <td style={{ fontSize: 11 }}>{sta}</td>
      <td style={{ maxWidth: 200, wordBreak: "break-word", fontSize: 11 }}>{r.sec || "—"}</td>
      <td className="mono">{r.dr || "—"}</td>
    </tr>
  );
})}
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
              <div style={{ marginLeft: "auto" }}>
                <button className="btn btn-o btn-sm" onClick={() =>
                  exportExcel(`FIR_Disposal_${fileLabel}.xlsx`, [{
                    name: "Disposal",
                    aoa: [
                      ["Sl", "FIR No.", "Year", "Station", "Case No.", "Parties", "Section", "Date Received", "Date of Reg"],
                      ...disposalSorted.map((r, i) => [
                        i + 1, r.fn || "", firYear(r.fn) || "", r.sta || "",
                        r.cn || "", r.pt || "", r.sec || "", r.dr || "", r.dreg || "",
                      ]),
                    ],
                  }])}>⬇ Excel</button>
              </div>
            </div>
            {disposalSorted.length === 0 ? (
              <div className="no-data">
                No Case Numbered entries with Date of Registration in {monthLabelFull}.
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}>
                  Disposal = Case Numbered register entries where Date of Reg (col H) is in {pad2(mm)}/{yyyy}
                </div>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sl</th><th>FIR No.</th><th>Year</th><th>Station</th>
                      <th>Case No.</th><th>Parties</th><th>Section</th>
                      <th>Date Received</th><th>Date of Reg</th>
                    </tr>
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
                        <td className="mono" style={{ color: "#4caf50" }}>{r.dreg || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── All Pending FIRs — live from FIR Pending Register ── */}
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
                  <tr>
                    <th>Sl</th><th>CR No.</th><th>Year</th>
                    <th>Station</th><th>Section U/s</th><th>Date Received</th>
                  </tr>
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
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 10, color: "var(--txt3)", fontSize: 11 }}>
                        Showing 500 of {pendingFiltered.length} — use year filter to narrow.
                      </td>
                    </tr>
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
        .stmt-title-sub  { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
        .stmt-title-ason { font-size: 11px; color: var(--txt2); }

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
