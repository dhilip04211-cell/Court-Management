import { useState, useEffect, useRef } from "react";
import { buildSectionString } from "../utils/helpers.js";
import { ACTS } from "../constants/config.js";

export default function SectionBuilder({ value, onChange }) {
  const [groups, setGroups] = useState([]);
  const [activeAct, setActiveAct] = useState(null);
  const [mainSec, setMainSec] = useState("");
  const [subSec, setSubSec] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fir_sec_history") || "[]"); }
    catch { return []; }
  });

  const mainSecRef = useRef(null);
  const lastSentValueRef = useRef("");

  useEffect(() => {
    const str = groups.some(g => g.raw)
      ? groups.find(g => g.raw)?.raw || ""
      : buildSectionString(groups);
    lastSentValueRef.current = str;
    onChange(str);
  }, [groups]);

  useEffect(() => {
    if (value !== lastSentValueRef.current) {
      lastSentValueRef.current = value;
      if (!value) {
        setGroups([]);
      } else {
        setGroups([{ actId: "__raw__", sections: [{ main: value, sub: "" }], raw: value }]);
      }
    }
  }, [value]);

  function addSection() {
    if (!activeAct || !mainSec.trim()) return;
    const entry = { main: mainSec.trim(), sub: subSec.trim() };
    setGroups(prev => {
      const existing = prev.findIndex(g => g.actId === activeAct);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], sections: [...updated[existing].sections, entry] };
        return updated;
      }
      return [...prev, { actId: activeAct, sections: [entry] }];
    });
    setMainSec("");
    setSubSec("");
    // Re-focus main section for rapid multi-section entry
    setTimeout(() => mainSecRef.current?.focus(), 30);
  }

  function removeSection(actId, secIdx) {
    setGroups(prev =>
      prev.map(g => {
        if (g.actId !== actId) return g;
        const secs = g.sections.filter((_, i) => i !== secIdx);
        return secs.length ? { ...g, sections: secs } : null;
      }).filter(Boolean)
    );
  }

  function removeGroup(actId) {
    setGroups(prev => prev.filter(g => g.actId !== actId));
  }

  function saveToHistory() {
    const str = buildSectionString(groups);
    if (!str) return;
    const newHist = [str, ...history.filter(h => h !== str)].slice(0, 12);
    setHistory(newHist);
    try { localStorage.setItem("fir_sec_history", JSON.stringify(newHist)); } catch { }
  }

  function loadFromHistory(str) {
    // Save current to history before replacing
    const cur = buildSectionString(groups);
    if (cur) saveToHistory();
    setGroups([]);
    onChange(str);
    // Directly set the value via onChange since groups won't reflect the raw string
    // We store it as a special raw group
    setGroups([{ actId: "__raw__", sections: [{ main: str, sub: "" }], raw: str }]);
  }

  function clearAll() {
    setGroups([]);
    setMainSec("");
    setSubSec("");
    setActiveAct(null);
  }

  const preview = groups.some(g => g.raw)
    ? groups.find(g => g.raw)?.raw || ""
    : buildSectionString(groups);



  return (
    <div className="sb-root">

      {/* ── History quick-reuse ──────────────────────────────────── */}
      {history.length > 0 && (
        <div className="sb-hist-area">
          <div className="sb-hist-lbl">Recent (tap to reuse)</div>
          <div className="sb-hist-scroll">
            {history.map((h, i) => (
              <div key={i} className="sb-hist-chip" onClick={() => loadFromHistory(h)} title={h}>
                {h.length > 32 ? h.slice(0, 32) + "…" : h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Preview bar ──────────────────────────────────────────── */}
      <div className="sb-preview">
        {preview
          ? preview.split(/ r\/w /).map((part, i) => (
            <span key={i}>{i > 0 && <em className="sb-rwb"> r/w </em>}{part}</span>
          ))
          : <span className="sb-preview-hint">Select Act → enter section → tap +</span>
        }
      </div>

      {/* ── Added chips ──────────────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="sb-chips-area">
          {groups.map(g => {
            if (g.raw) {
              return (
                <span key="raw" className="sb-chip sb-chip-raw">
                  {g.raw.length > 36 ? g.raw.slice(0, 36) + "…" : g.raw}
                  <span className="sb-chip-del" onClick={() => setGroups([])}>✕</span>
                </span>
              );
            }
            const actLabel = ACTS.find(a => a.id === g.actId)?.short || g.actId;
            return g.sections.map((s, si) => (
              <span key={`${g.actId}-${si}`} className="sb-chip">
                <span className="sb-chip-act">{actLabel}</span>
                {s.sub ? `${s.main}(${s.sub})` : s.main}
                <span className="sb-chip-del" onClick={() => removeSection(g.actId, si)}>✕</span>
              </span>
            ));
          })}
          {preview && (
            <span className="sb-chip sb-chip-action" onClick={saveToHistory} title="Save to history">
              💾
            </span>
          )}
          <span className="sb-chip sb-chip-action sb-chip-clear" onClick={clearAll} title="Clear all">
            ✕ All
          </span>
        </div>
      )}

      {/* ── Act selector ─────────────────────────────────────────── */}
      <div className="sb-act-scroll">
        {ACTS.map(a => (
          <div
            key={a.id}
            className={`sb-act-pill ${activeAct === a.id ? "sb-act-pill-active" : ""}`}
            onClick={() => {
              setActiveAct(activeAct === a.id ? null : a.id);
              setTimeout(() => mainSecRef.current?.focus(), 50);
            }}
          >
            {a.short}
          </div>
        ))}
      </div>

      {/* ── Section input ────────────────────────────────────────── */}
      {activeAct && (
        <div className="sb-input-area">
          <div className="sb-input-lbl">
            {ACTS.find(a => a.id === activeAct)?.label}
          </div>
          <div className="sb-input-row">
            <div className="et-fg" style={{ flex: "1.2 1 100px", minWidth: 0 }}>
              <label className="et-lbl">Section</label>
              <input
                ref={mainSecRef}
                className="et-inp et-inp-lg et-mono"
                type="text"
                value={mainSec}
                onChange={e => setMainSec(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSection()}
                placeholder="304A"
                autoComplete="off"
              />
            </div>
            <div className="et-fg" style={{ flex: "1 1 80px", minWidth: 0 }}>
              <label className="et-lbl">Sub (opt)</label>
              <input
                className="et-inp et-inp-lg et-mono"
                type="text"
                value={subSec}
                onChange={e => setSubSec(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSection()}
                placeholder="2"
                autoComplete="off"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <label className="et-lbl" style={{ visibility: "hidden" }}>Add</label>
              <button
                className="sb-add-btn"
                disabled={!mainSec.trim()}
                onClick={addSection}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}