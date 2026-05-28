import { useState } from "react";
import { SMAP, SID } from "../constants/config.js";
import { firMatch } from "../utils/helpers.js";
import { sheetsAppend, sheetsDeleteRow } from "../utils/sheets.js";

export default function FTCTab({ db, setDb, tok }) {
  const curYr = String(new Date().getFullYear());
  const [step,setStep]       = useState(1);
  const [fn,setFn]           = useState("");
  const [yr,setYr]           = useState(curYr);
  const [st,setSt]           = useState("JKM");
  const [firRow,setFirRow]   = useState(null);
  const [selCase,setSelCase] = useState(null);
  const [msg,setMsg]         = useState(null);

  function reset() {
    setStep(1);setFn("");setYr(curYr);setSt("JKM");
    setFirRow(null);setSelCase(null);setMsg(null);
  }

  function searchFIR() {
    if (!fn) { setMsg({type:"err",text:"Enter FIR Number."}); return; }
    const sNum = String(parseInt(fn,10)||fn);
    const rows = (db.fir[st]||[]).filter(r=>firMatch(r.cr,sNum,yr));
    if (!rows.length) {
      setMsg({type:"err",text:`FIR ${fn}/${yr} not found in ${SMAP.find(s=>s.sh===st)?.lb}.`});
      return;
    }
    setFirRow(rows[0]); setStep(2); setMsg(null);
  }

  function buildCases() {
    const sNum = String(parseInt(fn,10)||fn);
    return [
      ...db.pend.filter(c=>firMatch(c.fn,sNum,yr)).map(c=>({...c,_type:"pending"})),
      ...db.disp.filter(c=>firMatch(c.fn,sNum,yr)).map(c=>({...c,_type:"disposal"})),
    ];
  }

  async function execute() {
    setMsg({type:"loading",text:"Processing…"});
    const sc=selCase;
    const stLb=SMAP.find(x=>x.sh===st)?.lb||st;
    const row=[
      `${fn}/${yr}`,stLb,firRow?.sec||"",firRow?.dr||"",
      sc.cn||"",sc.pt||"",sc.adv||"",sc.dreg||"",
      sc.nxt||sc.ddec||"",sc._type||"",sc.sec||"",sc.nat||"",sc.des||""
    ];
    const saved=await sheetsAppend(tok,SID.casenum,"Sheet1!A:M",[row]);
    if (!saved) { setMsg({type:"err",text:"Failed to save to Case Numbered sheet."}); return; }
    if (firRow?.ri && firRow.ri!==999999) {
      await sheetsDeleteRow(tok,SID.fir,st,firRow.ri);
    }
    const idx=(db.fir[st]||[]).findIndex(r=>r.cr===firRow?.cr);
    if (idx>=0) {
      const newFir=[...(db.fir[st]||[])];
      newFir.splice(idx,1);
      setDb(prev=>({...prev,fir:{...prev.fir,[st]:newFir},cnum:[...prev.cnum,{fn:`${fn}/${yr}`,sta:stLb,...sc}]}));
    }
    setMsg({type:"ok",text:`✓ FIR ${fn}/${yr} moved to Case Numbered.`});
    setTimeout(reset,1600);
  }

  const allCases=step>=2?buildCases():[];
  const stLb=SMAP.find(x=>x.sh===st)?.lb||st;

  return (
    <div className="card">
      <div className="ctitle">📁 FIR → Case Numbered</div>
      <div className="step-row">
        {[1,2,3].map((n,i) => (
          <div key={n} style={{display:"flex",alignItems:"center",flex:i<2?"1":"initial",gap:4}}>
            <div className={`step-dot ${step>n?"done":step===n?"act":""}`}>{step>n?"✓":n}</div>
            {i<2 && <div className="step-line"/>}
          </div>
        ))}
      </div>

      {step===1 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 1 — Enter FIR details</div>
          <div className="frow">
            <div className="fg">
              <label className="lbl">FIR Number</label>
              <input className="inp mono" type="tel" inputMode="numeric" value={fn}
                onChange={e=>setFn(e.target.value)} placeholder="e.g. 561"/>
            </div>
            <div className="fg">
              <label className="lbl">Year</label>
              <input className="inp mono" type="tel" inputMode="numeric" value={yr}
                onChange={e=>setYr(e.target.value)} placeholder={curYr}/>
            </div>
            <div className="fg">
              <label className="lbl">Police Station</label>
              <select className="inp" value={st} onChange={e=>setSt(e.target.value)}>
                {SMAP.map(s=><option key={s.sh} value={s.sh}>{s.lb}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-g" onClick={searchFIR}>🔍 Search FIR</button>
        </div>
      )}

      {step===2 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 2 — Select linked case</div>
          {firRow && (
            <div className="msg-info" style={{marginBottom:10}}>
              ✓ FIR {firRow.cr} — {firRow.sec} | Received: {firRow.dr}
            </div>
          )}
          <div style={{fontSize:11,color:"var(--txt2)",marginBottom:6}}>
            Matched cases ({allCases.length})
          </div>
          {allCases.length===0
            ? <div className="no-data">No pending/disposal cases found for FIR {fn}/{yr}.</div>
            : allCases.map((c,i) => (
              <div key={i}
                className={`case-sel ${selCase?.cn===c.cn&&selCase?._type===c._type?"sel":""}`}
                onClick={()=>setSelCase(c)}>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:"JetBrains Mono,monospace"}}>{c.cn||"—"}</div>
                  <div style={{color:"var(--txt2)",fontSize:12,marginTop:2,wordBreak:"break-word"}}>{c.pt}</div>
                  <div style={{color:"var(--txt3)",fontSize:11,marginTop:2}}>{c.sta||""}{c.dreg?` · ${c.dreg}`:""}</div>
                </div>
                <span className={`bdg ${c._type==="pending"?"bdg-b":"bdg-g"}`} style={{flexShrink:0}}>
                  {c._type==="pending"?"Pending":"Disposed"}
                </span>
              </div>
            ))
          }
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button className="btn btn-o" onClick={()=>{setStep(1);setSelCase(null);}}>← Back</button>
            <button className="btn btn-g" disabled={!selCase} onClick={()=>setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{fontSize:11,color:"var(--txt3)",marginBottom:12}}>Step 3 — Confirm & Execute</div>
          <div className="confirm-box">
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
                FIR: {fn}/{yr}
              </span>
              <span className="bdg bdg-a">{stLb}</span>
              <span style={{color:"var(--txt2)"}}>→</span>
              <span className="bdg bdg-p">{selCase?.cn||"N/A"}</span>
            </div>
            <div className="det-grid">
              <div><div className="df-lbl">Section U/s</div><div className="df-val">{firRow?.sec||"—"}</div></div>
              <div><div className="df-lbl">Date Received</div><div className="df-val mono">{firRow?.dr||"—"}</div></div>
              <div><div className="df-lbl">Case Number</div>
                <div className="df-val mono" style={{color:"var(--pur)"}}>{selCase?.cn||"—"}</div>
              </div>
              <div><div className="df-lbl">Police Station</div><div className="df-val">{selCase?.sta||"—"}</div></div>
              <div style={{gridColumn:"1/-1"}}>
                <div className="df-lbl">Petitioner VS Respondent</div>
                <div className="df-val">{selCase?.pt||"—"}</div>
              </div>
            </div>
          </div>
          <div className="warn-box">
            ⚠ This will delete FIR {fn}/{yr} from the "{st}" sheet and save to Case Numbered.
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-o" onClick={()=>setStep(2)}>← Back</button>
            <button className="btn btn-r" onClick={execute}>🗂 Move to Case Numbered</button>
          </div>
        </div>
      )}

      {msg && (
        <div className={msg.type==="ok"?"msg-ok":msg.type==="err"?"msg-err":"msg-info"} style={{marginTop:10}}>
          {msg.type==="loading"&&<span className="spin" style={{display:"inline-block",marginRight:6}}/>}
          {msg.text}
        </div>
      )}
    </div>
  );
}
