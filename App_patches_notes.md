## App.jsx patch required — load stations from sheet

Since stations now load from the FIR spreadsheet tab names,
your App.jsx (or wherever you call loadAllData) needs two changes:

### 1. Import loadStationsFromSheet
```js
import { loadStationsFromSheet, loadAllData } from "./utils/sheets.js";
```

### 2. Load smap before loadAllData, store in state
```js
const [smap, setSmap] = useState([]);

// inside your auth/load effect:
const loadedSmap = await loadStationsFromSheet(tok);
const finalSmap  = (loadedSmap && loadedSmap.length) ? loadedSmap : SMAP; // SMAP as fallback
setSmap(finalSmap);
const data = await loadAllData(tok, finalSmap);  // pass smap as second arg
setDb(data);
```

### 3. Pass smap to AbstractTab
```jsx
<AbstractTab db={db} tok={tok} smap={smap} />
```

### 4. Pass smap to EntryTab
```jsx
<EntryTab db={db} setDb={setDb} tok={tok} smap={smap} />
```

### 5. In EntryTab.jsx — replace top-level SMAP import with prop
In EntryTab, change:
```js
import { SMAP, SID } from "../constants/config.js";
```
to just:
```js
import { SID } from "../constants/config.js";
```
And add `smap` to the destructured props, then use `const SMAP = smap || [];`

### SheetJS for Excel export
Add this script tag once in your index.html <head>:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```