/**
 * Google API Configuration
 */
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/**
 * Google Sheets IDs — read from Vercel environment variables only.
 */
export const SID = {
  fir:      import.meta.env.VITE_FIR_SHEET_ID,
  pending:  import.meta.env.VITE_PENDING_SHEET_ID,
  disposal: import.meta.env.VITE_DISPOSAL_SHEET_ID,
  nonval:   import.meta.env.VITE_NONVAL_SHEET_ID,
  casenum:  import.meta.env.VITE_CASENUM_SHEET_ID,
};

/**
 * STATION_ALIAS_MAP
 * Built from StationMap sheet screenshot.
 * Key   = any raw name that may appear in pending/disposal/fir data (lowercased, trimmed)
 * Value = canonical ALLStation label used in SMAP
 *
 * This is what fixes "Linked Cases = 0":
 * The FIR sheet has station names like "T.Palur" / "T Palur" / "TPalur",
 * while pending/disposal sheets may have "T.Palur Police Station" etc.
 * normalizeStation() maps all variants → canonical label.
 */
export const STATION_ALIAS_MAP = {
  // ── Jayankondam ──────────────────────────────────────────
  "jayankondam":                     "Jayankondam",
  "jayankondam ps":                  "Jayankondam",
  "jayankondam police station":      "Jayankondam",
  "police station ariyalur":         "Jayankondam",   // row 3 in screenshot
  "jkm":                             "Jayankondam",

  // ── Vikkiramangalam ──────────────────────────────────────
  "vikkiramangalam":                 "Vikkiramangalam",
  "vikramangalam":                   "Vikkiramangalam",
  "police station venganam":         "Vikkiramangalam",
  "venganam":                        "Vikkiramangalam",
  "police station vikramangalam":    "Vikkiramangalam",
  "vkm":                             "Vikkiramangalam",

  // ── T.Palur ──────────────────────────────────────────────
  "t.palur":                         "T.Palur",
  "tpalur":                          "T.Palur",
  "t palur":                         "T.Palur",
  "t. palur":                        "T.Palur",
  "palur":                           "T.Palur",
  "police station keelapa":          "T.Palur",
  "police station keelaperambalur":  "T.Palur",
  "tpalur police station":           "T.Palur",
  "t.palur police station":          "T.Palur",
  "t.palur ps":                      "T.Palur",

  // ── PEW Ariyalur ─────────────────────────────────────────
  "pew ariyalur":                    "PEW Ariyalur",
  "pew":                             "PEW Ariyalur",
  "nb cid trichy":                   "PEW Ariyalur",
  "nb cid":                          "PEW Ariyalur",
  "pew ariyalur (pr":                "PEW Ariyalur",
  "pew ariyalur ps":                 "PEW Ariyalur",

  // ── AWPS Jayankondam ─────────────────────────────────────
  "awps jayankondam":                "AWPS Jayankondam",
  "awps":                            "AWPS Jayankondam",
  "all women ps jayankondam":        "AWPS Jayankondam",
  "all women police station":        "AWPS Jayankondam",
  "rp viruthachalam":                "AWPS Jayankondam",
  "rp viruthachalan":                "AWPS Jayankondam",
  "all women ps jayank":             "AWPS Jayankondam",
  "awps jkm":                        "AWPS Jayankondam",

  // ── DCB Ariyalur ─────────────────────────────────────────
  "dcb ariyalur":                    "DCB Ariyalur",
  "dcb":                             "DCB Ariyalur",
  "dcb ariyalur(district c":         "DCB Ariyalur",
  "dcb ariyalur (district crime":    "DCB Ariyalur",
  "district crime branch ariyalur":  "DCB Ariyalur",
  "rpf trichy":                      "DCB Ariyalur",
};

/**
 * normalizeStation(name) → canonical station label
 * Falls back to the original trimmed name if no alias found.
 */
export function normalizeStation(name) {
  if (!name) return "";
  const key = name.toString().trim().toLowerCase();
  return STATION_ALIAS_MAP[key] || name.toString().trim();
}

/**
 * Police Stations Map
 * sh  = Google Sheet tab name
 * lb  = canonical label (must match STATION_ALIAS_MAP values)
 * al  = alias list (all lowercased) — kept for firMatch compatibility
 */
export const SMAP = [
  { sh:"JKM",     lb:"Jayankondam",      al:["jayankondam","jkm","jayankondam police station","police station ariyalur"] },
  { sh:"VKM",     lb:"Vikkiramangalam",  al:["vikkiramangalam","vikramangalam","vkm","venganam","police station venganam"] },
  { sh:"Sheet7",  lb:"VKM (Extra)",      al:["sheet7","vkm extra","vkm ps record"] },
  { sh:"T.PALUR", lb:"T.Palur",          al:["t.palur","tpalur","palur","t palur","t. palur","t.palur police","police station keelapa"] },
  { sh:"PEW",     lb:"PEW Ariyalur",     al:["pew","pew ariyalur","nb cid","nb cid trichy"] },
  { sh:"AWPS",    lb:"AWPS Jayankondam", al:["awps","awps jayankondam","all women","rp viruthachalam","rp viruthachalan"] },
  { sh:"DCB",     lb:"DCB Ariyalur",     al:["dcb","dcb ariyalur","ariyalur dcb","rpf trichy"] },
];

