// ════════════════════════════════════════════════════════════════
//  MaintenanceInner.jsx
//  Renders the "Maintenance" inner tab content.
//  concatSortAsc state and concatList memo live here (maintenance-only).
//  All other state & async handlers come from AbstractTab.jsx as props.
// ════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";

function robustFirSortKey(cr) {
  if (!cr) return 0;
  const s = cr.toString().trim();
  const slash = s.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (slash) return parseInt(slash[2], 10) * 100000 + parseInt(slash[1], 10);
  const concat = s.match(/^(\d+?)(\d{4})$/);
  if (concat) return parseInt(concat[2], 10) * 100000 + parseInt(concat[1], 10);
  return 0;
}

export default function MaintenanceInner({
  issues, scanning, fixing,
  maintMsg, renumMsg,
  doScan, fixConcatenated, fixSerialNumbers, fixFIROrder, fixMovedDuplicates,
  maintProgress, maintSnack,
}) {
  const [concatSortAsc, setConcatSortAsc] = useState(true);

  const concatList = useMemo(() => {
    if (!issues?.concat) return [];
    const arr = [...issues.concat];
    arr.sort((a, b) => concatSortAsc
      ? robustFirSortKey(a.fixed) - robustFirSortKey(b.fixed)
      : robustFirSortKey(b.fixed) - robustFirSortKey(a.fixed));
    return arr;
  }, [issues?.concat, concatSortAsc]);

  return (
    <div className="abt-maint-root">

      {(scanning || fixing) && (
        <div className="card" style={{ marginBottom: 16, border: "1px solid var(--accent)", padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>
            <span>{scanning ? "🔍 Scanning sheets..." : "⚙️ Fixing data issues..."}</span>
            <span style={{ color: "var(--accent)", fontFamily: "monospace" }}>{maintProgress}%</span>
          </div>
          <div className="ex-prog-track" style={{ height: 8, background: "var(--bg3)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
            <div className="ex-prog-fill" style={{ width: `${maintProgress}%`, height: "100%", background: "var(--accent)", transition: "width 0.1s linear" }} />
          </div>
        </div>
      )}

      <div className="abt-scan-card">
        <div className="abt-scan-icon">🔍</div>
        <div className="abt-scan-body">
          <div className="abt-scan-title">Data Scanner</div>
          <div className="abt-scan-sub">Checks all sheets for concatenated CR numbers, bad dates, and out-of-order FIR / serial numbers.</div>
        </div>
        <button className="btn btn-g" onClick={doScan} disabled={scanning || fixing} style={{ flexShrink: 0 }}>
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
            <div className={`abt-issue-chip ${issues.moved?.length > 0 ? "abt-issue-red" : "abt-issue-green"}`}>
              <div className="abt-issue-num">{issues.moved?.length ?? 0}</div>
              <div className="abt-issue-lbl">Already Registered</div>
            </div>
          </div>

          {issues.concat.length === 0 && issues.date.length === 0 && issues.sl.length === 0 && !issues.fir?.length && !issues.moved?.length && (
            <div className="msg-ok" style={{ marginBottom: 10 }}>✓ All sheets are clean — no data issues found.</div>
          )}

          {/* Concatenated CR Numbers */}
          {issues.concat.length > 0 && (
            <div className="card">
              <div className="ctitle">
                ⚠ Concatenated CR Numbers
                <button className="btn btn-o btn-sm" style={{ marginLeft: 8 }} onClick={() => setConcatSortAsc(prev => !prev)}>
                  {concatSortAsc ? "Sort Desc" : "Sort Asc"}
                </button>
                <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }} onClick={fixConcatenated} disabled={fixing}>
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

          {/* Already Registered / Moved to Case Numbered */}
          {issues.moved?.length > 0 && (
            <div className="card">
              <div className="ctitle">
                📋 Already Registered (Present in Case Numbered)
                <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }} onClick={fixMovedDuplicates} disabled={fixing}>
                  {fixing ? "⏳ Removing…" : `✦ Remove All (${issues.moved.length})`}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                These pending FIRs are already registered with case numbers in the Case Numbered List. Click <b>Remove All</b> to delete them from FIR pending sheets.
              </div>
              <div className="tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Station</th><th>Row</th><th>CR No.</th><th>Section</th><th>Date</th></tr></thead>
                  <tbody>
                    {issues.moved.map((iss, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11 }}>{iss.lb}</td>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                        <td className="mono" style={{ color: "var(--gold)" }}>{iss.cr}</td>
                        <td>{iss.sec}</td>
                        <td className="mono">{iss.dr || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                  <thead><tr><th>Station</th><th>Row</th><th>CR No.</th><th>Date (as found)</th><th>Issue</th></tr></thead>
                  <tbody>
                    {issues.date.map((iss, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11 }}>{iss.lb}</td>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                        <td className="mono" style={{ color: "var(--gold)" }}>{iss.cr}</td>
                        <td><span className={`abt-date-badge ${iss.issue === "missing" ? "abt-date-missing" : "abt-date-bad"}`}>{iss.dr}</span></td>
                        <td style={{ fontSize: 10, color: "var(--txt3)" }}>{iss.issue === "missing" ? "No date entered" : "Wrong format"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIR Numbers Out of Order */}
          {issues.fir?.length > 0 && (
            <div className="card">
              <div className="ctitle">
                ⚠ FIR Numbers Out of Order
                <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }} onClick={fixFIROrder} disabled={fixing}>
                  {fixing ? "⏳ Fixing…" : `✦ Fix All (${issues.fir.length})`}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                FIRs are not in ascending order by year → number. Click <b>Fix All</b> to sort all sheets.
              </div>
              <div className="tbl-wrap">
                <table className="abs-tbl">
                  <thead><tr><th>Station</th><th>Row</th><th>Previous CR</th><th>↓ This CR (wrong)</th><th>Expected order</th></tr></thead>
                  <tbody>
                    {issues.fir.map((iss, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11 }}>{iss.lb}</td>
                        <td className="mono" style={{ color: "var(--txt3)" }}>{iss.row}</td>
                        <td className="mono" style={{ color: "var(--txt2)" }}>{iss.prevCR}</td>
                        <td><span className="abt-cr-bad">{iss.cr}</span></td>
                        <td style={{ fontSize: 10, color: "var(--txt3)" }}>{iss.cr} should come before {iss.prevCR}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Serial Numbers */}
          <div className="card">
            <div className="ctitle">
              🔢 Serial Numbers
              {issues.sl.length > 0 && (
                <button className="btn btn-g btn-sm" style={{ marginLeft: "auto" }} onClick={fixSerialNumbers} disabled={fixing}>
                  {fixing ? "⏳ Fixing…" : "✦ Fix All"}
                </button>
              )}
            </div>
            {issues.sl.length === 0
              ? <div className="msg-ok">✓ All serial numbers are in correct ascending order.</div>
              : <>
                <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8 }}>
                  {issues.sl.length} rows have incorrect serial numbers.{" "}
                  <span style={{ color: "var(--txt3)" }}>Note: Fix FIR Order first, then fix serials.</span>
                </div>
                <div className="tbl-wrap">
                  <table className="abs-tbl">
                    <thead><tr><th>Station</th><th>Row</th><th>CR No.</th><th>Current Sl</th><th>Expected</th></tr></thead>
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
                        <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--txt3)", fontSize: 11, padding: 10 }}>…and {issues.sl.length - 60} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            }
            {renumMsg && (
              <div className={renumMsg.type === "ok" ? "msg-ok" : "msg-info"} style={{ marginTop: 8 }}>
                {renumMsg.type === "loading" && <span className="spin" style={{ display: "inline-block", marginRight: 6 }} />}
                {renumMsg.text}
              </div>
            )}
          </div>
        </>
      )}

      {/* Global maintenance message (fix concat / fix order / edit row save) */}
      {maintMsg && (
        <div className={`${maintMsg.type === "ok" ? "msg-ok" : maintMsg.type === "err" ? "msg-err" : "msg-info"}`} style={{ marginTop: 8 }}>
          {maintMsg.type === "loading" && <span className="spin" style={{ display: "inline-block", marginRight: 6 }} />}
          {maintMsg.text}
        </div>
      )}

      {maintSnack && (
        <div className={`ex-snack ex-snack--${maintSnack.type}`} role="status" aria-live="polite" style={{ bottom: 84 }}>
          <span className="ex-snack-dot" aria-hidden="true" />
          {maintSnack.msg}
        </div>
      )}
    </div>
  );
}
