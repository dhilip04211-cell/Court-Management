import { useState, useMemo, useCallback, useRef } from "react";
import { SID, SMAP as DEFAULT_SMAP, normalizeStation } from "../constants/config.js";
import { firMatch, firSortKey } from "../utils/helpers.js";
import {
  sheetsAppend, sheetsDeleteRow, loadAllData,
  ensureCasenumHeaders, insertFIRSorted,
} from "../utils/sheets.js";
import CaseDetail from "../components/CaseDetail.jsx";

// ── Case type priority order ─────────────────────────────────────
const CASE_TYPE_ORDER = ["PRC", "CC", "STC", "MC", "CRLMP"];

function parseDate(str) {
  if (!str) return null;
  const s = str.toString().trim();
  const m = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
}

function detectCaseType(cn) {
  if (!cn) return "";
  const upper = cn.toString().toUpperCase();
  for (const t of CASE_TYPE_ORDER) {
    if (upper.includes(t)) return t;
  }
  return "";
}

function sortCasesByPriority(cases) {
  return [...cases].sort((a, b) => {
    const ta = CASE_TYPE_ORDER.indexOf(detectCaseType(a.cn));
    const tb = CASE_TYPE_ORDER.indexOf(detectCaseType(b.cn));
    const pa = ta === -1 ? 99 : ta;
    const pb = tb === -1 ? 99 : tb;
    if (pa !== pb) return pa - pb;
    return (a.cn || "").localeCompare(b.cn || "");
  });
}

function caseTypeColor(ct) {
  const map = {
    PRC: "#e8a020", CC: "#3b82f6", STC: "#8b5cf6",
    MC: "#10b981", CRLMP: "#ec4899",
  };
  return map[ct] || "var(--gold)";
}

// ── Auto-format date input "01062025" → "01.06.2025" ────────────
function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

// ── Find which station a case belongs to ────────────────────────
// Looks at case.sta (canonical label) → finds SMAP entry
function findStationForCase(row, SMAP) {
  if (!row?.sta) return null;
  return SMAP.find(s => s.lb === row.sta || s.sh === row.sta) || null;
}

// ── Check if a FIR exists in a station's pending list ───────────
// fn format: "107/2026"  — leading zeros in FIR number don't count
function firExistsInStation(fn, firDb, stSh) {
  if (!fn || !stSh) return false;
  const parts = fn.split("/");
  const num = String(parseInt(parts[0], 10) || parts[0]);
  const yr  = parts[1] || "";
  const rows = firDb[stSh] || [];
  return rows.some(r => firMatch(r.cr, num, yr));
}

