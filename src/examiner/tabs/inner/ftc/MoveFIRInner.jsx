import React from "react";

const CASE_TYPE_ORDER = ["PRC", "CC", "STC", "MC", "CRLMP"];

function detectCaseType(cn) {
  if (!cn) return "";
  const upper = cn.toString().toUpperCase();
  for (const t of CASE_TYPE_ORDER) {
    if (upper.includes(t)) return t;
  }
  return "";
}

function caseTypeColor(ct) {
  const map = {
    PRC: "#e8a020",
    CC: "#3b82f6",
    STC: "#8b5cf6",
    MC: "#10b981",
    CRLMP: "#ec4899",
  };
  return map[ct] || "var(--gold)";
}

export default function MoveFIRInner({
  fn,
  yr,
  curYr,
  searched,
  displayFIR,
  stationHits,
  selSt,
  setSelSt,
  firRow,
  stObj,
  allCases,
  selCase,
  setSelCase,
  confirming,
  setConfirming,
  busy,
  msg,
  handleFnChange,
  handleYrChange,
  doSearch,
  resetAll,
  execute,
}) {
  return (
    <>
      <div className="vt-search-card">
        <div className="vt-search-eyebrow">FIR → CASE NUMBERED</div>
        <div className="vt-search-row">
          <div className="vt-fg vt-fg-grow">
            <label className="vt-lbl">FIR Number</label>
            <input
              className="vt-inp vt-mono"
              type="tel"
              inputMode="numeric"
              value={fn}
              onChange={(e) => handleFnChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
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
              value={yr}
              onChange={(e) => handleYrChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={curYr}
            />
          </div>
          <div className="vt-search-actions">
            <button className="vt-btn vt-btn-primary" onClick={doSearch}>
              Search
            </button>
            {searched && (
              <button className="vt-btn vt-btn-ghost" onClick={resetAll}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {searched && stationHits.length === 0 && (
        <div className="vt-empty">
          <div className="vt-empty-icon">🔍</div>
          <div className="vt-empty-title">FIR not found in any station</div>
          <div className="vt-empty-sub">
            for <span className="vt-gold">{displayFIR}</span>
          </div>
        </div>
      )}

      {searched && stationHits.length > 0 && (
        <div className="vt-results">
          <div className="vt-summary">
            <span className="vt-summary-count">{stationHits.length}</span>
            <span className="vt-summary-label">
              station{stationHits.length > 1 ? "s" : ""} for
            </span>
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
              {stationHits.map((s) => (
                <button
                  key={s.sh}
                  className={`vt-chip vt-chip-fir${
                    selSt === s.sh ? " vt-chip-active-fir" : ""
                  }`}
                  onClick={() => {
                    setSelSt(selSt === s.sh ? null : s.sh);
                    setSelCase(null);
                    setConfirming(false);
                  }}
                >
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
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--txt3)",
                        marginTop: 4,
                      }}
                    >
                      (Station: {stObj?.lb} — check if cases use a different
                      station name)
                    </div>
                  </div>
                ) : (
                  <div className="ftc-case-list">
                    {allCases.map((c, i) => {
                      const isSel =
                        selCase?.cn === c.cn && selCase?._type === c._type;
                      const ct = detectCaseType(c.cn);
                      return (
                        <div
                          key={i}
                          className={`ftc-case-card${
                            isSel ? " ftc-case-sel" : ""
                          }`}
                          onClick={() => {
                            setSelCase(isSel ? null : c);
                            setConfirming(false);
                          }}
                        >
                          <div className="ftc-case-top">
                            <span className="ftc-case-cn">{c.cn || "—"}</span>
                            <div style={{ display: "flex", gap: 4 }}>
                              {ct && (
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    background: caseTypeColor(ct) + "22",
                                    color: caseTypeColor(ct),
                                    border: `1px solid ${caseTypeColor(ct)}55`,
                                  }}
                                >
                                  {ct}
                                </span>
                              )}
                              <span
                                className={`vt-tag ${
                                  c._type === "pending"
                                    ? "vt-tag-blue"
                                    : "vt-tag-green"
                                }`}
                              >
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
                    <button
                      className="ftc-proceed-btn"
                      onClick={() => setConfirming(true)}
                    >
                      Review &amp; Move →
                    </button>
                  </div>
                )}

                {selCase && confirming && (
                  <div className="ftc-confirm">
                    <div className="ftc-confirm-title">⚠ Confirm Move</div>
                    <div className="ftc-confirm-grid">
                      <div className="ftc-cf">
                        <span className="ftc-cf-lbl">FIR</span>
                        <span className="ftc-cf-val vt-mono">{displayFIR}</span>
                      </div>
                      <div className="ftc-cf">
                        <span className="ftc-cf-lbl">Station</span>
                        <span className="ftc-cf-val">{stObj?.lb}</span>
                      </div>
                      <div className="ftc-cf">
                        <span className="ftc-cf-lbl">Case Number</span>
                        <span
                          className="ftc-cf-val vt-mono"
                          style={{ color: "var(--vt-purple)" }}
                        >
                          {selCase.cn || "—"}
                        </span>
                      </div>
                      <div className="ftc-cf">
                        <span className="ftc-cf-lbl">Type</span>
                        <span className="ftc-cf-val">{selCase._type}</span>
                      </div>
                      <div className="ftc-cf" style={{ gridColumn: "1 / -1" }}>
                        <span className="ftc-cf-lbl">Parties</span>
                        <span className="ftc-cf-val">{selCase.pt || "—"}</span>
                      </div>
                    </div>
                    <div className="ftc-warn-note">
                      This will delete FIR {displayFIR} from &ldquo;{stObj?.lb}
                      &rdquo; and save to Case Numbered.
                    </div>
                    <div className="ftc-confirm-actions">
                      <button
                        className="vt-btn vt-btn-ghost"
                        style={{ padding: "9px 14px" }}
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                      >
                        ← Back
                      </button>
                      <button
                        className="ftc-execute-btn"
                        onClick={execute}
                        disabled={busy}
                      >
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
        <div
          className={`et-msg et-msg-${
            msg.type === "ok" ? "ok" : msg.type === "err" ? "err" : "info"
          }`}
          style={{ marginTop: 12 }}
        >
          {msg.text}
        </div>
      )}
    </>
  );
}
