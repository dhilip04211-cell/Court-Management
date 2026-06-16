import { useState } from "react";
import PropertyViewerInner from "./inner/PropertyViewerInner.jsx";
import CasePropertyListInner from "./inner/CasePropertyListInner.jsx";

export default function CasePropertyTab({ db, SMAP }) {
  const [subTab, setSubTab] = useState("viewer");

  return (
    <div className="hc-tab-container">
      {/* ── Top tab bar ── */}
      <div className="abt-tabbar">
        <button
          className={`abt-tab${subTab === "viewer" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("viewer")}
        >
          <span className="abt-tab-icon">🔎</span>
          <span>Property Viewer</span>
        </button>
        <button
          className={`abt-tab${subTab === "list" ? " abt-tab-active" : ""}`}
          onClick={() => setSubTab("list")}
        >
          <span className="abt-tab-icon">📋</span>
          <span>Case Property List</span>
        </button>
      </div>

      {/* ── Sub-tabs Rendering ── */}
      <div className="hc-tab-content" style={{ marginTop: 16 }}>
        {subTab === "viewer" && (
          <PropertyViewerInner db={db} SMAP={SMAP} />
        )}
        {subTab === "list" && (
          <CasePropertyListInner db={db} />
        )}
      </div>
    </div>
  );
}
