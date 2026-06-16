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

function PillGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            border: "1.5px solid",
            borderColor: value === opt.value ? opt.color || "var(--gold)" : "var(--bdr)",
            background: value === opt.value ? (opt.color || "var(--gold)") + "22" : "var(--bg3)",
            color: value === opt.value ? opt.color || "var(--gold)" : "var(--txt2)",
            transition: "all 0.15s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function QueryBuilderInner({
  SMAP,
  qbStation,
  setQbStation,
  qbCaseType,
  setQbCaseType,
  qbListType,
  setQbListType,
  qbDateMode,
  setQbDateMode,
  qbDateA,
  setQbDateA,
  qbDateB,
  setQbDateB,
  qbResults,
  qbLoading,
  qbMsg,
  qbSelRow,
  setQbSelRow,
  qbSelectedRows,
  setQbSelectedRows,
  qbConfirm,
  setQbConfirm,
  qbBusy,
  qbMoveMsg,
  setQbMoveMsg,
  handleQbRowClick,
  qbFirInfo,
  rowFIRExists,
  findStationForCase,
  runQueryBuilder,
  executeQbMove,
  executeQbBulkMove,
  setAddFirTarget,
  handleQbDateInput,
  getQbRowKey,
}) {
  const caseTypeOptions = [
    { value: "ALL", label: "ALL", color: "var(--txt)" },
    { value: "PRC", label: "PRC", color: "#e8a020" },
    { value: "CC", label: "CC", color: "#3b82f6" },
    { value: "STC", label: "STC", color: "#8b5cf6" },
    { value: "MC", label: "MC", color: "#10b981" },
    { value: "CRLMP", label: "CRLMP", color: "#ec4899" },
  ];
  const listTypeOptions = [
    { value: "ALL", label: "ALL", color: "var(--txt)" },
    { value: "pending", label: "Pending", color: "#3b82f6" },
    { value: "disposal", label: "Disposal", color: "#10b981" },
  ];
  const dateModeOptions = [
    { value: "gt", label: "After →" },
    { value: "lt", label: "← Before" },
    { value: "between", label: "Between ↔" },
  ];

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* ── Filter Card ──────────────────────────────────── */}
      <div className="card" style={{ margin: "12px 14px 0" }}>
        <div className="ctitle" style={{ marginBottom: 14 }}>
          🔎 Query Builder
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="lbl" style={{ display: "block", marginBottom: 6 }}>
            Police Station
          </label>
          <select
            className="inp"
            value={qbStation}
            onChange={(e) => {
              setQbStation(e.target.value);
              setQbSelRow(null);
              setQbSelectedRows([]);
              setQbConfirm(false);
              setQbMoveMsg(null);
            }}
          >
            <option value="ALL">All Stations</option>
            {SMAP.map((s) => (
              <option key={s.sh} value={s.lb}>
                {s.lb}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="lbl" style={{ display: "block", marginBottom: 6 }}>
            Case Type
          </label>
          <PillGroup
            value={qbCaseType}
            onChange={(v) => {
              setQbCaseType(v);
              setQbSelRow(null);
              setQbSelectedRows([]);
              setQbConfirm(false);
              setQbMoveMsg(null);
            }}
            options={caseTypeOptions}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="lbl" style={{ display: "block", marginBottom: 6 }}>
            List Type
          </label>
          <PillGroup
            value={qbListType}
            onChange={(v) => {
              setQbListType(v);
              setQbSelRow(null);
              setQbSelectedRows([]);
              setQbConfirm(false);
              setQbMoveMsg(null);
            }}
            options={listTypeOptions}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="lbl" style={{ display: "block", marginBottom: 6 }}>
            Date of Registration
            <span
              style={{
                marginLeft: 8,
                fontWeight: 400,
                color: "var(--txt3)",
                fontSize: 9,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              (DD-MM-YYYY — hyphens auto-inserted)
            </span>
          </label>
          <PillGroup
            value={qbDateMode}
            onChange={(v) => {
              setQbDateMode(v);
              setQbDateA("");
              setQbDateB("");
              setQbSelRow(null);
              setQbSelectedRows([]);
              setQbConfirm(false);
              setQbMoveMsg(null);
            }}
            options={dateModeOptions}
          />
          {(qbDateMode === "gt" || qbDateMode === "lt") && (
            <div style={{ marginTop: 8 }}>
              <input
                className="inp vt-mono"
                type="text"
                inputMode="numeric"
                placeholder="DD-MM-YYYY"
                value={qbDateA}
                maxLength={10}
                onChange={(e) => setQbDateA(handleQbDateInput(qbDateA, e.target.value))}
                style={{ maxWidth: 150 }}
              />
            </div>
          )}
          {qbDateMode === "between" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  flex: 1,
                  minWidth: 120,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--txt3)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  From
                </span>
                <input
                  className="inp vt-mono"
                  type="text"
                  inputMode="numeric"
                  placeholder="DD-MM-YYYY"
                  value={qbDateA}
                  maxLength={10}
                  onChange={(e) =>
                    setQbDateA(handleQbDateInput(qbDateA, e.target.value))
                  }
                />
              </div>
              <span style={{ color: "var(--txt3)", fontSize: 18, paddingTop: 18 }}>
                →
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  flex: 1,
                  minWidth: 120,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--txt3)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  To
                </span>
                <input
                  className="inp vt-mono"
                  type="text"
                  inputMode="numeric"
                  placeholder="DD-MM-YYYY"
                  value={qbDateB}
                  maxLength={10}
                  onChange={(e) =>
                    setQbDateB(handleQbDateInput(qbDateB, e.target.value))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <button
          className="ftc-execute-btn"
          style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
          onClick={runQueryBuilder}
          disabled={qbLoading}
        >
          {qbLoading ? "⏳ Loading…" : "🔍 Run Query"}
        </button>
      </div>

      {qbMsg && (
        <div className={`et-msg et-msg-${qbMsg.type}`} style={{ margin: "10px 14px 0" }}>
          {qbMsg.text}
        </div>
      )}

      {/* ── Results Table ────────────────────────────────── */}
      {qbResults !== null && qbResults.length > 0 && (
        <div className="card" style={{ margin: "12px 14px 0" }}>
          <div className="ctitle">
            📋 Results
            <span
              style={{
                marginLeft: "auto",
                fontWeight: 400,
                color: "var(--txt3)",
                fontSize: 10,
              }}
            >
              {qbResults.length} case{qbResults.length !== 1 ? "s" : ""} — tap row to
              select
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, padding: "0 0 10px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                color: "var(--txt3)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "var(--red)22",
                  border: "1px solid var(--red)66",
                  display: "inline-block",
                }}
              />
              FIR missing — needs Add
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                color: "var(--txt3)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "var(--grn)11",
                  border: "1px solid var(--grn)44",
                  display: "inline-block",
                }}
              />
              FIR present — ready to move
            </div>
          </div>

          {/* Select-all bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 4px 8px",
              borderBottom: "1px solid var(--bdr)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                fontSize: 12,
                color: "var(--txt2)",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--gold)",
                  cursor: "pointer",
                }}
                checked={
                  qbResults.length > 0 &&
                  qbSelectedRows.length === qbResults.length
                }
                ref={(el) => {
                  if (el)
                    el.indeterminate =
                      qbSelectedRows.length > 0 &&
                      qbSelectedRows.length < qbResults.length;
                }}
                onChange={(e) => {
                  if (e.target.checked) {
                    setQbSelectedRows([...qbResults]);
                    setQbSelRow(qbResults[qbResults.length - 1] || null);
                  } else {
                    setQbSelectedRows([]);
                    setQbSelRow(null);
                    setQbConfirm(false);
                    setQbMoveMsg(null);
                  }
                }}
              />
              {qbSelectedRows.length === qbResults.length &&
              qbResults.length > 0
                ? `All ${qbResults.length} selected`
                : qbSelectedRows.length > 0
                ? `${qbSelectedRows.length} of ${qbResults.length} selected`
                : `Select all ${qbResults.length}`}
            </label>
            {qbSelectedRows.length > 0 && (
              <button
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--txt3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                }}
                onClick={() => {
                  setQbSelectedRows([]);
                  setQbSelRow(null);
                  setQbConfirm(false);
                  setQbMoveMsg(null);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="tbl-wrap">
            <table className="abs-tbl">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>#</th>
                  <th>Case No.</th>
                  <th>FIR No.</th>
                  <th>Station</th>
                  <th>Parties</th>
                  <th>Reg Date</th>
                  <th>Type</th>
                  <th>FIR Status</th>
                </tr>
              </thead>
              <tbody>
                {qbResults.map((r, idx) => {
                  const ct = detectCaseType(r.cn);
                  const rowKey = getQbRowKey(r);
                  const isSel = qbSelRow && getQbRowKey(qbSelRow) === rowKey;
                  const isSelected = qbSelectedRows.some(
                    (item) => getQbRowKey(item) === rowKey
                  );
                  const firFound = rowFIRExists(r);
                  const stO = findStationForCase(r, SMAP);

                  return (
                    <tr
                      key={idx}
                      onClick={() => handleQbRowClick(r)}
                      style={{
                        cursor: "pointer",
                        background:
                          isSel || isSelected
                            ? "var(--gold)18"
                            : firFound
                            ? "var(--grn)07"
                            : "var(--red)09",
                        outline:
                          isSel || isSelected
                            ? "1.5px solid var(--gold)"
                            : undefined,
                        borderLeft: firFound
                          ? "3px solid var(--grn)"
                          : "3px solid var(--red)",
                      }}
                    >
                      <td
                        style={{
                          width: 32,
                          padding: 0,
                          textAlign: "center",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={qbSelectedRows.some(
                              (item) => getQbRowKey(item) === getQbRowKey(r)
                            )}
                            onChange={() => handleQbRowClick(r)}
                            style={{
                              width: 16,
                              height: 16,
                              accentColor: "var(--gold)",
                            }}
                          />
                        </label>
                      </td>
                      <td style={{ color: "var(--txt3)", fontSize: 10 }}>
                        {idx + 1}
                      </td>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {ct && (
                          <span
                            style={{
                              marginRight: 3,
                              padding: "1px 5px",
                              borderRadius: 8,
                              fontSize: 9,
                              background: caseTypeColor(ct) + "22",
                              color: caseTypeColor(ct),
                              border: `1px solid ${caseTypeColor(ct)}55`,
                              fontWeight: 800,
                            }}
                          >
                            {ct}
                          </span>
                        )}
                        {r.cn || "—"}
                      </td>
                      <td className="mono" style={{ color: "var(--gold)" }}>
                        {r.fn || "—"}
                      </td>
                      <td style={{ fontSize: 10 }}>{r.sta || "—"}</td>
                      <td
                        style={{
                          maxWidth: 140,
                          wordBreak: "break-word",
                          fontSize: 11,
                        }}
                      >
                        {r.pt || "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 10 }}>
                        {r.dreg || "—"}
                      </td>
                      <td>
                        <span
                          className={`vt-tag ${
                            r._type === "pending"
                              ? "vt-tag-blue"
                              : "vt-tag-green"
                          }`}
                          style={{ fontSize: 9 }}
                        >
                          {r._type === "pending" ? "P" : "D"}
                        </span>
                      </td>
                      {/* FIR Status cell */}
                      <td onClick={(e) => e.stopPropagation()}>
                        {firFound ? (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "var(--grn)",
                              padding: "2px 7px",
                              borderRadius: 8,
                              background: "var(--grn)18",
                              border: "1px solid var(--grn)44",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✓ Present
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (!stO) return;
                              setAddFirTarget({ row: r, stObj: stO });
                            }}
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#fff",
                              padding: "3px 8px",
                              borderRadius: 8,
                              border: "none",
                              background: "var(--red)",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            + Add FIR
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {qbSelectedRows.length > 0 && (
        <div
          className="card"
          style={{
            margin: "12px 14px 0",
            border: "1.5px solid var(--gold)55",
          }}
        >
          <div className="ctitle" style={{ color: "var(--gold)", marginBottom: 10 }}>
            📦 Bulk Selection
            <span
              style={{
                marginLeft: 8,
                fontWeight: 400,
                fontSize: 11,
                color: "var(--txt3)",
              }}
            >
              {qbSelectedRows.length} case{qbSelectedRows.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>

          {/* Selected cases list with individual remove */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              maxHeight: 240,
              overflowY: "auto",
              marginBottom: 12,
              border: "1px solid var(--bdr)",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            {qbSelectedRows.map((row, idx) => {
              const ct = detectCaseType(row.cn);
              const firOk = rowFIRExists(row);
              return (
                <div
                  key={getQbRowKey(row)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 6,
                    background: firOk ? "var(--grn)09" : "var(--red)09",
                    border: `1px solid ${
                      firOk ? "var(--grn)33" : "var(--red)33"
                    }`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--txt3)",
                      minWidth: 18,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}.
                  </span>
                  {ct && (
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: 6,
                        fontSize: 9,
                        background: caseTypeColor(ct) + "22",
                        color: caseTypeColor(ct),
                        border: `1px solid ${caseTypeColor(ct)}55`,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {ct}
                    </span>
                  )}
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.cn || "—"}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    {row.fn || ""}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: firOk ? "var(--grn)18" : "var(--red)18",
                      color: firOk ? "var(--grn)" : "var(--red)",
                      border: `1px solid ${
                        firOk ? "var(--grn)44" : "var(--red)44"
                    }`,
                      flexShrink: 0,
                    }}
                  >
                    {firOk ? "✓" : "⛔"}
                  </span>
                  <button
                    title="Remove from selection"
                    onClick={() => {
                      const next = qbSelectedRows.filter(
                        (_, i) => i !== idx
                      );
                      setQbSelectedRows(next);
                      if (
                        qbSelRow &&
                        getQbRowKey(qbSelRow) === getQbRowKey(row)
                      ) {
                        setQbSelRow(next.length ? next[next.length - 1] : null);
                        setQbConfirm(false);
                        setQbMoveMsg(null);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--txt3)",
                      fontSize: 14,
                      padding: "0 2px",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              className="vt-btn vt-btn-ghost"
              style={{ flex: "0 0 auto" }}
              onClick={() => {
                setQbSelectedRows([]);
                setQbSelRow(null);
                setQbConfirm(false);
                setQbMoveMsg(null);
              }}
            >
              Clear All
            </button>
            <button
              className="ftc-execute-btn"
              style={{ flex: "1 1 220px" }}
              onClick={executeQbBulkMove}
              disabled={qbBusy || qbSelectedRows.length === 0}
            >
              {qbBusy
                ? "⏳ Processing…"
                : `✅ Move ${qbSelectedRows.length} Case${
                    qbSelectedRows.length !== 1 ? "s" : ""
                  } to Case Numbered`}
            </button>
          </div>

          {qbMoveMsg && (
            <div
              className={`et-msg et-msg-${
                qbMoveMsg.type === "ok"
                  ? "ok"
                  : qbMoveMsg.type === "err"
                  ? "err"
                  : "info"
              }`}
              style={{ marginTop: 10 }}
            >
              {qbMoveMsg.text}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 10, color: "var(--txt3)" }}>
            ⛔ = FIR missing (add first) &nbsp;|&nbsp; ✓ = FIR present (ready to
            move)
          </div>
        </div>
      )}

      {/* ── QB Confirm Panel ─────────────────────────────── */}
      {qbSelRow && (
        <div
          className="card"
          style={{
            margin: "12px 14px 0",
            border: "1.5px solid var(--gold)55",
          }}
        >
          <div className="ctitle" style={{ color: "var(--gold)" }}>
            📌 Selected Case
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 10,
            }}
          >
            {[
              ["Case Number", qbSelRow.cn, "var(--pur)"],
              ["FIR Number", qbSelRow.fn, "var(--gold)"],
              ["Station", qbSelRow.sta, null],
              ["Type", qbSelRow._type, null],
              ["Reg Date", qbSelRow.dreg, null],
              ["Next Date", qbSelRow.nxt || qbSelRow.ddec || "—", null],
            ].map(([lbl, val, col]) => (
              <div
                key={lbl}
                style={{
                  background: "var(--bg3)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  border: "1px solid var(--bdr)",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--txt3)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {lbl}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: col || "var(--txt)",
                    marginTop: 2,
                  }}
                >
                  {val || "—"}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "var(--bg3)",
              borderRadius: 8,
              padding: "7px 10px",
              border: "1px solid var(--bdr)",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "var(--txt3)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Parties
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              {qbSelRow.pt || "—"}
            </div>
          </div>

          {/* FIR presence status */}
          {(() => {
            const firPresent = rowFIRExists(qbSelRow);
            const stO = findStationForCase(qbSelRow, SMAP);
            if (firPresent) {
              return (
                <div
                  style={{
                    background: "var(--grn)11",
                    border: "1px solid var(--grn)44",
                    borderRadius: 8,
                    padding: "7px 10px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--grn)",
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    ✓ FIR FOUND IN REGISTER
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: "var(--txt3)" }}>Station: </span>
                    <strong>{qbFirInfo?.stObj?.lb || qbSelRow.sta}</strong>
                    {"  "}
                    <span style={{ color: "var(--txt3)" }}>Section: </span>
                    <strong>{qbFirInfo?.firRow?.sec || "—"}</strong>
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  style={{
                    background: "var(--red)11",
                    border: "1.5px solid var(--red)55",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--red)",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    ⛔ FIR NOT IN REGISTER — Move Blocked
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 10 }}>
                    FIR <strong style={{ color: "var(--gold)" }}>{qbSelRow.fn}</strong>{" "}
                    is not present in <strong>{qbSelRow.sta}</strong> FIR Pending
                    Register. Add it first, then move.
                  </div>
                  {stO && (
                    <button
                      onClick={() => setAddFirTarget({ row: qbSelRow, stObj: stO })}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--grn)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ➕ Add FIR to {stO.lb}
                    </button>
                  )}
                </div>
              );
            }
          })()}

          {qbMoveMsg && (
            <div
              className={`et-msg et-msg-${
                qbMoveMsg.type === "ok"
                  ? "ok"
                  : qbMoveMsg.type === "err"
                  ? "err"
                  : "info"
              }`}
              style={{ marginBottom: 8 }}
            >
              {qbMoveMsg.text}
            </div>
          )}

          {/* Move buttons — only show if FIR is present */}
          {rowFIRExists(qbSelRow) && !qbConfirm && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="vt-btn vt-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setQbSelRow(null);
                  setQbMoveMsg(null);
                }}
              >
                ✕ Deselect
              </button>
              <button
                className="ftc-execute-btn"
                style={{ flex: 2 }}
                onClick={() => setQbConfirm(true)}
              >
                🗂 Move to Case Numbered →
              </button>
            </div>
          )}

          {rowFIRExists(qbSelRow) && qbConfirm && (
            <div>
              <div className="ftc-warn-note" style={{ marginBottom: 10 }}>
                ⚠ This will save case <strong>{qbSelRow.cn}</strong> to the Case
                Numbered sheet
                {qbFirInfo ? ` and delete FIR from "${qbFirInfo.stObj.lb}"` : ""}.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="vt-btn vt-btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setQbConfirm(false)}
                  disabled={qbBusy}
                >
                  ← Back
                </button>
                <button
                  className="ftc-execute-btn"
                  style={{ flex: 2 }}
                  onClick={executeQbMove}
                  disabled={qbBusy}
                >
                  {qbBusy ? "⏳ Processing…" : "✅ Confirm Move"}
                </button>
              </div>
            </div>
          )}

          {/* Deselect button when FIR missing */}
          {!rowFIRExists(qbSelRow) && (
            <button
              className="vt-btn vt-btn-ghost"
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => {
                setQbSelRow(null);
                setQbMoveMsg(null);
              }}
            >
              ✕ Deselect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
