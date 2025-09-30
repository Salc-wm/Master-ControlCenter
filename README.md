# Dashboard Core: User Instruction Manual

*A fast, customizable home for links, apps, and widgets in your browser.*

<p align="center">
  <a href="#install"><img alt="Install" src="https://img.shields.io/badge/Install-Now-228BE6?style=for-the-badge"></a>
  <a href="#first-run-and-setup"><img alt="First Run & Setup" src="https://img.shields.io/badge/First_Run-Setup-34C759?style=for-the-badge"></a>
  <a href="#troubleshooting"><img alt="Troubleshooting" src="https://img.shields.io-badge/Troubleshooting-Help-FF9F0A?style=for-the-badge"></a>
</p>

[Chrome Web Store](link) • [Support](email or issues link) • Version `<x.y.z>`

---

## Contents

1. Install
2. First run and setup
3. Pages
4. Groups
5. Tiles
6. Edit mode and drag and drop
7. Appearance and personalization
8. Data and persistence
9. Navigation and menus
10. Programs and launching
11. Link management and icons
12. Widgets

    * Weather
    * RSS Feed
    * Uptime Status
    * IFrame
    * COVID Stats
13. Icons and performance
14. Fonts and reliability
15. Advanced settings
16. Resilience and safety
17. Accessibility and usability
18. Export and import safety
19. Favicon and branding
20. Privacy
21. Keyboard shortcuts
22. Troubleshooting
23. FAQ
24. Support and feedback
25. Changelog

---

## 1. Install

### From Chrome Web Store

1. Open the store page: `<link>`
2. Select **Add to Chrome**
3. Confirm requested permissions

### From source

1. Download or clone the project
2. If a build step exists, run:

```bash
npm install
npm run build
```

3. Open `chrome://extensions`
4. Enable **Developer mode** in the top right
5. Select **Load unpacked**
6. Pick the `<dist or build>` folder that contains `manifest.json`

> Tip: If there is no build step, point **Load unpacked** at the folder that contains `manifest.json`.

---

## 2. First run and setup

1. Click the extension icon to open Dashboard Core or open a new tab if you set it as your start page
2. Turn on **Edit mode** from the top bar
3. Create your first **Page** for one area such as Home or Work
4. Add **Groups** inside the page for categories such as News, Dev Tools, or Streaming
5. Add **Tiles** to each group for links, programs, or widgets
6. Turn **Edit mode** off to lock the layout

> Your layout and settings save automatically in the browser extension storage.

---

## 3. Pages

Pages separate different contexts such as Home, Work, and Media.

* Create a page: click **+ Page** on the page bar
* Rename a page: open the small menu on the page tab and select **Rename**
* Delete a page: open the page menu and select **Delete** then confirm
* Reorder pages: drag a page tab left or right
* Overflow: if many pages exist they collapse into a dropdown for quick selection

**Recommended setup**

* Start with 3 pages: Home, Work, Media
* Keep page names short and clear

---

## 4. Groups

Groups cluster related tiles inside a page.

* Add a group: click **Add Group** in Edit mode
* Rename a group: select the group title and type a new name
* Move a group: drag the group header to a new position
* Delete a group: open the group menu and select **Delete**

**Ideas for groups**

* News, Reference, Tools, Dev, Social, Streaming, Finance

---

## 5. Tiles

Tiles are visual blocks for links, program entries, or widgets.

* Add a tile: inside a group click **Add Tile** and choose **Link**, **Program**, or **Widget**
* Move a tile: drag the tile to another spot or group
* Edit a tile: open the tile menu then select **Edit**
* Delete a tile: open the tile menu then select **Delete**

**Tile types**

* **Link**: opens a website or web app
* **Program**: placeholder for local tools with optional launch helpers
* **Widget**: live content such as weather or feeds

---

## 6. Edit mode and drag and drop

* Toggle **Edit mode** to rearrange, add, or remove content
* With Edit mode on, drag tiles or groups to reposition
* Turn Edit mode off for a clean view and to prevent accidental changes

---

## 7. Appearance and personalization

Open **Settings → General** to adjust appearance.

* **Theme**: System, Light, Dark, or **Crimson Dark**
* **Custom font**: pick from a large list with search
* **Glow effect**: optional colored glow for interactive elements and a **Reset** button
* **Dynamic favicon**: the tab icon refreshes to stay sharp

> Use light theme for bright rooms and dark theme for low light to improve comfort.

---

## 8. Data and persistence

* **Automatic saving**: pages, groups, tiles, and settings are saved locally in extension storage
* **Backup**: export a JSON file that contains your full setup
* **Restore**: import a backup file to return to a known good state
* **Safe import cleaning**: imported data is checked and normalized before applying

**Backup steps**

1. Open **Settings → Data**
2. Click **Export** and save the JSON file

**Restore steps**

1. Open **Settings → Data**
2. Click **Import** and select a previous JSON backup
3. Confirm to apply

---

## 9. Navigation and menus

* **Page overflow**: extra pages collapse into a dropdown
* **Page actions**: small menus on each page tab allow rename or delete
* **Settings panel**: slide out panel with tabs **General**, **Data**, **APIs**, **Advanced**

---

## 10. Programs and launching

**Program entries** let you list tools with custom icons and notes.

* Add a program: **Add Tile → Program** then fill Name, Notes, and Icon
* **Launch modes**

  1. URL schemes such as custom protocols for web driven launch
  2. Optional future native launch that uses a helper process
* **Native host stub**: a template exists for wiring native launch with a whitelist of commands only

> Native launch is optional. Use it only if you understand and trust the helper process.

