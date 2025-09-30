# Dashboard Core: User Instruction Manual

_A fast, customizable home for links, apps, and widgets in your browser._

<p align='center'>
  <a href='#install'><img alt='Install' src='https://img.shields.io/badge/Install-Now-228BE6?style=for-the-badge'></a>
  <a href='#first-run-and-setup'><img alt='First Run & Setup' src='https://img.shields.io/badge/First%20Run%20&%20Setup-34C759?style=for-the-badge'></a>
  <a href='#troubleshooting'><img alt='Troubleshooting' src='https://img.shields.io/badge/Troubleshooting-Help-FF950A?style=for-the-badge'></a>
</p>

[Chrome Web Store](link) • [Support](email or issues link) • Version `<x.y.z>`

---

## Contents

- [Install](#install)
- [First run and setup](#first-run-and-setup)
- [Pages](#pages)
- [Groups](#groups)
- [Tiles](#tiles)
- [Edit mode and drag and drop](#edit-mode-and-drag-and-drop)
- [Appearance and personalization](#appearance-and-personalization)
- [Data and persistence](#data-and-persistence)
- [Navigation and menus](#navigation-and-menus)
- [Programs and launching](#programs-and-launching)
- [Link management and icons](#link-management-and-icons)
- [Widgets](#widgets)
  - [Weather widget](#weather-widget)
  - [RSS Feed widget](#rss-feed-widget)
  - [Uptime Status widget](#uptime-status-widget)
  - [IFrame widget](#iframe-widget)
  - [COVID Stats widget](#covid-stats-widget)
- [Icons and performance](#icons-and-performance)
- [Fonts and reliability](#fonts-and-reliability)
- [Advanced settings](#advanced-settings)
- [Resilience and safety](#resilience-and-safety)
- [Accessibility and usability](#accessibility-and-usability)
- [Export and import safety](#export-and-import-safety)
- [Favicon and branding](#favicon-and-branding)
- [Privacy](#privacy)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Support and feedback](#support-and-feedback)
- [Changelog](#changelog)

---

## Install

**From Chrome Web Store**

1. Open the store page: `<link>`.
2. Click **Add to Chrome**.
3. Confirm the requested permissions.

**From source**

1. Download or clone the project.
2. If a build step exists, run:
   ```bash
   npm install
   npm run build
   ```
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the folder that contains `manifest.json` (usually `dist` or `build`).

Tip: If there is no build step, point **Load unpacked** at the folder containing `manifest.json`.

---

## First run and setup

1. Open Dashboard Core by clicking the extension icon or loading a new tab (if set as your start page).
2. Turn on **Edit mode** from the top bar.
3. Create your first **Page** for a context such as Home or Work.
4. Add **Groups** inside the page for categories like News, Dev Tools, or Streaming.
5. Add **Tiles** to each group for links, programs, or widgets.
6. Turn **Edit mode** off to lock your layout.

Your layout and settings save automatically in extension storage.

---

## Pages

Pages separate your work into different contexts such as Home, Work, or Media.

- **Create a page:** Click **+ Page** on the page bar.
- **Rename a page:** Open the page’s menu and choose **Rename**.
- **Delete a page:** Open the page’s menu and choose **Delete**, then confirm.
- **Reorder pages:** Drag a page tab left or right.
- **Overflow:** If you create many pages they collapse into a dropdown for quick selection.

Recommended setup: Start with three pages (Home, Work, Media) and keep names short.

---

## Groups

Groups cluster related tiles within a page.

- **Add a group:** Click **Add Group** in Edit mode.
- **Rename a group:** Click the group title and type a new name.
- **Move a group:** Drag the group header to a new spot.
- **Delete a group:** Open the group’s menu and choose **Delete**.

Ideas for groups: News, Reference, Tools, Dev, Social, Streaming, Finance.

---

## Tiles

Tiles are visual blocks for links, program entries, or widgets.

- **Add a tile:** In a group, click **Add Tile** and choose **Link**, **Program**, or **Widget**.
- **Move a tile:** Drag the tile to another spot or group.
- **Edit a tile:** Open the tile menu and choose **Edit**.
- **Delete a tile:** Open the tile menu and choose **Delete**.

Tile types:

- **Link** opens a website or web app.
- **Program** lists a local tool with optional launch helpers.
- **Widget** shows live content such as weather or feeds.

---

## Edit mode and drag and drop

- Toggle **Edit mode** to rearrange, add, or remove content.
- With Edit mode on, drag tiles or groups to reposition them.
- Turn Edit mode off for a clean view and to prevent accidental changes.

---

## Appearance and personalization

Open **Settings → General** to customize appearance.

- **Theme:** System, Light, Dark, or **Crimson Dark**.
- **Custom font:** Search and pick from a large list.
- **Glow effect:** Optional colored glow with a **Reset** button.
- **Dynamic favicon:** The tab icon refreshes to stay sharp.

Use light theme in bright rooms and dark theme in low light for comfort.

---

## Data and persistence

- **Automatic saving:** Pages, groups, tiles, and settings are stored locally in extension storage.
- **Backup:** Export a JSON file of your full setup.
- **Restore:** Import a backup to return to a saved state.
- **Safe import cleaning:** Imported data is checked and normalized before applying.

**To back up:** Open **Settings → Data**, click **Export**, and save the JSON file.

**To restore:** Open **Settings → Data**, click **Import**, select a previous JSON backup, and confirm.

---

## Navigation and menus

- **Page overflow:** Extra pages collapse into a dropdown.
- **Page actions:** Small menus on each page tab let you rename or delete pages.
- **Settings panel:** A slide‑out panel with tabs for **General**, **Data**, **APIs**, and **Advanced**.

---

## Programs and launching

Program entries let you list local tools with custom icons and notes.

- **Add a program:** Choose **Add Tile → Program**, then fill in Name, Notes, and Icon.
- **Launch modes:**
  1. URL schemes (custom protocols) for web‑driven launch.
  2. Optional native launch (future) using a helper process.
- **Native host stub:** A template exists for native launching with only a whitelisted set of commands.

Native launch is optional. Use it only if you understand and trust the helper process.

---

## Link management and icons

Choose how each tile gets its icon.

- **Auto favicon:** Uses the site’s favicon.
- **Company logo service:** Fetches a branded logo.
- **Direct image URL:** Link to any hosted image.
- **Upload:** Use your own PNG, JPG, or WebP.

**Smart logo guessing:** When you type a title (e.g., Plex), the extension suggests a likely domain (e.g., `plex.tv`).

**Upload guidance:** Prefer square images at least 128×128 pixels; keep file sizes small for faster loading.

---

## Widgets

### Weather widget

1. Add a tile and select **Widget → Weather**.
2. Choose **City name** or **GPS coordinates**.
3. Optionally collapse advanced details.
4. Save and return to the page.

Notes:

- Location permission is required for GPS mode.
- Data refreshes automatically on a schedule.

### RSS Feed widget

1. Add a tile and select **Widget → RSS**.
2. Enter the feed URL and a title.
3. Choose how many items to show.
4. Save and return to the page.

Notes:

- If a site blocks direct loading, the app uses proxies.
- New items can be highlighted.

### Uptime Status widget

1. Add a tile and select **Widget → Uptime**.
2. Open **Settings → APIs** and add your API key.
3. Enter your monitor ID or endpoint.
4. Save and return.

Notes:

- Shows current up/down state and uptime percentage.

### IFrame widget

1. Add a tile and select **Widget → IFrame**.
2. Paste the target site URL.
3. Adjust size and permissions if needed.
4. Save and return.

Notes:

- Some sites disallow embedding. If blocked, use a Link tile instead.

### COVID Stats widget

1. Add a tile and select **Widget → COVID Stats**.
2. Choose **Global** or a specific country.
3. Save and return.

Notes:

- Intended for basic viewing only.

**Widget refresh and caching:** Each widget refreshes on a schedule. Data is cached temporarily to reduce repeated requests.

---

## Icons and performance

- **Lazy image loading:** Icons load as they scroll into view.
- **Cache pruning:** Old entries are removed automatically based on age and size limits.
- **Lightweight rendering:** The UI rebuilds from a small state for reliability.

---

## Fonts and reliability

- **Auto fallback:** If a font fails to load, a safe default is used.
- **Readability check:** An internal test estimates if a font appears too faint.

---

## Advanced settings

Open **Settings → Advanced** for:

- **Cache controls:** Set maximum age in hours and maximum number of cached entries.
- **Performance flag:** Optional internal diagnostics hook.
- **Danger reset:** Wipes pages, groups, and links while keeping settings (confirmation required).

---

## Resilience and safety

- **Defensive loading:** Try/catch blocks ensure one failure does not break the app.
- **CORS workarounds:** The RSS widget uses proxies when direct access fails.
- **Size limits:** Uploaded icons are capped to a reasonable size.
- **Whitelisted native commands:** The native launcher only permits a fixed list of commands.

---

## Accessibility and usability

- **Keyboard navigation:** Settings tabs support arrow keys; Escape closes menus and modals.
- **Clear states:** Active page highlighting, open/closed menu states, and collapsed indicators.
- **Status text:** Messages such as Loading, Configure widget, and Feed unavailable.

---

## Export and import safety

- **ID normalization:** Missing IDs are regenerated.
- **Structure cleanup:** Missing or malformed arrays are repaired.
- **Backwards compatibility:** Older field names map to new ones when possible.

---

## Favicon and branding

- Icons are regenerated to remain crisp in various tab states.
- Several PNG and SVG sizes are included for flexibility.

---

## Privacy

- **Data location:** Stored locally in extension storage.
- **Network calls:** Only for widgets and logo lookups that require them.
- **Logo service key:** Stored in settings and not embedded in saved links.
- **Location:** Requested only if you enable GPS mode for the Weather widget.

Review and adjust permissions at any time in `chrome://extensions`.

---

## Keyboard shortcuts

| Command            | Default shortcut | Where it works   |
|--------------------|------------------|------------------|
| Open Dashboard     | configurable     | Browser          |
| Toggle Edit mode   | configurable     | Dashboard Core   |
| Focus search       | configurable     | Dashboard Core   |

Change shortcuts in `chrome://extensions/shortcuts`.

---

## Troubleshooting

- **Icon is gray:** Open a supported page or grant host access if prompted.
- **IFrame is blank:** The site likely blocks embedding; use a Link tile.
- **RSS fails to load:** The site may block direct access; the app uses a proxy or shows a message.
- **Uptime tile is empty:** Add or refresh your API key in **Settings → APIs**.
- **Slow loading:** Remove heavy widgets or lower cache limits in **Settings → Advanced**.
- **Lost layout:** Restore from your last JSON backup in **Settings → Data**.

Collecting diagnostics:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Open the service worker console for the extension.
4. Reproduce the issue and copy any errors.

---

## FAQ

**Does it work in Incognito?**

Yes, if you enable **Allow in Incognito** on the extension details page.

**Can I restrict it to certain sites?**

Yes. Adjust host permissions in the extension details.

**Does it sync between devices?**

Export on one device and import on another.

**Can I use my own icons?**

Yes. Upload PNG, JPG, or WebP images. Prefer square images at least 128×128 pixels.

---

## Support and feedback

- **Report a bug:** `<issues link or email>`
- **Contact:** `<email or contact form>`

---

## Changelog

See Releases or maintain a `CHANGELOG.md` with entries in the following format:

```
v<x.y.z> - <YYYY-MM-DD>
- Added: <feature>
- Changed: <change>
- Fixed: <bug>
```
