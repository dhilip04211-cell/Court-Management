import { useState } from "react";
import { SMAP } from "../constants/config.js";

export default function ViewerTab({ db }) {
  const [selectedStation, setSelectedStation] = useState(SMAP[0]?.sh || "");

  if (!db) {
    return <div className="card"><div className="ctitle">🔍 Viewer</div><p>Loading data...</p></div>;
  }

  const stationData = db.fir[selectedStation] || [];

  return (
    <div>
      <div className="v-search-box">
        <div className="ctitle">🔍 Search FIR Records</div>
        <div className="v-inputs">
          <select className="inp" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
            {SMAP.map(s => (
              <option key={s.sh} value={s.sh}>{s.lb}</option>
            ))}
          </select>
          <div style={{ color: "var(--txt3)", fontSize: 12 }}>
            Found: {stationData.length} records
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ctitle">📋 {SMAP.find(s => s.sh === selectedStation)?.lb || "Records"}</div>
        {stationData.length === 0 ? (
          <div className="no-data">No records found</div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sl</th>
                  <th>FIR No</th>
                  <th>Section</th>
                  <th>DR</th>
                </tr>
              </thead>
              <tbody>
                {stationData.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td>{r.sl}</td>
                    <td>{r.cr}</td>
                    <td>{r.sec}</td>
                    <td>{r.dr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
