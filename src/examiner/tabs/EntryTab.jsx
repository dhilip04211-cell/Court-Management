import { useState, useEffect } from "react";
import { SID } from "../constants/config.js";
import { firMatch, firSortKey } from "../utils/helpers.js";
import { sheetsDeleteRow, insertFIRSorted, updateFIRRow } from "../utils/sheets.js";
import SectionBuilder from "../components/SectionBuilder.jsx";

// Auto-insert dots: "01062025" → "01.06.2025"
function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

// "01.06.2025" → "2025-06-01" for <input type="date">
function dtToIso(dt) {
  const p = dt.split(".");
  if (p.length === 3 && p[2].length === 4)
    return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
  return "";
}

// "2025-06-01" → "01.06.2025"
function isoToDt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d.padStart(2, "0")}.${m}.${y}`;
}

export default function EntryTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const curYr = String(new Date().getFullYear());
  const [fn, setFn] = useState(() => { try { return localStorage.getItem("fir_draft_fn") || ""; } catch { return ""; } });
  const [yr, setYr] = useState(() => { try { return localStorage.getItem("fir_draft_yr") || curYr; } catch { return curYr; } });
  const [st, setSt] = useState(() => { try { return localStorage.getItem("fir_draft_st") || ""; } catch { return ""; } });
  const [uns, setUns] = useState(() => { try { return localStorage.getItem("fir_draft_uns") || ""; } catch { return ""; } });
  const [dt, setDt] = useState(() => { try { return localStorage.getItem("fir_draft_dt") || ""; } catch { return ""; } });
  const [msg, setMsg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [existingRow, setExistingRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("fir_draft_fn", fn);
      localStorage.setItem("fir_draft_yr", yr);
      localStorage.setItem("fir_draft_st", st);
      localStorage.setItem("fir_draft_uns", uns);
      localStorage.setItem("fir_draft_dt", dt);
    } catch { }
  }, [fn, yr, st, uns, dt]);

  useEffect(() => {
    if (!fn || !yr || !st) { setEditMode(false); setExistingRow(null); return; }
    const sNum = String(parseInt(fn, 10) || fn);
    const rows = (db.fir[st] || []).filter(r => firMatch(r.cr, sNum, yr));
    if (rows.length) { setExistingRow(rows[0]); setEditMode(true); } else { setExistingRow(null); setEditMode(false); }
  }, [fn, yr, st]);

  function loadExisting() {
    if (!existingRow) return;
    setUns(existingRow.sec || "");
    setDt(existingRow.dr || "");
    setMsg({ type: "info", text: `Loaded FIR ${existingRow.cr} for editing.` });
  }

  function clearDraft() {
    setFn(""); setUns(""); setDt(""); setMsg(null); setEditMode(false); setExistingRow(null);
    setYr(curYr); setSt("");
    try {
      localStorage.removeItem("fir_draft_fn"); localStorage.removeItem("fir_draft_yr");
      localStorage.removeItem("fir_draft_st"); localStorage.removeItem("fir_draft_uns");
      localStorage.removeItem("fir_draft_dt");
    } catch { }
  }

  // ── Handle date text input with auto-dots ──────────────────────────────────
  function handleDateText(e) {
    const raw = e.target.value;
    // If user is deleting (backspace), allow free editing — strip only dots
    const incoming = raw.replace(/\./g, "");
    const prev = dt.replace(/\./g, "");
    const isDeleting = incoming.length < prev.length;
    if (isDeleting) {
      // Rebuild from raw digits of incoming
      setDt(autoFormatDate(incoming));
    } else {
      setDt(autoFormatDate(raw));
    }
  }

  async function save() {
    if (!fn || !yr || !st) { setMsg({ type: "err", text: "Enter FIR Number, Year, and select a Station." }); return; }
    if (!uns) { setMsg({ type: "err", text: "Section U/s is required." }); return; }
    if (!dt || dt.length < 10) { setMsg({ type: "err", text: "Enter a valid date (DD.MM.YYYY)." }); return; }
    const cr = `${parseInt(fn, 10)}/${yr}`;
    const stLabel = SMAP.find(s => s.sh === st)?.lb;

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (editMode && existingRow) {
      // Optimistic update
      setDb(prev => ({
        ...prev,
        fir: {
          ...prev.fir,
          [st]: prev.fir[st].map(r => r.ri === existingRow.ri ? { ...r, sec: uns, dr: dt } : r)
        }
      }));
      setMsg({ type: "ok", text: `✓ FIR ${cr} updated in ${stLabel}.` });
      setEditMode(false); setExistingRow(null);

      // Background sheet write
      updateFIRRow(tok, st, existingRow.ri, uns, dt).then(ok => {
        if (!ok) setMsg({ type: "err", text: `Sheet sync failed for ${cr}. Check connection.` });
      });
      return;
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    const existingRows = db.fir[st] || [];
    // Optimistic: assign a temporary sl and add immediately
    const tempSl = String(existingRows.length + 1);
    const tempRow = { sl: tempSl, cr, sec: uns, dr: dt, yr, ri: null };
    const optimisticRows = [...existingRows, tempRow]
      .sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr))
      .map((r, i) => ({ ...r, sl: String(i + 1) }));

    setDb(prev => ({ ...prev, fir: { ...prev.fir, [st]: optimisticRows } }));
    setMsg({ type: "ok", text: `✓ FIR ${cr} saved to ${stLabel}.` });

    // Clear form immediately
    const savedFn = fn;
    setFn(""); setUns(""); setDt(""); setEditMode(false); setExistingRow(null);
    try {
      localStorage.removeItem("fir_draft_fn");
      localStorage.removeItem("fir_draft_uns");
      localStorage.removeItem("fir_draft_dt");
    } catch { }

    // Background sheet write — patch ri once confirmed
    insertFIRSorted(tok, st, cr, uns, dt, existingRows).then(result => {
      if (result.ok) {
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [st]: prev.fir[st].map(r =>
              r.cr === cr && r.ri === null ? { ...r, ri: result.ri, sl: String(result.sl) } : r
            )
          }
        }));
      } else {
        // Rollback optimistic row
        setDb(prev => ({
          ...prev,
          fir: { ...prev.fir, [st]: prev.fir[st].filter(r => !(r.cr === cr && r.ri === null)) }
        }));
        setMsg({ type: "err", text: `Save failed for ${savedFn}/${yr}. Check permissions.` });
      }
    });
  }

  async function deleteFIR() {
    if (!existingRow) return;
    setShowDeleteConfirm(false);
    const cr = existingRow.cr;

    // Optimistic delete
    setDb(prev => ({
      ...prev,
      fir: { ...prev.fir, [st]: prev.fir[st].filter(r => r.ri !== existingRow.ri) }
    }));
    setMsg({ type: "ok", text: `✓ FIR ${cr} deleted.` });
    const savedRow = existingRow;
    clearDraft();

    // Background sheet delete
    sheetsDeleteRow(tok, SID.fir, st, savedRow.ri).then(ok => {
      if (!ok) {
        // Rollback: re-add the row
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [st]: [...(prev.fir[st] || []), savedRow].sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr))
          }
        }));
        setMsg({ type: "err", text: `Delete sync failed for ${cr}. Row restored.` });
      }
    });
  }

  const stObj = SMAP.find(s => s.sh === st);
  const recent = st ? (db.fir[st] || []).slice(-3).reverse() : [];
  const firReady = fn && yr && yr.length === 4;

  return (
    <div>
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">⚠ Confirm Delete</div>
            <div className="modal-body">
              Delete FIR <strong style={{ color: "var(--red)" }}>{fn}/{yr}</strong> from{" "}
              <strong>{stObj?.lb}</strong>? This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-o btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-r btn-sm" onClick={deleteFIR}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="ctitle">{editMode ? "✏️ Edit FIR" : "📝 New FIR Entry"}
          {editMode && <span className="bdg bdg-b" style={{ marginLeft: 4 }}>Edit Mode</span>}
        </div>

        <div className="sec-divider">Step 1 — FIR Number & Year</div>
        <div className="numpad-row" style={{ marginBottom: 12 }}>
          <div style={{ flex: "1 1 130px", minWidth: 0 }}>
            <label className="lbl">FIR Number</label>
            <input className="inp mono" type="tel" inputMode="numeric" value={fn} onChange={e => setFn(e.target.value)} placeholder="e.g. 561" />
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 0 }}>
            <label className="lbl">Year</label>
            <input className="inp mono" type="tel" inputMode="numeric" maxLength={4} value={yr} onChange={e => setYr(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={curYr} />
            {fn && yr && yr.length === 4 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "JetBrains Mono,monospace" }}>
                  {parseInt(fn, 10)}/{yr}
                </span>
              </div>
            )}
          </div>
        </div>

        {firReady && (
          <>
            <div className="sec-divider">Step 2 — Select Police Station</div>
            <div className="pill-row" style={{ marginBottom: 8 }}>
              {SMAP.map(s => {
                const sNum = String(parseInt(fn, 10) || fn);
                const exists = (db.fir[s.sh] || []).some(r => firMatch(r.cr, sNum, yr));
                return (
                  <div key={s.sh}
                    className={`pill ${st === s.sh ? "active" : ""} ${exists && st !== s.sh ? "warn" : ""}`}
                    onClick={() => setSt(st === s.sh ? "" : s.sh)}>
                    {s.lb}
                    {exists && <span style={{ fontSize: 9, marginLeft: 2 }}>{st === s.sh ? "✏" : "⚠"}</span>}
                  </div>
                );
              })}
            </div>
            {st && existingRow && !editMode && (
              <div className="msg-err" style={{ marginBottom: 8 }}>
                ⚠ FIR {fn}/{yr} already exists in {stObj?.lb}.
                <button className="btn btn-edit btn-sm" style={{ marginLeft: 8 }} onClick={loadExisting}>✏ Edit it</button>
              </div>
            )}
            {st && editMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span className="st-badge gold">✏ Editing {fn}/{yr} in {stObj?.lb}</span>
                {!uns && <button className="btn btn-edit btn-sm" onClick={loadExisting}>Load Data</button>}
              </div>
            )}
          </>
        )}

        {firReady && st && (
          <>
            <div className="sec-divider">Step 3 — Section U/s</div>
            <SectionBuilder value={uns} onChange={setUns} />
            {uns && (
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 8, padding: "6px 10px", background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--gold-d)", fontFamily: "Crimson Pro,serif", lineHeight: 1.6 }}>
                <span style={{ color: "var(--txt3)", fontSize: 9, display: "block", marginBottom: 2 }}>FINAL OUTPUT:</span>
                {uns}
              </div>
            )}
          </>
        )}

        {firReady && st && (
          <>
            <div className="sec-divider">Step 4 — Date Received</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                {/* Text input with auto-dots */}
                <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                  <label className="lbl">Date (DD.MM.YYYY)</label>
                  <input
                    className="inp mono"
                    type="text"
                    inputMode="numeric"
                    placeholder="01.06.2025"
                    value={dt}
                    onChange={handleDateText}
                    maxLength={10}
                  />
                </div>
                {/* Calendar picker as optional helper */}
                <div style={{ flex: "0 0 auto" }}>
                  <label className="lbl" style={{ visibility: "hidden", display: "block" }}>Pick</label>
                  <input
                    className="inp"
                    type="date"
                    style={{ width: 42, padding: "0 4px", cursor: "pointer", opacity: 0.7 }}
                    title="Pick from calendar"
                    value={dtToIso(dt)}
                    onChange={e => setDt(isoToDt(e.target.value))}
                  />
                </div>
                {dt && dt.length === 10 && (
                  <div style={{ alignSelf: "center", fontSize: 12, color: "var(--txt2)", fontFamily: "JetBrains Mono,monospace" }}>
                    ✓ {dt}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {firReady && st && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={save} disabled={!uns || !dt || dt.length < 10}>
              {editMode ? "💾 Update FIR" : "💾 Save FIR"}
            </button>
            {editMode && (
              <button className="btn btn-r" onClick={() => setShowDeleteConfirm(true)}>🗑 Delete</button>
            )}
            <button className="btn btn-o" onClick={clearDraft}>✕ Clear</button>
          </div>
        )}

        {msg && (
          <div className={msg.type === "ok" ? "msg-ok" : msg.type === "err" ? "msg-err" : "msg-info"} style={{ marginTop: 8 }}>
            {msg.text}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="card">
          <div className="ctitle">🕐 Recent FIRs — {stObj?.lb}</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Section U/s</th><th>Date Received</th></tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.sl}</td>
                    <td className="mono" style={{ color: "var(--gold)" }}>{r.cr}</td>
                    <td>{r.sec}</td>
                    <td className="mono">{r.dr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}