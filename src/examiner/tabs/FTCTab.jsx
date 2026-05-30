import { useState, useMemo, useCallback } from "react";
import { SID } from "../constants/config.js";
import { firMatch } from "../utils/helpers.js";
import { sheetsAppend, sheetsDeleteRow, loadAllData } from "../utils/sheets.js";
import CaseDetail from "../components/CaseDetail.jsx";

export default function FTCTab({ db, setDb, tok, smap }) {
  const SMAP = smap || [];
  const curYr = String(new Date().getFullYear());

  const [fn, setFn] = useState("");
  const [yr, setYr] = useState(curYr);
  const [searched, setSearched] = useState(false);
  const [selSt, setSelSt] = useState(null);
  const [selCase, setSelCase] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Sub-tab state
  const [subTab, setSubTab] = useState("move");
  const [detSearch, setDetSearch] = useState("");
  const [detStation, setDetStation] = useState("ALL");
  const [detType, setDetType] = useState("ALL");
  const [activeDetailCase, setActiveDetailCase] = useState(null);

  // ── BUG FIX: track whether cnum has been refreshed for details tab ──
  const [cnumLoaded, setCnumLoaded] = useState(false);
  const [cnumLoading, setCnumLoading] = useState(false);

  const sNum = fn ? String(parseInt(fn, 10) || fn) : "";
  const displayFIR = sNum && yr ? `${sNum}/${yr}` : sNum;

  function doSearch() {
    if (!fn || !yr || yr.length < 4) {
      setMsg({ type: "err", text: "Enter a valid FIR number and 4-digit year." });
      return;
    }
    setSearched(true);
    setSelSt(null); setSelCase(null);
    setConfirming(false); setMsg(null);
  }

  function resetAll() {
    setFn(""); setYr(curYr); setSearched(false);
    setSelSt(null); setSelCase(null);
    setConfirming(false); setBusy(false); setMsg(null);
  }

  function handleFnChange(v) {
    setFn(v.replace(/\D/g, ""));
    setSearched(false); setSelSt(null); setSelCase(null); setConfirming(false);
  }

  function handleYrChange(v) {
    setYr(v.replace(/\D/g, "").slice(0, 4));
    setSearched(false); setSelSt(null); setSelCase(null); setConfirming(false);
  }

  // ── BUG FIX: load cnum data when switching to details sub-tab ──
  const handleSubTabChange = useCallback(async (tab) => {
    setSubTab(tab);
    if (tab === "details" && !cnumLoaded && tok) {
      setCnumLoading(true);
      try {
        const fresh = await loadAllData(tok, SMAP);
        if (fresh) {
          setDb(fresh);
          setCnumLoaded(true);
        }
      } catch (e) {
        console.error("Failed to load cnum data:", e);
      } finally {
        setCnumLoading(false);
      }
    }
  }, [cnumLoaded, tok, SMAP, setDb]);

  // Stations that contain this FIR
  const stationHits = searched && sNum && yr
    ? SMAP.filter(s => (db.fir[s.sh] || []).some(r => firMatch(r.cr, sNum, yr)))
    : [];

  const firRow = selSt
    ? (db.fir[selSt] || []).find(r => firMatch(r.cr, sNum, yr))
    : null;

  const stObj = selSt ? SMAP.find(s => s.sh === selSt) : null;

  // ── BUG FIX: also filter allCases by station so cases from other stations
  //    sharing the same FIR number don't bleed in ──
  const allCases = selSt ? [
    ...db.pend
      .filter(c => firMatch(c.fn, sNum, yr))
      // include if case station matches selected station, or if sta is unset
      .filter(c => !c.sta || SMAP.find(s => s.sh === selSt)?.lb === c.sta || c.sta === selSt)
      .map(c => ({ ...c, _type: "pending" })),
    ...db.disp
      .filter(c => firMatch(c.fn, sNum, yr))
      .filter(c => !c.sta || SMAP.find(s => s.sh === selSt)?.lb === c.sta || c.sta === selSt)
      .map(c => ({ ...c, _type: "disposal" })),
  ] : [];

  async function execute() {
    if (!selCase || !firRow || !selSt) return;
    setBusy(true);
    setMsg({ type: "loading", text: "Processing…" });
    const stLb = stObj?.lb || selSt;

    // ── BUG FIX: normalise _type → "pending"/"disposal" consistently ──
    const caseType = (selCase._type || "").toLowerCase().trim();

    const row = [
      `${sNum}/${yr}`, stLb, firRow.sec || "", firRow.dr || "",
      selCase.cn || "", selCase.pt || "", selCase.adv || "", selCase.dreg || "",
      selCase.nxt || selCase.ddec || "", caseType,
      selCase.sec || "", selCase.nat || "", selCase.des || "",
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setMsg({ type: "err", text: "Failed to save to Case Numbered sheet." });
      setBusy(false); return;
    }
    if (firRow.ri && firRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, selSt, firRow.ri);
    }
    const idx = (db.fir[selSt] || []).findIndex(r => r.cr === firRow.cr);
    if (idx >= 0) {
      const newFir = (db.fir[selSt] || [])
        .filter((_, i) => i !== idx)
        .map(r => {
          if (r.ri > firRow.ri) {
            return { ...r, ri: r.ri - 1 };
          }
          return r;
        });
      setDb(prev => ({
        ...prev,
        fir: { ...prev.fir, [selSt]: newFir },
        cnum: [...prev.cnum, {
          fn: `${sNum}/${yr}`,
          sta: stLb,
          sec: firRow.sec || "",
          dr: firRow.dr || "",
          cn: selCase.cn || "",
          pt: selCase.pt || "",
          adv: selCase.adv || "",
          dreg: selCase.dreg || "",
          nxt: selCase.nxt || selCase.ddec || "",
          // ── BUG FIX: store normalised type ──
          type: caseType,
          sec2: selCase.sec || "",
          nat: selCase.nat || "",
          des: selCase.des || "",
        }],
      }));
    }

    // Live reload from Google Sheets
    setMsg({ type: "loading", text: "Syncing live data from Google Sheets..." });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
      setCnumLoaded(true); // mark as fresh so details tab won't re-fetch
      setMsg({ type: "ok", text: `✓ FIR ${displayFIR} successfully moved & synced.` });
    } else {
      setMsg({ type: "ok", text: `✓ FIR ${displayFIR} moved (offline sync).` });
    }
    setBusy(false);
    setTimeout(resetAll, 1800);
  }

  const uniqueStations = useMemo(() => {
    const list = db.cnum.map(r => r.sta).filter(Boolean);
    return [...new Set(list)].sort();
  }, [db.cnum]);

  // ── BUG FIX: normalise type comparison to lowercase, trim whitespace ──
  const filteredCnum = useMemo(() => {
    return db.cnum.filter(r => {
      if (detStation !== "ALL" && r.sta !== detStation) return false;
      if (detType !== "ALL") {
        const rType = (r.type || "").toLowerCase().trim();
        const dType = detType.toLowerCase().trim();
        if (rType !== dType) return false;
      }
      if (detSearch) {
        const q = detSearch.toLowerCase();
        const matches =
          (r.fn || "").toLowerCase().includes(q) ||
          (r.cn || "").toLowerCase().includes(q) ||
          (r.pt || "").toLowerCase().includes(q) ||
          (r.sec || "").toLowerCase().includes(q) ||
          (r.sec2 || "").toLowerCase().includes(q) ||
          (r.adv || "").toLowerCase().includes(q) ||
          (r.sta || "").toLowerCase().includes(q) ||
          (r.nat || "").toLowerCase().includes(q) ||
          (r.des || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [db.cnum, detSearch, detStation, detType]);

  return (
    <div className="vt-root" style={{ padding: "0 0 32px" }}>

      {/* ── Inner tab bar ── */}
      <div className="abt-tabbar">
        <button className={`abt-tab${subTab === "move" ? " abt-tab-active" : ""}`} onClick={() => handleSubTabChange("move")}>
          <span className="abt-tab-icon">🔀</span>
          <span>Move FIR</span>
        </button>
        <button className={`abt-tab${subTab === "details" ? " abt-tab-active" : ""}`} onClick={() => handleSubTabChange("details")}>
          <span className="abt-tab-icon">📂</span>
          <span>Case Numbered Details</span>
        </button>
      </div>

      {subTab === "move" && (
        <>
          {/* ── Search card ── */}
          <div className="vt-search-card">
            <div className="vt-search-eyebrow">FIR → CASE NUMBERED</div>
            <div className="vt-search-row">
              <div className="vt-fg vt-fg-grow">
                <label className="vt-lbl">FIR Number</label>
                <input
                  className="vt-inp vt-mono"
                  type="tel" inputMode="numeric"
                  value={fn}
                  onChange={e => handleFnChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="e.g. 123"
                  autoFocus
                />
              </div>
              <div className="vt-fg" style={{ flex: "0 0 90px" }}>
                <label className="vt-lbl">Year</label>
                <input
                  className="vt-inp vt-mono"
                  type="tel" inputMode="numeric"
                  maxLength={4}
                  value={yr}
                  onChange={e => handleYrChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder={curYr}
                />
              </div>
              <div className="vt-search-actions">
                <button className="vt-btn vt-btn-primary" onClick={doSearch}>Search</button>
                {searched && (
                  <button className="vt-btn vt-btn-ghost" onClick={resetAll}>✕</button>
                )}
              </div>
            </div>
          </div>

          {/* ── No results ── */}
          {searched && stationHits.length === 0 && (
            <div className="vt-empty">
              <div className="vt-empty-icon">🔍</div>
              <div className="vt-empty-title">FIR not found in any station</div>
              <div className="vt-empty-sub">
                for <span className="vt-gold">{displayFIR}</span>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {searched && stationHits.length > 0 && (
            <div className="vt-results">

              {/* Summary strip */}
              <div className="vt-summary">
                <span className="vt-summary-count">{stationHits.length}</span>
                <span className="vt-summary-label">
                  station{stationHits.length > 1 ? "s" : ""} for
                </span>
                <span className="vt-summary-fir">{displayFIR}</span>
              </div>

              {/* ── Station selector ── */}
              <div className="vt-section">
                <div className="vt-section-header">
                  <div className="vt-section-icon vt-icon-fir">📋</div>
                  <div>
                    <div className="vt-section-title">FIR Pending Register</div>
                    <div className="vt-section-sub">Tap station to view details</div>
                  </div>
                </div>

                <div className="vt-chip-row">
                  {stationHits.map(s => (
                    <button
                      key={s.sh}
                      className={`vt-chip vt-chip-fir${selSt === s.sh ? " vt-chip-active-fir" : ""}`}
                      onClick={() => {
                        setSelSt(selSt === s.sh ? null : s.sh);
                        setSelCase(null); setConfirming(false); setMsg(null);
                      }}
                    >
                      <span className="vt-chip-label">{s.lb}</span>
                    </button>
                  ))}
                </div>

                {/* ── FIR detail ── */}
                {selSt && firRow && (
                  <div className="vt-panel vt-panel-fir" style={{ marginTop: 0 }}>

                    <div className="ftc-fir-info">
                      <div className="ftc-fir-cr">{firRow.cr}</div>
                      <div className="ftc-fir-fields">
                        {firRow.sec && (
                          <div className="ftc-field">
                            <span className="ftc-flbl">Section</span>
                            <span className="ftc-fval">{firRow.sec}</span>
                          </div>
                        )}
                        {firRow.dr && (
                          <div className="ftc-field">
                            <span className="ftc-flbl">Date Received</span>
                            <span className="ftc-fval vt-mono">{firRow.dr}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Cases ── */}
                    <div className="ftc-cases-hdr">
                      <span className="ftc-cases-title">Linked Cases</span>
                      <span className="vt-tag vt-tag-blue">{allCases.length}</span>
                    </div>

                    {allCases.length === 0 ? (
                      <div className="ftc-no-cases">
                        No pending or disposed cases found for {displayFIR}
                      </div>
                    ) : (
                      <div className="ftc-case-list">
                        {allCases.map((c, i) => {
                          const isSel = selCase?.cn === c.cn && selCase?._type === c._type;
                          return (
                            <div
                              key={i}
                              className={`ftc-case-card${isSel ? " ftc-case-sel" : ""}`}
                              onClick={() => {
                                setSelCase(isSel ? null : c);
                                setConfirming(false);
                              }}
                            >
                              <div className="ftc-case-top">
                                <span className="ftc-case-cn">{c.cn || "—"}</span>
                                <span className={`vt-tag ${c._type === "pending" ? "vt-tag-blue" : "vt-tag-green"}`}>
                                  {c._type === "pending" ? "Pending" : "Disposed"}
                                </span>
                              </div>
                              {c.pt && <div className="ftc-case-pt">{c.pt}</div>}
                              <div className="ftc-case-meta">
                                {c.sta && <span>{c.sta}</span>}
                                {c.dreg && <span>Reg: {c.dreg}</span>}
                              </div>
                              {isSel && <div className="ftc-sel-tick">✓ Selected</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Proceed button ── */}
                    {selCase && !confirming && (
                      <div style={{ marginTop: 10 }}>
                        <button className="ftc-proceed-btn" onClick={() => setConfirming(true)}>
                          Review &amp; Move →
                        </button>
                      </div>
                    )}

                    {/* ── Confirm panel ── */}
                    {selCase && confirming && (
                      <div className="ftc-confirm">
                        <div className="ftc-confirm-title">⚠ Confirm Move</div>
                        <div className="ftc-confirm-grid">
                          <div className="ftc-cf">
                            <span className="ftc-cf-lbl">FIR</span>
                            <span className="ftc-cf-val vt-mono">{displayFIR}</span>
                          </div>
                          <div className="ftc-cf">
                            <span className="ftc-cf-lbl">Station</span>
                            <span className="ftc-cf-val">{stObj?.lb}</span>
                          </div>
                          <div className="ftc-cf">
                            <span className="ftc-cf-lbl">Case Number</span>
                            <span className="ftc-cf-val vt-mono" style={{ color: "var(--vt-purple)" }}>
                              {selCase.cn || "—"}
                            </span>
                          </div>
                          <div className="ftc-cf">
                            <span className="ftc-cf-lbl">Case Station</span>
                            <span className="ftc-cf-val">{selCase.sta || "—"}</span>
                          </div>
                          <div className="ftc-cf" style={{ gridColumn: "1 / -1" }}>
                            <span className="ftc-cf-lbl">Parties</span>
                            <span className="ftc-cf-val">{selCase.pt || "—"}</span>
                          </div>
                        </div>
                        <div className="ftc-warn-note">
                          This will delete FIR {displayFIR} from &ldquo;{stObj?.lb}&rdquo; and save to Case Numbered.
                        </div>
                        <div className="ftc-confirm-actions">
                          <button
                            className="vt-btn vt-btn-ghost"
                            style={{ padding: "9px 14px" }}
                            onClick={() => setConfirming(false)}
                            disabled={busy}
                          >
                            ← Back
                          </button>
                          <button
                            className="ftc-execute-btn"
                            onClick={execute}
                            disabled={busy}
                          >
                            {busy ? "⏳ Processing…" : "🗂 Move to Case Numbered"}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Message ── */}
          {msg && msg.type !== "loading" && (
            <div className={`et-msg et-msg-${msg.type === "ok" ? "ok" : msg.type === "err" ? "err" : "info"}`}
              style={{ marginTop: 12 }}>
              {msg.text}
            </div>
          )}
        </>
      )}

      {/* ── Case Numbered Details sub-tab ── */}
      {subTab === "details" && (
        <div>
          {/* ── BUG FIX: loading indicator while fetching cnum data ── */}
          {cnumLoading && (
            <div className="et-msg et-msg-info" style={{ margin: "12px 14px 0" }}>
              ⏳ Loading Case Numbered records…
            </div>
          )}

          {/* ── BUG FIX: refresh button for stale data ── */}
          {!cnumLoading && (
            <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px 14px 0" }}>
              <button
                className="btn btn-o btn-sm"
                onClick={async () => {
                  setCnumLoading(true);
                  const fresh = await loadAllData(tok, SMAP);
                  if (fresh) { setDb(fresh); setCnumLoaded(true); }
                  setCnumLoading(false);
                }}
              >
                🔄 Refresh
              </button>
            </div>
          )}

          {/* Filters card */}
          <div className="card" style={{ margin: "12px 14px 0" }}>
            <div className="ctitle">
              🔦 Search &amp; Filters
              <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                {filteredCnum.length} of {db.cnum.length} records
              </span>
            </div>
            <div className="frow">
              <div className="fg" style={{ flex: "2 1 200px" }}>
                <label className="lbl">Search keyword</label>
                <div className="search-wrap">
                  <input className="inp" type="text" value={detSearch}
                    onChange={e => setDetSearch(e.target.value)}
                    placeholder="Search Case, FIR, parties, advocate, section, nature, description..." />
                  {detSearch && <button className="search-clear" onClick={() => setDetSearch("")}>✕</button>}
                </div>
              </div>
              <div className="fg">
                <label className="lbl">Station</label>
                <select className="inp" value={detStation} onChange={e => setDetStation(e.target.value)}>
                  <option value="ALL">All Stations</option>
                  {uniqueStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Type</label>
                <select className="inp" value={detType} onChange={e => setDetType(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="pending">Pending</option>
                  {/* ── BUG FIX: value must match what execute() stores — "disposal" not "disposed" ── */}
                  <option value="disposal">Disposal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details list card */}
          <div className="card" style={{ margin: "12px 14px 0" }}>
            <div className="ctitle">
              📋 Case Numbered Register
            </div>
            <div className="tbl-wrap">
              <table className="abs-tbl">
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>FIR Number</th>
                    <th>Station</th>
                    <th>Parties</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cnumLoading ? (
                    <tr><td colSpan={6} className="no-data">Loading…</td></tr>
                  ) : filteredCnum.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">
                        {db.cnum.length === 0
                          ? "No Case Numbered records found. Click Refresh to load."
                          : "No cases match the current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredCnum.map((r, idx) => (
                      <tr key={idx}>
                        <td className="mono" style={{ color: "var(--c-purple)", fontWeight: 700 }}>{r.cn || "—"}</td>
                        <td className="mono" style={{ color: "var(--gold)" }}>{r.fn || "—"}</td>
                        <td style={{ fontSize: 11 }}>{r.sta || "—"}</td>
                        <td style={{ maxWidth: 220, wordBreak: "break-word" }}>{r.pt || "—"}</td>
                        <td>
                          {/* ── BUG FIX: compare normalised type string ── */}
                          <span className={`vt-tag ${(r.type || "").toLowerCase().trim() === "disposal"
                            ? "vt-tag-green"
                            : "vt-tag-blue"}`}>
                            {r.type || "—"}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-o btn-sm" onClick={() => setActiveDetailCase(r)}>
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Case Detail Modal ── */}
      {activeDetailCase && (
        <div className="modal-overlay" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "fixed", zIndex: 1000, inset: 0,
          background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)"
        }}>
          <div className="modal" style={{
            maxWidth: 620, width: "90%", maxHeight: "85vh",
            display: "flex", flexDirection: "column",
            background: "var(--bg2)", borderRadius: 14,
            border: "1px solid var(--bdr)", padding: 16
          }}>
            <div className="modal-title" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingBottom: 10, borderBottom: "1px solid var(--bdr2)", marginBottom: 12
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--txt1)" }}>Case Details</span>
              <button className="btn btn-o btn-sm" onClick={() => setActiveDetailCase(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", padding: "4px 0", flex: 1 }}>
              {/* ── BUG FIX: pass normalised record so CaseDetail can find all fields ── */}
              <CaseDetail r={{
                ...activeDetailCase,
                // ensure _type is present for CaseDetail which may use it
                _type: activeDetailCase.type || activeDetailCase._type,
                // map sec2 → sec if CaseDetail expects 'sec' for the case section
                caseSec: activeDetailCase.sec2,
                // map nxt to appropriate field
                nxt: activeDetailCase.nxt,
              }} srcKey="cnum" />
            </div>
            <div className="modal-actions" style={{
              paddingTop: 10, borderTop: "1px solid var(--bdr2)",
              display: "flex", justifyContent: "flex-end", marginTop: 12
            }}>
              <button type="button" className="btn btn-o" onClick={() => setActiveDetailCase(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}