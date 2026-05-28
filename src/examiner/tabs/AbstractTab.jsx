import { useState } from "react";

export default function AbstractTab({ db, tok, setDb }) {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  return (
    <div>
      <div className="card">
        <div className="ctitle">📊 Statistics & Abstract</div>
        <div className="msg-info">
          View statistics and generate abstracts. Tab refactored from Examiner.jsx.
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>Filter by Year</div>
          <select className="inp" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="stat-grid" style={{ marginTop: 16 }}>
          <div className="stat">
            <div className="stat-lbl">Total FIRs</div>
            <div className="stat-val">0</div>
            <div className="stat-sub">Year {filterYear}</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Pending</div>
            <div className="stat-val">0</div>
            <div className="stat-sub">Cases</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Disposed</div>
            <div className="stat-val">0</div>
            <div className="stat-sub">Cases</div>
          </div>
        </div>
      </div>
    </div>
  );
}