/**
 * Acts/Laws List
 */
export const ACTS = [
  { id:"IPC",    label:"IPC",             short:"IPC" },
  { id:"BNS",    label:"BNS",             short:"BNS" },
  { id:"MMD",    label:"M&M(D&R) Act",    short:"M&M Act" },
  { id:"COTPA",  label:"COTPA Act",       short:"COTPA" },
  { id:"NDPS",   label:"NDPS Act",        short:"NDPS" },
  { id:"TNPHW",  label:"TNPHW Act",       short:"TNPHW" },
  { id:"MVA",    label:"MV Act",          short:"MVA" },
  { id:"PC",     label:"PC Act",          short:"PC Act" },
];

/**
 * Case Numbered sheet column headers
 * Order must match what execute() writes and loadAllData() reads.
 */
export const CASENUM_HEADERS = [
  "FIR Number",       // A  → fn
  "Station",          // B  → sta
  "FIR Section",      // C  → sec
  "Date Received",    // D  → dr
  "Case Number",      // E  → cn
  "Parties",          // F  → pt
  "Advocate",         // G  → adv
  "Date of Reg",      // H  → dreg
  "Next Date",        // I  → nxt
  "Case Type",        // J  → type
  "Case Section",     // K  → sec2
  "Nature",           // L  → nat
  "Description",      // M  → des
];

/**
 * Theme Definitions
 */
export const THEMES = [
  { id:"night",  label:"🌙 Night",    vars:{
    "--bg":"#0d1117","--bg2":"#161b22","--bg3":"#21262d","--bdr":"#30363d",
    "--txt":"#e6edf3","--txt2":"#8b949e","--txt3":"#6e7681",
    "--gold":"#C9A84C","--gold-l":"#F0D07A","--gold-d":"#8B6914",
    "--grn":"#3fb950","--red":"#f85149","--blu":"#58a6ff","--pur":"#bc8cff",
    "--accent":"#C9A84C","--shadow":"rgba(0,0,0,0.4)",
  }},
  { id:"day",    label:"☀️ Day",     vars:{
    "--bg":"#f5f5f0","--bg2":"#ffffff","--bg3":"#eaeae4","--bdr":"#d0d0c8",
    "--txt":"#1a1a18","--txt2":"#5a5a52","--txt3":"#8a8a82",
    "--gold":"#8B6914","--gold-l":"#C9A84C","--gold-d":"#5a4208",
    "--grn":"#2a7a35","--red":"#c0392b","--blu":"#1a5fa8","--pur":"#6a3fa8",
    "--accent":"#8B6914","--shadow":"rgba(0,0,0,0.12)",
  }},
  { id:"sepia",  label:"📜 Sepia",   vars:{
    "--bg":"#2c2416","--bg2":"#352c1a","--bg3":"#3f3420","--bdr":"#5a4a2a",
    "--txt":"#f0e0c0","--txt2":"#c0a878","--txt3":"#907858",
    "--gold":"#e8c060","--gold-l":"#f8d880","--gold-d":"#a07820",
    "--grn":"#6ab060","--red":"#e06040","--blu":"#80b0d8","--pur":"#c090e0",
    "--accent":"#e8c060","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"ocean",  label:"🌊 Ocean",   vars:{
    "--bg":"#040f1a","--bg2":"#071828","--bg3":"#0a2038","--bdr":"#0f3050",
    "--txt":"#c8e8f8","--txt2":"#6898b8","--txt3":"#406880",
    "--gold":"#40c8e8","--gold-l":"#80e0f8","--gold-d":"#2090b0",
    "--grn":"#40d880","--red":"#f85060","--blu":"#60a8f8","--pur":"#a060f8",
    "--accent":"#40c8e8","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"forest", label:"🌿 Forest",  vars:{
    "--bg":"#0a120a","--bg2":"#101a10","--bg3":"#162016","--bdr":"#204020",
    "--txt":"#d0e8c8","--txt2":"#7aaa70","--txt3":"#507848",
    "--gold":"#a8d050","--gold-l":"#c8e870","--gold-d":"#708820",
    "--grn":"#50d870","--red":"#e86050","--blu":"#60b8d8","--pur":"#c090e0",
    "--accent":"#a8d050","--shadow":"rgba(0,0,0,0.5)",
  }},
  { id:"crimson",label:"🔴 Crimson", vars:{
    "--bg":"#120808","--bg2":"#1c0f0f","--bg3":"#261616","--bdr":"#401818",
    "--txt":"#f0d8d8","--txt2":"#b07878","--txt3":"#805050",
    "--gold":"#e84040","--gold-l":"#f87070","--gold-d":"#a02020",
    "--grn":"#50d870","--red":"#ff5040","--blu":"#80b0f8","--pur":"#d080f8",
    "--accent":"#e84040","--shadow":"rgba(0,0,0,0.5)",
  }},
];