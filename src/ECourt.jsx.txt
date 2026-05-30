import { useState, useEffect, useRef } from "react";

const TOKEN = "eci_live_mqwhkj4mi2atr73o2ke0m6c9ro2m5f6x";
const BASE = "https://webapi.ecourtsindia.com/v1";

// ── Tamil Nadu court data ──────────────────────────────────────────
const TN_DISTRICTS = [
  "Ariyalur","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul",
  "Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri",
  "Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur",
  "Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi",
  "Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli",
  "Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur",
  "Vellore","Villupuram","Virudhunagar"
];

const COURTS_BY_DISTRICT = {
  Ariyalur: ["Ariyalur JM1","Jayankondam JM1","Sendurai JM1","Udayarpalayam JM1"],
  Chennai: ["Chennai JM1","Chennai JM2","Chennai JM3","Egmore JM1","Saidapet JM1"],
  Coimbatore: ["Coimbatore JM1","Coimbatore JM2","Pollachi JM1","Mettupalayam JM1"],
  Cuddalore: ["Cuddalore JM1","Chidambaram JM1","Virudhachalam JM1"],
  Madurai: ["Madurai JM1","Madurai JM2","Dindigul JM1"],
  Thanjavur: ["Thanjavur JM1","Kumbakonam JM1","Papanasam JM1"],
  Tiruchirappalli: ["Trichy JM1","Trichy JM2","Musiri JM1","Lalgudi JM1"],
  Salem: ["Salem JM1","Salem JM2","Namakkal JM1","Rasipuram JM1"],
  Tirunelveli: ["Tirunelveli JM1","Nagercoil JM1","Thoothukudi JM1"],
  Vellore: ["Vellore JM1","Ranipet JM1","Arakkonam JM1"],
};

// Crime/Case types with icons
const CASE_TYPES = [
  { code: "CC",   label: "CC — Criminal Complaint",          icon: "⚖️",  desc: "Complaint filed before Magistrate" },
  { code: "CMP",  label: "CMP — Criminal Miscellaneous Petition", icon: "📋", desc: "Misc petitions in criminal matters" },
  { code: "CR",   label: "CR — Crime / Sessions Case",       icon: "🔐",  desc: "Sessions court criminal cases" },
  { code: "SC",   label: "SC — Sessions Case",               icon: "🏛️",  desc: "Trial before Sessions Judge" },
  { code: "FIR",  label: "FIR — First Information Report",   icon: "🚨",  desc: "Search by FIR / Crime Number" },
  { code: "PCR",  label: "PCR — Private Complaint",          icon: "📝",  desc: "Private complaint under CrPC" },
  { code: "CNR",  label: "CNR — Direct CNR Lookup",          icon: "🔎",  desc: "16-character unique case number" },
  { code: "CS",   label: "CS — Civil Suit",                  icon: "⚡",  desc: "Civil suits in district courts" },
  { code: "MC",   label: "MC — Maintenance Case",            icon: "👨‍👩‍👧",  desc: "Maintenance under Section 125" },
  { code: "OP",   label: "OP — Original Petition",           icon: "📜",  desc: "Original petitions in district courts" },
];

const POLICE_STATIONS_ARIYALUR = [
  "Ariyalur PS","Jayankondam PS","Sendurai PS","Udayarpalayam PS",
  "Andimadam PS","T.Palur PS","Kilur PS","Thirumanur PS",
];

// ── helpers ───────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
  catch { return d; }
}
function Badge({ status }) {
  const s = (status||"").toLowerCase();
  const color = s.includes("pend") ? "#f59e0b" : s.includes("dispos") ? "#22c55e" : "#94a3b8";
  return (
    <span style={{
      background: color+"22", color, border:`1px solid ${color}55`,
      borderRadius:4, padding:"2px 10px", fontSize:11, fontFamily:"monospace",
      fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase"
    }}>{status||"Unknown"}</span>
  );
}

