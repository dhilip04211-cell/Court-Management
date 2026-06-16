import { useState, useMemo } from "react";

export default function CasePropertyListInner({ db }) {
  const [searchText, setSearchText] = useState("");
  const [selectedStation, setSelectedStation] = useState("ALL");
  
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
              placeholder="Search by RP No, Case No, FIR, Description, Remarks..."
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

      {/* ── Results Table (Excel Style) ── */}
      {filteredList.length > 0 ? (
        <div className="vt-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div className="abs-tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="abs-tbl" style={{ tableLayout: "auto", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg3)" }}>
                  <th style={{ width: "60px", textAlign: "center", border: "1px solid var(--bdr)" }}>S.No</th>
                  <th style={{ width: "120px", border: "1px solid var(--bdr)" }}>RP Number</th>
                  <th style={{ width: "140px", border: "1px solid var(--bdr)" }}>Case Number</th>
                  <th style={{ width: "120px", border: "1px solid var(--bdr)" }}>FIR Number</th>
                  <th style={{ width: "180px", border: "1px solid var(--bdr)" }}>Police Station</th>
                  <th style={{ minWidth: "220px", border: "1px solid var(--bdr)" }}>Description</th>
                  <th style={{ minWidth: "220px", border: "1px solid var(--bdr)" }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visibleList.map((r, i) => (
                  <tr 
                    key={`nv-row-${r.ri}-${i}`} 
                    className="qb-row"
                    style={{ borderBottom: "1px solid var(--bdr)" }}
                  >
                    <td style={{ textAlign: "center", color: "var(--txt3)", border: "1px solid var(--bdr)" }}>{i + 1}</td>
                    <td className="mono" style={{ color: "var(--c-amber)", fontWeight: 600, border: "1px solid var(--bdr)" }}>
                      {r.rp || "—"}
                    </td>
                    <td className="mono" style={{ border: "1px solid var(--bdr)" }}>{r.cn || "—"}</td>
                    <td className="mono" style={{ border: "1px solid var(--bdr)" }}>{r.fn || "—"}</td>
                    <td style={{ border: "1px solid var(--bdr)" }}>{r.sta || "—"}</td>
                    <td style={{ 
                      whiteSpace: "normal", 
                      wordBreak: "break-word", 
                      color: "var(--txt)",
                      border: "1px solid var(--bdr)",
                      fontSize: "12px",
                      lineHeight: "1.4"
                    }}>
                      {r.desc || "—"}
                    </td>
                    <td style={{ 
                      whiteSpace: "normal", 
                      wordBreak: "break-word", 
                      color: "var(--txt2)",
                      border: "1px solid var(--bdr)",
                      fontSize: "12px",
                      lineHeight: "1.4"
                    }}>
                      {r.rem || "—"}
                    </td>
                  </tr>
                ))}
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
