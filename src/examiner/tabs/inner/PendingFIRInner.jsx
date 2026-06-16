// ════════════════════════════════════════════════════════════════
//  PendingFIRInner.jsx
//  Renders the "Pending FIR" inner tab content + Edit modal.
//  All state & derived data come in as props from AbstractTab.jsx.
// ════════════════════════════════════════════════════════════════

import { updateFIRRow } from "../../utils/sheets.js";

const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;

export default function PendingFIRInner({
  db, setDb, tok, SMAP,
  pendSt, setPendSt,
  pendSearch, setPendSearch,
  pendFilterStatus, setPendFilterStatus,
  pendRowsSorted, pendMissingCount, pendFormatCount,
  editingRow, setEditingRow,
  setMaintMsg,
}) {
  return (
    <div className="abt-pend-root">
      <div className="abt-st-bar">
        {SMAP.map(s => {
          const cnt = (db.fir[s.sh] || []).length;
          const badDates = (db.fir[s.sh] || []).filter(r => (r.dr && !DATE_RE.test(r.dr)) || !r.dr).length;
          return (
            <button key={s.sh}
              className={`abt-st-chip${pendSt === s.sh ? " abt-st-active" : ""}`}
              onClick={() => { setPendSt(s.sh); setPendSearch(""); setPendFilterStatus("ALL"); }}>
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
              style={{ cursor: "pointer", background: pendFilterStatus === "FORMAT" ? "rgba(255, 85, 85, .12)" : undefined, borderColor: pendFilterStatus === "FORMAT" ? "rgba(255,85,85,.45)" : undefined }}>
              <span className="abt-date-badge abt-date-bad">format</span>
              {` Wrong format (${pendFormatCount})`}
            </button>
            <button
              className={`abt-leg-item${pendFilterStatus === "MISSING" ? " active" : ""}`}
              onClick={() => setPendFilterStatus(pendFilterStatus === "MISSING" ? "ALL" : "MISSING")}
              style={{ cursor: "pointer", background: pendFilterStatus === "MISSING" ? "rgba(255, 166, 87, .12)" : undefined, borderColor: pendFilterStatus === "MISSING" ? "rgba(255, 166, 87, .45)" : undefined }}>
              <span className="abt-date-badge abt-date-missing">missing</span>
              {` No date (${pendMissingCount})`}
            </button>
            {pendFilterStatus !== "ALL" && (
              <button className="btn btn-o btn-sm" onClick={() => setPendFilterStatus("ALL")}>Clear filter</button>
            )}
          </div>

          <div className="search-wrap" style={{ marginBottom: 8 }}>
            <input className="inp" type="text" value={pendSearch} onChange={e => setPendSearch(e.target.value)} placeholder="Search CR No., section, date…" />
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
                          <button className="btn btn-o btn-sm"
                            onClick={() => setEditingRow({ ri: r.ri, cr: r.cr || "", sec: r.sec || "", dr: r.dr || "" })}
                            disabled={!r.ri}>Edit</button>
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
              {editingRow.cr && <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--gold)" }}>{editingRow.cr}</span>}
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Section U/s</label>
                <input className="inp" value={editingRow.sec} onChange={e => setEditingRow(prev => ({ ...prev, sec: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Date Received (DD.MM.YYYY)</label>
                <input className="inp mono" value={editingRow.dr} onChange={e => setEditingRow(prev => ({ ...prev, dr: e.target.value }))} placeholder="e.g. 15.06.2025" />
                {editingRow.dr && !DATE_RE.test(editingRow.dr) && (
                  <div style={{ fontSize: 11, color: "var(--c-red)", marginTop: 4 }}>⚠ Format must be DD.MM.YYYY (e.g. 15.06.2025)</div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-o" onClick={() => setEditingRow(null)}>Cancel</button>
              <button type="button" className="btn btn-g"
                disabled={!!(editingRow.dr && !DATE_RE.test(editingRow.dr))}
                onClick={async () => {
                  if (!editingRow.ri) {
                    setMaintMsg({ type: "err", text: "Cannot update: missing sheet row index." });
                    setEditingRow(null);
                    return;
                  }
                  const ok = await updateFIRRow(tok, pendSt, editingRow.ri, editingRow.sec, editingRow.dr);
                  if (ok) {
                    setDb(prev => ({
                      ...prev,
                      fir: {
                        ...prev.fir,
                        [pendSt]: (prev.fir[pendSt] || []).map(r =>
                          r.ri === editingRow.ri ? { ...r, sec: editingRow.sec, dr: editingRow.dr } : r
                        )
                      }
                    }));
                    setEditingRow(null);
                    setMaintMsg({ type: "ok", text: "✓ Row updated successfully." });
                    setTimeout(() => setMaintMsg(null), 2500);
                  } else {
                    setMaintMsg({ type: "err", text: "Failed to update sheet. Please try again." });
                  }
                }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
