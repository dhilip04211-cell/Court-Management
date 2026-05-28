# Examiner Module Refactoring

## Overview
The Examiner module has been refactored from a single monolithic `Examiner.jsx` file into a modular, organized structure for better maintainability and scalability.

## Directory Structure

```
src/examiner/
├── Examiner.jsx                 # Main container component
├── Examiner-old.jsx             # Original backup file
│
├── constants/
│   └── config.js                # Google API keys, sheets IDs, constants (SMAP, ACTS, THEMES)
│
├── utils/
│   ├── helpers.js               # FIR helpers (validation, parsing, formatting)
│   ├── sheets.js                # Google Sheets API utilities
│   └── styles.js                # CSS generator
│
├── components/
│   ├── AuthPrompt.jsx           # Authentication prompt UI
│   ├── SectionBuilder.jsx       # Section/Act builder component
│   ├── NumPad2.jsx              # Generic numpad for input
│   ├── DateNumPad.jsx           # Date input numpad
│   └── FIRNumPad.jsx            # FIR number input numpad
│
└── tabs/
    ├── EntryTab.jsx             # 📝 FIR entry form (placeholder)
    ├── ViewerTab.jsx            # 🔍 FIR viewer with search
    ├── FTCTab.jsx               # 📁 FIR to Case conversion (placeholder)
    └── AbstractTab.jsx          # 📊 Statistics & abstract (placeholder)
```

## Files Description

### Main Container
- **Examiner.jsx**: Main component that manages tabs, authentication, theme switching, and imports all utilities

### Constants (`constants/config.js`)
- `CLIENT_ID`: Google OAuth client ID
- `SCOPE`: Google Sheets API scope
- `SID`: Sheet IDs for different data sources
- `SMAP`: Police stations mapping
- `ACTS`: List of acts/laws
- `THEMES`: 6 theme configurations (Night, Day, Sepia, Ocean, Forest, Crimson)

### Utilities
- **helpers.js**:
  - `isValidFIRCell()`: Validate FIR format (e.g., "123/2024")
  - `parseFIR()`: Extract number and year from FIR
  - `firMatch()`: Match FIR with search criteria
  - `firSortKey()`: Generate sort key for FIR
  - `autoFormatDate()`: Auto-format date input
  - `buildSectionString()`: Build concatenated section string

- **sheets.js**:
  - `sheetsGet()`: Fetch data from sheets
  - `sheetsUpdate()`: Update sheet data
  - `sheetsAppend()`: Append data to sheets
  - `getSheetIdByName()`: Get sheet ID
  - `sheetsInsertRow()`: Insert row in sheet
  - `sheetsDeleteRow()`: Delete row from sheet
  - `loadFIRSheet()`: Load FIR data
  - `loadAllData()`: Load all data from all sheets
  - `insertFIRSorted()`: Insert FIR with sorting

- **styles.js**:
  - `getCSS()`: Generate responsive CSS for all themes

### Components
- **AuthPrompt.jsx**: Shows authentication prompt with Google Sign-In button
- **SectionBuilder.jsx**: UI for building section strings with act/law and sections
- **NumPad2.jsx**: Generic numpad with optional brackets toggle
- **DateNumPad.jsx**: Specialized numpad for date input with auto-formatting
- **FIRNumPad.jsx**: Specialized numpad for FIR number input

### Tabs (Partially Implemented)
- **EntryTab.jsx**: Placeholder for FIR entry form - needs full implementation
- **ViewerTab.jsx**: Viewer with station selector and table display
- **FTCTab.jsx**: Placeholder for FIR to case conversion - needs full implementation
- **AbstractTab.jsx**: Placeholder for statistics - needs full implementation

## UI Features

### App UI Improvements
- **Full-screen responsive design** with proper viewport handling
- **Mobile-first approach** with breakpoints for tablet and mobile
- **Landscape orientation support** for proper phone usage
- **Touch-friendly** interface with proper tap targets
- **Optimized spacing** using clamp() for scalable fonts and padding
- **Flexbox/Grid layout** that adapts to all screen sizes

### Responsive Breakpoints
- **Desktop**: Full multi-column layouts
- **Tablet (768px and below)**: 2-column grids
- **Mobile (480px and below)**: Single column, larger touch targets
- **Landscape**: Fixed height management to prevent UI cutoff

## How to Use

### Using the Components
```jsx
import { SectionBuilder } from './components/SectionBuilder.jsx';
import { NumPad2 } from './components/NumPad2.jsx';

// In your component
<SectionBuilder value={value} onChange={setValue} />
<NumPad2 label="Amount" value={amount} onChange={setAmount} />
```

### Using Utilities
```jsx
import { isValidFIRCell, parseFIR } from './utils/helpers.js';
import { loadAllData } from './utils/sheets.js';

// Validate FIR format
if (isValidFIRCell("123/2024")) {
  const { num, yr } = parseFIR("123/2024");
}

// Load data from sheets
const data = await loadAllData(accessToken);
```

## Next Steps

### Complete Tab Implementations
The tab files currently have placeholder content. To complete them:

1. **EntryTab.jsx**: Add FIR entry form with:
   - Police station selector
   - FIR number input
   - Date received input
   - Section builder
   - Case details
   - Submit/save functionality

2. **FTCTab.jsx**: Add case numbering workflow with:
   - Case selection
   - Case numbering form
   - Validation
   - Save to sheets

3. **AbstractTab.jsx**: Add statistics view with:
   - Year-based filtering
   - Station-based filtering
   - Statistics calculations
   - Abstract report generation

### Migrating Tab Code
The original Examiner-old.jsx contains the full implementations of:
- `EntryTab` (lines ~993-1266)
- `ViewerTab` (lines ~1272-1504)
- `FTCTab` (lines ~1564-1739)
- `AbstractTab` (lines ~1745-2090)

These can be extracted and merged into the new tab files while:
- Removing the CSS (already in styles.js)
- Updating imports to use new modular paths
- Replacing global function calls with imported utilities

## Mobile Responsiveness Improvements

### App.jsx Enhancements
- Removed fixed padding, using `clamp()` for fluid scaling
- Touch-friendly navigation with proper button sizes
- Mobile menu that collapses on small screens
- Full viewport height (100vh/100dvh) handling
- Landscape orientation support
- Reduced padding on mobile to maximize space

### Examiner CSS
- Responsive grid layouts with auto-fit
- Touch targets minimum 44x44px
- Proper overflow handling with `-webkit-overflow-scrolling`
- Flexible font sizes that scale with viewport
- Mobile-optimized tables that can scroll

## Browser Compatibility
- Modern browsers with ES6+ support
- Google API integration for authentication
- LocalStorage for caching
- Flexbox and CSS Grid for layouts

## Deployment Notes
- Keep `Examiner-old.jsx` as reference or remove after migration
- Ensure all imports are correctly updated in tab files
- Test responsive design on various device sizes
- Verify Google Sheets API access before deployment

---

**Last Updated**: May 28, 2026  
**Status**: Partially Refactored (Main structure complete, tabs need completion)
