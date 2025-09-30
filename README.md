# Dashboard Core: User Instruction Manual

*A fast, customizable home for links, apps, and widgets in your browser.*

<p align='center'>
  <a href='#install'><img alt='Install' src='https://img.shields.io/badge/Install-Now-228BE6?style=for-the-badge'></a>
  <a href='#first-run-and-setup'><img alt='First Run & Setup' src='https://img.shields.io/badge/First%20Run%20&%20Setup-34C759?style=for-the-badge'></a>
  <a href='#troubleshooting'><img alt='Troubleshooting' src='https://img.shields.io/badge/Troubleshooting-Help-FF950A?style=for-the-badge'></a>
</p>

[Chrome Web Store](https://example.com/store) • [Support](https://github.com/OWNER/REPO/issues) • Version `<x.y.z>`

> The UI takes cues from the dark, card‑based profile layout shown in the reference screenshot. All interactive items glow burgundy on hover and keep text readable.

---

## Quick Checklist

* Install and launch the extension.
* Create pages, groups, and tiles with copy‑paste snippets.
* Add burgundy hover glow to every interactive element and keep contrast accessible.
* Configure widgets, icons, and themes. Backup your data.
* Use shortcuts, troubleshooting, and recovery steps when needed.

---

## Contents

* [Hover Effects: Burgundy Glow](#hover-effects-burgundy-glow)
* [Install](#install)
* [First run and setup](#first-run-and-setup)
* [Pages](#pages)
* [Groups](#groups)
* [Tiles](#tiles)
* [Edit mode and drag and drop](#edit-mode-and-drag-and-drop)
* [Appearance and personalization](#appearance-and-personalization)
* [Data and persistence](#data-and-persistence)
* [Navigation and menus](#navigation-and-menus)
* [Programs and launching](#programs-and-launching)
* [Link management and icons](#link-management-and-icons)
* [Widgets](#widgets)

  * [Weather widget](#weather-widget)
  * [RSS Feed widget](#rss-feed-widget)
  * [Uptime Status widget](#uptime-status-widget)
  * [IFrame widget](#iframe-widget)
  * [COVID Stats widget](#covid-stats-widget)
* [Icons and performance](#icons-and-performance)
* [Fonts and reliability](#fonts-and-reliability)
* [Advanced settings](#advanced-settings)
* [Resilience and safety](#resilience-and-safety)
* [Accessibility and usability](#accessibility-and-usability)
* [Export and import safety](#export-and-import-safety)
* [Favicon and branding](#favicon-and-branding)
* [Privacy](#privacy)
* [Keyboard shortcuts](#keyboard-shortcuts)
* [Troubleshooting](#troubleshooting)
* [FAQ](#faq)
* [Support and feedback](#support-and-feedback)
* [Changelog](#changelog)
* [Validation](#validation)

---

## Hover Effects: Burgundy Glow

All interactive elements must glow burgundy on hover and remain readable. Add these theme tokens and rules to your stylesheet.

```css
/* Core theme tokens */
:root{
  --dc-bg: #0f1115;            /* dashboard background */
  --dc-card: #171922;          /* tile and panel background */
  --dc-text: #e6e7eb;          /* default text */
  --dc-muted: #a4a9b6;         /* secondary text */
  --dc-burgundy: #800020;      /* brand glow */
  --dc-glow-text: #FFF0F5;     /* light lavender text during glow */
  --dc-focus-ring: 2px solid var(--dc-burgundy);
}

/* Global hover for anchors and buttons */
a, button, .btn, .tile, .nav-item, .chip, .badge, [role='button']{
  transition: box-shadow .2s ease, color .2s ease, border-color .2s ease, transform .06s ease;
}

a:hover, button:hover, .btn:hover, .tile:hover, .nav-item:hover, .chip:hover, .badge:hover, [role='button']:hover{
  box-shadow: 0 0 8px 2px var(--dc-burgundy);
  color: var(--dc-glow-text);
}

/* Focus visibility for keyboard users */
a:focus-visible, button:focus-visible, .btn:focus-visible, .tile:focus-visible{
  outline: var(--dc-focus-ring);
  outline-offset: 2px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce){
  a, button, .btn, .tile, .nav-item, .chip, .badge{ transition: none; }
}
```

**Required snippet (include verbatim):**

```css
/* Example Burgundy Glow Hover */
.glow-on-hover:hover {
box-shadow: 0 0 8px 2px #800020;
color: #FFF0F5;
transition: box-shadow 0.2s, color 0.2s;
}
```

**Usage examples**

```html
<a class='btn glow-on-hover' href='#settings'>Open Settings</a>
<div class='tile glow-on-hover' role='button' tabindex='0' onclick="location.href='https://github.com/OWNER/REPO/issues'">Issues</div>
```

Accessibility notes

* Keep hover text color at `#FFF0F5` on card background `#171922` for comfortable contrast.
* Retain the focus outline so keyboard users can see where they are.

---

## Install

**From Chrome Web Store**

1. Open the store page: `https://example.com/store`.
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

Pages separate your work into contexts such as Home, Work, or Media.

* **Create a page:** Click **+ Page** on the page bar.
* **Rename a page:** Open the page menu and choose **Rename**.
* **Delete a page:** Open the page menu and choose **Delete**, then confirm.
* **Reorder pages:** Drag a page tab left or right.
* **Overflow:** Many pages collapse into a dropdown for quick selection.

**JSON example**

```jsonc
{
  "pages": [
    { "id": "home", "title": "Home", "icon": "home" },
    { "id": "work", "title": "Work", "icon": "briefcase" }
  ],
  "defaultPage": "home"
}
```

Direct routes: `#/page/home`, `#/page/work`.

---

## Groups

Groups cluster related tiles within a page.

* **Add a group:** Click **Add Group** in Edit mode.
* **Rename a group:** Click the group title and type a new name.
* **Move a group:** Drag the group header to a new spot.
* **Delete a group:** Open the group menu and choose **Delete**.

**Options**

```jsonc
{
  "id": "dev",
  "title": "Dev Tools",
  "layout": { "columns": 6, "tileHeight": 100, "gap": 12 },
  "style": { "accent": "#800020", "icon": "code" }
}
```

---

## Tiles

Tiles are the clickable units. Types include `link`, `program`, `widget`, and `folder`.

* **Add a tile:** In a group, click **Add Tile** and choose a type.
* **Move a tile:** Drag to another spot or group.
* **Edit a tile:** Open the tile menu and choose **Edit**.
* **Delete a tile:** Open the tile menu and choose **Delete**.

**Common tile fields**

```jsonc
{
  "id": "docs",
  "type": "link",
  "title": "Docs",
  "subtitle": "Project wiki",
  "href": "https://github.com/OWNER/REPO/wiki",
  "icon": "book",
  "badge": "new",
  "color": "#171922",
  "textColor": "#e6e7eb",
  "classes": ["glow-on-hover"],
  "openIn": "tab"
}
```

**Folder tile**

```jsonc
{
  "id": "quick",
  "type": "folder",
  "title": "Quick Links",
  "icon": "zap",
  "children": [
    { "type": "link", "title": "Issues", "href": "https://github.com/OWNER/REPO/issues" },
    { "type": "link", "title": "Releases", "href": "https://github.com/OWNER/REPO/releases" },
    { "type": "link", "title": "Discussions", "href": "https://github.com/OWNER/REPO/discussions" }
  ]
}
```

**HTML example**

```html
<div class='tile glow-on-hover' role='button' tabindex='0' onclick="window.open('https://github.com/OWNER/REPO/issues','_blank')">
  <span class='title'>Issues</span>
  <span class='badge'>Open</span>
</div>
```

---

## Edit mode and drag and drop

* Toggle **Edit mode** to rearrange, add, or remove content.
* With Edit mode on, drag tiles or groups to reposition them.
* Turn Edit mode off to prevent accidental changes.

---

## Appearance and personalization

Open **Settings → General** to customize appearance.

* **Theme:** System, Light, Dark, or **Crimson Dark**.
* **Accent and glow:** Choose a brand color. The default accent is `#800020`. Use the CSS from the Hover section.
* **Custom font:** Pick from the list or paste a CSS font stack.
* **Dynamic favicon:** The tab icon updates to stay sharp.

---

## Data and persistence

* Automatic saving to extension storage.
* **Backup:** Export a JSON file of your full setup.
* **Restore:** Import a backup to return to a saved state.

**Export and import**

```text
Settings → Data → Export
Settings → Data → Import
```

---

## Navigation and menus

* **Page overflow:** Extra pages collapse into a dropdown.
* **Page actions:** Menus on page tabs allow rename or delete.
* **Settings panel:** Tabs for General, Data, APIs, and Advanced.

---

## Programs and launching

Program entries list local tools with icons and notes.

* **Add a program:** **Add Tile → Program**.
* **Launch modes:**

  1. URL schemes for web driven launch.
  2. Optional native helper (advanced).

**Native host stub template (opt in)**

```jsonc
{
  "name": "dashboard.core.native",
  "description": "Dashboard Core Native Host",
  "path": "C:/path/to/native-helper.exe",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://YOUR_ID/"]
}
```

---

## Link management and icons

Icon sources

* Auto favicon
* Logo service
* Direct image URL
* Upload your own PNG, JPG, or WebP

Guidance

* Prefer square images at least 128x128 px.
* Keep file sizes small for load speed.

---

## Widgets

### Weather widget

1. Add a tile and select **Widget → Weather**.
2. Choose **City** or **GPS**.
3. Save.

Notes

* Location permission is required for GPS mode.

### RSS Feed widget

1. Add a tile and select **Widget → RSS**.
2. Enter the feed URL.
3. Choose how many items to show.
4. Save.

### Uptime Status widget

1. Add a tile and select **Widget → Uptime**.
2. Add your API key in **Settings → APIs**.
3. Enter a monitor ID.
4. Save.

### IFrame widget

1. Add a tile and select **Widget → IFrame**.
2. Paste the target URL.
3. Save.

Note: Some sites block embedding. Use a Link tile if needed.

### COVID Stats widget

1. Add a tile and select **Widget → COVID Stats**.
2. Pick Global or a country.
3. Save.

**Widget refresh and caching**

* Each widget refreshes on a schedule and uses temporary caching.

---

## Icons and performance

* Lazy loading for images.
* Cache pruning for old entries.
* Lightweight rendering from app state.

---

## Fonts and reliability

* Automatic fallback to safe fonts if a custom font fails to load.
* Internal readability check avoids faint rendering.

---

## Advanced settings

* **Cache controls:** set maximum age and size.
* **Diagnostics flag:** optional internal logging.
* **Danger reset:** wipes pages, groups, and links with confirmation.

---

## Resilience and safety

* Defensive loading so one failure does not break the app.
* Proxy support for RSS when direct loading fails.
* Size limits on uploaded icons.
* Strict whitelists for any native commands.

---

## Accessibility and usability

* Keyboard navigation across settings and menus.
* Visible focus rings using the CSS in the Hover section.
* `prefers-reduced-motion` honored by the CSS above.
* Color choices keep text legible during hover glow.
* ARIA roles on tiles used as buttons: `role='button'` and `tabindex='0'`.

---

## Export and import safety

* IDs normalized during import.
* Structures repaired when needed.
* Old field names mapped to new ones when possible.

---

## Favicon and branding

* Tab icon updates for common resolutions.
* Include PNG and SVG sizes under `public/icons/`.

---

## Privacy

* Data stored locally in extension storage.
* Network calls used only by widgets and logo lookups when configured.
* Location used only if GPS weather is enabled.

Review permissions in `chrome://extensions`.

---

## Keyboard shortcuts

| Command          | Default shortcut | Where it works |
| ---------------- | ---------------- | -------------- |
| Open Dashboard   | configurable     | Browser        |
| Toggle Edit mode | configurable     | Dashboard Core |
| Focus search     | configurable     | Dashboard Core |

Change shortcuts in `chrome://extensions/shortcuts`.

---

## Troubleshooting

* **Icon is gray:** Open a supported page or grant host access if prompted.
* **IFrame is blank:** The site likely blocks embedding. Use a Link tile.
* **RSS fails to load:** The site may block direct access. Try another feed or refresh.
* **Uptime tile is empty:** Add or refresh your API key in **Settings → APIs**.
* **Slow loading:** Remove heavy widgets or lower cache limits under **Settings → Advanced**.
* **Lost layout:** Restore a JSON backup from **Settings → Data**.

Diagnostics

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Open the extension's service worker console.
4. Reproduce the issue and copy any errors.

---

## FAQ

**Does it work in Incognito?**
Yes, if you enable **Allow in Incognito** on the extension details page.

**Does it sync between devices?**
Export on one device and import on another.

**Can I use my own icons?**
Yes. Upload PNG, JPG, or WebP images. Prefer square images at least 128x128 px.

---

## Support and feedback

* **Report a bug:** [https://github.com/OWNER/REPO/issues](https://github.com/OWNER/REPO/issues)
* **Discussions:** [https://github.com/OWNER/REPO/discussions](https://github.com/OWNER/REPO/discussions)
* **Contact:** mailto:hello@example.com

---

## Changelog

See Releases or keep a `CHANGELOG.md` with the format below.

```
v<x.y.z> - <YYYY-MM-DD>
- Added: <feature>
- Changed: <change>
- Fixed: <bug>
```

---

## Validation

* Installation, onboarding, navigation, customization, and recovery are documented.
* Burgundy hover CSS is provided with a copy‑paste class and accessible focus ring.
* Every feature has either a working link, a button example, or a code snippet.
* Placeholders `OWNER/REPO` and `https://example.com/store` should be replaced with your real values before publishing.
