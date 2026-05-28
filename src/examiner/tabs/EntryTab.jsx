import { useState, useEffect } from "react";
import { SMAP, SID } from "../constants/config.js";
import { firMatch, firSortKey } from "../utils/helpers.js";
import { sheetsDeleteRow, insertFIRSorted, updateFIRRow } from "../utils/sheets.js";
import SectionBuilder from "../components/SectionBuilder.jsx";

export default function EntryTab({ db, setDb, tok }) {
  const curYr = String(new Date().getFullYear());
  const [fn,  setFn]  = useState(() => { try { return localStorage.getItem("fir_draft_fn")||""; } catch { return ""; } });
  const [yr,  setYr]  = useState(() => { try { return localStorage.getItem("fir_draft_yr")||curYr; } catch { return curYr; } });
  const [st,  setSt]  = useState(() => { try { return localStorage.getItem("fir_draft_st")||""; } catch { return ""; } });
  const [uns, setUns] = useState(() => { try { return localStorage.getItem("fir_draft_uns")||""; } catch { return ""; } });
  const [dt,  setDt]  = useState(() => { try { return localStorage.getItem("fir_draft_dt")||""; } catch { return ""; } });
  const [msg, setMsg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [existingRow, setExistingRow] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("fir_draft_fn", fn);
      localStorage.setItem("fir_draft_yr", yr);
      localStorage.setItem("fir_draft_st", st);
      localStorage.setItem("fir_draft_uns", uns);
      localStorage.setItem("fir_draft_dt", dt);
    } catch {}
  }, [fn, yr, st, uns, dt]);

  useEffect(() => {
    if (!fn || !yr || !st) { setEditMode(false); setExistingRow(null); return; }
    const sNum = String(parseInt(fn, 10) || fn);
    const rows = (db.fir[st] || []).filter(r => firMatch(r.cr, sNum, yr));
    if (rows.length) { setExistingRow(rows[0]); setEditMode(true); } else { setExistingRow(null); setEditMode(false); }
  }, [fn, yr, st]);

  function loadExisting() {
    if (!existingRow) return;
    setUns(existingRow.sec || "");
    setDt(existingRow.dr || "");
    setMsg({ type:"info", text:`Loaded FIR ${existingRow.cr} for editing.` });
  }

  function clearDraft() {
    setFn(""); setUns(""); setDt(""); setMsg(null); setEditMode(false); setExistingRow(null);
    setYr(curYr); setSt("");
    try {
      localStorage.removeItem("fir_draft_fn"); localStorage.removeItem("fir_draft_yr");
      localStorage.removeItem("fir_draft_st"); localStorage.removeItem("fir_draft_uns");
      localStorage.removeItem("fir_draft_dt");
    } catch {}
  }

  async function save() {
    if (!fn || !yr || !st) { setMsg({type:"err",text:"Enter FIR Number, Year, and select a Station."}); return; }
    if (!uns) { setMsg({type:"err",text:"Section U/s is required."}); return; }
    if (!dt || dt.length < 10) { setMsg({type:"err",text:"Enter a valid date (DD.MM.YYYY)."}); return; }
    const cr = `${parseInt(fn,10)}/${yr}`;

    if (editMode && existingRow) {
      setMsg({type:"loading",text:"Updating…"});
      const ok = await updateFIRRow(tok, st, existingRow.ri, uns, dt);
      if (ok) {
        setDb(prev => ({
          ...prev,
          fir: {
            ...prev.fir,
            [st]: prev.fir[st].map(r => r.ri === existingRow.ri ? {...r, sec:uns, dr:dt} : r)
          }
        }));
        setMsg({type:"ok",text:`✓ FIR ${cr} updated in ${SMAP.find(s=>s.sh===st)?.lb}.`});
      } else {
        setMsg({type:"err",text:"Update failed."});
      }
      return;
    }

    setMsg({type:"loading",text:"Saving with sorted insert…"});
    const existingRows = db.fir[st] || [];
    const result = await insertFIRSorted(tok, st, cr, uns, dt, existingRows);
    if (result.ok) {
      const newRow = { sl: String(result.sl), cr, sec: uns, dr: dt, yr, ri: result.ri };
      const updated = [...existingRows, newRow].sort((a,b) => firSortKey(a.cr) - firSortKey(b.cr))
        .map((r,i) => ({...r, sl:String(i+1)}));
      setDb(prev => ({...prev, fir:{...prev.fir, [st]: updated}}));
      setMsg({type:"ok",text:`✓ FIR ${cr} saved (Sl ${result.sl}) to ${SMAP.find(s=>s.sh===st)?.lb}.`} );
      setFn(""); setUns(""); setDt(""); setEditMode(false); setExistingRow(null);
      try { localStorage.removeItem("fir_draft_fn"); localStorage.removeItem("fir_draft_uns"); localStorage.removeItem("fir_draft_dt"); } catch {}
    } else {
      setMsg({type:"err",text:"Save failed. Check permissions."});
    }
  }

  async function deleteFIR() {
    if (!existingRow) return;
    setShowDeleteConfirm(false);
    setMsg({type:"loading",text:"Deleting…"});
    const ok = await sheetsDeleteRow(tok, SID.fir, st, existingRow.ri);
    if (ok) {
      setDb(prev => ({
        ...prev,
        fir: {...prev.fir, [st]: prev.fir[st].filter(r => r.ri !== existingRow.ri)}
      }));
      setMsg({type:"ok",text:`✓ FIR ${existingRow.cr} deleted.`});
      clearDraft();
    } else {
      setMsg({type:"err",text:"Delete failed."});
    }
  }

  const stObj = SMAP.find(s => s.sh === st);
  const recent = st ? (db.fir[st] || []).slice(-3).reverse() : [];
  const firReady = fn && yr;

  return (
    <div>
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">⚠ Confirm Delete</div>
            <div className="modal-body">
              Delete FIR <strong style={{color:"var(--red)"}}>{fn}/{yr}</strong> from{" "}
              <strong>{stObj?.lb}</strong>? This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-o btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-r btn-sm" onClick={deleteFIR}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="ctitle">{editMode ? "✏️ Edit FIR" : "📝 New FIR Entry"}
          {editMode && <span className="bdg bdg-b" style={{marginLeft:4}}>Edit Mode</span>}
        </div>

        <div className="sec-divider">Step 1 — FIR Number & Year</div>
        <div className="numpad-row" style={{marginBottom:12}}>
          <div style={{flex:"1 1 130px",minWidth:0}}>
            <label className="lbl">FIR Number</label>
            <input className="inp mono" type="tel" inputMode="numeric" value={fn} onChange={e=>setFn(e.target.value)} placeholder="e.g. 561" />
          </div>
          <div style={{flex:"1 1 130px",minWidth:0}}>
            <div className="lbl" style={{marginBottom:4}}>Year</div>
            <div className="val-display mono" style={{marginBottom:6}}>{yr}</div>
            <div className="yr-ctrl" style={{marginBottom:6}}>
              <button className="btn btn-o btn-sm" onClick={()=>setYr(y=>String(parseInt(y)-1))}>◀</button>
              <span className="yr-val">{yr}</span>
              <button className="btn btn-o btn-sm" onClick={()=>setYr(y=>String(parseInt(y)+1))}>▶</button>
              {yr!==curYr && <span className="rst" onClick={()=>setYr(curYr)}>reset</span>}
            </div>
            {fn && yr && (
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
                  {parseInt(fn,10)}/{yr}
                </span>
              </div>
            )}
          </div>
        </div>

        {firReady && (
          <>
            <div className="sec-divider">Step 2 — Select Police Station</div>
            <div className="pill-row" style={{marginBottom:8}}>
              {SMAP.map(s => {
                const sNum = String(parseInt(fn,10)||fn);
                const exists = (db.fir[s.sh]||[]).some(r => firMatch(r.cr, sNum, yr));
                return (
                  <div key={s.sh}
                    className={`pill ${st===s.sh?"active":""} ${exists && st!==s.sh?"warn":""}`}
                    onClick={() => setSt(st===s.sh?"":s.sh)}>
                    {s.lb}
                    {exists && <span style={{fontSize:9,marginLeft:2}}>{st===s.sh?"✏":"⚠"}</span>}
                  </div>
                );
              })}
            </div>
            {st && existingRow && !editMode && (
              <div className="msg-err" style={{marginBottom:8}}>
                ⚠ FIR {fn}/{yr} already exists in {stObj?.lb}.
                <button className="btn btn-edit btn-sm" style={{marginLeft:8}} onClick={loadExisting}>✏ Edit it</button>
              </div>
            )}
            {st && editMode && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span className="st-badge gold">✏ Editing {fn}/{yr} in {stObj?.lb}</span>
                {!uns && <button className="btn btn-edit btn-sm" onClick={loadExisting}>Load Data</button>}
              </div>
            )}
          </>
        )}

        {firReady && st && (
          <>
            <div className="sec-divider">Step 3 — Section U/s</div>
            <SectionBuilder value={uns} onChange={setUns}/>
            {uns && (
              <div style={{fontSize:11,color:"var(--txt2)",marginBottom:8,padding:"6px 10px",background:"var(--bg3)",borderRadius:6,border:"1px solid var(--gold-d)",fontFamily:"Crimson Pro,serif",lineHeight:1.6}}>
                <span style={{color:"var(--txt3)",fontSize:9,display:"block",marginBottom:2}}>FINAL OUTPUT:</span>
                {uns}
              </div>
            )}
          </>
        )}

        {firReady && st && (
          <>
            <div className="sec-divider">Step 4 — Date Received</div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <div style={{flex:"1 1 260px",minWidth:0}}>
                  <label className="lbl">Date Received</label>
                  <input className="inp mono" type="date" value={dt ? (() => { const p=dt.split('.'); if(p.length===3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; return ""; })() : ""}
                    onChange={e=>{ const v=e.target.value; if(!v){ setDt(""); return;} const [y,m,d]=v.split('-'); setDt(`${d.padStart(2,'0')}.${m}.${y}`); }} />
                </div>
                <div style={{alignSelf:"center",fontSize:11,color:"var(--txt2)"}}>{dt || <span style={{color:"var(--txt3)"}}>—</span>}</div>
              </div>
            </div>
          </>
        )}

        {firReady && st && (
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-g" onClick={save} disabled={!uns || !dt || dt.length < 10}>
              {editMode ? "💾 Update FIR" : "💾 Save FIR"}
            </button>
            {editMode && (
              <button className="btn btn-r" onClick={() => setShowDeleteConfirm(true)}>🗑 Delete</button>
            )}
            <button className="btn btn-o" onClick={clearDraft}>✕ Clear</button>
          </div>
        )}

        {msg && (
          <div className={msg.type==="ok"?"msg-ok":msg.type==="err"?"msg-err":"msg-info"} style={{marginTop:8}}>
            {msg.type==="loading" && <span className="spin" style={{display:"inline-block",marginRight:6}}/>}
            {msg.text}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="card">
          <div className="ctitle">🕐 Recent FIRs — {stObj?.lb}</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Sl</th><th>CR No.</th><th>Section U/s</th><th>Date Received</th></tr>
              </thead>
              <tbody>
                {recent.map((r,i)=>(
                  <tr key={i}>
                    <td className="mono">{r.sl}</td>
                    <td className="mono" style={{color:"var(--gold)"}}>{r.cr}</td>
                    <td>{r.sec}</td>
                    <td className="mono">{r.dr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
