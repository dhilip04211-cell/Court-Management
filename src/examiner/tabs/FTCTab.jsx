import { useState } from "react";

export default function FTCTab({ db, setDb, tok }) {
  const [step, setStep] = useState(1);

  return (
    <div>
      <div className="card">
        <div className="ctitle">📁 FIR to Case Numbering</div>
        <div className="msg-info">
          Convert FIR records to case numbers. Tab refactored from Examiner.jsx.
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="step-row">
            <div className={`step-dot ${step >= 1 ? "act" : ""} ${step > 1 ? "done" : ""}`}>1</div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 2 ? "act" : ""} ${step > 2 ? "done" : ""}`}>2</div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 3 ? "act" : ""} ${step > 3 ? "done" : ""}`}>3</div>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: "var(--bg3)", borderRadius: 6 }}>
            <div className="lbl" style={{ marginBottom: 8 }}>Step {step}</div>
            <p style={{ color: "var(--txt2)", fontSize: 13 }}>
              FTC process under development. Add your step content here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
