export default function NumPad2({ label, value, onChange, maxLen = 8, withBrackets = false }) {
  function tap(ch) {
    if (value.replace(/\D/g, "").length >= maxLen) return;
    onChange(value + ch);
  }
  function bs() {
    onChange(value.slice(0, -1));
  }
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div style={{ flex: "1 1 130px", minWidth: 0 }}>
      <div className="lbl" style={{ marginBottom: 4 }}>{label}</div>
      <div className="val-display">{value || <span style={{ color: "var(--txt3)" }}>—</span>}</div>
      <div className="numpad">
        {nums.map(n => <div key={n} className="np" onClick={() => tap(String(n))}>{n}</div>)}
        <div className="np" onClick={() => tap("0")}>0</div>
        {withBrackets
          ? <><div className="np accent" onClick={() => tap("(")}>( )</div><div className="np" onClick={bs}>⌫</div></>
          : <div className="np w2" onClick={bs}>⌫</div>
        }
      </div>
    </div>
  );
}
