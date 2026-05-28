import React from "react";

export default function CaseDetail({ r, srcKey, relatedNv }) {
  const fields = {
    pend: [
      ["Case Number", r.cn, "hi mono"],
      ["FIR Number", r.fn, "mono"],
      ["Petitioner VS Respondent", r.pt, null, true],
      ["Advocate", r.adv],
      ["Date of Registration", r.dreg, "mono"],
      ["Next Hearing Date", r.nxt, "mono"],
      ["Purpose", r.pur],
      ["Act / Section", r.sec],
      ["Police Station", r.sta],
      ["Nature", r.nat],
      ["Designation", r.des],
    ],
    disp: [
      ["Case Number", r.cn, "hi mono"],
      ["FIR Number", r.fn, "mono"],
      ["Petitioner VS Respondent", r.pt, null, true],
      ["Advocate", r.adv],
      ["Date of Registration", r.dreg, "mono"],
      ["Date of Decision", r.ddec, "mono"],
      ["Nature of Disposal", r.dnat],
      ["Act / Section", r.sec],
      ["Police Station", r.sta],
      ["Nature", r.nat],
      ["Designation", r.des],
    ],
    nv: [
      ["RP Number", r.rp, "hi mono"],
      ["Case Number", r.cn, "mono"],
      ["FIR Number", r.fn, "mono"],
      ["Police Station", r.sta],
      ["Description", r.desc, null, true],
      ["Remarks", r.rem, null, true],
    ],
    cnum: [
      ["Case Number", r.cn, "hi mono"],
      ["FIR Number", r.fn, "mono"],
      ["Parties", r.pt, null, true],
      ["Police Station", r.sta],
      ["Advocate", r.adv],
      ["Date of Registration", r.dreg, "mono"],
      ["Next Date", r.nxt, "mono"],
      ["Case Type", r.type],
      ["Section U/s (FIR)", r.sec],
      ["Section (Case)", r.sec2],
      ["Nature", r.nat],
      ["Designation", r.des],
    ],
  }[srcKey] || [];

  const config = {
    pend: { color: "var(--c-blue)", bg: "rgba(88,166,255,.08)", border: "rgba(88,166,255,.2)", label: "Pending", icon: "⚖" },
    disp: { color: "var(--c-green)", bg: "rgba(63,185,80,.08)", border: "rgba(63,185,80,.2)", label: "Disposed", icon: "✓" },
    nv: { color: "var(--c-amber)", bg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.2)", label: "Non-Valuable", icon: "🏷" },
    cnum: { color: "var(--c-purple)", bg: "rgba(167,139,250,.08)", border: "rgba(167,139,250,.2)", label: "Case Numbered", icon: "📁" },
  }[srcKey] || {};

  const primaryId = srcKey === "nv" ? (r.rp || "—") : (r.cn || r.rp || "—");

  return (
    <div className="cd-root" style={{ "--cd-color": config.color, "--cd-bg": config.bg, "--cd-border": config.border }}>

      {/* Header strip */}
      <div className="cd-header">
        <div className="cd-header-icon">{config.icon}</div>
        <div className="cd-header-body">
          <div className="cd-primary-id">{primaryId}</div>
          <div className="cd-type-label">{config.label}</div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="cd-fields">
        {fields.map(([lbl, val, cls, full], i) => (
          <div key={i} className={`cd-field${full ? " cd-field-full" : ""}`}>
            <div className="cd-field-lbl">{lbl}</div>
            <div className={`cd-field-val${cls ? " " + cls : ""}`}>
              {val || <span className="cd-empty">—</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Linked Non-Valuable Property (only for pend / disp / cnum) ── */}
      {relatedNv?.length > 0 && (
        <div className="cd-nv-section">
          <div className="cd-nv-heading">🏷️ Non-Valuable Property</div>
          {relatedNv.map((nv, i) => (
            <CaseDetail key={i} r={nv} srcKey="nv" />
          ))}
        </div>
      )}

    </div>
  );
}