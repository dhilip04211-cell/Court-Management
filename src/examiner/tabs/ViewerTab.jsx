import { useState } from "react";
import { SMAP } from "../constants/config.js";
import { firMatch } from "../utils/helpers.js";
import CaseDetail from "../components/CaseDetail.jsx";

export default function ViewerTab({ db }) {
  const [fn, setFn] = useState("");
  const [yr, setYr] = useState("");
  const [searched, setSearched] = useState(false);

  const [pendHits, setPendHits] = useState([]);
  const [dispHits, setDispHits] = useState([]);
  const [nvHits, setNvHits] = useState([]);
  const [cnHits, setCnHits] = useState([]);
  const [firHits, setFirHits] = useState([]);

  const [activeSt, setActiveSt] = useState(null);
  const [activeNvSt, setActiveNvSt] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [activeNvId, setActiveNvId] = useState(null);

  function doSearch() {
    const trimmed = fn.trim();
    if (!trimmed) return;
    const sNum = String(parseInt(trimmed, 10) || trimmed);
    const sYr = yr.trim();

    const fh = [];
    for (const s of SMAP) {
      const rows = (db.fir[s.sh] || []).filter(r => firMatch(r.cr, sNum, sYr));
      if (rows.length) fh.push({ s, rows });
    }

    const ph = db.pend.filter(r => firMatch(r.fn, sNum, sYr));
    const dh = db.disp.filter(r => firMatch(r.fn, sNum, sYr));
    const nh = db.nv.filter(r => firMatch(r.fn, sNum, sYr));
    const ch = db.cnum.filter(r => firMatch(r.fn, sNum, sYr));

    setFirHits(fh); setPendHits(ph); setDispHits(dh);
    setNvHits(nh); setCnHits(ch);
    setSearched(true);
    setActiveSt(null); setActiveNvSt(null);
    setActiveCaseId(null); setActiveNvId(null);
  }

  function doClear() {
    setFn(""); setYr(""); setSearched(false);
    setFirHits([]); setPendHits([]); setDispHits([]);
    setNvHits([]); setCnHits([]);
    setActiveSt(null); setActiveNvSt(null);
    setActiveCaseId(null); setActiveNvId(null);
  }

  const displayFIR = yr ? `${fn}/${yr}` : fn;

  /* ── Case rows (Pending + Disposed only, no NV) ── */
  const caseRows = [
    ...pendHits.map(r => ({ ...r, _src: "pend" })),
    ...dispHits.map(r => ({ ...r, _src: "disp" })),
  ];

  /* ── NV rows ── */
  const nvRows = nvHits.map(r => ({ ...r, _src: "nv" }));

  /* ── Station names helper ── */
  function extractStations(rows) {
    const names = [];
    const seen = new Set();
    for (const r of rows) {
      const ps = (r.sta || "").trim() || "(Blank Station)";
      if (!seen.has(ps)) { seen.add(ps); names.push(ps); }
    }
    return names;
  }

  const caseStations = extractStations(caseRows);
  const nvStations = extractStations(nvRows);

  function getRowsForStation(rows, stName) {
    if (!stName) return [];
    const isBlank = stName === "(Blank Station)";
    const stL = stName.toLowerCase();
    return rows.filter(r => {
      const ps = (r.sta || "").trim();
      const pt = (r.pt || "").toLowerCase();
      if (isBlank) return !ps;
      return ps.toLowerCase() === stL
        || ps.toLowerCase().includes(stL)
        || (stL.includes(ps.toLowerCase()) && ps.length > 3)
        || pt.includes(stL);
    });
  }

  const caseStRows = activeSt ? getRowsForStation(caseRows, activeSt) : [];
  const nvStRows = activeNvSt ? getRowsForStation(nvRows, activeNvSt) : [];

  const firTotal = firHits.reduce((a, b) => a + b.rows.length, 0);
  const totalHits = firTotal + caseRows.length + nvRows.length + cnHits.length;

  return (
    <div className="vt-root">

      {/* ── Search Card ── */}
      <div className="vt-search-card">
        <div className="vt-search-eyebrow">FIR LOOKUP</div>
        <div className="vt-search-row">
          <div className="vt-fg vt-fg-grow">
            <label className="vt-lbl">FIR Number</label>
            <input
              className="vt-inp vt-mono"
              type="tel" inputMode="numeric"
              value={fn} onChange={e => setFn(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="e.g. 12"
            />
          </div>
          <div className="vt-fg" style={{ flex: "0 0 90px" }}>
            <label className="vt-lbl">Year</label>
            <input
              className="vt-inp vt-mono"
              type="tel" inputMode="numeric"
              value={yr} onChange={e => setYr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="2025"
            />
          </div>
          <div className="vt-search-actions">
            <button className="vt-btn vt-btn-primary" onClick={doSearch}>Search</button>
            {searched && (
              <button className="vt-btn vt-btn-ghost" onClick={doClear}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── No results ── */}
      {searched && totalHits === 0 && (
        <div className="vt-empty">
          <div className="vt-empty-icon">🔍</div>
          <div className="vt-empty-title">No records found</div>
          <div className="vt-empty-sub">
            for <span className="vt-gold">{displayFIR}</span>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {searched && totalHits > 0 && (
        <div className="vt-results">

          {/* Result summary chip */}
          <div className="vt-summary">
            <span className="vt-summary-count">{totalHits}</span>
            <span className="vt-summary-label">
              record{totalHits > 1 ? "s" : ""} for
            </span>
            <span className="vt-summary-fir">{displayFIR}</span>
          </div>

          {/* ════════════ SECTION 1 — FIR Pending Register ════════════ */}
          {firHits.length > 0 && (
            <div className="vt-section">
              <div className="vt-section-header">
                <div className="vt-section-icon vt-icon-fir">📋</div>
                <div>
                  <div className="vt-section-title">FIR Pending Register</div>
                  <div className="vt-section-sub">{firTotal} entr{firTotal === 1 ? "y" : "ies"}</div>
                </div>
              </div>

              <div className="vt-chip-row">
                {firHits.map(({ s, rows }) => {
                  const key = "fir::" + s.sh;
                  return (
                    <button
                      key={key}
                      className={`vt-chip vt-chip-fir${activeSt === key ? " vt-chip-active-fir" : ""}`}
                      onClick={() => {
                        setActiveSt(activeSt === key ? null : key);
                        setActiveCaseId(null);
                      }}
                    >
                      <span className="vt-chip-label">{s.lb}</span>
                      <span className="vt-chip-count">{rows.length}</span>
                    </button>
                  );
                })}
              </div>

              {activeSt && activeSt.startsWith("fir::") && (() => {
                const shKey = activeSt.replace("fir::", "");
                const sObj = SMAP.find(s => s.sh === shKey);
                const rows = (firHits.find(x => x.s.sh === shKey) || {}).rows || [];
                return (
                  <div className="vt-panel vt-panel-fir">
                    <div className="vt-panel-heading">
                      <span className="vt-panel-title">{sObj?.lb}</span>
                      <span className="vt-tag vt-tag-red">FIR Pending</span>
                    </div>
                    <div className="vt-fir-list">
                      {rows.map((r, i) => (
                        <div key={i} className="vt-fir-card">
                          <div className="vt-fir-row-top">
                            <div className="vt-fir-cr">{r.cr}</div>
                            {r.yr && <span className="vt-tag vt-tag-amber">{r.yr}</span>}
                          </div>
                          <div className="vt-fir-meta">
                            {r.sec && (
                              <div className="vt-fir-field">
                                <span className="vt-fir-flbl">Section</span>
                                <span className="vt-fir-fval">{r.sec}</span>
                              </div>
                            )}
                            {r.rp && (
                              <div className="vt-fir-field">
                                <span className="vt-fir-flbl">RP Number</span>
                                <span className="vt-fir-fval vt-mono">{r.rp}</span>
                              </div>
                            )}
                            {r.dr && (
                              <div className="vt-fir-field">
                                <span className="vt-fir-flbl">Date Received</span>
                                <span className="vt-fir-fval vt-mono">{r.dr}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════════════ SECTION 2 — Cases (Pending + Disposed) ════════════ */}
          {caseRows.length > 0 && (
            <div className="vt-section">
              <div className="vt-section-header">
                <div className="vt-section-icon vt-icon-case">⚖️</div>
                <div>
                  <div className="vt-section-title">Cases</div>
                  <div className="vt-section-sub">
                    {pendHits.length > 0 && (
                      <span className="vt-sub-pill vt-sub-blue">{pendHits.length} Pending</span>
                    )}
                    {dispHits.length > 0 && (
                      <span className="vt-sub-pill vt-sub-green">{dispHits.length} Disposed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="vt-chip-row">
                {caseStations.map(ps => {
                  const cnt = getRowsForStation(caseRows, ps).length;
                  return (
                    <button
                      key={ps}
                      className={`vt-chip vt-chip-case${activeSt === ps ? " vt-chip-active-case" : ""}`}
                      onClick={() => {
                        setActiveSt(activeSt === ps ? null : ps);
                        setActiveCaseId(null);
                      }}
                    >
                      <span className="vt-chip-label">{ps}</span>
                      <span className="vt-chip-count">{cnt}</span>
                    </button>
                  );
                })}
              </div>

              {activeSt && !activeSt.startsWith("fir::") && (
                <div className="vt-panel vt-panel-case">
                  <div className="vt-panel-heading">
                    <span className="vt-panel-title">{activeSt}</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {caseStRows.filter(r => r._src === "pend").length > 0 && (
                        <span className="vt-tag vt-tag-blue">
                          ⚖ {caseStRows.filter(r => r._src === "pend").length} Pending
                        </span>
                      )}
                      {caseStRows.filter(r => r._src === "disp").length > 0 && (
                        <span className="vt-tag vt-tag-green">
                          ✓ {caseStRows.filter(r => r._src === "disp").length} Disposed
                        </span>
                      )}
                    </div>
                  </div>

                  {[
                    { src: "pend", title: "Pending Cases", color: "var(--c-blue)", tag: "vt-tag-blue" },
                    { src: "disp", title: "Disposed Cases", color: "var(--c-green)", tag: "vt-tag-green" },
                  ].map(({ src, title, color, tag }) => {
                    const srcRows = caseStRows.filter(r => r._src === src);
                    if (!srcRows.length) return null;
                    return (
                      <div key={src} className="vt-case-group">
                        <div className="vt-case-group-header">
                          <span className="vt-case-group-title" style={{ color }}>{title}</span>
                          <span className={`vt-tag ${tag}`}>{srcRows.length}</span>
                        </div>
                        <div className="vt-cn-pills">
                          {srcRows.map((r, i) => {
                            const caseId = `${src}::${r.ri}::${i}`;
                            const label = (r.cn || "").trim() || (r.rp || "").trim() || `#${r.sl || r.sno || r.ri}`;
                            return (
                              <button
                                key={caseId}
                                className={`vt-cn-pill${activeCaseId === caseId ? " vt-cn-active" : ""}`}
                                onClick={() => setActiveCaseId(activeCaseId === caseId ? null : caseId)}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {srcRows.map((r, i) => {
                          const caseId = `${src}::${r.ri}::${i}`;
                          if (activeCaseId !== caseId) return null;
                          return <CaseDetail key={caseId} r={r} srcKey={src} />;
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════ SECTION 3 — Non-Valuable Property ════════════ */}
          {nvRows.length > 0 && (
            <div className="vt-section">
              <div className="vt-section-header">
                <div className="vt-section-icon vt-icon-nv">🏷️</div>
                <div>
                  <div className="vt-section-title">Non-Valuable Property</div>
                  <div className="vt-section-sub">{nvRows.length} record{nvRows.length > 1 ? "s" : ""}</div>
                </div>
              </div>

              <div className="vt-chip-row">
                {nvStations.map(ps => {
                  const cnt = getRowsForStation(nvRows, ps).length;
                  return (
                    <button
                      key={ps}
                      className={`vt-chip vt-chip-nv${activeNvSt === ps ? " vt-chip-active-nv" : ""}`}
                      onClick={() => {
                        setActiveNvSt(activeNvSt === ps ? null : ps);
                        setActiveNvId(null);
                      }}
                    >
                      <span className="vt-chip-label">{ps}</span>
                      <span className="vt-chip-count">{cnt}</span>
                    </button>
                  );
                })}
              </div>

              {activeNvSt && (
                <div className="vt-panel vt-panel-nv">
                  <div className="vt-panel-heading">
                    <span className="vt-panel-title">{activeNvSt}</span>
                    <span className="vt-tag vt-tag-amber">{nvStRows.length} NV</span>
                  </div>
                  <div className="vt-cn-pills">
                    {nvStRows.map((r, i) => {
                      const nvId = `nv::${r.ri}::${i}`;
                      /* Show RP number as pill label for NV */
                      const label = (r.rp || "").trim() || (r.cn || "").trim() || `#${r.sl || r.sno || i}`;
                      return (
                        <button
                          key={nvId}
                          className={`vt-cn-pill vt-cn-amber${activeNvId === nvId ? " vt-cn-active-amber" : ""}`}
                          onClick={() => setActiveNvId(activeNvId === nvId ? null : nvId)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {nvStRows.map((r, i) => {
                    const nvId = `nv::${r.ri}::${i}`;
                    if (activeNvId !== nvId) return null;
                    return <CaseDetail key={nvId} r={r} srcKey="nv" />;
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════ SECTION 4 — Case Numbered (if any) ════════════ */}
          {cnHits.length > 0 && (
            <div className="vt-section">
              <div className="vt-section-header">
                <div className="vt-section-icon vt-icon-cn">📁</div>
                <div>
                  <div className="vt-section-title">Case Numbered</div>
                  <div className="vt-section-sub">{cnHits.length} record{cnHits.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="vt-cn-pills" style={{ padding: "4px 0 8px" }}>
                {cnHits.map((r, i) => {
                  const cnId = `cnum::${r.ri}::${i}`;
                  const label = (r.cn || "").trim() || `#${r.sl || i}`;
                  return (
                    <button
                      key={cnId}
                      className={`vt-cn-pill vt-cn-purple${activeCaseId === cnId ? " vt-cn-active-purple" : ""}`}
                      onClick={() => setActiveCaseId(activeCaseId === cnId ? null : cnId)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {cnHits.map((r, i) => {
                const cnId = `cnum::${r.ri}::${i}`;
                if (activeCaseId !== cnId) return null;
                return <CaseDetail key={cnId} r={r} srcKey="cnum" />;
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
}