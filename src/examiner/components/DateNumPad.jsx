import { autoFormatDate } from "../utils/helpers.js";

export default function DateNumPad({ value, onChange }) {
  function tapDigit(d) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 8) return;
    const next = autoFormatDate(digits + d);
    onChange(next);
  }
  function bs() {
    const digits = value.replace(/\D/g, "");
    const next = autoFormatDate(digits.slice(0, -1));
    onChange(next);
  }
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div style={{ flex: "1 1 130px", minWidth: 0 }}>
      <div className="lbl" style={{ marginBottom: 4 }}>Date Received (DD.MM.YYYY)</div>
      <div className="val-display mono">{value || <span style={{ color: "var(--txt3)" }}>—</span>}</div>
      <div className="numpad">
        {nums.map(n => <div key={n} className="np" onClick={() => tapDigit(String(n))}>{n}</div>)}
        <div className="np" onClick={() => tapDigit("0")}>0</div>
        <div className="np w2" onClick={bs}>⌫</div>
      </div>
    </div>
  );
}
