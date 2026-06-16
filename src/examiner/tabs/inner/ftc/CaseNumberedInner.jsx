import { useMemo } from "react";
import { loadAllData } from "../../../utils/sheets.js";

const CASE_TYPE_ORDER = ["PRC", "CC", "STC", "MC", "CRLMP"];

function detectCaseType(cn) {
  if (!cn) return "";
  const upper = cn.toString().toUpperCase();
  for (const t of CASE_TYPE_ORDER) {
    if (upper.includes(t)) return t;
  }
  return "";
}

function caseTypeColor(ct) {
  const map = {
    PRC: "#e8a020",
    CC: "#3b82f6",
    STC: "#8b5cf6",
    MC: "#10b981",
    CRLMP: "#ec4899",
  };
  return map[ct] || "var(--gold)";
}

export default function CaseNumberedInner({
  db,
  setDb,
  tok,
  SMAP,
  detSearch,
  setDetSearch,
  detStation,
  setDetStation,
  detType,
  setDetType,
  setActiveDetailCase,
  cnumLoading,
  setCnumLoading,
}) {
  const uniqueStations = useMemo(() => {
    const list = (db.cnum || []).map((r) => r.sta).filter(Boolean);
    return [...new Set(list)].sort();
  }, [db.cnum]);

  const filteredCnum = useMemo(() => {
    return (db.cnum || []).filter((r) => {
      if (detStation !== "ALL" && r.sta !== detStation) return false;
      if (detType !== "ALL") {
        const rType = (r.type || "").toLowerCase().trim();
        if (rType !== detType.toLowerCase()) return false;
      }
      if (detSearch) {
        const q = detSearch.toLowerCase();
        const ok =
          (r.fn || "").toLowerCase().includes(q) ||
          (r.cn || "").toLowerCase().includes(q) ||
          (r.pt || "").toLowerCase().includes(q) ||
          (r.sec || "").toLowerCase().includes(q) ||
          (r.sec2 || "").toLowerCase().includes(q) ||
          (r.adv || "").toLowerCase().includes(q) ||
          (r.sta || "").toLowerCase().includes(q) ||
          (r.nat || "").toLowerCase().includes(q) ||
          (r.des || "").toLowerCase().includes(q);
        if (!ok) return false;
      }
      return true;
    });
  }, [db.cnum, detSearch, detStation, detType]);

  async function handleRefresh() {
    setCnumLoading(true);
    try {
      const fresh = await loadAllData(tok, SMAP);
      if (fresh) {
        setDb(fresh);
      }
    } catch (e) {
      console.error("cnum load error:", e);
    } finally {
      setCnumLoading(false);
    }
  }

  return (
    <div>
      {cnumLoading && (
        <div className="et-msg et-msg-info" style={{ margin: "12px 14px 0" }}>
          ⏳ Loading Case Numbered records…
        </div>
      )}
      {!cnumLoading && (
        <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px 14px 0" }}>
          <button className="btn btn-o btn-sm" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      )}

      <div className="card" style={{ margin: "12px 14px 0" }}>
        <div className="ctitle">
          🔦 Search &amp; Filters
          <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
            {filteredCnum.length} of {(db.cnum || []).length} records
          </span>
        </div>
        <div className="frow">
          <div className="fg" style={{ flex: "2 1 200px" }}>
            <label className="lbl">Search keyword</label>
            <div className="search-wrap">
              <input
                className="inp"
                type="text"
                value={detSearch}
                onChange={(e) => setDetSearch(e.target.value)}
                placeholder="Case, FIR, parties, advocate, section…"
              />
              {detSearch && (
                <button className="search-clear" onClick={() => setDetSearch("")}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="fg">
            <label className="lbl">Station</label>
            <select
              className="inp"
              value={detStation}
              onChange={(e) => setDetStation(e.target.value)}
            >
              <option value="ALL">All Stations</option>
              {uniqueStations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Type</label>
            <select
              className="inp"
              value={detType}
              onChange={(e) => setDetType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="pending">Pending</option>
              <option value="disposal">Disposal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ margin: "12px 14px 0" }}>
        <div className="ctitle">📋 Case Numbered Register</div>
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
                <tr>
                  <td colSpan={6} className="no-data">
                    Loading…
                  </td>
                </tr>
              ) : filteredCnum.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">
                    {(db.cnum || []).length === 0
                      ? "No Case Numbered records found. Click Refresh to load."
                      : "No cases match the current filters."}
                  </td>
                </tr>
              ) : (
                filteredCnum.map((r, idx) => {
                  const ct = detectCaseType(r.cn);
                  return (
                    <tr key={idx}>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {ct && (
                          <span
                            style={{
                              marginRight: 4,
                              padding: "1px 6px",
                              borderRadius: 8,
                              fontSize: 9,
                              background: caseTypeColor(ct) + "22",
                              color: caseTypeColor(ct),
                              border: `1px solid ${caseTypeColor(ct)}55`,
                              fontWeight: 800,
                            }}
                          >
                            {ct}
                          </span>
                        )}
                        <span style={{ color: "var(--c-purple)" }}>
                          {r.cn || "—"}
                        </span>
                      </td>
                      <td className="mono" style={{ color: "var(--gold)" }}>
                        {r.fn || "—"}
                      </td>
                      <td style={{ fontSize: 11 }}>{r.sta || "—"}</td>
                      <td style={{ maxWidth: 180, wordBreak: "break-word" }}>
                        {r.pt || "—"}
                      </td>
                      <td>
                        <span
                          className={`vt-tag ${
                            (r.type || "").toLowerCase().trim() === "disposal"
                              ? "vt-tag-green"
                              : "vt-tag-blue"
                          }`}
                        >
                          {r.type || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-o btn-sm"
                          onClick={() => setActiveDetailCase(r)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