---

## 11. Link management and icons

Choose how each tile gets its icon.

* **Auto favicon**: uses the site favicon
* **Company logo service**: fetch a branded logo
* **Direct image URL**: link to any image you host
* **Upload**: add your own PNG, JPG, or WebP

**Smart logo guessing**

* When you type a title such as Plex, the app suggests a likely domain such as `plex.tv`

**Upload guidance**

* Prefer square images
* Use at least 128 x 128 pixels
* Keep file size small for faster loading

---

## 12. Widgets

### Weather widget

1. Add a tile then choose **Widget → Weather**
2. Select **City name** or **GPS coordinates**
3. Optionally collapse advanced details
4. Save and return to the page

**Notes**

* Location permission is required for GPS coordinate mode
* Data refreshes automatically on a schedule

### RSS Feed widget

1. Add a tile then choose **Widget → RSS**
2. Paste the feed URL and title
3. Choose how many items to show
4. Save and return to the page

**Notes**

* The app uses fallbacks or a proxy if a site blocks direct loading
* New items can be highlighted

### Uptime Status widget

1. Add a tile then choose **Widget → Uptime**
2. Open **Settings → APIs** and add your API key
3. Enter your monitor ID or endpoint
4. Save and return to the page

**Notes**

* Shows current up and down state and uptime percentage

### IFrame widget

1. Add a tile then choose **Widget → IFrame**
2. Paste the target site URL
3. Adjust size and permissions as needed
4. Save and return to the page

**Notes**

* Many sites disallow embedding. If blocked, use a Link tile instead

### COVID Stats widget

1. Add a tile then choose **Widget → COVID Stats**
2. Choose **Global** or a specific country
3. Save and return to the page

**Notes**

* Intended for basic viewing only

**Widget refresh and caching**

* Each widget refreshes on a schedule
* Responses are cached temporarily to reduce repeated network calls

---

## 13. Icons and performance

* **Lazy image loading**: icons load as they come into view
* **Cache pruning**: old cached entries are removed automatically based on age and size limits
* **Lightweight rendering**: the UI rebuilds from a small state for reliability

---

## 14. Fonts and reliability

* **Auto fallback**: if a selected font fails, a safe default is used
* **Readability check**: an internal test estimates if a font appears too faint

---

## 15. Advanced settings

Open **Settings → Advanced** for the following controls.

* **Cache controls**: set maximum age in hours and maximum number of cached entries
* **Performance flag**: optional internal diagnostics hook
* **Danger reset**: one click wipe of pages, groups, and links while keeping settings. Confirmation is required

---

## 16. Resilience and safety

* **Defensive loading**: many try and catch blocks prevent a single failure from breaking the app
* **CORS workarounds**: the RSS widget uses proxies when direct access fails
* **Size limits**: uploaded icons are capped to a reasonable size
* **Whitelisted native commands**: the native launcher example only permits a fixed list

---

## 17. Accessibility and usability

* **Keyboard navigation**: settings tabs support arrow keys
* **Escape** closes menus and modals
* **Clear states**: active page highlighting, open and closed menu states, collapsed indicators
* **Status text**: messages such as Loading, Configure widget, and Feed unavailable

---

## 18. Export and import safety

* **ID normalization**: missing IDs are regenerated
* **Structure cleanup**: missing or malformed sub arrays are repaired
* **Backwards compatibility**: older field names map to new ones where possible

---

## 19. Favicon and branding

* Icons are regenerated to remain crisp in various tab states
* Several PNG and SVG sizes are included for adaptability

---

## 20. Privacy

* Data location: stored locally in extension storage
* Network calls: only for widgets and logo lookups that require them
* Logo service key: stored only in settings and not embedded in saved links
* Location: requested only if you opt into GPS mode in the Weather widget

> Review and adjust permissions any time in `chrome://extensions`.

---

## 21. Keyboard shortcuts

| Command          | Default shortcut | Where it works |
| ---------------- | ---------------- | -------------- |
| Open Dashboard   | configurable     | Browser        |
| Toggle Edit mode | configurable     | Dashboard Core |
| Focus Search     | configurable     | Dashboard Core |

You can change shortcuts in `chrome://extensions/shortcuts`.

---

## 22. Troubleshooting

* **Icon is gray**: open a supported page or grant host access if prompted
* **IFrame is blank**: the site likely blocks embedding. Replace with a Link tile
* **RSS fails to load**: the site may block direct access. The app will try a proxy or show a message
* **Uptime tile is empty**: add or refresh your API key in **Settings → APIs**
* **Slow loading**: reduce heavy widgets, or prune cache with lower limits in **Settings → Advanced**
* **Lost layout**: restore from your last JSON backup in **Settings → Data**

Collecting diagnostics:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Open the service worker console for the extension
4. Reproduce the issue and copy any errors

---

## 23. FAQ

**Does it work in Incognito**

Yes if you enable **Allow in Incognito** on the extension details page.

**Can I restrict it to certain sites**

Yes. Adjust host permissions in the extension details.

**Does it sync between devices**

Use **Export** on device A and **Import** on device B.

**Can I use my own icons**

Yes. Upload PNG, JPG, or WebP. Prefer square images at 128 x 128 pixels or larger.

---

## 24. Support and feedback

* Report a bug: `<issues link or email>`
* Contact: `<email or contact form>`

---

## 25. Changelog

See Releases or keep a `CHANGELOG.md` with entries in the format shown below.

```
v<x.y.z> - <YYYY-MM-DD>
- Added: <feature>
- Changed: <change>
- Fixed: <bug>
```
