import { useState, useMemo } from "react";
import CaseDetail from "../../../examiner/components/CaseDetail.jsx";

export default function CasePropertyListInner({ db }) {
  const [searchText, setSearchText] = useState("");
  const [selectedStation, setSelectedStation] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);
  
  // Pagination/limit state
  const [displayLimit, setDisplayLimit] = useState(50);

  // Get all unique stations represented in the properties database
  const stationOptions = useMemo(() => {
    const set = new Set();
    (db?.nv || []).forEach(r => {
      if (r.sta) set.add(r.sta.trim());
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [db?.nv]);

  // Filter properties list based on search and station selection
  const filteredList = useMemo(() => {
    const list = db?.nv || [];
    const query = searchText.toLowerCase().trim();
    
    return list.filter(r => {
      // 1. Station match
      if (selectedStation !== "ALL") {
        const rSta = (r.sta || "").toLowerCase().trim();
        const sSta = selectedStation.toLowerCase().trim();
        if (rSta !== sSta) return false;
      }
      
      // 2. Text query match
      if (query) {
        const rp = (r.rp || "").toLowerCase();
        const cn = (r.cn || "").toLowerCase();
        const fn = (r.fn || "").toLowerCase();
        const desc = (r.desc || "").toLowerCase();
        const rem = (r.rem || "").toLowerCase();
        const sta = (r.sta || "").toLowerCase();
        
        return (
          rp.includes(query) ||
          cn.includes(query) ||
          fn.includes(query) ||
          desc.includes(query) ||
          rem.includes(query) ||
          sta.includes(query)
        );
      }
      
      return true;
    });
  }, [db?.nv, searchText, selectedStation]);

  // Reset pagination limit when filters change
  const handleFilterChange = (updater) => {
    updater();
    setDisplayLimit(50);
  };

  const visibleList = filteredList.slice(0, displayLimit);
  const hasMore = filteredList.length > displayLimit;

  function handleRowClick(rowId) {
    setExpandedId(expandedId === rowId ? null : rowId);
  }

  function handleLoadMore() {
    setDisplayLimit(prev => prev + 50);
  }

  return (
    <div className="hc-list-root">
      {/* ── Filters Card ── */}
      <div className="vt-search-card" style={{ marginBottom: 16 }}>
        <div className="vt-search-eyebrow">PROPERTY DATABASE</div>
        
        <div className="vt-search-row" style={{ marginTop: 12 }}>
          <div className="vt-fg vt-fg-grow">
            <label className="vt-lbl">Search Properties</label>
            <input
              className="vt-inp"
              type="text"
              value={searchText}
              onChange={e => handleFilterChange(() => setSearchText(e.target.value))}
              placeholder="Search by RP No, Case No, FIR, Description..."
            />
          </div>
          
          <div className="vt-fg" style={{ flex: "0 0 220px" }}>
            <label className="vt-lbl">Police Station</label>
            <select
              className="vt-inp"
              style={{ paddingRight: 24, appearance: "auto" }}
              value={selectedStation}
              onChange={e => handleFilterChange(() => setSelectedStation(e.target.value))}
            >
              {stationOptions.map(st => (
                <option key={st} value={st}>{st === "ALL" ? "All Stations" : st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary statistics ── */}
      <div className="vt-summary" style={{ marginBottom: 12 }}>
        <span className="vt-summary-count">{filteredList.length}</span>
        <span className="vt-summary-label">
          record{filteredList.length !== 1 ? "s" : ""} match filters
        </span>
      </div>

      {/* ── Results Table ── */}
      {filteredList.length > 0 ? (
        <div className="vt-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="qb-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>S.No</th>
                  <th style={{ width: "120px" }}>RP Number</th>
                  <th style={{ width: "140px" }}>Case Number</th>
                  <th style={{ width: "120px" }}>FIR Number</th>
                  <th>Police Station</th>
                  <th>Description</th>
                  <th style={{ width: "80px", textAlign: "center" }}>View</th>
                </tr>
              </thead>
              <tbody>
                {visibleList.map((r, i) => {
                  const rowId = `nv-list-${r.ri}-${i}`;
                  const isExpanded = expandedId === rowId;
                  
                  return (
                    <option key={rowId} style={{ display: "contents" }}>
                      <tr 
                        className={`qb-row${isExpanded ? " qb-row-selected" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRowClick(rowId)}
                      >
                        <td style={{ textAlign: "center", color: "var(--txt3)" }}>{i + 1}</td>
                        <td className="mono" style={{ color: "var(--c-amber)", fontWeight: 600 }}>
                          {r.rp || "—"}
                        </td>
                        <td className="mono">{r.cn || "—"}</td>
                        <td className="mono">{r.fn || "—"}</td>
                        <td>{r.sta || "—"}</td>
                        <td style={{ 
                          maxWidth: "280px", 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis",
                          color: "var(--txt2)"
                        }}>
                          {r.desc || "—"}
                        </td>
                        <td style={{ textAlign: "center", fontSize: "14px" }}>
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: "var(--bg3)", padding: 16 }}>
                            <div className="hc-list-expanded-detail" onClick={e => e.stopPropagation()}>
                              <CaseDetail r={r} srcKey="nv" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </option>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {hasMore && (
            <div style={{ padding: 16, display: "flex", justifyContent: "center", borderTop: "1px solid var(--bdr)" }}>
              <button className="vt-btn vt-btn-primary" onClick={handleLoadMore} style={{ minWidth: 150 }}>
                Load More ({filteredList.length - displayLimit} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="vt-empty">
          <div className="vt-empty-icon">🏷️</div>
          <div className="vt-empty-title">No matching records</div>
          <div className="vt-empty-sub">Try adjusting your search criteria or station filters</div>
        </div>
      )}
    </div>
  );
}
