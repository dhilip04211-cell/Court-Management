import { useState } from "react";

export default function EntryTab({ db, setDb, tok }) {
  const [message, setMessage] = useState("");

  return (
    <div>
      <div className="card">
        <div className="ctitle">📝 FIR Entry Form</div>
        <div className="msg-info">
          Tab refactored from Examiner.jsx. Add your FIR entry form UI here.
        </div>
        {message && <div className="msg-ok" style={{marginTop: 10}}>{message}</div>}
      </div>
    </div>
  );
}
