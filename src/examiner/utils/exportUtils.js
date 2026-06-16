// ════════════════════════════════════════════════════════════════
//  exportUtils.js
//  Shared export helpers used by AbstractTab inner components.
// ════════════════════════════════════════════════════════════════

export function exportToExcel(filename, sheetsData) {
  try {
    const XLSX = window.XLSX; if (!XLSX) throw new Error("no xlsx");
    const wb = XLSX.utils.book_new();
    for (const { name, headers, rows } of sheetsData) {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename);
  } catch {
    const { headers, rows } = sheetsData[0];
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename.replace(/\.xlsx$/, ".csv"); a.click();
  }
}

export function exportToWord(filename, title, headers, rows, options = {}) {
  const pageSize = options.pageSize || 'A4';
  const orientation = options.orientation || 'portrait';
  const fontSize = options.fontSize || 12;
  const cellPadding = options.cellPadding || 6;
  const pageRule = options.pageSize || options.orientation
    ? `@page { size: ${pageSize} ${orientation}; margin: 12mm; }` : '';
  const style = `
    <style>${pageRule} body{font-family:'Times New Roman', Times, serif; color:#000; margin: 12mm;}
    table{border-collapse:collapse;width:100%;table-layout:fixed;}
    th,td{border:1px solid #444;padding:${cellPadding}px;text-align:left;font-size:${fontSize}px;word-wrap:break-word;}
    th{background:#f3f3f3;} h2{margin-bottom:16px;}</style>`;
  const thead = `<tr>${headers.map(h => `<th>${String(h)}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${r.map(c => `<td>${String(c ?? '')}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body><h2>${title}</h2><table>${thead}${tbody}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.replace(/\.xlsx$|\.csv$/i, '.doc');
  a.click();
}
