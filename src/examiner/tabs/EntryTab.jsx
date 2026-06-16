import { useState, useEffect, useRef, useCallback } from "react";
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

// ─── Lock helpers ──────────────────────────────────────────────────────────
function lsGet(k, fallback = "") {
  try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
}
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { } }
function lsRemove(k) { try { localStorage.removeItem(k); } catch { } }

export default function EntryTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const curYr = String(new Date().getFullYear());

  const firNumRef  = useRef(null);
  const stPillsRef = useRef(null); // ref on the station pills container

  // ── Core form state ─────────────────────────────────────────────────────
  const [fn, setFn] = useState(() => lsGet("fir_draft_fn", ""));
  const [yr, setYr] = useState(() => lsGet("fir_draft_yr", curYr));
  const [st, setSt] = useState(() => lsGet("fir_draft_st", ""));
  const [uns, setUns] = useState("");
  const [dt,  setDt]  = useState(() => lsGet("fir_draft_dt", ""));

  // ── Lock state ──────────────────────────────────────────────────────────
  const [stLocked,  setStLocked]  = useState(() => lsGet("fir_lock_st",  "false") === "true");
  const [dtLocked,  setDtLocked]  = useState(() => lsGet("fir_lock_dt",  "false") === "true");
  const [unLocked,  setUnLocked]  = useState(() => lsGet("fir_lock_uns", "false") === "true");
  const [lockedSt,  setLockedSt]  = useState(() => lsGet("fir_locked_st_val",  ""));
  const [lockedDt,  setLockedDt]  = useState(() => lsGet("fir_locked_dt_val",  ""));
  const [lockedUns, setLockedUns] = useState(() => lsGet("fir_locked_uns_val", ""));

  // ── UI state ─────────────────────────────────────────────────────────────
  const [msg,               setMsg]               = useState(null);
  const [editMode,          setEditMode]          = useState(false);
  const [existingRow,       setExistingRow]       = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveCount,         setSaveCount]         = useState(0);
  const [showLoadConfirm,   setShowLoadConfirm]   = useState(false); // ask user to load existing data
  const [pendingStation,    setPendingStation]    = useState(null);  // station user just clicked

  // ── Effective values (locked overrides form if locked) ──────────────────
  const effectiveSt  = stLocked  ? lockedSt  : st;
  const effectiveDt  = dtLocked  ? lockedDt  : dt;
  const effectiveUns = unLocked  ? lockedUns : uns;

  // ── Persist draft (non-locked fields) ────────────────────────────────────
  useEffect(() => { lsSet("fir_draft_fn", fn); }, [fn]);
  useEffect(() => { lsSet("fir_draft_yr", yr); }, [yr]);
  useEffect(() => { lsSet("fir_draft_st", effectiveSt); }, [effectiveSt]);
  useEffect(() => { lsSet("fir_draft_dt", effectiveDt); }, [effectiveDt]);

  // ── Persist lock state ───────────────────────────────────────────────────
  useEffect(() => { lsSet("fir_lock_st",  String(stLocked)); }, [stLocked]);
  useEffect(() => { lsSet("fir_lock_dt",  String(dtLocked)); }, [dtLocked]);
  useEffect(() => { lsSet("fir_lock_uns", String(unLocked)); }, [unLocked]);
  useEffect(() => { lsSet("fir_locked_st_val",  lockedSt);  }, [lockedSt]);
  useEffect(() => { lsSet("fir_locked_dt_val",  lockedDt);  }, [lockedDt]);
  useEffect(() => { lsSet("fir_locked_uns_val", lockedUns); }, [lockedUns]);

  // ── Detect edit mode ─────────────────────────────────────────────────────
  useEffect(() => {
    const activeSt = effectiveSt;
    if (!fn || !yr || !activeSt) { setEditMode(false); setExistingRow(null); return; }
    const sNum = String(parseInt(fn, 10) || fn);
    const rows = (db.fir[activeSt] || []).filter(r => firMatch(r.cr, sNum, yr));
    if (rows.length) {
      setExistingRow(rows[0]);
      setEditMode(true);
      // Auto-load section + date if not locked
      if (!unLocked) setUns(rows[0].sec || "");
      if (!dtLocked && rows[0].dr) setDt(rows[0].dr);
    } else {
      setExistingRow(null);
      setEditMode(false);
      // If not locked, clear section for fresh entry
      if (!unLocked) setUns("");
    }
  }, [fn, yr, effectiveSt]);

  // ── Focus FIR number ─────────────────────────────────────────────────────
  function focusFirNum() {
    setTimeout(() => {
      if (firNumRef.current) {
        firNumRef.current.focus();
        firNumRef.current.select();
      }
    }, 60);
  }

  // ── Lock helpers ──────────────────────────────────────────────────────────
  function toggleStLock() {
    if (stLocked) {
      setStLocked(false);
      setLockedSt("");
    } else {
      if (!effectiveSt) { setMsg({ type: "err", text: "Select a station first to lock it." }); return; }
      setLockedSt(effectiveSt);
      setStLocked(true);
      setMsg({ type: "ok", text: `📍 Station locked: ${SMAP.find(s => s.sh === effectiveSt)?.lb}` });
    }
  }

  function toggleDtLock() {
    if (dtLocked) {
      setDtLocked(false);
      setLockedDt("");
    } else {
      if (!effectiveDt || effectiveDt.length < 10) { setMsg({ type: "err", text: "Enter a valid date first to lock it." }); return; }
      setLockedDt(effectiveDt);
      setDtLocked(true);
      setMsg({ type: "ok", text: `📅 Date locked: ${effectiveDt}` });
    }
  }

  function toggleUnLock() {
    if (unLocked) {
      setUnLocked(false);
      setLockedUns("");
      setUns("");
    } else {
      if (!effectiveUns) { setMsg({ type: "err", text: "Enter a section first to lock it." }); return; }
      setLockedUns(effectiveUns);
      setUnLocked(true);
      setMsg({ type: "ok", text: `🔒 Section locked: ${effectiveUns}` });
    }
  }

  // ── Station pill click ───────────────────────────────────────────────────
  function handleStationClick(sh) {
    if (stLocked) return; // locked — ignore
    if (sh === effectiveSt) { setSt(""); return; } // deselect

    // Check if FIR exists in this station → ask confirm
    if (fn && yr && yr.length === 4) {
      const sNum = String(parseInt(fn, 10) || fn);
      const exists = (db.fir[sh] || []).some(r => firMatch(r.cr, sNum, yr));
      if (exists) {
        setPendingStation(sh);
        setShowLoadConfirm(true);
        return;
      }
    }
    setSt(sh);
  }

  // User confirms loading existing FIR from selected station
  function confirmLoadStation() {
    if (!pendingStation) return;
    setSt(pendingStation);
    setShowLoadConfirm(false);
    // Data will be auto-loaded by the editMode useEffect
    setPendingStation(null);
  }

  function cancelLoadStation() {
    setShowLoadConfirm(false);
    setPendingStation(null);
  }

  // ── FIR Number Enter key ─────────────────────────────────────────────────
  // If all locked fields are set → auto-save; else focus station
  function handleFirNumKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const allLocked = stLocked && dtLocked && unLocked;

    if (allLocked && fn && yr && yr.length === 4) {
      // Auto-save immediately
      save(true);
    } else {
      // Move focus to station pills area (first unlocked pill or next field)
      if (!stLocked) {
        // Focus first station pill
        const firstPill = stPillsRef.current?.querySelector(".et-pill");
        if (firstPill) firstPill.focus();
      }
      // If station is locked, move to section or date
    }
  }

  // ── Date text handler ────────────────────────────────────────────────────
  function handleDateText(e) {
    if (dtLocked) return;
    const raw = e.target.value;
    const clean = raw.replace(/[^\d.]/g, "");
    if (clean.length < dt.length) { setDt(clean); } else { setDt(autoFormatDate(clean)); }
  }

  // ── Clear draft ───────────────────────────────────────────────────────────
  function clearDraft() {
    setFn(""); setUns(""); setMsg(null); setEditMode(false); setExistingRow(null);
    setYr(curYr);
    if (!stLocked) setSt("");
    if (!dtLocked) setDt("");
    if (!unLocked) setUns("");
    lsRemove("fir_draft_fn");
    lsRemove("fir_draft_yr");
    if (!stLocked) lsRemove("fir_draft_st");
    if (!dtLocked) lsRemove("fir_draft_dt");
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async (autoSave = false) => {
    const activeSt  = effectiveSt;
    const activeDt  = effectiveDt;
    const activeUns = unLocked ? lockedUns : uns;

    if (!fn || !yr || !activeSt) { setMsg({ type: "err", text: "Enter FIR Number, Year, and select a Station." }); return; }
    if (!activeUns) { setMsg({ type: "err", text: "Section U/s is required." }); return; }
    if (!activeDt || activeDt.length < 10) { setMsg({ type: "err", text: "Enter a valid date (DD.MM.YYYY)." }); return; }

    const cr = `${parseInt(fn, 10)}/${yr}`;
    const stLabel = SMAP.find(s => s.sh === activeSt)?.lb;

    // ── UPDATE ─────────────────────────────────────────────────────────────
    if (editMode && existingRow) {
      setDb(prev => ({
        ...prev,
        fir: {
          ...prev.fir,
          [activeSt]: prev.fir[activeSt].map(r => r.ri === existingRow.ri ? { ...r, sec: activeUns, dr: activeDt } : r)
        }
      }));
      setSaveCount(c => c + 1);
      setMsg({ type: "ok", text: `✓ FIR ${cr} updated in ${stLabel}.` });
      setEditMode(false); setExistingRow(null);

      setFn(""); if (!unLocked) setUns("");
      lsRemove("fir_draft_fn");
      focusFirNum();

      updateFIRRow(tok, activeSt, existingRow.ri, activeUns, activeDt).then(ok => {
        if (!ok) setMsg({ type: "err", text: `Sheet sync failed for ${cr}. Check connection.` });
      });
      return;
    }

    // ── INSERT ─────────────────────────────────────────────────────────────
    const existingRows = db.fir[activeSt] || [];
    const tempSl = String(existingRows.length + 1);
    const tempRow = { sl: tempSl, cr, sec: activeUns, dr: activeDt, yr, ri: null };
    const optimisticRows = [...existingRows, tempRow]
      .sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr))
      .map((r, i) => ({ ...r, sl: String(i + 1) }));

    setDb(prev => ({ ...prev, fir: { ...prev.fir, [activeSt]: optimisticRows } }));
    setSaveCount(c => c + 1);
    setMsg({ type: "ok", text: `✓ FIR ${cr} → ${stLabel}` });

    const savedFn = fn;
    setFn(""); if (!unLocked) setUns("");
    setEditMode(false); setExistingRow(null);
    lsRemove("fir_draft_fn");
    focusFirNum();

    insertFIRSorted(tok, activeSt, cr, activeUns, activeDt, existingRows).then(result => {
      if (result.ok) {
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [activeSt]: prev.fir[activeSt].map(r =>
              r.cr === cr && r.ri === null ? { ...r, ri: result.ri, sl: String(result.sl) } : r
            )
          }
        }));
      } else {
        setDb(prev => ({
          ...prev,
          fir: { ...prev.fir, [activeSt]: prev.fir[activeSt].filter(r => !(r.cr === cr && r.ri === null)) }
        }));
        setMsg({ type: "err", text: `Save failed for ${savedFn}/${yr}. Check permissions.` });
      }
    });
  }, [fn, yr, effectiveSt, effectiveDt, uns, unLocked, lockedUns, editMode, existingRow, db, tok, SMAP]);

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteFIR() {
    if (!existingRow) return;
    setShowDeleteConfirm(false);
    const cr = existingRow.cr;
    const activeSt = effectiveSt;

    setDb(prev => ({
      ...prev,
      fir: { ...prev.fir, [activeSt]: prev.fir[activeSt].filter(r => r.ri !== existingRow.ri) }
    }));
    setMsg({ type: "ok", text: `✓ FIR ${cr} deleted.` });
    const savedRow = existingRow;

    setFn(""); if (!unLocked) setUns("");
    setEditMode(false); setExistingRow(null);
    lsRemove("fir_draft_fn");
    focusFirNum();

    sheetsDeleteRow(tok, SID.fir, activeSt, savedRow.ri).then(ok => {
      if (!ok) {
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [activeSt]: [...(prev.fir[activeSt] || []), savedRow].sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr))
          }
        }));
        setMsg({ type: "err", text: `Delete sync failed for ${cr}. Row restored.` });
      }
    });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const stObj   = SMAP.find(s => s.sh === effectiveSt);
  const recent  = effectiveSt ? (db.fir[effectiveSt] || []).slice(-3).reverse() : [];
  const firReady = fn && yr && yr.length === 4;
  const canSave  = firReady && effectiveSt && effectiveUns && effectiveDt && effectiveDt.length === 10;
  const allLocked = stLocked && dtLocked && unLocked;

  // ── Pending station label ─────────────────────────────────────────────────
  const pendingStLabel = pendingStation ? (SMAP.find(s => s.sh === pendingStation)?.lb || pendingStation) : "";

  return (
    <div className="et-root">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="et-topbar">
        <div className="et-topbar-icon">🔐</div>
        <div>
          <div className="et-topbar-title">FIR ENTRY</div>
          <div className="et-topbar-sub">
            {allLocked
              ? "⚡ All Locked — Enter FIR No. + Enter to auto-save"
              : "Speed Mode — Enter FIR → Station → Section → Date → Save"}
          </div>
        </div>
        {saveCount > 0 && (
          <div className="et-save-count">{saveCount} saved</div>
        )}
      </div>

      {/* ── Load existing FIR confirm modal ──────────────────────────── */}
      {showLoadConfirm && (
        <div className="et-modal-overlay">
          <div className="et-modal">
            <div className="et-modal-title">📋 FIR Exists</div>
            <div className="et-modal-body">
              FIR <strong style={{ color: "var(--et-blu)" }}>{parseInt(fn, 10) || fn}/{yr}</strong> already exists in{" "}
              <strong>{pendingStLabel}</strong>.<br />
              Load this record for editing?
            </div>
            <div className="et-modal-actions">
              <button className="et-btn et-btn-o et-btn-sm" onClick={cancelLoadStation}>Cancel</button>
              <button className="et-btn et-btn-edit et-btn-sm" onClick={confirmLoadStation}>Load & Edit</button>
            </div>
          </div>
        </div>
      )}

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
            <button className="et-btn et-btn-r et-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowDeleteConfirm(true)}>
              🗑
            </button>
          </div>
        )}

        {/* ── Lock status bar ───────────────────────────────────────────── */}
        {(stLocked || dtLocked || unLocked) && (
          <div className="et-lock-bar">
            {stLocked && (
              <span className="et-lock-chip et-lock-chip-st">
                📍 {stObj?.lb || lockedSt}
                <span className="et-lock-chip-del" title="Unlock station" onClick={toggleStLock}>🔓</span>
              </span>
            )}
            {dtLocked && (
              <span className="et-lock-chip et-lock-chip-dt">
                📅 {lockedDt}
                <span className="et-lock-chip-del" title="Unlock date" onClick={toggleDtLock}>🔓</span>
              </span>
            )}
            {unLocked && (
              <span className="et-lock-chip et-lock-chip-uns">
                🔒 {lockedUns.length > 28 ? lockedUns.slice(0, 28) + "…" : lockedUns}
                <span className="et-lock-chip-del" title="Unlock section" onClick={toggleUnLock}>🔓</span>
              </span>
            )}
          </div>
        )}

        {/* ── Step 1: FIR Number & Year ────────────────────────────────── */}
        <div className="et-step-lbl">
          <span className="et-step-num">1</span> FIR Number &amp; Year
          {allLocked && <span className="et-step-note" style={{ color: "var(--et-grn, #22c55e)" }}>⚡ Press Enter to auto-save</span>}
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
                onKeyDown={handleFirNumKeyDown}
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
              {editMode && <span className="et-bdg et-bdg-b" style={{ marginLeft: 8 }}>Exists ✏</span>}
            </div>
          )}
        </div>

        {/* ── Step 2: Station ──────────────────────────────────────────── */}
        {firReady && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">2</span> Police Station
              {effectiveSt && <span className="et-step-sel">{stObj?.lb}</span>}
              {/* Lock / Unlock button */}
              <button
                className={`et-lock-btn ${stLocked ? "et-lock-btn-on" : ""}`}
                onClick={toggleStLock}
                title={stLocked ? "Unlock station" : "Lock station for batch entry"}
              >
                {stLocked ? "🔒 Locked" : "🔓 Lock"}
              </button>
            </div>
            <div className="et-card">
              <div className="et-pill-row" ref={stPillsRef}>
                {SMAP.map(s => {
                  const sNum = String(parseInt(fn, 10) || fn);
                  const exists = (db.fir[s.sh] || []).some(r => firMatch(r.cr, sNum, yr));
                  const isActive = effectiveSt === s.sh;
                  const isLocked = stLocked && isActive;
                  return (
                    <div
                      key={s.sh}
                      tabIndex={0}
                      className={`et-pill ${isActive ? "et-pill-active" : ""} ${exists && !isActive ? "et-pill-warn" : ""} ${isLocked ? "et-pill-locked" : ""}`}
                      onClick={() => handleStationClick(s.sh)}
                      onKeyDown={e => e.key === "Enter" && handleStationClick(s.sh)}
                    >
                      {s.lb}
                      {exists && <span style={{ fontSize: 9, marginLeft: 3 }}>{isActive ? "✏" : "⚠"}</span>}
                      {isLocked && <span style={{ fontSize: 9, marginLeft: 3 }}>🔒</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Section U/s ──────────────────────────────────────── */}
        {firReady && effectiveSt && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">3</span> Section U/s
              <button
                className={`et-lock-btn ${unLocked ? "et-lock-btn-on" : ""}`}
                onClick={toggleUnLock}
                title={unLocked ? "Unlock section" : "Lock section for batch entry"}
              >
                {unLocked ? "🔒 Locked" : "🔓 Lock"}
              </button>
            </div>
            {unLocked ? (
              <div className="et-card et-locked-field">
                <div className="et-locked-label">Section (Locked)</div>
                <div className="et-locked-value">{lockedUns}</div>
                <button className="et-btn et-btn-o et-btn-sm" style={{ marginTop: 6 }} onClick={toggleUnLock}>
                  🔓 Unlock & Change
                </button>
              </div>
            ) : (
              <SectionBuilder value={uns} onChange={setUns} />
            )}
          </>
        )}

        {/* ── Step 4: Date Received ────────────────────────────────────── */}
        {firReady && effectiveSt && (
          <>
            <div className="et-step-lbl">
              <span className="et-step-num">4</span> Date Received
              <span className="et-step-note">Stays until changed</span>
              <button
                className={`et-lock-btn ${dtLocked ? "et-lock-btn-on" : ""}`}
                onClick={toggleDtLock}
                title={dtLocked ? "Unlock date" : "Lock date for batch entry"}
              >
                {dtLocked ? "🔒 Locked" : "🔓 Lock"}
              </button>
            </div>
            <div className="et-card">
              {dtLocked ? (
                <div className="et-locked-field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="et-locked-value" style={{ fontSize: "1.2rem" }}>📅 {lockedDt}</span>
                  <button className="et-btn et-btn-o et-btn-sm" onClick={toggleDtLock}>🔓 Unlock</button>
                </div>
              ) : (
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
              )}
            </div>
          </>
        )}

        {/* ── Action buttons ───────────────────────────────────────────── */}
        {firReady && effectiveSt && (
          <div className="et-action-row">
            <button
              className={`et-fab ${editMode ? "et-fab-edit" : ""}`}
              onClick={() => save(false)}
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