// ── main component ────────────────────────────────────────────────
export default function ECourt() {
  const [tab, setTab] = useState("search");     // search | result | about
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [caseNo, setCaseNo] = useState("12");
  const [year, setYear] = useState("2026");
  const [district, setDistrict] = useState("Ariyalur");
  const [court, setCourt] = useState("Jayankondam JM1");
  const [cnr, setCnr] = useState("");
  const [firNo, setFirNo] = useState("");
  const [firYear, setFirYear] = useState("2026");
  const [policeStation, setPoliceStation] = useState("Jayankondam PS");
  const [token, setToken] = useState(TOKEN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [rawJson, setRawJson] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [corsWarning, setCorsWarning] = useState(false);
  const resultRef = useRef(null);

  const courts = COURTS_BY_DISTRICT[district] || [`${district} JM1`];

  useEffect(() => {
    if (!courts.includes(court)) setCourt(courts[0]);
  }, [district]);

  // ── API call ──
  async function doSearch() {
    setLoading(true); setError(""); setResult(null); setRawJson(null); setCorsWarning(false);
    try {
      let url, opts = { headers:{ "Authorization":`Bearer ${token}`, "Accept":"application/json" } };

      if (caseType.code === "CNR") {
        url = `${BASE}/case/${cnr.trim()}`;
      } else if (caseType.code === "FIR") {
        url = `${BASE}/case-search?` + new URLSearchParams({
          searchType:"fir", firNumber:firNo, firYear, policeStation,
          state:"Tamil Nadu", district, court
        });
      } else {
        url = `${BASE}/case-search?` + new URLSearchParams({
          caseType: caseType.code, caseNumber: caseNo, year,
          state:"Tamil Nadu", district, court
        });
      }

      const res = await fetch(url, opts);
      const data = await res.json();
      setRawJson(data);

      if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);

      const cases = data?.data?.cases || data?.data?.results || (Array.isArray(data?.data)?data.data:[data?.data]);
      const c = cases?.[0];
      if (!c) throw new Error("No case found for these parameters.");
      setResult(c);
      setTab("result");
      setTimeout(() => resultRef.current?.scrollIntoView({behavior:"smooth"}), 100);

    } catch(e) {
      if (e.message.includes("fetch") || e.message.includes("CORS") || e.message.includes("Network")) {
        setCorsWarning(true);
      } else {
        setError(e.message);
      }
    }
    setLoading(false);
  }

  // ── Code snippet ──
  function getSnippet() {
    let params;
    if (caseType.code === "CNR") {
      params = `/${cnr}`;
    } else if (caseType.code === "FIR") {
      params = `-search?firNumber=${firNo}&firYear=${firYear}&policeStation=${encodeURIComponent(policeStation)}&district=${encodeURIComponent(district)}&court=${encodeURIComponent(court)}`;
    } else {
      params = `-search?caseType=${caseType.code}&caseNumber=${caseNo}&year=${year}&district=${encodeURIComponent(district)}&court=${encodeURIComponent(court)}`;
    }
    return `// Node.js
const res = await fetch(
  "https://webapi.ecourtsindia.com/v1/case${params}",
  { headers: { "Authorization": "Bearer ${token}" } }
);
const data = await res.json();
console.log(data);

# Python
import requests
r = requests.get(
    "https://webapi.ecourtsindia.com/v1/case${params}",
    headers={"Authorization": f"Bearer ${token}"}
)
print(r.json())`;
  }

  // ── styles ──
  const S = {
    root: {
      minHeight:"100vh", background:"#0d1117",
      fontFamily:'"Crimson Pro", "Georgia", serif',
      color:"#e2d9c8",
    },
    topbar: {
      borderBottom:"1px solid #1e2940",
      background:"#0d1117ee",
      backdropFilter:"blur(12px)",
      position:"sticky", top:0, zIndex:50,
      display:"flex", alignItems:"center",
      padding:"0 1.5rem", gap:"1.5rem", height:56,
    },
    logo: {
      display:"flex", alignItems:"center", gap:10,
      fontFamily:"monospace", fontWeight:700, fontSize:15,
      color:"#60a5fa", letterSpacing:"0.04em",
      flexShrink:0,
    },
    logoIcon: {
      width:32, height:32, background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
      borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:16,
    },
    tabs: { display:"flex", gap:4, marginLeft:"auto" },
    tab: (active) => ({
      padding:"6px 16px", borderRadius:6, fontSize:13,
      fontFamily:"monospace", cursor:"pointer", border:"none",
      background: active ? "#1e3a5f" : "transparent",
      color: active ? "#60a5fa" : "#94a3b8",
      transition:"all .15s",
    }),
    body: { maxWidth:900, margin:"0 auto", padding:"2rem 1rem" },
    card: {
      background:"#111827", border:"1px solid #1e2940",
      borderRadius:12, overflow:"hidden", marginBottom:"1.5rem",
    },
    cardHead: {
      background:"linear-gradient(90deg,#1a2540,#111827)",
      padding:"1rem 1.4rem", display:"flex", alignItems:"center",
      gap:10, borderBottom:"1px solid #1e2940",
    },
    cardTitle: { fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#60a5fa", letterSpacing:"0.1em", textTransform:"uppercase" },
    cardBody: { padding:"1.4rem" },
    label: { fontSize:11, fontFamily:"monospace", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5, display:"block" },
    input: {
      width:"100%", background:"#0d1117", border:"1px solid #1e2940",
      borderRadius:6, padding:"9px 12px", color:"#e2d9c8",
      fontFamily:"monospace", fontSize:13, outline:"none",
      boxSizing:"border-box", transition:"border-color .15s",
    },
    select: {
      width:"100%", background:"#0d1117", border:"1px solid #1e2940",
      borderRadius:6, padding:"9px 12px", color:"#e2d9c8",
      fontFamily:"monospace", fontSize:13, outline:"none",
      boxSizing:"border-box", cursor:"pointer",
    },
    grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" },
    grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem" },
    btn: {
      width:"100%", padding:"12px", borderRadius:8, border:"none",
      background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
      color:"#fff", fontFamily:"monospace", fontSize:14, fontWeight:700,
      letterSpacing:"0.06em", cursor:"pointer", marginTop:"1rem",
      transition:"opacity .15s", display:"flex", alignItems:"center",
      justifyContent:"center", gap:8,
    },
    error: {
      background:"#450a0a22", border:"1px solid #7f1d1d66",
      borderRadius:8, padding:"12px 16px", color:"#fca5a5",
      fontFamily:"monospace", fontSize:12, marginTop:"1rem",
    },
    corsBox: {
      background:"#1c1400", border:"1px solid #7c5c0a",
      borderRadius:8, padding:"1rem 1.2rem", marginTop:"1rem",
    },
    pre: {
      background:"#0d1117", border:"1px solid #1e2940", borderRadius:8,
      padding:"1rem", fontFamily:"monospace", fontSize:11,
      color:"#94d68a", overflow:"auto", maxHeight:260,
      whiteSpace:"pre", lineHeight:1.6,
    },
    dataRow: { display:"flex", flexDirection:"column", gap:3, marginBottom:0 },
    key: { fontSize:10, fontFamily:"monospace", color:"#4b6d9f", textTransform:"uppercase", letterSpacing:"0.1em" },
    val: { fontSize:15, color:"#e2d9c8", fontWeight:600 },
    divider: { height:1, background:"#1e2940", margin:"1rem 0" },
    partyRow: {
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"8px 0", borderBottom:"1px solid #1a2035",
    },
    hearingRow: {
      display:"grid", gridTemplateColumns:"140px 1fr auto",
      gap:"0.5rem 1rem", padding:"7px 0", borderBottom:"1px solid #1a2035",
      alignItems:"center",
    },
  };

  // ── Case type picker ──
  function CaseTypeGrid() {
    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"0.6rem" }}>
        {CASE_TYPES.map(ct => (
          <div
            key={ct.code}
            onClick={() => setCaseType(ct)}
            style={{
              border: caseType.code===ct.code ? "1.5px solid #3b82f6" : "1px solid #1e2940",
              background: caseType.code===ct.code ? "#1a2f50" : "#0d1117",
              borderRadius:8, padding:"10px 12px", cursor:"pointer",
              transition:"all .15s", display:"flex", gap:10, alignItems:"flex-start",
            }}
          >
            <span style={{fontSize:20, flexShrink:0}}>{ct.icon}</span>
            <div>
              <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:caseType.code===ct.code?"#60a5fa":"#cbd5e1"}}>
                {ct.code}
              </div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{ct.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Search fields depending on type ──
  function SearchFields() {
    if (caseType.code === "CNR") return (
      <div style={{marginTop:"1rem"}}>
        <label style={S.label}>CNR Number (16 characters)</label>
        <input style={S.input} value={cnr} onChange={e=>setCnr(e.target.value)}
          placeholder="e.g. TNAR010012026001" maxLength={16} />
      </div>
    );

    if (caseType.code === "FIR") return (
      <div style={{marginTop:"1rem"}}>
        <div style={S.grid3}>
          <div><label style={S.label}>FIR / Crime Number</label>
            <input style={S.input} value={firNo} onChange={e=>setFirNo(e.target.value)} placeholder="e.g. 45" /></div>
          <div><label style={S.label}>Year</label>
            <input style={S.input} value={firYear} onChange={e=>setFirYear(e.target.value)} placeholder="2026" /></div>
          <div><label style={S.label}>District</label>
            <select style={S.select} value={district} onChange={e=>setDistrict(e.target.value)}>
              {TN_DISTRICTS.map(d=><option key={d}>{d}</option>)}
            </select></div>
        </div>
        <div style={{...S.grid2, marginTop:"1rem"}}>
          <div><label style={S.label}>Police Station</label>
            <select style={S.select} value={policeStation} onChange={e=>setPoliceStation(e.target.value)}>
              {POLICE_STATIONS_ARIYALUR.map(ps=><option key={ps}>{ps}</option>)}
            </select></div>
          <div><label style={S.label}>Court</label>
            <select style={S.select} value={court} onChange={e=>setCourt(e.target.value)}>
              {courts.map(c=><option key={c}>{c}</option>)}
            </select></div>
        </div>
      </div>
    );

    return (
      <div style={{marginTop:"1rem"}}>
        <div style={S.grid3}>
          <div><label style={S.label}>Case Number</label>
            <input style={S.input} value={caseNo} onChange={e=>setCaseNo(e.target.value)} placeholder="12" /></div>
          <div><label style={S.label}>Year</label>
            <input style={S.input} value={year} onChange={e=>setYear(e.target.value)} placeholder="2026" /></div>
          <div><label style={S.label}>District</label>
            <select style={S.select} value={district} onChange={e=>setDistrict(e.target.value)}>
              {TN_DISTRICTS.map(d=><option key={d}>{d}</option>)}
            </select></div>
        </div>
        <div style={{marginTop:"1rem"}}>
          <label style={S.label}>Court / Establishment</label>
          <select style={S.select} value={court} onChange={e=>setCourt(e.target.value)}>
            {courts.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
    );
  }

  // ── Result panel ──
  function ResultPanel() {
    if (!result) return null;
    const status = result.caseStatus || result.status || "Unknown";
    const parties = [
      ...([].concat(result.petitioners||result.petitioner||[])).map(p=>({name:p?.name||p,role:"Petitioner/Complainant"})),
      ...([].concat(result.respondents||result.respondent||[])).map(r=>({name:r?.name||r,role:"Accused/Respondent"})),
    ].filter(p=>p.name);
    const hearings = result.hearings||result.hearing_history||[];
    const nextDate = result.nextHearingDate||result.next_hearing_date;

    return (
      <div ref={resultRef}>
        {/* Header strip */}
        <div style={{
          background:"linear-gradient(90deg,#1a2540,#1a1230)",
          border:"1px solid #2d3d60", borderRadius:12,
          padding:"1.2rem 1.5rem", marginBottom:"1.2rem",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.8rem"
        }}>
          <div>
            <div style={{fontFamily:"monospace",fontSize:11,color:"#4b6d9f",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>
              Case Found
            </div>
            <div style={{fontSize:22,fontWeight:700,color:"#e2d9c8"}}>
              {result.caseNumber||result.case_number||`${caseType.code} ${caseNo}/${year}`}
            </div>
            <div style={{fontSize:13,color:"#64748b",marginTop:3}}>
              {result.courtName||court} · {result.districtName||district} · Tamil Nadu
            </div>
          </div>
          <Badge status={status} />
        </div>

        {/* Particulars */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={{fontSize:14}}>📋</span>
            <span style={S.cardTitle}>Case Particulars</span>
          </div>
          <div style={{...S.cardBody}}>
            <div style={S.grid3}>
              {[
                ["Case Type", result.caseType||caseType.code],
                ["Filing No.", result.filingNumber||result.filing_number||"—"],
                ["Filing Date", fmt(result.filingDate||result.filing_date)],
                ["Reg. Date", fmt(result.registrationDate||result.registration_date)],
                ["Police Station", result.policeStation||result.police_station||"—"],
                ["FIR / Crime No.", result.firNumber||result.fir_number||"—"],
              ].map(([k,v])=>(
                <div key={k} style={S.dataRow}>
                  <span style={S.key}>{k}</span>
                  <span style={S.val}>{v||"—"}</span>
                </div>
              ))}
            </div>
            <div style={S.divider}/>
            <div style={S.dataRow}>
              <span style={S.key}>CNR Number</span>
              <span style={{...S.val, fontFamily:"monospace", fontSize:13, color:"#60a5fa"}}>
                {result.cnrNumber||result.cnr||"Not in search results — fetch via case detail endpoint"}
              </span>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={{fontSize:14}}>👤</span>
            <span style={S.cardTitle}>Parties</span>
          </div>
          <div style={S.cardBody}>
            {parties.length ? parties.map((p,i)=>(
              <div key={i} style={S.partyRow}>
                <span style={{fontSize:15,fontWeight:600}}>{p.name}</span>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#4b6d9f",letterSpacing:"0.06em"}}>{p.role}</span>
              </div>
            )) : (
              <div style={{fontSize:13,color:"#475569"}}>Party details not available in search — use CNR for full detail</div>
            )}
          </div>
        </div>

        {/* Hearings */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={{fontSize:14}}>📅</span>
            <span style={S.cardTitle}>Hearing History</span>
          </div>
          <div style={S.cardBody}>
            {nextDate && (
              <div style={S.hearingRow}>
                <span style={{fontFamily:"monospace",fontSize:12,color:"#60a5fa"}}>{fmt(nextDate)}</span>
                <span style={{fontSize:14}}>{result.nextHearingPurpose||"Next Hearing"}</span>
                <span style={{background:"#f59e0b22",color:"#f59e0b",fontSize:10,fontFamily:"monospace",padding:"2px 8px",borderRadius:4,fontWeight:700}}>NEXT</span>
              </div>
            )}
            {hearings.length ? hearings.map((h,i)=>(
              <div key={i} style={S.hearingRow}>
                <span style={{fontFamily:"monospace",fontSize:12,color:"#94a3b8"}}>{fmt(h.date||h.hearingDate)}</span>
                <span style={{fontSize:14}}>{h.purpose||h.businessOnDate||"—"}</span>
                <span/>
              </div>
            )) : !nextDate && (
              <div style={{fontSize:13,color:"#475569"}}>No hearing data in search results</div>
            )}
          </div>
        </div>

        {/* Raw JSON */}
        <div style={S.card}>
          <div style={{...S.cardHead, cursor:"pointer"}} onClick={()=>setShowRaw(v=>!v)}>
            <span style={{fontSize:14}}>🗄</span>
            <span style={S.cardTitle}>Raw API Response</span>
            <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:11,color:"#60a5fa"}}>{showRaw?"▲ hide":"▼ show"}</span>
          </div>
          {showRaw && <div style={S.cardBody}><pre style={S.pre}>{JSON.stringify(rawJson,null,2)}</pre></div>}
        </div>
      </div>
    );
  }

  // ── CORS warning with code ──
  function CorsWarning() {
    return (
      <div style={S.corsBox}>
        <div style={{fontFamily:"monospace",fontSize:12,color:"#fbbf24",fontWeight:700,marginBottom:8}}>
          ⚠ CORS Restriction — API must be called server-side
        </div>
        <div style={{fontSize:13,color:"#92400e",marginBottom:"0.8rem"}}>
          The eCourtsIndia API blocks browser requests. Run this from Node.js, Python, or cURL:
        </div>
        <pre style={S.pre}>{getSnippet()}</pre>
      </div>
    );
  }

  // ── About tab ──
  function About() {
    return (
      <div style={S.card}>
        <div style={S.cardHead}><span style={{fontSize:14}}>ℹ️</span><span style={S.cardTitle}>About This App</span></div>
        <div style={S.cardBody}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.4rem"}}>
            {[
              {icon:"⚖️",title:"CC — Criminal Complaint",desc:"Cases filed before Judicial Magistrates under CrPC. Most common for police-filed complaints and private complaints."},
              {icon:"🚨",title:"FIR / Crime Number Search",desc:"Search by FIR number and police station to find the linked court case. Each FIR is mapped to a court case after charge-sheet."},
              {icon:"🏛️",title:"Sessions Cases (SC/CR)",desc:"Serious crimes (murder, POCSO, etc.) committed to Sessions Court. Higher punishment potential."},
              {icon:"🔎",title:"CNR Direct Lookup",desc:"The fastest method. Every case has a unique 16-char CNR (e.g. TNAR010012026001). Found on summons and court notices."},
              {icon:"📋",title:"CMP — Misc Petitions",desc:"Bail applications, anticipatory bail, suspension of sentence — filed as CMP before Magistrate."},
              {icon:"👨‍👩‍👧",title:"MC — Maintenance",desc:"Section 125 CrPC maintenance cases. Filed before Magistrate for spousal/child maintenance."},
            ].map(({icon,title,desc})=>(
              <div key={title} style={{background:"#0d1117",border:"1px solid #1e2940",borderRadius:8,padding:"1rem"}}>
                <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
                <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#60a5fa",marginBottom:4}}>{title}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{...S.divider,marginTop:"1.5rem"}}/>
          <div style={{fontSize:12,color:"#475569",fontFamily:"monospace"}}>
            API: webapi.ecourtsindia.com · Partner API v1 · Tamil Nadu District Courts · 27.5 Cr+ case records
          </div>
        </div>
      </div>
    );
  }

  // ── Token editor ──
  function TokenBox() {
    return (
      <div style={S.card}>
        <div style={{...S.cardHead, cursor:"pointer"}} onClick={()=>setShowToken(v=>!v)}>
          <span style={{fontSize:14}}>🔑</span>
          <span style={S.cardTitle}>API Token</span>
          <span style={{
            marginLeft:10, fontFamily:"monospace", fontSize:11,
            color: token.startsWith("eci_live_") ? "#22c55e" : "#ef4444"
          }}>
            {token.startsWith("eci_live_") ? "● valid format" : "● invalid"}
          </span>
          <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:11,color:"#60a5fa"}}>{showToken?"▲ hide":"▼ edit"}</span>
        </div>
        {showToken && (
          <div style={S.cardBody}>
            <label style={S.label}>Bearer Token</label>
            <input style={{...S.input,fontFamily:"monospace",fontSize:12}} value={token} onChange={e=>setToken(e.target.value)} />
            <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginTop:6}}>
              ⚠ Keep your token private. Regenerate at ecourtsindia.com if compromised.
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div style={S.logo}>
          <div style={S.logoIcon}>⚖</div>
          <span>eCourt.in</span>
        </div>
        <div style={{fontSize:11,fontFamily:"monospace",color:"#475569",display:"flex",gap:6}}>
          <span style={{color:"#22c55e"}}>●</span> Tamil Nadu · District Courts
        </div>
        <div style={S.tabs}>
          {["search","result","about"].map(t=>(
            <button key={t} style={S.tab(tab===t)} onClick={()=>setTab(t)}>
              {t==="search"?"🔍 Search":t==="result"?"📄 Result":"ℹ About"}
            </button>
          ))}
        </div>
      </div>

      <div style={S.body}>
        {/* Search tab */}
        {tab === "search" && (
          <>
            <TokenBox />

            <div style={S.card}>
              <div style={S.cardHead}>
                <span style={{fontSize:14}}>🗂</span>
                <span style={S.cardTitle}>Case / Crime Type</span>
              </div>
              <div style={S.cardBody}>
                <CaseTypeGrid />
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHead}>
                <span style={{fontSize:16}}>{caseType.icon}</span>
                <span style={S.cardTitle}>{caseType.label}</span>
              </div>
              <div style={S.cardBody}>
                <SearchFields />
                <button
                  style={{...S.btn, opacity: loading ? 0.6 : 1}}
                  onClick={doSearch}
                  disabled={loading}
                >
                  {loading ? "⏳ Querying API..." : `🔍 Fetch ${caseType.code} Case`}
                </button>
                {error && <div style={S.error}>✗ {error}</div>}
                {corsWarning && <CorsWarning />}
              </div>
            </div>
          </>
        )}

        {/* Result tab */}
        {tab === "result" && (
          result ? <ResultPanel /> :
          <div style={{...S.card}}>
            <div style={S.cardBody}>
              <div style={{textAlign:"center",padding:"3rem 1rem",color:"#475569"}}>
                <div style={{fontSize:48,marginBottom:"1rem"}}>📭</div>
                <div style={{fontFamily:"monospace",fontSize:14}}>No result yet — run a search first</div>
                <button style={{...S.btn,maxWidth:200,margin:"1rem auto 0"}} onClick={()=>setTab("search")}>Go to Search</button>
              </div>
            </div>
          </div>
        )}

        {/* About tab */}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
