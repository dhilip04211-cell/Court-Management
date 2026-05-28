import { useState } from "react";
import { SMAP } from "../constants/config.js";
import { firMatch } from "../utils/helpers.js";
import CaseDetail from "../components/CaseDetail.jsx";

export default function ViewerTab({ db }) {
  const [fn, setFn]             = useState("");
  const [yr, setYr]             = useState("");
  const [searched, setSearched] = useState(false);

  const [pendHits, setPendHits] = useState([]);
  const [dispHits, setDispHits] = useState([]);
  const [nvHits,   setNvHits]   = useState([]);
  const [cnHits,   setCnHits]   = useState([]);
  const [firHits,  setFirHits]  = useState([]);

  const [activeSt,     setActiveSt]     = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);

  function doSearch() {
    const trimmed = fn.trim();
    if (!trimmed) return;
    const sNum = String(parseInt(trimmed, 10) || trimmed);
    const sYr  = yr.trim();

    const fh = [];
    for (const s of SMAP) {
      const rows = (db.fir[s.sh] || []).filter(r => firMatch(r.cr, sNum, sYr));
      if (rows.length) fh.push({ s, rows });
    }

    const ph = db.pend.filter(r => firMatch(r.fn, sNum, sYr));
    const dh = db.disp.filter(r => firMatch(r.fn, sNum, sYr));
    const nh = db.nv.filter(r   => firMatch(r.fn, sNum, sYr));
    const ch = db.cnum.filter(r => firMatch(r.fn, sNum, sYr));

    setFirHits(fh); setPendHits(ph); setDispHits(dh); setNvHits(nh); setCnHits(ch);
    setSearched(true); setActiveSt(null); setActiveCaseId(null);
  }

  function doClear() {
    setFn(""); setYr(""); setSearched(false);
    setFirHits([]); setPendHits([]); setDispHits([]);
    setNvHits([]); setCnHits([]);
    setActiveSt(null); setActiveCaseId(null);
  }

  const displayFIR = yr ? `${fn}/${yr}` : fn;

  const allCaseRows = [
    ...pendHits.map(r => ({ ...r, _src: "pend" })),
    ...dispHits.map(r => ({ ...r, _src: "disp" })),
    ...nvHits.map(r   => ({ ...r, _src: "nv"   })),
    ...cnHits.map(r   => ({ ...r, _src: "cnum" })),
  ];

  const stationNames = [];
  const seenSt = new Set();
  for (const r of allCaseRows) {
    const ps = (r.sta || "").trim() || "(Blank Station)";
    if (!seenSt.has(ps)) { seenSt.add(ps); stationNames.push(ps); }
  }

  function getRowsForStation(stName) {
    if (!stName) return [];
    const isBlank = stName === "(Blank Station)";
    const stL = stName.toLowerCase();
    return allCaseRows.filter(r => {
      const ps = (r.sta || "").trim();
      const pt = (r.pt  || "").toLowerCase();
      if (isBlank) return !ps;
      return ps.toLowerCase() === stL
          || ps.toLowerCase().includes(stL)
          || (stL.includes(ps.toLowerCase()) && ps.length > 3)
          || pt.includes(stL);
    });
  }

  const stationRows = (activeSt && !activeSt.startsWith("fir::")) ? getRowsForStation(activeSt) : [];
  const totalHits = firHits.reduce((a, b) => a + b.rows.length, 0) + allCaseRows.length;

  return (
    <div>
      <div className="v-search-box">
        <div className="ctitle">🔍 FIR Search</div>
        <div className="v-inputs">
          <div className="fg" style={{ flex:"1 1 100px" }}>
            <label className="lbl">FIR Number</label>
            <input className="inp mono" type="tel" inputMode="numeric"
              value={fn} onChange={e => setFn(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="e.g. 12"/>
          </div>
          <div className="fg" style={{ flex:"1 1 80px" }}>
            <label className="lbl">Year (optional)</label>
            <input className="inp mono" type="tel" inputMode="numeric"
              value={yr} onChange={e => setYr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="2025"/>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button className="btn btn-g" style={{height:36}} onClick={doSearch}>Search</button>
            <button className="btn btn-o btn-sm" style={{height:36}} onClick={doClear}>✕</button>
          </div>
        </div>
      </div>

      {searched && totalHits === 0 && (
        <div style={{textAlign:"center",padding:"28px 20px"}}>
          <div style={{fontSize:22,marginBottom:8}}>🔍</div>
          <div style={{fontSize:13,fontWeight:600,color:"var(--txt2)",marginBottom:4}}>
            No records found for <span style={{color:"var(--gold)"}}>{displayFIR}</span>
          </div>
        </div>
      )}

      {searched && totalHits > 0 && (
        <>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:10}}>
            <b style={{color:"var(--gold)"}}>{totalHits}</b> record{totalHits>1?"s":""} for{" "}
            <b style={{color:"var(--gold)"}}>{displayFIR}</b>
          </div>

          {firHits.length > 0 && (
            <div style={{marginBottom:14}}>
              <div className="lbl" style={{marginBottom:6}}>📋 FIR Pending Register</div>
              <div className="pill-row">
                {firHits.map(({ s, rows }) => {
                  const key = "fir::" + s.sh;
                  return (
                    <div key={key}
                      className={`pill ${activeSt===key?"active":""}`}
                      onClick={() => { setActiveSt(activeSt===key?null:key); setActiveCaseId(null); }}>
                      {s.lb}
                      <span style={{fontSize:9,opacity:.6,marginLeft:1}}>FIR</span>
                      <span className="pill-cnt">{rows.length}</span>
                    </div>
                  );
                })}
              </div>

              {activeSt && activeSt.startsWith("fir::") && (() => {
                const shKey = activeSt.replace("fir::","");
                const sObj  = SMAP.find(s => s.sh===shKey);
                const rows  = (firHits.find(x => x.s.sh===shKey)||{}).rows||[];
                return (
                  <div className="v-panel">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"var(--gold)"}}>{sObj?.lb}</span>
                      <span className="bdg bdg-r">📋 FIR Pending Register</span>
                    </div>
                    {rows.map((r,i) => (
                      <div key={i} className="v-fir-row">
                        <div className="det-grid">
                          <div><div className="df-lbl">CR Number</div><div className="df-val hi mono">{r.cr}</div></div>
                          <div><div className="df-lbl">Section U/s</div><div className="df-val">{r.sec||"—"}</div></div>
                          <div><div className="df-lbl">Date Received</div><div className="df-val mono">{r.dr||"—"}</div></div>
                          <div><div className="df-lbl">Year</div><div className="df-val mono">{r.yr||"—"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {stationNames.length > 0 && (
            <div style={{marginBottom:14}}>
              <div className="lbl" style={{marginBottom:6}}>⚖ Cases — tap a station</div>
              <div className="pill-row">
                {stationNames.map(ps => {
                  const cnt = getRowsForStation(ps).length;
                  return (
                    <div key={ps}
                      className={`pill ${activeSt===ps?"active":""}`}
                      onClick={() => { setActiveSt(activeSt===ps?null:ps); setActiveCaseId(null); }}>
                      {ps}<span className="pill-cnt">{cnt}</span>
                    </div>
                  );
                })}
              </div>

              {activeSt && !activeSt.startsWith("fir::") && (
                <div className="v-panel">
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--gold)"}}>{activeSt}</span>
                    {stationRows.filter(r=>r._src==="pend").length>0 &&
                      <span className="bdg bdg-b">⚖ {stationRows.filter(r=>r._src==="pend").length} Pending</span>}
                    {stationRows.filter(r=>r._src==="disp").length>0 &&
                      <span className="bdg bdg-g">✓ {stationRows.filter(r=>r._src==="disp").length} Disposed</span>}
                    {stationRows.filter(r=>r._src==="nv").length>0 &&
                      <span className="bdg bdg-a">🏷 {stationRows.filter(r=>r._src==="nv").length} NV</span>}
                    {stationRows.filter(r=>r._src==="cnum").length>0 &&
                      <span className="bdg bdg-p">📁 {stationRows.filter(r=>r._src==="cnum").length} Case#</span>}
                  </div>

                  {[
                    { src:"pend", title:"⚖ Case Pending",          bdg:"bdg-b" },
                    { src:"disp", title:"✅ Disposed Cases",        bdg:"bdg-g" },
                    { src:"nv",   title:"🏷 Non-Valuable Property", bdg:"bdg-a" },
                    { src:"cnum", title:"📁 Case Numbered",         bdg:"bdg-p" },
                  ].map(({ src, title, bdg }) => {
                    const srcRows = stationRows.filter(r => r._src===src);
                    if (!srcRows.length) return null;
                    return (
                      <div key={src} className="v-sheet-sec">
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <span className="lbl">{title}</span>
                          <span className={`bdg ${bdg}`}>{srcRows.length}</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
                          {srcRows.map((r,i) => {
                            const caseId = `${src}::${r.ri}::${i}`;
                            const label = (r.cn||"").trim()||(r.rp||"").trim()||`#${r.sl||r.sno||r.ri}`;
                            return (
                              <div key={caseId}
                                className={`cn-pill ${activeCaseId===caseId?"active":""}`}
                                onClick={() => setActiveCaseId(activeCaseId===caseId?null:caseId)}>
                                {label}
                              </div>
                            );
                          })}
                        </div>
                        {srcRows.map((r,i) => {
                          const caseId = `${src}::${r.ri}::${i}`;
                          if (activeCaseId!==caseId) return null;
                          return <CaseDetail key={caseId} r={r} srcKey={src}/>;
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
