import React from "react";

export default function CaseDetail({ r, srcKey }) {
  const fields = {
    pend: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Petitioner VS Respondent",r.pt,null,true],["Advocate",r.adv],
      ["Date of Registration",r.dreg,"mono"],["Next Hearing Date",r.nxt,"mono"],
      ["Purpose",r.pur],["Act / Section",r.sec],["Police Station",r.sta],
      ["Nature",r.nat],["Designation",r.des],
    ],
    disp: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Petitioner VS Respondent",r.pt,null,true],["Advocate",r.adv],
      ["Date of Registration",r.dreg,"mono"],["Date of Decision",r.ddec,"mono"],
      ["Nature of Disposal",r.dnat],["Act / Section",r.sec],["Police Station",r.sta],
      ["Nature",r.nat],["Designation",r.des],
    ],
    nv: [
      ["RP Number",r.rp,"hi mono"],["Case Number",r.cn,"mono"],
      ["FIR Number",r.fn,"mono"],["Police Station",r.sta],
      ["Description",r.desc,null,true],["Remarks",r.rem,null,true],
    ],
    cnum: [
      ["Case Number",r.cn,"hi mono"],["FIR Number",r.fn,"mono"],
      ["Parties",r.pt,null,true],["Police Station",r.sta],
      ["Advocate",r.adv],["Date of Registration",r.dreg,"mono"],
      ["Next Date",r.nxt,"mono"],["Case Type",r.type],
      ["Section U/s (FIR)",r.sec],["Section (Case)",r.sec2],
      ["Nature",r.nat],["Designation",r.des],
    ],
  }[srcKey]||[];

  const bdgMap = {pend:"bdg-b",disp:"bdg-g",nv:"bdg-a",cnum:"bdg-p"};
  const lbMap  = {pend:"Case Pending",disp:"Disposed",nv:"Non-Valuable Property",cnum:"Case Numbered"};

  return (
    <div className="v-det">
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:"var(--gold)",fontFamily:"JetBrains Mono,monospace"}}>
          {r.cn||r.rp||"—"}
        </span>
        <span className={`bdg ${bdgMap[srcKey]}`}>{lbMap[srcKey]}</span>
      </div>
      <div className="det-grid">
        {fields.map(([lbl,val,cls,full],i) => (
          <div key={i} style={full?{gridColumn:"1/-1"}:{}}>
            <div className="df-lbl">{lbl}</div>
            <div className={`df-val ${cls||""}`}>{val||"—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