// ════════════════════════════════════════════════════════════════
//  ADD FIR MINI MODAL
// ════════════════════════════════════════════════════════════════
function AddFIRModal({ row, stObj, db, setDb, tok, SMAP, onClose, onAdded }) {
  const [sec, setSec]   = useState("");
  const [dt, setDt]     = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const secRef = useRef(null);

  const parts  = (row.fn || "").split("/");
  const sNum   = String(parseInt(parts[0], 10) || parts[0]);
  const yr     = parts[1] || "";
  const crStr  = `${sNum}/${yr}`;

  function handleDateText(e) {
    const raw   = e.target.value;
    const clean = raw.replace(/[^\d.]/g, "");
    if (clean.length < dt.length) setDt(clean);
    else setDt(autoFormatDate(clean));
  }

  async function save() {
    if (!sec.trim()) { setErr("Section U/s is required."); return; }
    if (!dt || dt.length < 10) { setErr("Enter a valid date (DD.MM.YYYY)."); return; }
    setBusy(true);
    setErr("");
    try {
      const result = await insertFIRSorted(tok, stObj.sh, crStr, sec.trim(), dt);
      if (!result?.ok) {
        setErr("Failed to save to sheet. Check permissions.");
        setBusy(false);
        return;
      }
      // Update local db
      const tempRow = { sl: String(result.sl), cr: crStr, sec: sec.trim(), dr: dt, yr, ri: result.ri };
      setDb(prev => {
        const existing = prev.fir[stObj.sh] || [];
        const merged   = [...existing.filter(r => r.cr !== crStr), tempRow]
          .sort((a, b) => firSortKey(a.cr) - firSortKey(b.cr));
        return { ...prev, fir: { ...prev.fir, [stObj.sh]: merged } };
      });
      onAdded(crStr);
    } catch (e) {
      setErr("Error: " + e.message);
    }
    setBusy(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "var(--bg2)", borderRadius: 14, padding: 20,
        width: "min(92vw, 420px)", border: "1.5px solid var(--gold)44",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--txt)" }}>
              ➕ Add FIR to Register
            </div>
            <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>{crStr}</span>
              {"  →  "}
              <span style={{ color: "var(--grn)", fontWeight: 600 }}>{stObj.lb}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg3)", border: "1px solid var(--bdr)",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              color: "var(--txt2)", fontSize: 13, lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Section U/s */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
            Section U/s *
          </label>
          <input
            ref={secRef}
            autoFocus
            className="inp"
            type="text"
            placeholder="e.g. 302 IPC, 420 IPC"
            value={sec}
            onChange={e => setSec(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Date Received */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
            Date Received * (DD.MM.YYYY)
          </label>
          <input
            className="inp vt-mono"
            type="text"
            inputMode="numeric"
            placeholder="01.06.2025"
            value={dt}
            onChange={handleDateText}
            maxLength={10}
            onKeyDown={e => e.key === "Enter" && save()}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {err && (
          <div className="et-msg et-msg-err" style={{ marginBottom: 10, fontSize: 12 }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid var(--bdr)",
              background: "var(--bg3)", color: "var(--txt2)", cursor: "pointer", fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !sec.trim() || dt.length < 10}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 9,
              background: busy ? "var(--bg3)" : "var(--grn)",
              border: "none", color: "#fff", cursor: busy ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700, opacity: (!sec.trim() || dt.length < 10) ? 0.5 : 1,
            }}
          >
            {busy ? "⏳ Saving…" : "💾 Save to FIR Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function FTCTab({ db, setDb, tok, smap }) {
  const SMAP = smap || DEFAULT_SMAP;
  const curYr = String(new Date().getFullYear());

  const [subTab, setSubTab] = useState("move");

  // ── Move FIR state ───────────────────────────────────────────
  const [fn, setFn]           = useState("");
  const [yr, setYr]           = useState(curYr);
  const [searched, setSearched] = useState(false);
  const [selSt, setSelSt]     = useState(null);
  const [selCase, setSelCase] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState(null);

  // ── Details state ────────────────────────────────────────────
  const [detSearch, setDetSearch]   = useState("");
  const [detStation, setDetStation] = useState("ALL");
  const [detType, setDetType]       = useState("ALL");
  const [activeDetailCase, setActiveDetailCase] = useState(null);
  const [cnumLoaded, setCnumLoaded] = useState(false);
  const [cnumLoading, setCnumLoading] = useState(false);

  // ── QB state ─────────────────────────────────────────────────
  const [qbStation, setQbStation]   = useState("ALL");
  const [qbCaseType, setQbCaseType] = useState("ALL");
  const [qbListType, setQbListType] = useState("ALL");
  const [qbDateMode, setQbDateMode] = useState("none");
  const [qbDateA, setQbDateA]       = useState("");
  const [qbDateB, setQbDateB]       = useState("");
  const [qbResults, setQbResults]   = useState(null);
  const [qbLoading, setQbLoading]   = useState(false);
  const [qbMsg, setQbMsg]           = useState(null);

  const [qbSelRow, setQbSelRow]     = useState(null);
  const [qbConfirm, setQbConfirm]   = useState(false);
  const [qbBusy, setQbBusy]         = useState(false);
  const [qbMoveMsg, setQbMoveMsg]   = useState(null);

  // ── Add FIR modal state ──────────────────────────────────────
  const [addFirTarget, setAddFirTarget] = useState(null); // { row, stObj }

  // ── Track FIRs added this session so UI updates immediately ──
  // (in case db hasn't re-fetched yet)
  const [sessionAddedFIRs, setSessionAddedFIRs] = useState(new Set());

  // ── Derived ──────────────────────────────────────────────────
  const sNum = fn ? String(parseInt(fn, 10) || fn) : "";
  const displayFIR = sNum && yr ? `${sNum}/${yr}` : sNum;

  // ════════════════════════════════════════════════════════════
  //  MOVE FIR helpers
  // ════════════════════════════════════════════════════════════
  function doSearch() {
    if (!fn || !yr || yr.length < 4) {
      setMsg({ type: "err", text: "Enter a valid FIR number and 4-digit year." });
      return;
    }
    setSearched(true);
    setSelSt(null); setSelCase(null);
    setConfirming(false); setMsg(null);
  }

  function resetAll() {
    setFn(""); setYr(curYr); setSearched(false);
    setSelSt(null); setSelCase(null);
    setConfirming(false); setBusy(false); setMsg(null);
  }

  function handleFnChange(v) {
    setFn(v.replace(/\D/g, ""));
    setSearched(false); setSelSt(null); setSelCase(null); setConfirming(false);
  }

  function handleYrChange(v) {
    setYr(v.replace(/\D/g, "").slice(0, 4));
    setSearched(false); setSelSt(null); setSelCase(null); setConfirming(false);
  }

  const stationHits = searched && sNum && yr
    ? SMAP.filter(s => (db.fir[s.sh] || []).some(r => firMatch(r.cr, sNum, yr)))
    : [];

  const firRow = selSt
    ? (db.fir[selSt] || []).find(r => firMatch(r.cr, sNum, yr))
    : null;

  const stObj = selSt ? SMAP.find(s => s.sh === selSt) : null;

  const allCases = useMemo(() => {
    if (!selSt) return [];
    const canonicalLabel = SMAP.find(s => s.sh === selSt)?.lb || selSt;
    const matchStation = (cSta) => {
      if (!cSta) return true;
      const norm = normalizeStation(cSta);
      return norm === canonicalLabel || cSta === canonicalLabel || cSta === selSt;
    };
    const pending  = db.pend.filter(c => firMatch(c.fn, sNum, yr)).filter(c => matchStation(c.sta)).map(c => ({ ...c, _type: "pending" }));
    const disposal = db.disp.filter(c => firMatch(c.fn, sNum, yr)).filter(c => matchStation(c.sta)).map(c => ({ ...c, _type: "disposal" }));
    return sortCasesByPriority([...pending, ...disposal]);
  }, [selSt, sNum, yr, db.pend, db.disp, SMAP]);

  async function execute() {
    if (!selCase || !firRow || !selSt) return;
    setBusy(true);
    setMsg({ type: "loading", text: "Processing…" });
    const stLb = stObj?.lb || selSt;
    const caseType = (selCase._type || "").toLowerCase().trim();
    await ensureCasenumHeaders(tok);
    const row = [
      `${sNum}/${yr}`, stLb, firRow.sec || "", firRow.dr || "",
      selCase.cn || "", selCase.pt || "", selCase.adv || "", selCase.dreg || "",
      selCase.nxt || selCase.ddec || "", caseType,
      selCase.sec || "", selCase.nat || "", selCase.des || "",
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setMsg({ type: "err", text: "Failed to save to Case Numbered sheet." });
      setBusy(false); return;
    }
    if (firRow.ri && firRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, selSt, firRow.ri);
    }
    const idx = (db.fir[selSt] || []).findIndex(r => r.cr === firRow.cr);
    if (idx >= 0) {
      const newFir = (db.fir[selSt] || [])
        .filter((_, i) => i !== idx)
        .map(r => r.ri > firRow.ri ? { ...r, ri: r.ri - 1 } : r);
      setDb(prev => ({
        ...prev,
        fir: { ...prev.fir, [selSt]: newFir },
        cnum: [...prev.cnum, {
          fn: `${sNum}/${yr}`, sta: stLb,
          sec: firRow.sec || "", dr: firRow.dr || "",
          cn: selCase.cn || "", pt: selCase.pt || "",
          adv: selCase.adv || "", dreg: selCase.dreg || "",
          nxt: selCase.nxt || selCase.ddec || "",
          type: caseType, sec2: selCase.sec || "",
          nat: selCase.nat || "", des: selCase.des || "",
        }],
      }));
    }
    setMsg({ type: "loading", text: "Syncing live data…" });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
      setCnumLoaded(true);
      setMsg({ type: "ok", text: `✓ FIR ${displayFIR} moved & synced.` });
    } else {
      setMsg({ type: "ok", text: `✓ FIR ${displayFIR} moved (offline sync).` });
    }
    setBusy(false);
    setTimeout(resetAll, 1800);
  }

  // ════════════════════════════════════════════════════════════
  //  DETAILS helpers
  // ════════════════════════════════════════════════════════════
  const handleSubTabChange = useCallback(async (tab) => {
    setSubTab(tab);
    if (tab === "details" && !cnumLoaded && tok) {
      setCnumLoading(true);
      try {
        const fresh = await loadAllData(tok, SMAP);
        if (fresh) { setDb(fresh); setCnumLoaded(true); }
      } catch (e) { console.error("cnum load error:", e); }
      finally { setCnumLoading(false); }
    }
  }, [cnumLoaded, tok, SMAP, setDb]);

  const uniqueStations = useMemo(() => {
    const list = db.cnum.map(r => r.sta).filter(Boolean);
    return [...new Set(list)].sort();
  }, [db.cnum]);

  const filteredCnum = useMemo(() => {
    return db.cnum.filter(r => {
      if (detStation !== "ALL" && r.sta !== detStation) return false;
      if (detType !== "ALL") {
        const rType = (r.type || "").toLowerCase().trim();
        if (rType !== detType.toLowerCase()) return false;
      }
      if (detSearch) {
        const q = detSearch.toLowerCase();
        const ok =
          (r.fn||"").toLowerCase().includes(q) ||
          (r.cn||"").toLowerCase().includes(q) ||
          (r.pt||"").toLowerCase().includes(q) ||
          (r.sec||"").toLowerCase().includes(q) ||
          (r.sec2||"").toLowerCase().includes(q) ||
          (r.adv||"").toLowerCase().includes(q) ||
          (r.sta||"").toLowerCase().includes(q) ||
          (r.nat||"").toLowerCase().includes(q) ||
          (r.des||"").toLowerCase().includes(q);
        if (!ok) return false;
      }
      return true;
    });
  }, [db.cnum, detSearch, detStation, detType]);

  // ════════════════════════════════════════════════════════════
  //  QB helpers
  // ════════════════════════════════════════════════════════════
  function PillGroup({ value, onChange, options }) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            cursor: "pointer", border: "1.5px solid",
            borderColor: value === opt.value ? opt.color || "var(--gold)" : "var(--bdr)",
            background: value === opt.value ? (opt.color || "var(--gold)") + "22" : "var(--bg3)",
            color: value === opt.value ? opt.color || "var(--gold)" : "var(--txt2)",
            transition: "all 0.15s",
          }}>{opt.label}</button>
        ))}
      </div>
    );
  }

  const caseTypeOptions = [
    { value:"ALL",   label:"ALL",   color:"var(--txt)" },
    { value:"PRC",   label:"PRC",   color:"#e8a020" },
    { value:"CC",    label:"CC",    color:"#3b82f6" },
    { value:"STC",   label:"STC",   color:"#8b5cf6" },
    { value:"MC",    label:"MC",    color:"#10b981" },
    { value:"CRLMP", label:"CRLMP", color:"#ec4899" },
  ];
  const listTypeOptions = [
    { value:"ALL",      label:"ALL",      color:"var(--txt)" },
    { value:"pending",  label:"Pending",  color:"#3b82f6" },
    { value:"disposal", label:"Disposal", color:"#10b981" },
  ];
  const dateModeOptions = [
    { value:"none",    label:"Any Date" },
    { value:"gt",      label:"After →" },
    { value:"lt",      label:"← Before" },
    { value:"between", label:"Between" },
  ];

  async function runQueryBuilder() {
    setQbLoading(true);
    setQbResults(null);
    setQbMsg(null);
    setQbSelRow(null);
    setQbConfirm(false);
    setQbMoveMsg(null);
    setSessionAddedFIRs(new Set()); // reset per run
    try {
      const fresh = await loadAllData(tok, SMAP);
      if (fresh) { setDb(fresh); setCnumLoaded(true); }
      const data = fresh || db;

      const matchStation = (cSta) => {
        if (qbStation === "ALL") return true;
        const norm = normalizeStation(cSta);
        return norm === qbStation || cSta === qbStation;
      };
      const matchCaseType = (cn) => {
        if (qbCaseType === "ALL") return true;
        return detectCaseType(cn) === qbCaseType;
      };
      const matchDate = (dreg) => {
        if (qbDateMode === "none") return true;
        const d = parseDate(dreg);
        if (!d) return false;
        if (qbDateMode === "gt") { const ref = parseDate(qbDateA); return ref ? d > ref : true; }
        if (qbDateMode === "lt") { const ref = parseDate(qbDateA); return ref ? d < ref : true; }
        if (qbDateMode === "between") {
          const a = parseDate(qbDateA); const b = parseDate(qbDateB);
          if (!a || !b) return true;
          return d >= a && d <= b;
        }
        return true;
      };

      let results = [];
      if (qbListType === "ALL" || qbListType === "pending") {
        results.push(...data.pend.filter(r => matchStation(r.sta)).filter(r => matchCaseType(r.cn)).filter(r => matchDate(r.dreg)).map(r => ({ ...r, _type: "pending" })));
      }
      if (qbListType === "ALL" || qbListType === "disposal") {
        results.push(...data.disp.filter(r => matchStation(r.sta)).filter(r => matchCaseType(r.cn)).filter(r => matchDate(r.dreg)).map(r => ({ ...r, _type: "disposal" })));
      }
      results = results.sort((a, b) => {
        const lpa = a._type === "pending" ? 0 : 1;
        const lpb = b._type === "pending" ? 0 : 1;
        if (lpa !== lpb) return lpa - lpb;
        const ta = CASE_TYPE_ORDER.indexOf(detectCaseType(a.cn));
        const tb = CASE_TYPE_ORDER.indexOf(detectCaseType(b.cn));
        const pa = ta === -1 ? 99 : ta;
        const pb = tb === -1 ? 99 : tb;
        if (pa !== pb) return pa - pb;
        return (a.cn || "").localeCompare(b.cn || "");
      });
      setQbResults(results);
      if (results.length === 0) setQbMsg({ type: "info", text: "No cases match the selected filters." });
    } catch (e) {
      console.error("QB error:", e);
      setQbMsg({ type: "err", text: "Failed to load data. Check connection." });
    } finally {
      setQbLoading(false);
    }
  }

  function handleQbRowClick(row) {
    setQbSelRow(row);
    setQbConfirm(false);
    setQbMoveMsg(null);
  }

  // ── For a given result row, find the FIR in the correct station ──
  // Station is derived from row.sta (canonical label)
  const qbFirInfo = useMemo(() => {
    if (!qbSelRow) return null;
    const stObj = findStationForCase(qbSelRow, SMAP);
    if (!stObj) return null;
    const firs    = db.fir[stObj.sh] || [];
    const parts   = (qbSelRow.fn || "").split("/");
    const num     = String(parseInt(parts[0], 10) || parts[0]);
    const yr2     = parts[1] || "";
    const matched = firs.find(f => firMatch(f.cr, num, yr2));
    if (matched) return { firRow: matched, stObj };
    return null;
  }, [qbSelRow, db.fir, SMAP]);

  // ── Per-row: does FIR exist for this row's station? ──────────
  // Returns true/false. Checks sessionAddedFIRs too for instant feedback.
  function rowFIRExists(row) {
    if (sessionAddedFIRs.has(row.fn + "|" + row.sta)) return true;
    const stObj = findStationForCase(row, SMAP);
    if (!stObj) return false;
    return firExistsInStation(row.fn, db.fir, stObj.sh);
  }

  // ── QB: execute move ─────────────────────────────────────────
  async function executeQbMove() {
    if (!qbSelRow || !qbFirInfo) return;

    // GUARD: FIR must be present in the correct station
    if (!rowFIRExists(qbSelRow)) {
      setQbMoveMsg({
        type: "err",
        text: `⛔ FIR ${qbSelRow.fn} is not present in "${qbFirInfo?.stObj?.lb || qbSelRow.sta}" FIR Register. Add it first before moving.`,
      });
      setQbConfirm(false);
      return;
    }

    setQbBusy(true);
    setQbMoveMsg({ type: "loading", text: "Processing…" });

    const { firRow, stObj } = qbFirInfo;
    const stLb     = stObj?.lb || stObj?.sh || "";
    const caseType = (qbSelRow._type || "").toLowerCase().trim();

    await ensureCasenumHeaders(tok);

    const row = [
      qbSelRow.fn || "", stLb,
      firRow.sec || "", firRow.dr || "",
      qbSelRow.cn || "", qbSelRow.pt || "", qbSelRow.adv || "", qbSelRow.dreg || "",
      qbSelRow.nxt || qbSelRow.ddec || "", caseType,
      qbSelRow.sec || "", qbSelRow.nat || "", qbSelRow.des || "",
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setQbMoveMsg({ type: "err", text: "Failed to save to Case Numbered sheet." });
      setQbBusy(false); return;
    }
    if (firRow.ri && firRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, stObj.sh, firRow.ri);
    }

    setQbMoveMsg({ type: "loading", text: "Syncing…" });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
      setCnumLoaded(true);
      setQbResults(prev => (prev || []).filter(r => !(r.cn === qbSelRow.cn && r._type === qbSelRow._type)));
      setQbMoveMsg({ type: "ok", text: `✓ Case ${qbSelRow.cn} moved to Case Numbered.` });
    } else {
      setQbMoveMsg({ type: "ok", text: `✓ Case ${qbSelRow.cn} moved (offline sync).` });
    }
    setQbBusy(false);
    setTimeout(() => {
      setQbSelRow(null);
      setQbConfirm(false);
      setQbMoveMsg(null);
    }, 2000);
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="vt-root" style={{ padding: "0 0 32px" }}>

      {/* ── Add FIR Modal ──────────────────────────────────────── */}
      {addFirTarget && (
        <AddFIRModal
          row={addFirTarget.row}
          stObj={addFirTarget.stObj}
          db={db}
          setDb={setDb}
          tok={tok}
          SMAP={SMAP}
          onClose={() => setAddFirTarget(null)}
          onAdded={(crStr) => {
            const key = crStr + "|" + addFirTarget.row.sta;
            setSessionAddedFIRs(prev => new Set([...prev, key]));
            setAddFirTarget(null);
            // If this row was selected in confirm panel, recalculate
            if (qbSelRow?.fn === crStr || qbSelRow?.fn === addFirTarget.row.fn) {
              setQbMoveMsg({ type: "ok", text: `✓ FIR ${crStr} added to register. You can now move.` });
              setQbConfirm(false);
            }
          }}
        />
      )}

      {/* ── Top tab bar ─────────────────────────────────────────── */}
      <div className="abt-tabbar">
        <button className={`abt-tab${subTab === "move" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("move")}>
          <span className="abt-tab-icon">🔀</span><span>Move FIR</span>
        </button>
        <button className={`abt-tab${subTab === "details" ? " abt-tab-active" : ""}`}
          onClick={() => handleSubTabChange("details")}>
          <span className="abt-tab-icon">📂</span><span>Case Numbered</span>
        </button>
        <button className={`abt-tab${subTab === "query" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("query")}>
          <span className="abt-tab-icon">🔎</span><span>Query Builder</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
           MOVE FIR TAB
         ══════════════════════════════════════════════════════════ */}
      {subTab === "move" && (
        <>
          <div className="vt-search-card">
            <div className="vt-search-eyebrow">FIR → CASE NUMBERED</div>
            <div className="vt-search-row">
              <div className="vt-fg vt-fg-grow">
                <label className="vt-lbl">FIR Number</label>
                <input className="vt-inp vt-mono" type="tel" inputMode="numeric"
                  value={fn} onChange={e => handleFnChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="e.g. 123" autoFocus />
              </div>
              <div className="vt-fg" style={{ flex: "0 0 90px" }}>
                <label className="vt-lbl">Year</label>
                <input className="vt-inp vt-mono" type="tel" inputMode="numeric"
                  maxLength={4} value={yr}
                  onChange={e => handleYrChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder={curYr} />
              </div>
              <div className="vt-search-actions">
                <button className="vt-btn vt-btn-primary" onClick={doSearch}>Search</button>
                {searched && <button className="vt-btn vt-btn-ghost" onClick={resetAll}>✕</button>}
              </div>
            </div>
          </div>

          {searched && stationHits.length === 0 && (
            <div className="vt-empty">
              <div className="vt-empty-icon">🔍</div>
              <div className="vt-empty-title">FIR not found in any station</div>
              <div className="vt-empty-sub">for <span className="vt-gold">{displayFIR}</span></div>
            </div>
          )}

          {searched && stationHits.length > 0 && (
            <div className="vt-results">
              <div className="vt-summary">
                <span className="vt-summary-count">{stationHits.length}</span>
                <span className="vt-summary-label">station{stationHits.length > 1 ? "s" : ""} for</span>
                <span className="vt-summary-fir">{displayFIR}</span>
              </div>

              <div className="vt-section">
                <div className="vt-section-header">
                  <div className="vt-section-icon vt-icon-fir">📋</div>
                  <div>
                    <div className="vt-section-title">FIR Pending Register</div>
                    <div className="vt-section-sub">Tap station to view details</div>
                  </div>
                </div>

                <div className="vt-chip-row">
                  {stationHits.map(s => (
                    <button key={s.sh}
                      className={`vt-chip vt-chip-fir${selSt === s.sh ? " vt-chip-active-fir" : ""}`}
                      onClick={() => {
                        setSelSt(selSt === s.sh ? null : s.sh);
                        setSelCase(null); setConfirming(false); setMsg(null);
                      }}>
                      <span className="vt-chip-label">{s.lb}</span>
                    </button>
                  ))}
                </div>

                {selSt && firRow && (
                  <div className="vt-panel vt-panel-fir" style={{ marginTop: 0 }}>
                    <div className="ftc-fir-info">
                      <div className="ftc-fir-cr">{firRow.cr}</div>
                      <div className="ftc-fir-fields">
                        {firRow.sec && (
                          <div className="ftc-field">
                            <span className="ftc-flbl">Section</span>
                            <span className="ftc-fval">{firRow.sec}</span>
                          </div>
                        )}
                        {firRow.dr && (
                          <div className="ftc-field">
                            <span className="ftc-flbl">Date Received</span>
                            <span className="ftc-fval vt-mono">{firRow.dr}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ftc-cases-hdr">
                      <span className="ftc-cases-title">Linked Cases</span>
                      <span className="vt-tag vt-tag-blue">{allCases.length}</span>
                    </div>

                    {allCases.length === 0 ? (
                      <div className="ftc-no-cases">
                        No pending or disposed cases found for {displayFIR}
                        <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 4 }}>
                          (Station: {stObj?.lb} — check if cases use a different station name)
                        </div>
                      </div>
                    ) : (
                      <div className="ftc-case-list">
                        {allCases.map((c, i) => {
                          const isSel = selCase?.cn === c.cn && selCase?._type === c._type;
                          const ct = detectCaseType(c.cn);
                          return (
                            <div key={i}
                              className={`ftc-case-card${isSel ? " ftc-case-sel" : ""}`}
                              onClick={() => { setSelCase(isSel ? null : c); setConfirming(false); }}>
                              <div className="ftc-case-top">
                                <span className="ftc-case-cn">{c.cn || "—"}</span>
                                <div style={{ display: "flex", gap: 4 }}>
                                  {ct && (
                                    <span style={{
                                      padding: "2px 8px", borderRadius: 10, fontSize: 10,
                                      fontWeight: 800, background: caseTypeColor(ct) + "22",
                                      color: caseTypeColor(ct), border: `1px solid ${caseTypeColor(ct)}55`,
                                    }}>{ct}</span>
                                  )}
                                  <span className={`vt-tag ${c._type === "pending" ? "vt-tag-blue" : "vt-tag-green"}`}>
                                    {c._type === "pending" ? "Pending" : "Disposed"}
                                  </span>
                                </div>
                              </div>
                              {c.pt && <div className="ftc-case-pt">{c.pt}</div>}
                              <div className="ftc-case-meta">
                                {c.sta && <span>{c.sta}</span>}
                                {c.dreg && <span>Reg: {c.dreg}</span>}
                              </div>
                              {isSel && <div className="ftc-sel-tick">✓ Selected</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selCase && !confirming && (
                      <div style={{ marginTop: 10 }}>
                        <button className="ftc-proceed-btn" onClick={() => setConfirming(true)}>
                          Review &amp; Move →
                        </button>
                      </div>
                    )}

                    {selCase && confirming && (
                      <div className="ftc-confirm">
                        <div className="ftc-confirm-title">⚠ Confirm Move</div>
                        <div className="ftc-confirm-grid">
                          <div className="ftc-cf"><span className="ftc-cf-lbl">FIR</span><span className="ftc-cf-val vt-mono">{displayFIR}</span></div>
                          <div className="ftc-cf"><span className="ftc-cf-lbl">Station</span><span className="ftc-cf-val">{stObj?.lb}</span></div>
                          <div className="ftc-cf"><span className="ftc-cf-lbl">Case Number</span><span className="ftc-cf-val vt-mono" style={{ color: "var(--vt-purple)" }}>{selCase.cn || "—"}</span></div>
                          <div className="ftc-cf"><span className="ftc-cf-lbl">Type</span><span className="ftc-cf-val">{selCase._type}</span></div>
                          <div className="ftc-cf" style={{ gridColumn: "1 / -1" }}><span className="ftc-cf-lbl">Parties</span><span className="ftc-cf-val">{selCase.pt || "—"}</span></div>
                        </div>
                        <div className="ftc-warn-note">
                          This will delete FIR {displayFIR} from &ldquo;{stObj?.lb}&rdquo; and save to Case Numbered.
                        </div>
                        <div className="ftc-confirm-actions">
                          <button className="vt-btn vt-btn-ghost" style={{ padding: "9px 14px" }}
                            onClick={() => setConfirming(false)} disabled={busy}>← Back</button>
                          <button className="ftc-execute-btn" onClick={execute} disabled={busy}>
                            {busy ? "⏳ Processing…" : "🗂 Move to Case Numbered"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {msg && msg.type !== "loading" && (
            <div className={`et-msg et-msg-${msg.type === "ok" ? "ok" : msg.type === "err" ? "err" : "info"}`}
              style={{ marginTop: 12 }}>
              {msg.text}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
           CASE NUMBERED DETAILS TAB
         ══════════════════════════════════════════════════════════ */}
      {subTab === "details" && (
        <div>
          {cnumLoading && (
            <div className="et-msg et-msg-info" style={{ margin: "12px 14px 0" }}>
              ⏳ Loading Case Numbered records…
            </div>
          )}
          {!cnumLoading && (
            <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px 14px 0" }}>
              <button className="btn btn-o btn-sm" onClick={async () => {
                setCnumLoading(true);
                const fresh = await loadAllData(tok, SMAP);
                if (fresh) { setDb(fresh); setCnumLoaded(true); }
                setCnumLoading(false);
              }}>🔄 Refresh</button>
            </div>
          )}

          <div className="card" style={{ margin: "12px 14px 0" }}>
            <div className="ctitle">
              🔦 Search &amp; Filters
              <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                {filteredCnum.length} of {db.cnum.length} records
              </span>
            </div>
            <div className="frow">
              <div className="fg" style={{ flex: "2 1 200px" }}>
                <label className="lbl">Search keyword</label>
                <div className="search-wrap">
                  <input className="inp" type="text" value={detSearch}
                    onChange={e => setDetSearch(e.target.value)}
                    placeholder="Case, FIR, parties, advocate, section…" />
                  {detSearch && <button className="search-clear" onClick={() => setDetSearch("")}>✕</button>}
                </div>
              </div>
              <div className="fg">
                <label className="lbl">Station</label>
                <select className="inp" value={detStation} onChange={e => setDetStation(e.target.value)}>
                  <option value="ALL">All Stations</option>
                  {uniqueStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Type</label>
                <select className="inp" value={detType} onChange={e => setDetType(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="pending">Pending</option>
                  <option value="disposal">Disposal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ margin: "12px 14px 0" }}>
            <div className="ctitle">📋 Case Numbered Register</div>
            <div className="tbl-wrap">
              <table className="abs-tbl">
                <thead>
                  <tr>
                    <th>Case Number</th><th>FIR Number</th>
                    <th>Station</th><th>Parties</th>
                    <th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cnumLoading ? (
                    <tr><td colSpan={6} className="no-data">Loading…</td></tr>
                  ) : filteredCnum.length === 0 ? (
                    <tr><td colSpan={6} className="no-data">
                      {db.cnum.length === 0
                        ? "No Case Numbered records found. Click Refresh to load."
                        : "No cases match the current filters."}
                    </td></tr>
                  ) : filteredCnum.map((r, idx) => {
                    const ct = detectCaseType(r.cn);
                    return (
                      <tr key={idx}>
                        <td className="mono" style={{ fontWeight: 700 }}>
                          {ct && (
                            <span style={{
                              marginRight: 4, padding: "1px 6px", borderRadius: 8, fontSize: 9,
                              background: caseTypeColor(ct) + "22", color: caseTypeColor(ct),
                              border: `1px solid ${caseTypeColor(ct)}55`, fontWeight: 800,
                            }}>{ct}</span>
                          )}
                          <span style={{ color: "var(--c-purple)" }}>{r.cn || "—"}</span>
                        </td>
                        <td className="mono" style={{ color: "var(--gold)" }}>{r.fn || "—"}</td>
                        <td style={{ fontSize: 11 }}>{r.sta || "—"}</td>
                        <td style={{ maxWidth: 180, wordBreak: "break-word" }}>{r.pt || "—"}</td>
                        <td>
                          <span className={`vt-tag ${(r.type||"").toLowerCase().trim() === "disposal" ? "vt-tag-green" : "vt-tag-blue"}`}>
                            {r.type || "—"}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-o btn-sm" onClick={() => setActiveDetailCase(r)}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           QUERY BUILDER TAB
         ══════════════════════════════════════════════════════════ */}
      {subTab === "query" && (
        <div style={{ padding: "0 0 40px" }}>

          {/* ── Filter Card ──────────────────────────────────── */}
          <div className="card" style={{ margin: "12px 14px 0" }}>
            <div className="ctitle" style={{ marginBottom: 14 }}>🔎 Query Builder</div>

            <div style={{ marginBottom: 14 }}>
              <label className="lbl" style={{ display: "block", marginBottom: 6 }}>Police Station</label>
              <select className="inp" value={qbStation} onChange={e => { setQbStation(e.target.value); setQbResults(null); }}>
                <option value="ALL">All Stations</option>
                {SMAP.map(s => <option key={s.sh} value={s.lb}>{s.lb}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="lbl" style={{ display: "block", marginBottom: 6 }}>Case Type</label>
              <PillGroup value={qbCaseType} onChange={v => { setQbCaseType(v); setQbResults(null); }} options={caseTypeOptions} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="lbl" style={{ display: "block", marginBottom: 6 }}>List Type</label>
              <PillGroup value={qbListType} onChange={v => { setQbListType(v); setQbResults(null); }} options={listTypeOptions} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="lbl" style={{ display: "block", marginBottom: 6 }}>Date of Registration</label>
              <PillGroup value={qbDateMode}
                onChange={v => { setQbDateMode(v); setQbDateA(""); setQbDateB(""); setQbResults(null); }}
                options={dateModeOptions} />
              {(qbDateMode === "gt" || qbDateMode === "lt") && (
                <div style={{ marginTop: 8 }}>
                  <input className="inp vt-mono" type="text" placeholder="dd.mm.yyyy"
                    value={qbDateA} onChange={e => setQbDateA(e.target.value)} style={{ maxWidth: 140 }} />
                </div>
              )}
              {qbDateMode === "between" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input className="inp vt-mono" type="text" placeholder="From dd.mm.yyyy"
                    value={qbDateA} onChange={e => setQbDateA(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ color: "var(--txt3)", fontSize: 11 }}>—</span>
                  <input className="inp vt-mono" type="text" placeholder="To dd.mm.yyyy"
                    value={qbDateB} onChange={e => setQbDateB(e.target.value)} style={{ flex: 1 }} />
                </div>
              )}
            </div>

            <button className="ftc-execute-btn" style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
              onClick={runQueryBuilder} disabled={qbLoading}>
              {qbLoading ? "⏳ Loading…" : "🔍 Run Query"}
            </button>
          </div>

          {qbMsg && (
            <div className={`et-msg et-msg-${qbMsg.type}`} style={{ margin: "10px 14px 0" }}>
              {qbMsg.text}
            </div>
          )}

          {/* ── Results Table ────────────────────────────────── */}
          {qbResults !== null && qbResults.length > 0 && (
            <div className="card" style={{ margin: "12px 14px 0" }}>
              <div className="ctitle">
                📋 Results
                <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--txt3)", fontSize: 10 }}>
                  {qbResults.length} case{qbResults.length !== 1 ? "s" : ""} — tap row to select
                </span>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 12, padding: "0 0 10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--txt3)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--red)22", border: "1px solid var(--red)66", display: "inline-block" }} />
                  FIR missing — needs Add
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--txt3)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--grn)11", border: "1px solid var(--grn)44", display: "inline-block" }} />
                  FIR present — ready to move
                </div>
              </div>

              <div className="tbl-wrap">
                <table className="abs-tbl">
                  <thead>
                    <tr>
                      <th>#</th><th>Case No.</th><th>FIR No.</th>
                      <th>Station</th><th>Parties</th>
                      <th>Reg Date</th><th>Type</th><th>FIR Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qbResults.map((r, idx) => {
                      const ct       = detectCaseType(r.cn);
                      const isSel    = qbSelRow?.cn === r.cn && qbSelRow?._type === r._type;
                      const firFound = rowFIRExists(r);
                      const stO      = findStationForCase(r, SMAP);

                      return (
                        <tr key={idx}
                          onClick={() => handleQbRowClick(r)}
                          style={{
                            cursor: "pointer",
                            background: isSel
                              ? "var(--gold)18"
                              : firFound
                                ? "var(--grn)07"
                                : "var(--red)09",
                            outline: isSel ? "1.5px solid var(--gold)" : undefined,
                            borderLeft: firFound
                              ? "3px solid var(--grn)"
                              : "3px solid var(--red)",
                          }}>
                          <td style={{ color: "var(--txt3)", fontSize: 10 }}>{idx + 1}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>
                            {ct && (
                              <span style={{
                                marginRight: 3, padding: "1px 5px", borderRadius: 8, fontSize: 9,
                                background: caseTypeColor(ct) + "22", color: caseTypeColor(ct),
                                border: `1px solid ${caseTypeColor(ct)}55`, fontWeight: 800,
                              }}>{ct}</span>
                            )}
                            {r.cn || "—"}
                          </td>
                          <td className="mono" style={{ color: "var(--gold)" }}>{r.fn || "—"}</td>
                          <td style={{ fontSize: 10 }}>{r.sta || "—"}</td>
                          <td style={{ maxWidth: 140, wordBreak: "break-word", fontSize: 11 }}>{r.pt || "—"}</td>
                          <td className="mono" style={{ fontSize: 10 }}>{r.dreg || "—"}</td>
                          <td>
                            <span className={`vt-tag ${r._type === "pending" ? "vt-tag-blue" : "vt-tag-green"}`}
                              style={{ fontSize: 9 }}>
                              {r._type === "pending" ? "P" : "D"}
                            </span>
                          </td>
                          {/* FIR Status cell */}
                          <td onClick={e => e.stopPropagation()}>
                            {firFound ? (
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: "var(--grn)",
                                padding: "2px 7px", borderRadius: 8,
                                background: "var(--grn)18", border: "1px solid var(--grn)44",
                                whiteSpace: "nowrap",
                              }}>✓ Present</span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!stO) return;
                                  setAddFirTarget({ row: r, stObj: stO });
                                }}
                                style={{
                                  fontSize: 10, fontWeight: 800, color: "#fff",
                                  padding: "3px 8px", borderRadius: 8, border: "none",
                                  background: "var(--red)", cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >+ Add FIR</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── QB Confirm Panel ─────────────────────────────── */}
          {qbSelRow && (
            <div className="card" style={{ margin: "12px 14px 0", border: "1.5px solid var(--gold)55" }}>
              <div className="ctitle" style={{ color: "var(--gold)" }}>
                📌 Selected Case
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  ["Case Number", qbSelRow.cn, "var(--pur)"],
                  ["FIR Number",  qbSelRow.fn, "var(--gold)"],
                  ["Station",     qbSelRow.sta, null],
                  ["Type",        qbSelRow._type, null],
                  ["Reg Date",    qbSelRow.dreg, null],
                  ["Next Date",   qbSelRow.nxt || qbSelRow.ddec || "—", null],
                ].map(([lbl, val, col]) => (
                  <div key={lbl} style={{
                    background: "var(--bg3)", borderRadius: 8, padding: "7px 10px",
                    border: "1px solid var(--bdr)",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--txt3)", fontWeight: 700, textTransform: "uppercase" }}>{lbl}</div>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: col || "var(--txt)", marginTop: 2 }}>
                      {val || "—"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: "var(--bg3)", borderRadius: 8, padding: "7px 10px",
                border: "1px solid var(--bdr)", marginBottom: 10,
              }}>
                <div style={{ fontSize: 9, color: "var(--txt3)", fontWeight: 700, textTransform: "uppercase" }}>Parties</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{qbSelRow.pt || "—"}</div>
              </div>

              {/* FIR presence status */}
              {(() => {
                const firPresent = rowFIRExists(qbSelRow);
                const stO = findStationForCase(qbSelRow, SMAP);
                if (firPresent) {
                  return (
                    <div style={{
                      background: "var(--grn)11", border: "1px solid var(--grn)44",
                      borderRadius: 8, padding: "7px 10px", marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 9, color: "var(--grn)", fontWeight: 800, marginBottom: 4 }}>
                        ✓ FIR FOUND IN REGISTER
                      </div>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: "var(--txt3)" }}>Station: </span>
                        <strong>{qbFirInfo?.stObj?.lb || qbSelRow.sta}</strong>
                        {"  "}
                        <span style={{ color: "var(--txt3)" }}>Section: </span>
                        <strong>{qbFirInfo?.firRow?.sec || "—"}</strong>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div style={{
                      background: "var(--red)11", border: "1.5px solid var(--red)55",
                      borderRadius: 8, padding: "10px 12px", marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 800, marginBottom: 6 }}>
                        ⛔ FIR NOT IN REGISTER — Move Blocked
                      </div>
                      <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 10 }}>
                        FIR <strong style={{ color: "var(--gold)" }}>{qbSelRow.fn}</strong> is not present in{" "}
                        <strong>{qbSelRow.sta}</strong> FIR Pending Register.
                        Add it first, then move.
                      </div>
                      {stO && (
                        <button
                          onClick={() => setAddFirTarget({ row: qbSelRow, stObj: stO })}
                          style={{
                            padding: "8px 16px", borderRadius: 8, border: "none",
                            background: "var(--grn)", color: "#fff", cursor: "pointer",
                            fontSize: 12, fontWeight: 700,
                          }}
                        >
                          ➕ Add FIR to {stO.lb}
                        </button>
                      )}
                    </div>
                  );
                }
              })()}

              {qbMoveMsg && (
                <div className={`et-msg et-msg-${qbMoveMsg.type === "ok" ? "ok" : qbMoveMsg.type === "err" ? "err" : "info"}`}
                  style={{ marginBottom: 8 }}>
                  {qbMoveMsg.text}
                </div>
              )}

              {/* Move buttons — only show if FIR is present */}
              {rowFIRExists(qbSelRow) && !qbConfirm && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="vt-btn vt-btn-ghost" style={{ flex: 1 }}
                    onClick={() => { setQbSelRow(null); setQbMoveMsg(null); }}>
                    ✕ Deselect
                  </button>
                  <button className="ftc-execute-btn" style={{ flex: 2 }}
                    onClick={() => setQbConfirm(true)}>
                    🗂 Move to Case Numbered →
                  </button>
                </div>
              )}

              {rowFIRExists(qbSelRow) && qbConfirm && (
                <div>
                  <div className="ftc-warn-note" style={{ marginBottom: 10 }}>
                    ⚠ This will save case <strong>{qbSelRow.cn}</strong> to the Case Numbered sheet
                    {qbFirInfo ? ` and delete FIR from "${qbFirInfo.stObj.lb}"` : ""}.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="vt-btn vt-btn-ghost" style={{ flex: 1 }}
                      onClick={() => setQbConfirm(false)} disabled={qbBusy}>
                      ← Back
                    </button>
                    <button className="ftc-execute-btn" style={{ flex: 2 }}
                      onClick={executeQbMove} disabled={qbBusy}>
                      {qbBusy ? "⏳ Processing…" : "✅ Confirm Move"}
                    </button>
                  </div>
                </div>
              )}

              {/* Deselect button when FIR missing */}
              {!rowFIRExists(qbSelRow) && (
                <button className="vt-btn vt-btn-ghost" style={{ width: "100%", marginTop: 4 }}
                  onClick={() => { setQbSelRow(null); setQbMoveMsg(null); }}>
                  ✕ Deselect
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           CASE DETAIL MODAL
         ══════════════════════════════════════════════════════════ */}
      {activeDetailCase && (
        <div className="modal-overlay" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "fixed", zIndex: 1000, inset: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}>
          <div className="modal" style={{
            maxWidth: 620, width: "90%", maxHeight: "85vh",
            display: "flex", flexDirection: "column",
            background: "var(--bg2)", borderRadius: 14,
            border: "1px solid var(--bdr)", padding: 16,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingBottom: 10, borderBottom: "1px solid var(--bdr2)", marginBottom: 12,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--txt1)" }}>Case Details</span>
              <button className="btn btn-o btn-sm" onClick={() => setActiveDetailCase(null)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "4px 0", flex: 1 }}>
              <CaseDetail r={{
                ...activeDetailCase,
                _type: activeDetailCase.type || activeDetailCase._type,
                caseSec: activeDetailCase.sec2,
                nxt: activeDetailCase.nxt,
              }} srcKey="cnum" />
            </div>
            <div style={{
              paddingTop: 10, borderTop: "1px solid var(--bdr2)",
              display: "flex", justifyContent: "flex-end", marginTop: 12,
            }}>
              <button type="button" className="btn btn-o" onClick={() => setActiveDetailCase(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
