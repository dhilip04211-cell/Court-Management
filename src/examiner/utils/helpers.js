import { ACTS } from "../constants/config.js";

/**
 * Validate FIR cell format (e.g., "123/2024")
 */
export function isValidFIRCell(raw) {
  if (!raw && raw !== 0) return false;
  return /^\d+\/\d{4}$/.test(String(raw).trim());
}

/**
 * Parse FIR into number and year
 */
export function parseFIR(raw) {
  if (!raw && raw !== 0) return { num: "", yr: "" };
  const s = String(raw).trim();
  const parts = s.split(/\s*\/\s*/);
  const num = String(parseInt(parts[0], 10) || 0);
  const yr = parts[1] ? parts[1].trim() : "";
  return { num, yr };
}

/**
 * Match FIR with search criteria
 */
export function firMatch(raw, searchNum, searchYr) {
  if (!raw) return false;
  if (!isValidFIRCell(raw)) return false;
  const p = parseFIR(raw);
  if (p.num !== searchNum) return false;
  if (!searchYr) return true;
  if (!p.yr) return true;
  return p.yr === searchYr;
}

/**
 * Generate sort key for FIR
 */
export function firSortKey(cr) {
  const p = parseFIR(cr);
  return parseInt(p.yr || "0", 10) * 1000000 + parseInt(p.num || "0", 10);
}

/**
 * Auto-format date input
 */
export function autoFormatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "." + digits.slice(2);
  return digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4);
}

/**
 * Build section string from groups
 */
export function buildSectionString(groups) {
  if (!groups.length) return "";
  return groups.map((g, i) => {
    const secStr = g.sections.map(s => s.sub ? `${s.main}(${s.sub})` : s.main).join(", ");
    const actName = ACTS.find(a => a.id === g.actId)?.label || g.actId;
    const prefix = i === 0 ? "" : " r/w ";
    return `${prefix}${secStr} ${actName}`;
  }).join("");
}
