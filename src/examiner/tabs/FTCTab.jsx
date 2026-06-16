import { useState, useMemo, useCallback } from "react";
import { SID, SMAP as DEFAULT_SMAP, normalizeStation } from "../constants/config.js";
import { firMatch } from "../utils/helpers.js";
import {
  sheetsAppend,
  sheetsDeleteRow,
  loadAllData,
  ensureCasenumHeaders,
} from "../utils/sheets.js";
import CaseDetail from "../components/CaseDetail.jsx";

// Import split-out components
import AddFIRModal from "./inner/ftc/AddFIRModal.jsx";
import MoveFIRInner from "./inner/ftc/MoveFIRInner.jsx";
import OtherReasonsInner from "./inner/ftc/OtherReasonsInner.jsx";
import CaseNumberedInner from "./inner/ftc/CaseNumberedInner.jsx";
import QueryBuilderInner from "./inner/ftc/QueryBuilderInner.jsx";

// ── Case type priority order ─────────────────────────────────────
const CASE_TYPE_ORDER = ["PRC", "CC", "STC", "MC", "CRLMP"];

function parseDate(str) {
  if (!str) return null;
  const s = str.toString().trim();
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
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


// ── Auto-format date input → DD-MM-YYYY (hyphens) ───────────────
function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

// parse DD-MM-YYYY (hyphens) or DD.MM.YYYY (dots) for QB date inputs
function parseQbDate(str) {
  if (!str) return null;
  const s = str.toString().trim();
  // support both - and . separators
  const m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
}

function handleQbDateInput(prev, raw) {
  const clean = raw.replace(/[^\d-]/g, "");
  // Allow backspace: if shrinking just return clean
  if (clean.length < prev.replace(/[^\d-]/g, "").length) return clean;
  return autoFormatDate(clean);
}

// ── Find which station a case belongs to ────────────────────────
// Looks at case.sta (canonical label) → finds SMAP entry
function findStationForCase(row, SMAP) {
  if (!row?.sta) return null;
  return SMAP.find((s) => s.lb === row.sta || s.sh === row.sta) || null;
}

// ── Check if a FIR exists in a station's pending list ───────────
// fn format: "107/2026"  — leading zeros in FIR number don't count
function firExistsInStation(fn, firDb, stSh) {
  if (!fn || !stSh) return false;
  const parts = fn.split("/");
  const num = String(parseInt(parts[0], 10) || parts[0]);
  const yr = parts[1] || "";
  const rows = firDb[stSh] || [];
  return rows.some((r) => firMatch(r.cr, num, yr));
}

// ════════════════════════════════════════════════════════════════
//  MAIN ORCHESTRATOR COMPONENT
// ════════════════════════════════════════════════════════════════
export default function FTCTab({ db, setDb, tok, smap }) {
  const SMAP = smap || DEFAULT_SMAP;
  const curYr = String(new Date().getFullYear());

  const [subTab, setSubTab] = useState("move");

  // ── Move FIR state ───────────────────────────────────────────
  const [fn, setFn] = useState("");
  const [yr, setYr] = useState(curYr);
  const [searched, setSearched] = useState(false);
  const [selSt, setSelSt] = useState(null);
  const [selCase, setSelCase] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // ── Details state ────────────────────────────────────────────
  const [detSearch, setDetSearch] = useState("");
  const [detStation, setDetStation] = useState("ALL");
  const [detType, setDetType] = useState("ALL");
  const [activeDetailCase, setActiveDetailCase] = useState(null);
  const [cnumLoading, setCnumLoading] = useState(false);

  // ── QB state ─────────────────────────────────────────────────
  const [qbStation, setQbStation] = useState("ALL");
  const [qbCaseType, setQbCaseType] = useState("ALL");
  const [qbSection, setQbSection] = useState("ALL");
  const [qbListType, setQbListType] = useState("ALL");
  const [qbDateMode, setQbDateMode] = useState("between");
  const [qbDateA, setQbDateA] = useState("");
  const [qbDateB, setQbDateB] = useState("");
  const [qbResults, setQbResults] = useState(null);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbMsg, setQbMsg] = useState(null);

  const [qbSelRow, setQbSelRow] = useState(null);
  const [qbSelectedRows, setQbSelectedRows] = useState([]);
  const [qbConfirm, setQbConfirm] = useState(false);
  const [qbBusy, setQbBusy] = useState(false);
  const [qbMoveMsg, setQbMoveMsg] = useState(null);

  // ── Other Reasons state ──────────────────────────────────────
  const [orFn, setOrFn] = useState("");
  const [orYr, setOrYr] = useState(curYr);
  const [orSearched, setOrSearched] = useState(false);
  const [orSelSt, setOrSelSt] = useState(null);
  const [orRemark, setOrRemark] = useState("");
  const [orBusy, setOrBusy] = useState(false);
  const [orMsg, setOrMsg] = useState(null);

  // ── Add FIR modal state ──────────────────────────────────────
  const [addFirTarget, setAddFirTarget] = useState(null); // { row, stObj }

  // ── Track FIRs added this session so UI updates immediately ──
  // (in case db hasn't re-fetched yet)
  const [sessionAddedFIRs, setSessionAddedFIRs] = useState(new Set());

  // ── Derived values ───────────────────────────────────────────
  const cnumLoaded = useMemo(
    () => Array.isArray(db?.cnum) && db.cnum.length > 0,
    [db?.cnum]
  );

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
    setSelSt(null);
    setSelCase(null);
    setConfirming(false);
    setMsg(null);
  }

  function resetAll() {
    setFn("");
    setYr(curYr);
    setSearched(false);
    setSelSt(null);
    setSelCase(null);
    setConfirming(false);
    setBusy(false);
    setMsg(null);
  }

  function handleFnChange(v) {
    setFn(v.replace(/\D/g, ""));
    setSearched(false);
    setSelSt(null);
    setSelCase(null);
    setConfirming(false);
  }

  function handleYrChange(v) {
    setYr(v.replace(/\D/g, "").slice(0, 4));
    setSearched(false);
    setSelSt(null);
    setSelCase(null);
    setConfirming(false);
  }

  const stationHits =
    searched && sNum && yr
      ? SMAP.filter((s) =>
          (db.fir[s.sh] || []).some((r) => firMatch(r.cr, sNum, yr))
        )
      : [];

  const firRow = selSt
    ? (db.fir[selSt] || []).find((r) => firMatch(r.cr, sNum, yr))
    : null;

  const stObj = selSt ? SMAP.find((s) => s.sh === selSt) : null;

  const allCases = useMemo(() => {
    if (!selSt) return [];
    const canonicalLabel = SMAP.find((s) => s.sh === selSt)?.lb || selSt;
    const matchStation = (cSta) => {
      if (!cSta) return true;
      const norm = normalizeStation(cSta);
      return (
        norm === canonicalLabel || cSta === canonicalLabel || cSta === selSt
      );
    };
    const pending = db.pend
      .filter((c) => firMatch(c.fn, sNum, yr))
      .filter((c) => matchStation(c.sta))
      .map((c) => ({ ...c, _type: "pending" }));
    const disposal = db.disp
      .filter((c) => firMatch(c.fn, sNum, yr))
      .filter((c) => matchStation(c.sta))
      .map((c) => ({ ...c, _type: "disposal" }));
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
      `${sNum}/${yr}`,
      stLb,
      firRow.sec || "",
      firRow.dr || "",
      selCase.cn || "",
      selCase.pt || "",
      selCase.adv || "",
      selCase.dreg || "",
      selCase.nxt || selCase.ddec || "",
      caseType,
      selCase.sec || "",
      selCase.nat || "",
      selCase.des || "",
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setMsg({ type: "err", text: "Failed to save to Case Numbered sheet." });
      setBusy(false);
      return;
    }
    if (firRow.ri && firRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, selSt, firRow.ri);
    }
    const idx = (db.fir[selSt] || []).findIndex((r) => r.cr === firRow.cr);
    if (idx >= 0) {
      const newFir = (db.fir[selSt] || [])
        .filter((_, i) => i !== idx)
        .map((r) => (r.ri > firRow.ri ? { ...r, ri: r.ri - 1 } : r));
      setDb((prev) => ({
        ...prev,
        fir: { ...prev.fir, [selSt]: newFir },
        cnum: [
          ...prev.cnum,
          {
            fn: `${sNum}/${yr}`,
            sta: stLb,
            sec: firRow.sec || "",
            dr: firRow.dr || "",
            cn: selCase.cn || "",
            pt: selCase.pt || "",
            adv: selCase.adv || "",
            dreg: selCase.dreg || "",
            nxt: selCase.nxt || selCase.ddec || "",
            type: caseType,
            sec2: selCase.sec || "",
            nat: selCase.nat || "",
            des: selCase.des || "",
          },
        ],
      }));
    }
    setMsg({ type: "loading", text: "Syncing live data…" });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
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
  const handleSubTabChange = useCallback(
    async (tab) => {
      setSubTab(tab);
      if (tab === "details" && !cnumLoaded && tok) {
        setCnumLoading(true);
        try {
          const fresh = await loadAllData(tok, SMAP);
          if (fresh) {
            setDb(fresh);
          }
        } catch (e) {
          console.error("cnum load error:", e);
        } finally {
          setCnumLoading(false);
        }
      }
    },
    [cnumLoaded, tok, SMAP, setDb]
  );

  // ── Other Reasons helpers ────────────────────────────────────
  function handleOrSearch() {
    if (!orFn || !orYr || orYr.length < 4) {
      setOrMsg({
        type: "err",
        text: "Enter a valid FIR number and 4-digit year.",
      });
      return;
    }
    setOrSearched(true);
    setOrSelSt(null);
    setOrRemark("");
    setOrMsg(null);
  }

  function resetOrAll() {
    setOrFn("");
    setOrYr(curYr);
    setOrSearched(false);
    setOrSelSt(null);
    setOrRemark("");
    setOrBusy(false);
    setOrMsg(null);
  }

  const orSNum = orFn ? String(parseInt(orFn, 10) || orFn) : "";
  const orStationHits =
    orSearched && orSNum && orYr
      ? SMAP.filter((s) =>
          (db.fir[s.sh] || []).some((r) => firMatch(r.cr, orSNum, orYr))
        )
      : [];

  const orFirRow = orSelSt
    ? (db.fir[orSelSt] || []).find((r) => firMatch(r.cr, orSNum, orYr))
    : null;

  const orStObj = orSelSt ? SMAP.find((s) => s.sh === orSelSt) : null;

  async function executeOrMove() {
    if (!orFirRow || !orSelSt || !orRemark.trim()) return;
    setOrBusy(true);
    setOrMsg({ type: "loading", text: "Processing…" });
    const stLb = orStObj?.lb || orSelSt;
    await ensureCasenumHeaders(tok);
    const row = [
      `${orSNum}/${orYr}`,
      stLb,
      orFirRow.sec || "",
      orFirRow.dr || "",
      "Other reasons",
      orRemark.trim(),
      "—",
      "—",
      "—",
      "other",
      "—",
      "—",
      orRemark.trim(),
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setOrMsg({ type: "err", text: "Failed to save to Case Numbered sheet." });
      setOrBusy(false);
      return;
    }
    if (orFirRow.ri && orFirRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, orSelSt, orFirRow.ri);
    }
    const idx = (db.fir[orSelSt] || []).findIndex((r) => r.cr === orFirRow.cr);
    if (idx >= 0) {
      const newFir = (db.fir[orSelSt] || [])
        .filter((_, i) => i !== idx)
        .map((r) => (r.ri > orFirRow.ri ? { ...r, ri: r.ri - 1 } : r));
      setDb((prev) => ({
        ...prev,
        fir: { ...prev.fir, [orSelSt]: newFir },
        cnum: [
          ...prev.cnum,
          {
            fn: `${orSNum}/${orYr}`,
            sta: stLb,
            sec: orFirRow.sec || "",
            dr: orFirRow.dr || "",
            cn: "Other reasons",
            pt: orRemark.trim(),
            adv: "—",
            dreg: "—",
            nxt: "—",
            type: "other",
            sec2: "—",
            nat: "—",
            des: orRemark.trim(),
          },
        ],
      }));
    }
    setOrMsg({ type: "loading", text: "Syncing live data…" });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
      setOrMsg({ type: "ok", text: `✓ FIR ${orSNum}/${orYr} moved & synced.` });
    } else {
      setOrMsg({
        type: "ok",
        text: `✓ FIR ${orSNum}/${orYr} moved (offline sync).`,
      });
    }
    setOrBusy(false);
    setTimeout(resetOrAll, 1800);
  }

  // ════════════════════════════════════════════════════════════
  //  QB helpers
  // ════════════════════════════════════════════════════════════
  async function runQueryBuilder() {
    setQbLoading(true);
    setQbResults(null);
    setQbMsg(null);
    setQbSelRow(null);
    setQbSelectedRows([]);
    setQbConfirm(false);
    setQbMoveMsg(null);
    setSessionAddedFIRs(new Set()); // reset per run
    try {
      const fresh = await loadAllData(tok, SMAP);
      if (fresh) {
        setDb(fresh);
      }
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
      const matchSection = (sec) => {
        if (qbCaseType !== "CRLMP" || qbSection === "ALL") return true;
        return (sec || "").trim() === qbSection;
      };
      const matchDate = (dreg) => {
        const d = parseDate(dreg);
        if (!d) return true; // no dreg → include
        if (qbDateMode === "gt") {
          const ref = parseQbDate(qbDateA);
          return ref ? d > ref : true;
        }
        if (qbDateMode === "lt") {
          const ref = parseQbDate(qbDateA);
          return ref ? d < ref : true;
        }
        if (qbDateMode === "between") {
          const a = parseQbDate(qbDateA);
          const b = parseQbDate(qbDateB);
          if (!a && !b) return true; // both empty → show all
          if (a && !b) return d >= a;
          if (!a && b) return d <= b;
          return d >= a && d <= b;
        }
        return true;
      };

      let results = [];
      if (qbListType === "ALL" || qbListType === "pending") {
        results.push(
          ...data.pend
            .filter((r) => matchStation(r.sta))
            .filter((r) => matchCaseType(r.cn))
            .filter((r) => matchSection(r.sec))
            .filter((r) => matchDate(r.dreg))
            .map((r) => ({ ...r, _type: "pending" }))
        );
      }
      if (qbListType === "ALL" || qbListType === "disposal") {
        results.push(
          ...data.disp
            .filter((r) => matchStation(r.sta))
            .filter((r) => matchCaseType(r.cn))
            .filter((r) => matchSection(r.sec))
            .filter((r) => matchDate(r.dreg))
            .map((r) => ({ ...r, _type: "disposal" }))
        );
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

      const existingCnum = new Set(
        (data.cnum || []).map((r) => (r.cn || "").toString().trim().toUpperCase())
      );
      results = results.filter((r) => {
        const cn = (r.cn || "").toString().trim().toUpperCase();
        return cn ? !existingCnum.has(cn) : true;
      });

      setQbResults(results);
      if (results.length === 0)
        setQbMsg({ type: "info", text: "No cases match the selected filters." });
    } catch (e) {
      console.error("QB error:", e);
      setQbMsg({ type: "err", text: "Failed to load data. Check connection." });
    } finally {
      setQbLoading(false);
    }
  }

  function getQbRowKey(row) {
    return `${(row.fn || "").toString().trim()}|${(row.cn || "")
      .toString()
      .trim()}|${(row.sta || "").toString().trim()}|${(row._type || "")
      .toString()
      .trim()}`;
  }

  function handleQbRowClick(row) {
    setQbConfirm(false);
    setQbMoveMsg(null);
    const key = getQbRowKey(row);
    const exists = qbSelectedRows.some((item) => getQbRowKey(item) === key);
    if (exists) {
      const next = qbSelectedRows.filter((item) => getQbRowKey(item) !== key);
      setQbSelectedRows(next);
      if (qbSelRow && getQbRowKey(qbSelRow) === key) {
        setQbSelRow(next.length ? next[next.length - 1] : null);
      }
      return;
    }
    setQbSelRow(row);
    setQbSelectedRows([...qbSelectedRows, row]);
  }

  // ── For a given result row, find the FIR in the correct station ──
  // Station is derived from row.sta (canonical label)
  const qbFirInfo = useMemo(() => {
    if (!qbSelRow) return null;
    const stObj = findStationForCase(qbSelRow, SMAP);
    if (!stObj) return null;
    const firs = db.fir[stObj.sh] || [];
    const parts = (qbSelRow.fn || "").split("/");
    const num = String(parseInt(parts[0], 10) || parts[0]);
    const yr2 = parts[1] || "";
    const matched = firs.find((f) => firMatch(f.cr, num, yr2));
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
        text: `⛔ FIR ${qbSelRow.fn} is not present in "${
          qbFirInfo?.stObj?.lb || qbSelRow.sta
        }" FIR Register. Add it first before moving.`,
      });
      setQbConfirm(false);
      return;
    }

    setQbBusy(true);
    setQbMoveMsg({ type: "loading", text: "Processing…" });

    const { firRow, stObj } = qbFirInfo;
    const stLb = stObj?.lb || stObj?.sh || "";
    const caseType = (qbSelRow._type || "").toLowerCase().trim();

    await ensureCasenumHeaders(tok);

    const row = [
      qbSelRow.fn || "",
      stLb,
      firRow.sec || "",
      firRow.dr || "",
      qbSelRow.cn || "",
      qbSelRow.pt || "",
      qbSelRow.adv || "",
      qbSelRow.dreg || "",
      qbSelRow.nxt || qbSelRow.ddec || "",
      caseType,
      qbSelRow.sec || "",
      qbSelRow.nat || "",
      qbSelRow.des || "",
    ];
    const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [row]);
    if (!saved) {
      setQbMoveMsg({
        type: "err",
        text: "Failed to save to Case Numbered sheet.",
      });
      setQbBusy(false);
      return;
    }
    if (firRow.ri && firRow.ri !== 999999) {
      await sheetsDeleteRow(tok, SID.fir, stObj.sh, firRow.ri);
    }

    setQbMoveMsg({ type: "loading", text: "Syncing…" });
    const fresh = await loadAllData(tok, SMAP);
    if (fresh) {
      setDb(fresh);
      setQbResults((prev) =>
        (prev || []).filter(
          (r) => !(r.cn === qbSelRow.cn && r._type === qbSelRow._type)
        )
      );
      setQbMoveMsg({
        type: "ok",
        text: `✓ Case ${qbSelRow.cn} moved to Case Numbered.`,
      });
    } else {
      setQbMoveMsg({
        type: "ok",
        text: `✓ Case ${qbSelRow.cn} moved (offline sync).`,
      });
    }
    setQbBusy(false);
    setTimeout(() => {
      setQbSelRow(null);
      setQbConfirm(false);
      setQbMoveMsg(null);
    }, 2000);
  }

  async function executeQbBulkMove() {
    if (!qbSelectedRows.length) return;
    setQbBusy(true);
    setQbMoveMsg({ type: "loading", text: "Processing bulk transfer…" });
    try {
      await ensureCasenumHeaders(tok);
      const selected = [...qbSelectedRows];
      const moved = [];
      const skipped = [];
      const fresh = await loadAllData(tok, SMAP);
      if (fresh) {
        setDb(fresh);
      }
      const baseData = fresh || db;
      const data = { ...baseData, fir: { ...baseData.fir } };

      for (const row of selected) {
        const stObj = findStationForCase(row, SMAP);
        if (!stObj) {
          skipped.push(row);
          continue;
        }
        const firInfo = (data.fir[stObj.sh] || []).find((f) =>
          firMatch(
            f.cr,
            String(parseInt((row.fn || "").split("/")[0], 10) || row.fn),
            (row.fn || "").split("/")[1] || ""
          )
        );
        if (!firInfo) {
          skipped.push(row);
          continue;
        }
        const caseType = (row._type || "").toLowerCase().trim();
        const appendRow = [
          row.fn || "",
          stObj.lb,
          firInfo.sec || "",
          firInfo.dr || "",
          row.cn || "",
          row.pt || "",
          row.adv || "",
          row.dreg || "",
          row.nxt || row.ddec || "",
          caseType,
          row.sec || "",
          row.nat || "",
          row.des || "",
        ];
        const saved = await sheetsAppend(tok, SID.casenum, "Sheet1!A:M", [
          appendRow,
        ]);
        if (!saved) {
          skipped.push(row);
          continue;
        }
        if (firInfo.ri && firInfo.ri !== 999999) {
          await sheetsDeleteRow(tok, SID.fir, stObj.sh, firInfo.ri);
          data.fir[stObj.sh] = (data.fir[stObj.sh] || [])
            .filter((f) => f.ri !== firInfo.ri)
            .map((f) => (f.ri > firInfo.ri ? { ...f, ri: f.ri - 1 } : f));
        }
        moved.push(row);
      }

      const latest = await loadAllData(tok, SMAP);
      if (latest) {
        setDb(latest);
      }

      if (moved.length) {
        const suffix = skipped.length ? ` (${skipped.length} skipped)` : "";
        setQbMoveMsg({
          type: "ok",
          text: `✓ ${moved.length} case${
            moved.length !== 1 ? "s" : ""
          } moved to Case Numbered.${suffix}`,
        });
      } else {
        setQbMoveMsg({
          type: "err",
          text: "No selected cases could be moved. Ensure FIRs exist in the register.",
        });
      }
      setQbResults((prev) =>
        (prev || []).filter(
          (r) => !moved.some((m) => getQbRowKey(m) === getQbRowKey(r))
        )
      );
      setQbSelectedRows([]);
      setQbSelRow(null);
    } catch (e) {
      console.error("Bulk QB error:", e);
      setQbMoveMsg({
        type: "err",
        text: "Bulk move failed. Please try again.",
      });
    } finally {
      setQbBusy(false);
    }
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
          onClose={() => setAddFirTarget(null)}
          onAdded={(crStr) => {
            const key = crStr + "|" + addFirTarget.row.sta;
            setSessionAddedFIRs((prev) => new Set([...prev, key]));
            setAddFirTarget(null);
            // If this row was selected in confirm panel, recalculate
            if (qbSelRow?.fn === crStr || qbSelRow?.fn === addFirTarget.row.fn) {
              setQbMoveMsg({
                type: "ok",
                text: `✓ FIR ${crStr} added to register. You can now move.`,
              });
              setQbConfirm(false);
            }
          }}
        />
      )}

      {/* ── Top tab bar ─────────────────────────────────────────── */}
      <div className="abt-tabbar">
        <button
          className={`abt-tab${subTab === "move" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("move")}
        >
          <span className="abt-tab-icon">🔀</span>
          <span>Move FIR</span>
        </button>
        <button
          className={`abt-tab${
            subTab === "other_reasons" ? " abt-tab-active" : ""
          }`}
          onClick={() => setSubTab("other_reasons")}
        >
          <span className="abt-tab-icon">📝</span>
          <span>Other Reasons</span>
        </button>
        <button
          className={`abt-tab${subTab === "details" ? " abt-tab-active" : ""}`}
          onClick={() => handleSubTabChange("details")}
        >
          <span className="abt-tab-icon">📂</span>
          <span>Case Numbered</span>
        </button>
        <button
          className={`abt-tab${subTab === "query" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("query")}
        >
          <span className="abt-tab-icon">🔎</span>
          <span>Query Builder</span>
        </button>
      </div>

      {/* ── SUB-TABS RENDERING ── */}
      {subTab === "move" && (
        <MoveFIRInner
          fn={fn}
          yr={yr}
          curYr={curYr}
          searched={searched}
          displayFIR={displayFIR}
          stationHits={stationHits}
          selSt={selSt}
          setSelSt={setSelSt}
          firRow={firRow}
          stObj={stObj}
          allCases={allCases}
          selCase={selCase}
          setSelCase={setSelCase}
          confirming={confirming}
          setConfirming={setConfirming}
          busy={busy}
          msg={msg}
          handleFnChange={handleFnChange}
          handleYrChange={handleYrChange}
          doSearch={doSearch}
          resetAll={resetAll}
          execute={execute}
        />
      )}

      {subTab === "other_reasons" && (
        <OtherReasonsInner
          orFn={orFn}
          setOrFn={setOrFn}
          orYr={orYr}
          setOrYr={setOrYr}
          curYr={curYr}
          orSearched={orSearched}
          setOrSearched={setOrSearched}
          orStationHits={orStationHits}
          orSelSt={orSelSt}
          setOrSelSt={setOrSelSt}
          orFirRow={orFirRow}
          orRemark={orRemark}
          setOrRemark={setOrRemark}
          orBusy={orBusy}
          orMsg={orMsg}
          handleOrSearch={handleOrSearch}
          resetOrAll={resetOrAll}
          executeOrMove={executeOrMove}
        />
      )}

      {subTab === "details" && (
        <CaseNumberedInner
          db={db}
          setDb={setDb}
          tok={tok}
          SMAP={SMAP}
          detSearch={detSearch}
          setDetSearch={setDetSearch}
          detStation={detStation}
          setDetStation={setDetStation}
          detType={detType}
          setDetType={setDetType}
          setActiveDetailCase={setActiveDetailCase}
          cnumLoading={cnumLoading}
          setCnumLoading={setCnumLoading}
        />
      )}

      {subTab === "query" && (
        <QueryBuilderInner
          db={db}
          qbSection={qbSection}
          setQbSection={setQbSection}
          SMAP={SMAP}
          qbStation={qbStation}
          setQbStation={setQbStation}
          qbCaseType={qbCaseType}
          setQbCaseType={setQbCaseType}
          qbListType={qbListType}
          setQbListType={setQbListType}
          qbDateMode={qbDateMode}
          setQbDateMode={setQbDateMode}
          qbDateA={qbDateA}
          setQbDateA={setQbDateA}
          qbDateB={qbDateB}
          setQbDateB={setQbDateB}
          qbResults={qbResults}
          qbLoading={qbLoading}
          qbMsg={qbMsg}
          qbSelRow={qbSelRow}
          setQbSelRow={setQbSelRow}
          qbSelectedRows={qbSelectedRows}
          setQbSelectedRows={setQbSelectedRows}
          qbConfirm={qbConfirm}
          setQbConfirm={setQbConfirm}
          qbBusy={qbBusy}
          qbMoveMsg={qbMoveMsg}
          setQbMoveMsg={setQbMoveMsg}
          handleQbRowClick={handleQbRowClick}
          qbFirInfo={qbFirInfo}
          rowFIRExists={rowFIRExists}
          findStationForCase={findStationForCase}
          runQueryBuilder={runQueryBuilder}
          executeQbMove={executeQbMove}
          executeQbBulkMove={executeQbBulkMove}
          setAddFirTarget={setAddFirTarget}
          handleQbDateInput={handleQbDateInput}
          getQbRowKey={getQbRowKey}
        />
      )}

      {/* ── CASE DETAIL MODAL ────────────────────────────────────── */}
      {activeDetailCase && (
        <div
          className="modal-overlay"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            zIndex: 1000,
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: 620,
              width: "90%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg2)",
              borderRadius: 14,
              border: "1px solid var(--bdr)",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 10,
                borderBottom: "1px solid var(--bdr2)",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--txt1)" }}>
                Case Details
              </span>
              <button
                className="btn btn-o btn-sm"
                onClick={() => setActiveDetailCase(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "4px 0", flex: 1 }}>
              <CaseDetail
                r={{
                  ...activeDetailCase,
                  _type: activeDetailCase.type || activeDetailCase._type,
                  caseSec: activeDetailCase.sec2,
                  nxt: activeDetailCase.nxt,
                }}
                srcKey="cnum"
              />
            </div>
            <div
              style={{
                paddingTop: 10,
                borderTop: "1px solid var(--bdr2)",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                type="button"
                className="btn btn-o"
                onClick={() => setActiveDetailCase(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
