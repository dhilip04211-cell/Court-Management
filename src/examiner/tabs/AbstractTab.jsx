import { useState } from "react";
import { SMAP } from "../constants/config.js";
import { isValidFIRCell, parseFIR } from "../utils/helpers.js";
import { sheetsGet, sheetsUpdate } from "../utils/sheets.js";
import StationYearMatrix from "../components/StationYearMatrix.jsx";

export default function AbstractTab({ db, tok, setDb }) {
  const [filterSt,  setFilterSt]  = useState("ALL");
  const [filterYr,  setFilterYr]  = useState("ALL");
  const [filterDate,setFilterDate]= useState("");
  const [filterSec, setFilterSec] = useState("");
  const [listSearch,setListSearch]= useState("");
  const [renumMsg,  setRenumMsg]  = useState(null);

  const allFirs = [];
  for (const s of SMAP) {
    for (const r of (db.fir[s.sh]||[])) {
      if (!isValidFIRCell(r.cr)) continue;
      const yr = parseFIR(r.cr).yr || "";
      allFirs.push({ ...r, yr, stSh: s.sh, stLb: s.lb });
    }
  }

  const allYears = [...new Set(allFirs.map(r=>r.yr).filter(Boolean))].sort();

  const filtered = allFirs.filter(r => {
    if (filterSt!=="ALL" && r.stSh!==filterSt) return false;
    if (filterYr!=="ALL" && r.yr!==filterYr)   return false;
    if (filterDate && !((r.dr||"").includes(filterDate))) return false;
    if (filterSec  && !(r.sec||"").toLowerCase().includes(filterSec.toLowerCase())) return false;
    return true;
  });

  const grand = filtered.length;
  const stTot = SMAP.map(s=>({ sh:s.sh, lb:s.lb, cnt:filtered.filter(r=>r.stSh===s.sh).length }));

  const firStationMap = {};
  for (const r of allFirs) {
    if (!firStationMap[r.cr]) firStationMap[r.cr] = new Set();
    firStationMap[r.cr].add(r.stSh);
  }
  const conflicts = Object.entries(firStationMap)
    .filter(([,v]) => v.size > 1)
    .map(([cr, stations]) => ({ cr, stations: [...stations] }));

  const byYr={};
  for (const r of filtered) { const k=r.yr||"?"; byYr[k]=(byYr[k]||0)+1; }
  const yrSort=Object.entries(byYr).sort((a,b)=>a[0].localeCompare(b[0]));

  const byMon={};
  for (const r of filtered) {
    if (r.dr) {
      const pts=r.dr.trim().split(".");
      if (pts.length>=3) { const k=`${pts[2].trim()}-${pts[1].trim().padStart(2,"0")}`; byMon[k]=(byMon[k]||0)+1; }
    }
  }
  const monNames=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monSort=Object.entries(byMon).sort((a,b)=>a[0].localeCompare(b[0]));

  const byDay={};
  for (const r of filtered) { if (r.dr&&r.dr.trim()) { const k=r.dr.trim(); byDay[k]=(byDay[k]||0)+1; } }
  function parseDDMMYYYY(s) { const p=s.split("."); if(p.length<3) return 0; return new Date(p[2],p[1]-1,p[0]).getTime()||0; }
  const daySort=Object.entries(byDay).sort((a,b)=>parseDDMMYYYY(a[0])-parseDDMMYYYY(b[0])).slice(-30).reverse();

  const [secSearch,setSecSearch]=useState("");
  const bySec={};
  for (const r of filtered) { const k=(r.sec||"Unknown").trim(); bySec[k]=(bySec[k]||0)+1; }
  const secAll=Object.entries(bySec).sort((a,b)=>b[1]-a[1]);
  const secShow=secSearch ? secAll.filter(([k])=>k.toLowerCase().includes(secSearch.toLowerCase())) : secAll.slice(0,40);

  const listFiltered=filtered.filter(r => {
    if (!listSearch) return true;
    const q=listSearch.toLowerCase();
    return (r.cr||"").toLowerCase().includes(q)||(r.sec||"").toLowerCase().includes(q)
      ||(r.dr||"").toLowerCase().includes(q)||(r.stLb||"").toLowerCase().includes(q);
  });

  function resetAll() { setFilterSt("ALL");setFilterYr("ALL");setFilterDate("");setFilterSec("");setListSearch(""); }
  const hasFilters=filterSt!="ALL"||filterYr!="ALL"||filterDate||filterSec;

  async function batchRenumber() {
    setRenumMsg({type:"loading",text:"Renumbering all sheets…"});
    let totalFixed=0;
    for (const s of SMAP) {
      const rawRows = await sheetsGet(tok, SID.fir, `${s.sh}!A:D`);
      let slCounter=1;
      for (let i=0; i<rawRows.length; i++) {
        const b=(rawRows[i][1]||"").toString().trim();
        if (isValidFIRCell(b)) {
          const currentSl=(rawRows[i][0]||"").toString().trim();
          if (currentSl!==String(slCounter)) {
            await sheetsUpdate(tok, SID.fir, `${s.sh}!A${i+1}`, [[slCounter]]);
            totalFixed++;
          }
          slCounter++;
        }
      }
    }
    setRenumMsg({type:"ok",text:`✓ Fixed ${totalFixed} serial number(s) across all sheets.`});
    setTimeout(()=>setRenumMsg(null),3000);
  }

  return (
    <div>
      <div className="card">
        <div className="ctitle">
          🔦 Filters
          {hasFilters && (
            <button className="btn btn-o btn-sm" style={{marginLeft:"auto"}} onClick={resetAll}>✕ Reset All</button>
          )}
        </div>
        <div className="frow">
          <div className="fg">
            <label className="lbl">Station</label>
            <select className="inp" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
              <option value="ALL">All Stations</option>
              {SMAP.map(s=><option key={s.sh} value={s.sh}>{s.lb}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Year</label>
            <select className="inp" value={filterYr} onChange={e=>setFilterYr(e.target.value)}>
              <option value="ALL">All Years</option>
              {allYears.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Date (partial)</label>
            <input className="inp mono" type="text" value={filterDate}
              onChange={e=>setFilterDate(e.target.value)} placeholder="e.g. 05.2026"/>
          </div>
          <div className="fg">
            <label className="lbl">Section (keyword)</label>
            <div className="search-wrap">
              <input className="inp" type="text" value={filterSec}
                onChange={e=>setFilterSec(e.target.value)} placeholder="e.g. 307 IPC"/>
              {filterSec && <button className="search-clear" onClick={()=>setFilterSec("")}>✕</button>}
            </div>
          </div>
        </div>
        {hasFilters && (
          <div style={{fontSize:11,color:"var(--gold)",marginTop:4}}>
            Showing <b>{grand}</b> of <b>{allFirs.length}</b> FIRs
          </div>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="card" style={{borderColor:"var(--red)"}}>
          <div className="ctitle" style={{color:"var(--red)"}}>⚠ Data Conflicts — FIRs in Multiple Stations ({conflicts.length})</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>CR Number</th><th>Found In Stations</th></tr></thead>
              <tbody>
                {conflicts.map(({cr,stations}) => (
                  <tr key={cr}>
                    <td className="mono" style={{color:"var(--red)",fontWeight:700}}>{cr}</td>
                    <td>{stations.map(sh=><span key={sh} className="bdg bdg-r" style={{marginRight:4}}>{sh}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-lbl">Total Pending FIRs</div>
          <div className="stat-val">{grand}</div>
          <div className="stat-sub">{hasFilters?"Filtered":allFirs.length+" total"}</div>
        </div>
        {stTot.filter(s=>s.cnt>0).map(s=>(
          <div key={s.sh}
            className={`stat ${filterSt===s.sh?"active-st":""}`}
            onClick={()=>setFilterSt(filterSt===s.sh?"ALL":s.sh)}>
            <div className="stat-lbl">{s.lb}</div>
            <div className="stat-val">{s.cnt}</div>
            <div className="stat-sub mono" style={{fontSize:9}}>{s.sh}</div>
          </div>
        ))}
      </div>

      <div className="abs-grid">
        <div className="card">
          <div className="ctitle">📍 Station-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Tab</th><th>Station</th><th>FIRs</th><th>%</th></tr></thead>
            <tbody>
              {stTot.map(s=>(
                <tr key={s.sh} style={{cursor:"pointer"}} onClick={()=>setFilterSt(filterSt===s.sh?"ALL":s.sh)}>
                  <td className="mono" style={{color:"var(--txt3)"}}>{s.sh}</td>
                  <td>{s.lb}</td>
                  <td><b className="mono" style={{color:s.cnt>0?"var(--gold)":"var(--txt3)"}}>{s.cnt}</b></td>
                  <td className="mono">{grand?((s.cnt/grand)*100).toFixed(1):0}%</td>
                </tr>
              ))}
              <tr className="tot-row"><td colSpan={2}>Total</td><td><b className="mono">{grand}</b></td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📅 Year-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Year</th><th>FIRs</th><th>%</th></tr></thead>
            <tbody>
              {yrSort.map(([k,v])=> (
                <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterYr(filterYr===k?"ALL":k)}>
                  <td><span className="yr-badge">{k}</span>{filterYr===k&&<span style={{marginLeft:4,color:"var(--gold)",fontSize:9}}>▶</span>}</td>
                  <td className="mono"><b>{v}</b></td>
                  <td className="mono">{grand?((v/grand)*100).toFixed(1):0}%</td>
                </tr>
              ))}
              <tr className="tot-row"><td>Total</td><td className="mono"><b>{grand}</b></td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📆 Month-wise</div>
          <table className="abs-tbl">
            <thead><tr><th>Month</th><th>FIRs</th></tr></thead>
            <tbody>
              {monSort.length===0
                ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                : monSort.map(([k,v])=>{
                  const [my,mn]=k.split("-");
                  return <tr key={k}><td>{monNames[parseInt(mn,10)]||mn} {my}</td><td className="mono"><b>{v}</b></td></tr>;
                })
              }
              {monSort.length>0&&<tr className="tot-row"><td>Total</td><td className="mono"><b>{monSort.reduce((a,b)=>a+b[1],0)}</b></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">📋 Recent 30 Dates</div>
          <table className="abs-tbl">
            <thead><tr><th>Date</th><th>FIRs</th></tr></thead>
            <tbody>
              {daySort.length===0
                ? <tr><td colSpan={2} className="no-data">No date data</td></tr>
                : daySort.map(([k,v])=> (
                  <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterDate(filterDate===k?"":k)}>
                    <td className="mono" style={filterDate===k?{color:"var(--gold)",fontWeight:700}:{}}>{k}</td>
                    <td className="mono"><b>{v}</b></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">⚖ Section U/s-wise
            <span style={{marginLeft:"auto",fontWeight:400,color:"var(--txt3)",fontSize:9}}>
              {secShow.length}/{secAll.length}
            </span>
          </div>
          <div className="search-wrap" style={{marginBottom:10}}>
            <input className="inp" type="text" value={secSearch}
              onChange={e=>setSecSearch(e.target.value)} placeholder="Search section…"/>
            {secSearch&&<button className="search-clear" onClick={()=>setSecSearch("")}>✕</button>}
          </div>
          <table className="abs-tbl">
            <thead><tr><th>#</th><th>Section U/s</th><th>FIRs</th></tr></thead>
            <tbody>
              {secShow.length===0
                ? <tr><td colSpan={3} className="no-data">No match</td></tr>
                : secShow.map(([k,v],i)=>(
                  <tr key={k} style={{cursor:"pointer"}} onClick={()=>setFilterSec(filterSec===k?"":k)}>
                    <td className="mono" style={{color:"var(--txt3)"}}>{i+1}</td>
                    <td style={filterSec&&k.toLowerCase().includes(filterSec.toLowerCase())?{color:"var(--gold)"}:{}}>{k}</td>
                    <td className="mono"><b>{v}</b></td>
                  </tr>
                ))
              }
              <tr className="tot-row"><td colSpan={2}>Total</td><td className="mono"><b>{grand}</b></td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="ctitle">🔧 Maintenance</div>
          <div style={{fontSize:12,color:"var(--txt2)",marginBottom:10,lineHeight:1.6}}>
            Renumber all Sl (serial number) columns across every station sheet in ascending order.
            Use this if Sl numbers are out of sync after edits or deletions.
          </div>
          <button className="btn btn-o" onClick={batchRenumber}>🔢 Fix All Serial Numbers</button>
          {renumMsg && (
            <div className={renumMsg.type==="ok"?"msg-ok":"msg-info"} style={{marginTop:8}}>
              {renumMsg.type==="loading"&&<span className="spin" style={{display:"inline-block",marginRight:6}}/>}
              {renumMsg.text}
            </div>
          )}
        </div>

        <div className="card" style={{gridColumn:"1/-1"}}>
          <div className="ctitle">📊 Station × Year Matrix</div>
          <StationYearMatrix allFirs={filtered} years={allYears} stTot={stTot}
            setFilterSt={setFilterSt} setFilterYr={setFilterYr}/>
        </div>

        <div className="card" style={{gridColumn:"1/-1"}}>
          <div className="ctitle">
            📋 FIR Pending List
            {filterSt!="ALL"&&<span className="bdg bdg-a" style={{marginLeft:6}}>{SMAP.find(s=>s.sh===filterSt)?.lb}</span>}
            {filterYr!="ALL"&&<span className="yr-badge" style={{marginLeft:4}}>{filterYr}</span>}
            <span style={{marginLeft:"auto",fontWeight:400,color:"var(--txt3)",fontSize:10}}>{listFiltered.length} records</span>
          </div>
          <div className="search-wrap" style={{marginBottom:10}}>
            <input className="inp" type="text" value={listSearch}
              onChange={e=>setListSearch(e.target.value)} placeholder="Search CR No., section, date, station…"/>
            {listSearch&&<button className="search-clear" onClick={()=>setListSearch("")}>✕</button>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Year</th><th>Station</th><th>Section U/s</th><th>Date Received</th></tr>
              </thead>
              <tbody>
                {listFiltered.slice(0,300).map((r,i)=>(
                  <tr key={i}>
                    <td className="mono" style={{color:"var(--txt3)"}}>{r.sl}</td>
                    <td className="mono" style={{color:"var(--gold)",fontWeight:700}}>{r.cr}</td>
                    <td><span className="yr-badge">{r.yr||"?"}</span></td>
                    <td><span style={{color:"var(--txt2)",fontSize:11}}>{r.stLb}</span><span style={{color:"var(--txt3)",fontSize:9,marginLeft:4}}>({r.stSh})</span></td>
                    <td style={{maxWidth:220,wordBreak:"break-word"}}>{r.sec}</td>
                    <td className="mono">{r.dr||"—"}</td>
                  </tr>
                ))}
                {listFiltered.length===0&&<tr><td colSpan={6} className="no-data">No FIRs match filters.</td></tr>}
                {listFiltered.length>300&&(
                  <tr><td colSpan={6} style={{textAlign:"center",padding:10,color:"var(--txt3)",fontSize:11}}>
                    Showing 300 of {listFiltered.length} — apply filters to narrow.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
