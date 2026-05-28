import React from "react";

/**
 * Export data as Excel (.xlsx) using SheetJS (xlsx) loaded via CDN script tag.
 * Falls back to CSV if xlsx not available.
 */
function exportToExcel(filename, sheetName, headers, rows) {
  try {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("no xlsx");
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  } catch {
    // fallback: CSV download
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename.replace(/\.xlsx$/, ".csv");
    a.click();
  }
}

export default function StationYearMatrix({ allFirs, years, stTot, setFilterSt, setFilterYr }) {
  // Show ALL years sorted ascending (not just last 15)
  const yrList = [...years].sort();

  if (!yrList.length || !allFirs.length)
    return <div className="no-data">No data.</div>;

  const matrix = {};
  for (const r of allFirs) {
    const key = `${r.stSh}::${r.yr}`;
    matrix[key] = (matrix[key] || 0) + 1;
  }

  const yrTotals = {};
  for (const y of yrList) yrTotals[y] = allFirs.filter(r => r.yr === y).length;

  const activeStations = stTot.filter(s => {
    return yrList.some(y => (matrix[`${s.sh}::${y}`] || 0) > 0);
  });

  function handleExport() {
    const headers = ["Station", ...yrList, "Total"];
    const rows = activeStations.map(s => {
      const total = yrList.reduce((a, y) => a + (matrix[`${s.sh}::${y}`] || 0), 0);
      return [s.lb, ...yrList.map(y => matrix[`${s.sh}::${y}`] || 0), total];
    });
    const grandRow = ["Year Total", ...yrList.map(y => yrTotals[y] || 0),
      yrList.reduce((a, y) => a + (yrTotals[y] || 0), 0)];
    rows.push(grandRow);
    exportToExcel("Station_Year_Matrix.xlsx", "Matrix", headers, rows);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn btn-o btn-sm" onClick={handleExport}>⬇ Export Excel</button>
      </div>
      <div className="tbl-wrap">
        <table className="abs-tbl" style={{ fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 110 }}>Station</th>
              {yrList.map(y => (
                <th key={y} style={{ cursor: "pointer", textAlign: "center", minWidth: 52 }}
                  onClick={() => setFilterYr(y)}>
                  <span className="yr-badge">{y}</span>
                </th>
              ))}
              <th style={{ color: "var(--gold-l)", textAlign: "center" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {activeStations.map(s => {
              const rowTotal = yrList.reduce((a, y) => a + (matrix[`${s.sh}::${y}`] || 0), 0);
              return (
                <tr key={s.sh} style={{ cursor: "pointer" }} onClick={() => setFilterSt(s.sh)}>
                  <td style={{ fontWeight: 600 }}>
                    {s.lb}
                    <span style={{ color: "var(--txt3)", fontSize: 9, marginLeft: 4 }}>({s.sh})</span>
                  </td>
                  {yrList.map(y => {
                    const v = matrix[`${s.sh}::${y}`] || 0;
                    return (
                      <td key={y} className="mono"
                        style={{ textAlign: "center", color: v > 0 ? "var(--txt)" : "var(--txt3)" }}>
                        {v || "—"}
                      </td>
                    );
                  })}
                  <td className="mono" style={{ textAlign: "center", color: "var(--gold)", fontWeight: 700 }}>
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
            <tr className="tot-row">
              <td>Year Total</td>
              {yrList.map(y => (
                <td key={y} className="mono" style={{ textAlign: "center" }}>{yrTotals[y] || 0}</td>
              ))}
              <td className="mono" style={{ textAlign: "center" }}>
                {yrList.reduce((a, y) => a + (yrTotals[y] || 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}