import React from "react";

export default function OtherReasonsInner({
  orFn,
  setOrFn,
  orYr,
  setOrYr,
  curYr,
  orSearched,
  setOrSearched,
  orStationHits,
  orSelSt,
  setOrSelSt,
  orFirRow,
  orRemark,
  setOrRemark,
  orBusy,
  orMsg,
  handleOrSearch,
  resetOrAll,
  executeOrMove,
}) {
  return (
    <>
      <div className="vt-search-card">
        <div className="vt-search-eyebrow">FIR → CASE NUMBERED (OTHER REASONS)</div>
        <div className="vt-search-row">
          <div className="vt-fg vt-fg-grow">
            <label className="vt-lbl">FIR Number</label>
            <input
              className="vt-inp vt-mono"
              type="tel"
              inputMode="numeric"
              value={orFn}
              onChange={(e) => {
                setOrFn(e.target.value.replace(/\D/g, ""));
                setOrSearched(false);
                setOrSelSt(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleOrSearch()}
              placeholder="e.g. 123"
              autoFocus
            />
          </div>
          <div className="vt-fg" style={{ flex: "0 0 90px" }}>
            <label className="vt-lbl">Year</label>
            <input
              className="vt-inp vt-mono"
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={orYr}
              onChange={(e) => {
                setOrYr(e.target.value.replace(/\D/g, "").slice(0, 4));
                setOrSearched(false);
                setOrSelSt(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleOrSearch()}
              placeholder={curYr}
            />
          </div>
          <div className="vt-search-actions">
            <button className="vt-btn vt-btn-primary" onClick={handleOrSearch}>
              Search
            </button>
            {orSearched && (
              <button className="vt-btn vt-btn-ghost" onClick={resetOrAll}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {orSearched && orStationHits.length === 0 && (
        <div className="vt-empty">
          <div className="vt-empty-icon">🔍</div>
          <div className="vt-empty-title">FIR not found in any station</div>
          <div className="vt-empty-sub">
            for <span className="vt-gold">{orFn}/{orYr}</span>
          </div>
        </div>
      )}

      {orSearched && orStationHits.length > 0 && (
        <div className="vt-results">
          <div className="vt-summary">
            <span className="vt-summary-count">{orStationHits.length}</span>
            <span className="vt-summary-label">
              station{orStationHits.length > 1 ? "s" : ""} for
            </span>
            <span className="vt-summary-fir">
              {orFn}/{orYr}
            </span>
          </div>

          <div className="vt-section">
            <div className="vt-section-header">
              <div className="vt-section-icon vt-icon-fir">📋</div>
              <div>
                <div className="vt-section-title">FIR Pending Register</div>
                <div className="vt-section-sub">
                  Tap station to view details &amp; enter remark
                </div>
              </div>
            </div>

            <div className="vt-chip-row">
              {orStationHits.map((s) => (
                <button
                  key={s.sh}
                  className={`vt-chip vt-chip-fir${
                    orSelSt === s.sh ? " vt-chip-active-fir" : ""
                  }`}
                  onClick={() => {
                    setOrSelSt(orSelSt === s.sh ? null : s.sh);
                    setOrRemark("");
                  }}
                >
                  <span className="vt-chip-label">{s.lb}</span>
                </button>
              ))}
            </div>

            {orSelSt && orFirRow && (
              <div className="vt-panel vt-panel-fir" style={{ marginTop: 0 }}>
                <div className="ftc-fir-info">
                  <div className="ftc-fir-cr">{orFirRow.cr}</div>
                  <div className="ftc-fir-fields">
                    {orFirRow.sec && (
                      <div className="ftc-field">
                        <span className="ftc-flbl">Section</span>
                        <span className="ftc-fval">{orFirRow.sec}</span>
                      </div>
                    )}
                    {orFirRow.dr && (
                      <div className="ftc-field">
                        <span className="ftc-flbl">Date Received</span>
                        <span className="ftc-fval vt-mono">{orFirRow.dr}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="vt-lbl" style={{ display: "block", marginBottom: 6 }}>
                    Remark *
                  </label>
                  <textarea
                    className="vt-inp"
                    style={{
                      width: "100%",
                      height: 80,
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="Enter the reason or remark for moving this FIR..."
                    value={orRemark}
                    onChange={(e) => setOrRemark(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <button
                    className="vt-btn vt-btn-ghost"
                    onClick={() => setOrSelSt(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="ftc-execute-btn"
                    style={{ flex: 1 }}
                    disabled={!orRemark.trim() || orBusy}
                    onClick={executeOrMove}
                  >
                    {orBusy ? "⏳ Processing…" : "🗂 Move FIR with Remark"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {orMsg && orMsg.type !== "loading" && (
        <div
          className={`et-msg et-msg-${
            orMsg.type === "ok" ? "ok" : orMsg.type === "err" ? "err" : "info"
          }`}
          style={{ marginTop: 12 }}
        >
          {orMsg.text}
        </div>
      )}
    </>
  );
}
