import { useState, useEffect } from "react";
import { buildSectionString } from "../utils/helpers.js";
import { ACTS } from "../constants/config.js";
import { NumPad2 } from "./NumPad2.jsx";

export function SectionBuilder({ value, onChange }) {
  const [groups, setGroups] = useState([]);
  const [activeAct, setActiveAct] = useState(null);
  const [mainSec, setMainSec] = useState("");
  const [subSec, setSubSec] = useState("");
  const [subMode, setSubMode] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fir_sec_history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const str = buildSectionString(groups);
    onChange(str);
  }, [groups]);

  function addSection() {
    if (!activeAct || !mainSec) return;
    const entry = { main: mainSec, sub: subSec };
    setGroups(prev => {
      const existing = prev.findIndex(g => g.actId === activeAct);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], sections: [...updated[existing].sections, entry] };
        return updated;
      } else {
        return [...prev, { actId: activeAct, sections: [entry] }];
      }
    });
    setMainSec("");
    setSubSec("");
    setSubMode(false);
  }

  function removeSection(actId, secIdx) {
    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.actId !== actId) return g;
        const secs = g.sections.filter((_, i) => i !== secIdx);
        return secs.length ? { ...g, sections: secs } : null;
      }).filter(Boolean);
      return updated;
    });
  }

  function removeGroup(actId) {
    setGroups(prev => prev.filter(g => g.actId !== actId));
  }

  function saveToHistory() {
    const str = buildSectionString(groups);
    if (!str) return;
    const newHist = [str, ...history.filter(h => h !== str)].slice(0, 10);
    setHistory(newHist);
    try {
      localStorage.setItem("fir_sec_history", JSON.stringify(newHist));
    } catch { }
  }

  function loadFromHistory(str) {
    onChange(str);
    setGroups([]);
    onChange(str);
  }

  function clearAll() {
    setGroups([]);
    setMainSec("");
    setSubSec("");
    setSubMode(false);
    setActiveAct(null);
  }

  const preview = buildSectionString(groups);

  return (
    <div className="sec-builder">
      <div className="lbl" style={{ marginBottom: 6 }}>Section U/s Builder</div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="lbl" style={{ marginBottom: 4, fontSize: 9 }}>Recent Sections (tap to reuse)</div>
          <div className="hist-row">
            {history.map((h, i) => (
              <div key={i} className="hist-chip" onClick={() => loadFromHistory(h)} title={h}>
                {h.length > 30 ? h.slice(0, 30) + "…" : h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div style={{ marginBottom: 8 }}>
        <div className="lbl" style={{ marginBottom: 4 }}>Concatenated Output</div>
        <div className="sec-preview">
          {preview
            ? preview.split(/ r\/w /).map((part, i) => (
              <span key={i}>{i > 0 && <em> r/w </em>}{part}</span>
            ))
            : <span style={{ color: "var(--txt3)" }}>Select Act → enter section → Add</span>
          }
        </div>
      </div>

      {/* Groups display */}
      {groups.map(g => {
        const actLabel = ACTS.find(a => a.id === g.actId)?.label || g.actId;
        return (
          <div key={g.actId} className="sec-group">
            <span className="sec-group-act">{actLabel}</span>
            <div className="sec-chips">
              {g.sections.map((s, si) => (
                <span key={si} className="sec-chip">
                  {s.sub ? `${s.main}(${s.sub})` : s.main}
                  <span className="sec-chip-del" onClick={() => removeSection(g.actId, si)}>✕</span>
                </span>
              ))}
            </div>
            <button className="btn btn-r btn-sm" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => removeGroup(g.actId)}>✕ Act</button>
          </div>
        );
      })}

      <div className="sec-divider">Select Act</div>

      {/* Act pills */}
      <div className="pill-row" style={{ marginBottom: 10 }}>
        {ACTS.map(a => (
          <div key={a.id}
            className={`pill ${activeAct === a.id ? "active-act" : ""}`}
            onClick={() => setActiveAct(activeAct === a.id ? null : a.id)}>
            {a.short}
          </div>
        ))}
      </div>

      {activeAct && (
        <>
          <div className="sec-divider">
            Enter Section for {ACTS.find(a => a.id === activeAct)?.label}
          </div>
          <div className="sec-numpad-wrap">
            <NumPad2 label="Main Section" value={mainSec} onChange={setMainSec} maxLen={8} />
            <NumPad2 label="Sub-Section (optional)" value={subSec} onChange={setSubSec} maxLen={6} withBrackets />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button className="btn btn-g btn-sm"
              disabled={!mainSec}
              onClick={addSection}>
              ＋ Add Section
            </button>
            <button className="btn btn-o btn-sm" onClick={() => { setMainSec(""); setSubSec(""); }}>
              Clear
            </button>
          </div>
        </>
      )}

      {preview && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <button className="btn btn-o btn-sm" onClick={saveToHistory}>💾 Save to History</button>
          <button className="btn btn-r btn-sm" onClick={clearAll}>✕ Clear All</button>
        </div>
      )}
    </div>
  );
}
