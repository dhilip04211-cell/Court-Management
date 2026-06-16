import { useState, useRef } from "react";
import { insertFIRSorted } from "../../../utils/sheets.js";
import { firSortKey } from "../../../utils/helpers.js";

// Auto-format date input → DD-MM-YYYY (hyphens)
function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export default function AddFIRModal({ row, stObj, db, setDb, tok, onClose, onAdded }) {
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
