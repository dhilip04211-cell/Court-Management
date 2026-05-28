# Quick Reference: Court Management Refactored Structure

## 🎯 Quick Links

### Where to Find Things
| What | Where |
|------|-------|
| Main App UI | `src/App.jsx` |
| Examiner Container | `src/examiner/Examiner.jsx` |
| API Keys & Themes | `src/examiner/constants/config.js` |
| Helper Functions | `src/examiner/utils/helpers.js` |
| Sheet API Calls | `src/examiner/utils/sheets.js` |
| CSS Themes | `src/examiner/utils/styles.js` |
| Reusable Components | `src/examiner/components/` |
| Tab Views | `src/examiner/tabs/` |
| Full Documentation | `src/examiner/README.md` |

---

## 💡 Common Tasks

### Import a Component
```jsx
import { SectionBuilder } from './examiner/components/SectionBuilder.jsx';
import { NumPad2 } from './examiner/components/NumPad2.jsx';
import { AuthPrompt } from './examiner/components/AuthPrompt.jsx';
```

### Use a Helper Function
```jsx
import { isValidFIRCell, parseFIR, autoFormatDate } from './examiner/utils/helpers.js';

// Validate FIR
if (isValidFIRCell("123/2024")) {
  const { num, yr } = parseFIR("123/2024");
}
```

### Call Google Sheets API
```jsx
import { loadAllData, sheetsUpdate } from './examiner/utils/sheets.js';

const data = await loadAllData(accessToken);
await sheetsUpdate(accessToken, sheetId, range, values);
```

### Get Theme Colors
```jsx
import { THEMES, ACTS, SMAP } from './examiner/constants/config.js';

const theme = THEMES.find(t => t.id === 'night');
console.log(theme.vars['--gold']); // #C9A84C
```

### Add a New Component
```jsx
// 1. Create src/examiner/components/MyComponent.jsx
export function MyComponent({ prop1, prop2 }) {
  return <div className="card">...</div>;
}

// 2. Import in Examiner.jsx
import { MyComponent } from './components/MyComponent.jsx';

// 3. Use it
<MyComponent prop1="value" prop2="value" />
```

### Add a New Tab
```jsx
// 1. Create src/examiner/tabs/MyTab.jsx
export default function MyTab({ db, setDb, tok }) {
  return <div className="card"><div className="ctitle">My Tab</div></div>;
}

// 2. Import in Examiner.jsx
import MyTab from './tabs/MyTab.jsx';

// 3. Add to tabs array
const tabs = [
  // ... existing
  { id: "mytab", label: "🎯 My Tab" },
];

// 4. Add conditional render
{activeTab === "mytab" && <MyTab db={db} setDb={setDb} tok={tok} />}
```

---

## 📱 Responsive Design Classes

### Breakpoints
| Size | Width | Class |
|------|-------|-------|
| Mobile | ≤480px | `.np` (numpad) |
| Tablet | 481-767px | `.tab`, `.card` |
| Desktop | ≥768px | `.content` |

### Responsive Classes
```css
/* Cards and containers */
.card { }
.pane { }

/* Grids */
.card-grid { }        /* Auto-fit 260-280px columns */
.stat-grid { }        /* Auto-fit 120px columns */
.det-grid { }         /* Auto-fit 140px columns */
.abs-grid { }         /* Auto-fit 260px columns */

/* Inputs */
.inp { }              /* Responsive input */
.numpad { }           /* Touch-friendly numpad */

/* Tables */
.tbl-wrap { }         /* Scrollable table wrapper */
table { }             /* Responsive table */

/* Layout */
.frow { }             /* Flex row with auto-wrap */
.pill-row { }         /* Wrapping pill buttons */
```

---

## 🎨 Theming

### Available Themes
1. 🌙 **Night** - Dark blue with gold accents
2. ☀️ **Day** - Light with brown tones
3. 📜 **Sepia** - Vintage sepia tones
4. 🌊 **Ocean** - Deep ocean colors
5. 🌿 **Forest** - Natural green tones
6. 🔴 **Crimson** - Red accent theme

### Switch Theme
```jsx
// In Examiner.jsx
switchTheme('night');  // Changes to Night theme
switchTheme('day');    // Changes to Day theme
```

### Theme Colors Reference
```
--bg              Background
--bg2             Secondary background
--bg3             Tertiary background
--bdr             Border color
--txt             Text color
--txt2            Secondary text
--txt3            Tertiary text
--gold            Accent gold
--gold-l          Light gold
--gold-d          Dark gold
--grn             Green (success)
--red             Red (error)
--blu             Blue (info)
--pur             Purple
--accent          Accent color
--shadow          Shadow effect
```

---

## 🔑 Authentication Flow

### Google Sign-In
```jsx
// User clicks "Sign in with Google"
// → Google Script loads
// → Token received
// → Stored in localStorage
// → Data fetches automatically
// → App displays content
```

### Token Refresh
- Token stored with expiry time
- App refreshes 5 minutes before expiry
- Automatic in background
- No user action needed

---

## 📊 Data Structure

### FIR Data
```js
{
  fir: {
    'JKM': [              // Station code
      {
        sl: '1',          // Serial number
        cr: '123/2024',   // Case reference
        sec: '377 IPC',   // Section
        dr: 'Police',     // DR (investigating officer)
        yr: '2024',       // Year
        ri: 2             // Row index
      }
    ]
  },
  pend: [],              // Pending cases
  disp: [],              // Disposed cases
  nv: [],                // Non-validated
  cnum: []               // Case numbers
}
```

---

## ⚙️ Configuration

### Update API Keys
```js
// src/examiner/constants/config.js
export const CLIENT_ID = "YOUR_NEW_ID";
export const SID = {
  fir: "YOUR_SHEET_ID",
  // ... other sheets
};
```

### Customize Stations
```js
export const SMAP = [
  { sh: "JKM", lb: "Jayankondam", al: ["jayankondam", "jkm"] },
  // Add more stations
];
```

---

## 🧪 Testing Checklist

- [ ] App loads without errors
- [ ] Mobile menu works on small screens
- [ ] Cards stack properly on mobile
- [ ] All themes switch correctly
- [ ] Google sign-in works
- [ ] Data loads after authentication
- [ ] Tabs switch smoothly
- [ ] Forms submit correctly
- [ ] Numbers pad inputs work
- [ ] Section builder saves history
- [ ] Responsive on: iPhone, iPad, desktop
- [ ] Landscape orientation works

---

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| `REFACTORING_SUMMARY.md` | Overview of all changes |
| `README.md` (examiner) | Detailed module documentation |
| Code comments | Inline explanations |
| Component prop docs | JSDoc comments in code |

---

## 🚀 Deployment

```bash
# Build production
npm run build

# Output in dist/
# Ready to deploy to hosting
```

---

## 💬 Need Help?

1. **Check the README**: `src/examiner/README.md`
2. **View original code**: `src/examiner/Examiner-old.jsx`
3. **Check component props**: Look at component JSDoc
4. **Debug**: Use browser dev tools, check console
5. **Mobile test**: Use Chrome DevTools responsive mode

---

**Last Updated**: May 28, 2026
