import { useState, useEffect, useRef } from "react";
import { SID } from "../constants/config.js";
import { firMatch, firSortKey } from "../utils/helpers.js";
import { sheetsDeleteRow, insertFIRSorted, updateFIRRow } from "../utils/sheets.js";
import SectionBuilder from "../components/SectionBuilder.jsx";

// "01062025" → "01.06.2025"
function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function dtToIso(dt) {
  const p = dt.split(".");
  if (p.length === 3 && p[2].length === 4)
    return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
  return "";
}

function isoToDt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d.padStart(2, "0")}.${m}.${y}`;
}

export default function EntryTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const curYr = String(new Date().getFullYear());

  const firNumRef = useRef(null);

  const [fn, setFn] = useState(() => { try { return localStorage.getItem("fir_draft_fn") || ""; } catch { return ""; } });
  const [yr, setYr] = useState(() => { try { return localStorage.getItem("fir_draft_yr") || curYr; } catch { return curYr; } });
  const [st, setSt] = useState(() => { try { return localStorage.getItem("fir_draft_st") || ""; } catch { return ""; } });
  const [uns, setUns] = useState("");
  // DATE: persists in localStorage, never cleared on save
  const [dt, setDt] = useState(() => { try { return localStorage.getItem("fir_draft_dt") || ""; } catch { return ""; } });
  const [msg, setMsg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [existingRow, setExistingRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  // Persist draft (date always saved, fn/uns/yr/st as before)
  useEffect(() => {
    try {
      localStorage.setItem("fir_draft_fn", fn);
      localStorage.setItem("fir_draft_yr", yr);
      localStorage.setItem("fir_draft_st", st);
      // Date is intentionally always persisted — never cleared on save
      localStorage.setItem("fir_draft_dt", dt);
    } catch { }
  }, [fn, yr, st, dt]);

  // Detect edit mode when FIR+year+station match an existing record
  useEffect(() => {
    if (!fn || !yr || !st) { setEditMode(false); setExistingRow(null); return; }
    const sNum = String(parseInt(fn, 10) || fn);
    const rows = (db.fir[st] || []).filter(r => firMatch(r.cr, sNum, yr));
    if (rows.length) { setExistingRow(rows[0]); setEditMode(true); }
    else { setExistingRow(null); setEditMode(false); }
  }, [fn, yr, st]);

  function loadExisting() {
    if (!existingRow) return;
    setUns(existingRow.sec || "");
    setMsg({ type: "info", text: `Loaded FIR ${existingRow.cr} for editing.` });
  }

  function clearDraft() {
    setFn(""); setUns(""); setMsg(null); setEditMode(false); setExistingRow(null);
    setYr(curYr); setSt("");
    // Date intentionally NOT cleared here — user clears manually if needed
    try {
      localStorage.removeItem("fir_draft_fn");
      localStorage.removeItem("fir_draft_yr");
      localStorage.removeItem("fir_draft_st");
      localStorage.removeItem("fir_draft_uns");
    } catch { }
  }

  function handleDateText(e) {
    const raw = e.target.value;
    const clean = raw.replace(/[^\d.]/g, "");
    if (clean.length < dt.length) {
      setDt(clean);
    } else {
      setDt(autoFormatDate(clean));
    }
  }

  // Focus the FIR number input
  function focusFirNum() {
    setTimeout(() => {
      if (firNumRef.current) {
        firNumRef.current.focus();
        firNumRef.current.select();
      }
    }, 60);
  }

  async function save() {
    if (!fn || !yr || !st) { setMsg({ type: "err", text: "Enter FIR Number, Year, and select a Station." }); return; }
    if (!uns) { setMsg({ type: "err", text: "Section U/s is required." }); return; }
    if (!dt || dt.length < 10) { setMsg({ type: "err", text: "Enter a valid date (DD.MM.YYYY)." }); return; }

    const cr = `${parseInt(fn, 10)}/${yr}`;
    const stLabel = SMAP.find(s => s.sh === st)?.lb;

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (editMode && existingRow) {
      setDb(prev => ({
        ...prev,
        fir: {
          ...prev.fir,
          [st]: prev.fir[st].map(r => r.ri === existingRow.ri ? { ...r, sec: uns, dr: dt } : r)
        }
      }));
      setSaveCount(c => c + 1);
      setMsg({ type: "ok", text: `✓ FIR ${cr} updated in ${stLabel}.` });
      setEditMode(false); setExistingRow(null);

      // RESET: only fn and uns — keep st, yr, dt
      setFn(""); setUns("");
      try { localStorage.removeItem("fir_draft_fn"); } catch { }
      focusFirNum();

      updateFIRRow(tok, st, existingRow.ri, uns, dt).then(ok => {
        if (!ok) setMsg({ type: "err", text: `Sheet sync failed for ${cr}. Check connection.` });
      });
      return;
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    const existingRows = db.fir[st] || [];
    const tempSl = String(existingRows.length + 1);
    const tempRow = { sl: tempSl, cr, sec: uns, dr: dt, yr, ri: null };
    const optimisticRows = [...existingRows, tempRow]
      .sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr))
      .map((r, i) => ({ ...r, sl: String(i + 1) }));

    setDb(prev => ({ ...prev, fir: { ...prev.fir, [st]: optimisticRows } }));
    setSaveCount(c => c + 1);
    setMsg({ type: "ok", text: `✓ FIR ${cr} → ${stLabel}` });

    // RESET: only fn and uns — keep st, yr, dt
    const savedFn = fn;
    setFn(""); setUns("");
    setEditMode(false); setExistingRow(null);
    try { localStorage.removeItem("fir_draft_fn"); } catch { }
    focusFirNum();

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

    setDb(prev => ({
      ...prev,
      fir: { ...prev.fir, [st]: prev.fir[st].filter(r => r.ri !== existingRow.ri) }
    }));
    setMsg({ type: "ok", text: `✓ FIR ${cr} deleted.` });
    const savedRow = existingRow;

    // Full clear on delete (intentional)
    setFn(""); setUns(""); setEditMode(false); setExistingRow(null);
    try { localStorage.removeItem("fir_draft_fn"); } catch { }
    focusFirNum();

    sheetsDeleteRow(tok, SID.fir, st, savedRow.ri).then(ok => {
      if (!ok) {
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
  const canSave = firReady && st && uns && dt && dt.length === 10;

  return (
    <div className="et-root">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="et-topbar">
        <div className="et-topbar-icon">🔐</div>
        <div>
          <div className="et-topbar-title">FIR ENTRY</div>
          <div className="et-topbar-sub">Speed Mode — Tap ▸ Save ▸ Next</div>
        </div>
        {saveCount > 0 && (
          <div className="et-save-count">{saveCount} saved</div>
        )}
      </div>

      {/* ── Delete confirm modal ─────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="et-modal-overlay">
          <div className="et-modal">
            <div className="et-modal-title">⚠ Confirm Delete</div>
            <div className="et-modal-body">
              Delete FIR <strong style={{ color: "var(--et-red)" }}>{fn}/{yr}</strong> from{" "}
              <strong>{stObj?.lb}</strong>? This cannot be undone.
            </div>
            <div className="et-modal-actions">
              <button className="et-btn et-btn-o et-btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="et-btn et-btn-r et-btn-sm" onClick={deleteFIR}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="et-pane">

        {/* ── Edit mode banner ─────────────────────────────────────────── */}
        {editMode && (
          <div className="et-edit-banner">
            <span className="et-edit-banner-icon">✏</span>
            <span>Editing <strong style={{ color: "var(--et-blu)" }}>{parseInt(fn, 10) || fn}/{yr}</strong> in <strong>{stObj?.lb}</strong></span>
            {!uns && (
              <button className="et-btn et-btn-edit et-btn-sm" style={{ marginLeft: 8 }} onClick={loadExisting}>
                Load Data
              </button>
            )}
            <button className="et-btn et-btn-r et-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowDeleteConfirm(true)}>
              🗑
            </button>
          </div>
        )}

        {/* ── Step 1: FIR Number & Year ────────────────────────────────── */}
        <div className="et-step-lbl">
          <span className="et-step-num">1</span> FIR Number &amp; Year
        </div>
        <div className="et-card">
          <div className="et-fir-row">
            <div className="et-fg et-fg-wide">
              <label className="et-lbl">FIR No.</label>
              <input
                ref={firNumRef}
                className="et-inp et-inp-lg et-mono"
                type="tel"
                inputMode="numeric"
                value={fn}
                onChange={e => setFn(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 561"
                autoFocus
              />
            </div>
            <div className="et-fg">
              <label className="et-lbl">Year</label>
              <input
                className="et-inp et-inp-lg et-mono"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={yr}
                onChange={e => setYr(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={curYr}
              />
            </div>
          </div>
          {fn && yr && yr.length === 4 && (
            <div className="et-cr-badge">
              CR: <strong>{parseInt(fn, 10) || fn}/{yr}</strong>
              {editMode && <span className="et-bdg et-bdg-b" style={{ marginLeft: 8 }}>Exists</span>}
            </div>
          )}
        </div>

        {/* ── Step 2: Station ──────────────────────────────────────────── */}
        {firReady && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">2</span> Police Station
              {st && <span className="et-step-sel">{stObj?.lb}</span>}
            </div>
            <div className="et-card">
              <div className="et-pill-row">
                {SMAP.map(s => {
                  const sNum = String(parseInt(fn, 10) || fn);
                  const exists = (db.fir[s.sh] || []).some(r => firMatch(r.cr, sNum, yr));
                  return (
                    <div
                      key={s.sh}
                      className={`et-pill ${st === s.sh ? "et-pill-active" : ""} ${exists && st !== s.sh ? "et-pill-warn" : ""}`}
                      onClick={() => setSt(st === s.sh ? "" : s.sh)}
                    >
                      {s.lb}
                      {exists && <span style={{ fontSize: 9, marginLeft: 3 }}>{st === s.sh ? "✏" : "⚠"}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Section U/s ──────────────────────────────────────── */}
        {firReady && st && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">3</span> Section U/s
            </div>
            <SectionBuilder value={uns} onChange={setUns} />
          </>
        )}

        {/* ── Step 4: Date Received ────────────────────────────────────── */}
        {firReady && st && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">4</span> Date Received
              <span className="et-step-note">Stays until you change it</span>
            </div>
            <div className="et-card">
              <div className="et-date-row">
                <div className="et-fg" style={{ flex: 1 }}>
                  <label className="et-lbl">Date (DD.MM.YYYY)</label>
                  <input
                    className="et-inp et-inp-lg et-mono"
                    type="text"
                    inputMode="numeric"
                    placeholder="01.06.2025"
                    value={dt}
                    onChange={handleDateText}
                    maxLength={10}
                  />
                </div>
                <div className="et-cal-wrap">
                  <label className="et-lbl" style={{ visibility: "hidden" }}>Pick</label>
                  <div className="et-cal-btn" title="Pick from calendar">
                    📅
                    <input
                      type="date"
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", fontSize: 1 }}
                      value={dtToIso(dt)}
                      onChange={e => setDt(isoToDt(e.target.value))}
                    />
                  </div>
                </div>
                {dt && dt.length === 10 && (
                  <div className="et-date-ok">✓</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Action buttons ───────────────────────────────────────────── */}
        {firReady && st && (
          <div className="et-action-row">
            <button
              className={`et-fab ${editMode ? "et-fab-edit" : ""}`}
              onClick={save}
              disabled={!canSave}
            >
              {editMode ? "💾 Update FIR" : "💾 Save FIR"}
            </button>
            <button className="et-btn et-btn-o" onClick={clearDraft} style={{ flexShrink: 0 }}>
              ✕
            </button>
          </div>
        )}

        {/* ── Status message ───────────────────────────────────────────── */}
        {msg && (
          <div className={`et-msg et-msg-${msg.type}`}>{msg.text}</div>
        )}

        {/* ── Recent FIRs ──────────────────────────────────────────────── */}
        {recent.length > 0 && (
          <div className="et-card" style={{ marginTop: 4 }}>
            <div className="et-card-title">🕐 Recent — {stObj?.lb}</div>
            <div className="et-tbl-wrap">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Sl</th><th>CR No.</th><th>Section U/s</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i}>
                      <td className="et-mono">{r.sl}</td>
                      <td className="et-mono et-gold">{r.cr}</td>
                      <td>{r.sec}</td>
                      <td className="et-mono">{r.dr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}