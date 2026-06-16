import { useState, useMemo } from "react";
import { firMatch } from "../../../examiner/utils/helpers.js";
import CaseDetail from "../../../examiner/components/CaseDetail.jsx";

export default function PropertyViewerInner({ db, SMAP }) {
  const [searchMode, setSearchMode] = useState("rp"); // "rp" | "fir"
  const [num, setNum] = useState("");
  const [yr, setYr] = useState(new Date().getFullYear().toString());
  
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);
  
  // Station resolution state for FIR search
  const [detectedStations, setDetectedStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  
  const displaySearch = yr ? `${num}/${yr}` : num;

  // Search execution logic
  function handleSearch() {
    const cleanNum = num.trim();
    const cleanYr = yr.trim();
    if (!cleanNum) return;

    setSearched(true);
    setSelectedStation(null);

    const sNum = String(parseInt(cleanNum, 10) || cleanNum);
    const sYr = cleanYr;

    if (searchMode === "rp") {
      // ── Search by RP No & Year ──
      // Scan db.nv for matching RP number and year
      const hits = (db?.nv || []).filter(r => {
        if (!r.rp) return false;
        // Check exact or loose match on rp number and year
        const cleanRp = r.rp.toString().trim();
        const parts = cleanRp.split("/");
        const rpNum = String(parseInt(parts[0], 10) || parts[0]);
        const rpYr = parts[1] ? parts[1].trim() : "";

        if (rpNum !== sNum) return false;
        if (!sYr) return true;
        if (!rpYr) return true;

        const yr4 = rpYr.length === 2 ? `20${rpYr}` : rpYr;
        const searchYr4 = sYr.length === 2 ? `20${sYr}` : sYr;
        return yr4 === searchYr4;
      });

      setResults(hits);
      setDetectedStations([]);
    } else {
      // ── Search by FIR No & Year ──
      // 1. Find all matching stations from nv database or fir database
      const stations = new Set();
      
      // Look in nv sheet first
      (db?.nv || []).forEach(r => {
        if (firMatch(r.fn, sNum, sYr)) {
          if (r.sta) stations.add(r.sta);
        }
      });

      // Also check the FIR pending list for each station
      if (db?.fir) {
        for (const [stSh, rows] of Object.entries(db.fir)) {
          const hasFir = rows.some(r => {
            if (firMatch(r.cr, sNum, sYr)) return true;
            if (sYr && firMatch(r.cr, `${sNum}/${sYr}`, "")) return true;
            return false;
          });
          if (hasFir) {
            const sObj = SMAP.find(s => s.sh === stSh);
            if (sObj?.lb) stations.add(sObj.lb);
          }
        }
      }

      const matchingStations = Array.from(stations);
      setDetectedStations(matchingStations);
      
      // Auto-select if only one station matches
      if (matchingStations.length === 1) {
        setSelectedStation(matchingStations[0]);
        loadFIRDetails(sNum, sYr, matchingStations[0]);
      } else {
        setResults([]);
      }
    }
  }

  // Helper to load details for FIR + selected station
  function loadFIRDetails(firNum, firYr, stationLabel) {
    const hits = (db?.nv || []).filter(r => {
      const fnOk = firMatch(r.fn, firNum, firYr);
      if (!fnOk) return false;
      
      // Match station
      if (!r.sta || !stationLabel) return false;
      const rSta = r.sta.toLowerCase().trim();
      const sSta = stationLabel.toLowerCase().trim();
      return rSta === sSta || rSta.includes(sSta) || sSta.includes(rSta);
    });
    setResults(hits);
  }

  function handleStationSelect(station) {
    setSelectedStation(station);
    const cleanNum = num.trim();
    const cleanYr = yr.trim();
    const sNum = String(parseInt(cleanNum, 10) || cleanNum);
    loadFIRDetails(sNum, cleanYr, station);
  }

  function handleClear() {
    setNum("");
    setYr(new Date().getFullYear().toString());
    setSearched(false);
    setResults([]);
    setDetectedStations([]);
    setSelectedStation(null);
  }

  return (
    <div className="hc-viewer-root">
      {/* ── Dual Search Control Card ── */}
      <div className="vt-search-card">
        <div className="hc-tab-toggles">
          <button 
            className={`hc-toggle-btn${searchMode === "rp" ? " hc-toggle-btn-active" : ""}`}
            onClick={() => { setSearchMode("rp"); handleClear(); }}
          >
            📦 RP No. & Year
          </button>
          <button 
            className={`hc-toggle-btn${searchMode === "fir" ? " hc-toggle-btn-active" : ""}`}
            onClick={() => { setSearchMode("fir"); handleClear(); }}
          >
            📋 FIR No. & Year
          </button>
        </div>

        <div className="vt-search-row" style={{ marginTop: 16 }}>
          <div className="vt-fg vt-fg-grow">
            <label className="vt-lbl">{searchMode === "rp" ? "RP Number" : "FIR Number"}</label>
            <input
              className="vt-inp vt-mono"
              type="tel"
              inputMode="numeric"
              value={num}
              onChange={e => { setNum(e.target.value.replace(/\D/g, "")); setSearched(false); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 12"
            />
          </div>
          <div className="vt-fg" style={{ flex: "0 0 90px" }}>
            <label className="vt-lbl">Year</label>
            <input
              className="vt-inp vt-mono"
              type="tel"
              inputMode="numeric"
              value={yr}
              onChange={e => { setYr(e.target.value.replace(/\D/g, "").slice(0, 4)); setSearched(false); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 2026"
            />
          </div>
          <div className="vt-search-actions">
            <button className="vt-btn vt-btn-primary" onClick={handleSearch} style={{ minWidth: 90 }}>
              Search
            </button>
            {searched && (
              <button className="vt-btn vt-btn-ghost" onClick={handleClear}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── No Results State ── */}
      {searched && searchMode === "rp" && results.length === 0 && (
        <div className="vt-empty">
          <div className="vt-empty-icon">📦</div>
          <div className="vt-empty-title">No properties found</div>
          <div className="vt-empty-sub">
            for RP Number <span className="vt-gold">{displaySearch}</span>
          </div>
        </div>
      )}

      {searched && searchMode === "fir" && detectedStations.length === 0 && (
        <div className="vt-empty">
          <div className="vt-empty-icon">📋</div>
          <div className="vt-empty-title">No records found</div>
          <div className="vt-empty-sub">
            for FIR Number <span className="vt-gold">{displaySearch}</span>
          </div>
        </div>
      )}

      {/* ── Police Station Resolver UI (only in FIR search mode) ── */}
      {searched && searchMode === "fir" && detectedStations.length > 0 && (
        <div className="hc-resolver-section">
          <div className="hc-resolver-title">
            📍 Select Police Station for FIR <span className="vt-gold">{displaySearch}</span>
          </div>
          <div className="vt-chip-row" style={{ marginTop: 12 }}>
            {detectedStations.map(st => (
              <button
                key={st}
                className={`vt-chip vt-chip-case${selectedStation === st ? " vt-chip-active-case" : ""}`}
                onClick={() => handleStationSelect(st)}
              >
                <span className="vt-chip-label">{st}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Display Loaded Details ── */}
      {searched && (searchMode === "rp" || selectedStation) && (
        <div className="hc-results-section" style={{ marginTop: 24 }}>
          {results.length > 0 ? (
            <div className="vt-panel vt-panel-nv">
              <div className="vt-panel-heading">
                <span className="vt-panel-title">
                  {searchMode === "rp" ? `RP Record: ${displaySearch}` : `${selectedStation} - FIR ${displaySearch}`}
                </span>
                <span className="vt-tag vt-tag-amber">{results.length} Property Item{results.length > 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                {results.map((r, i) => (
                  <CaseDetail key={i} r={r} srcKey="nv" />
                ))}
              </div>
            </div>
          ) : (
            selectedStation && (
              <div className="vt-empty">
                <div className="vt-empty-icon">🏷️</div>
                <div className="vt-empty-title">No Property details recorded</div>
                <div className="vt-empty-sub">
                  for FIR <span className="vt-gold">{displaySearch}</span> at <span className="vt-gold">{selectedStation}</span>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
