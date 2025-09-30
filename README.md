# Dashboard Core: User Instruction Manual

*A fast, customizable home for links, apps, and widgets in your browser.*

<p align="center">
  <a href="#install" title="Install">
    <img alt="INSTALL" src="https://img.shields.io/badge/INSTALL-111827?style=for-the-badge&labelColor=111827&logoColor=fff">
  </a>
  <a href="#install" title="Now">
    <img alt="NOW" src="https://img.shields.io/badge/NOW-1D4ED8?style=for-the-badge&labelColor=1D4ED8&logoColor=fff">
  </a>
  <a href="#first-run-and-setup" title="First Run & Setup">
    <img alt="FIRST RUN & SETUP" src="https://img.shields.io/badge/FIRST%20RUN%20%26%20SETUP-22C55E?style=for-the-badge&labelColor=22C55E">
  </a>
  <a href="#troubleshooting" title="Troubleshooting">
    <img alt="TROUBLESHOOTING" src="https://img.shields.io/badge/TROUBLESHOOTING-374151?style=for-the-badge&labelColor=374151&logoColor=ffffff">
  </a>
  <a href="#support-and-feedback" title="Help">
    <img alt="HELP" src="https://img.shields.io/badge/HELP-F59E0B?style=for-the-badge&labelColor=F59E0B">
  </a>
</p>

[Chrome Web Store](https://example.com/store) • [Support](https://github.com/OWNER/REPO/issues) • Version `<x.y.z>`

---

## Contents

* [Install](#install)
* [First run and setup](#first-run-and-setup)
* [Pages](#pages)
* [Groups](#groups)
* [Tiles](#tiles)
* [Edit mode and drag and drop](#edit-mode-and-drag-and-drop)
* [Widgets](#widgets)

  * [Weather](#weather)
  * [RSS](#rss)
  * [Uptime](#uptime)
  * [IFrame](#iframe)
* [Data and backups](#data-and-backups)
* [Navigation and menus](#navigation-and-menus)
* [Keyboard shortcuts](#keyboard-shortcuts)
* [Troubleshooting](#troubleshooting)
* [FAQ](#faq)
* [Support and feedback](#support-and-feedback)
* [Changelog](#changelog)

---

## Install

**Chrome Web Store**

1. Open `https://example.com/store`.
2. Click **Add to Chrome**.
3. Approve permissions.

**From source**

1. Clone the repo.

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
```

2. Build if needed.

```bash
npm install
npm run build
```

3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the folder that contains `manifest.json`.

Tip: if there is no build step, select the root that contains `manifest.json`.

---

## First run and setup

1. Open a new tab to launch Dashboard Core, or click the extension icon.
2. Toggle **Edit** in the top bar.
3. Create a **Page** for each context like Home or Work.
4. Inside a page, add **Groups** such as News, Dev Tools, Streaming.
5. Add **Tiles** to each group for links, programs, or widgets.
6. Turn **Edit** off to lock the layout.

All changes save automatically in extension storage.

---

## Pages

Pages are top level workspaces.

* **Add**: Pages menu then **New Page**.
* **Rename**: Page tab menu then **Rename**.
* **Delete**: Page tab menu then **Delete** and confirm.
* **Reorder**: Drag page tabs.
* **Overflow**: Many pages collapse into a dropdown.

Config example


## Groups

Groups cluster tiles inside a page.

* **Add**: **Edit** then **Add Group**.
* **Rename**: Click title and type.
* **Move**: Drag the group header.
* **Delete**: Group menu then **Delete**.

Group options



## Tiles

Tiles are the clickable units. Types are `link`, `program`, `widget`, and `folder`.

* **Add**: **Add Tile** then choose a type.
* **Move**: Drag between positions or groups.
* **Edit**: Tile menu then **Edit**.
* **Delete**: Tile menu then **Delete**.

Common fields



Folder tile




## Edit mode and drag and drop

* Turn **Edit** on to rearrange, add, or remove content.
* Drag tiles or groups to reposition.
* Turn **Edit** off to prevent accidental changes.

---

## Widgets

### Weather

1. Add tile then **Widget → Weather**.
2. Pick City or GPS.
3. Save.

### RSS

1. Add tile then **Widget → RSS**.
2. Paste feed URL and set item count.
3. Save.

### Uptime

1. Add tile then **Widget → Uptime**.
2. Add your API key in **Settings → APIs**.
3. Enter monitor ID.
4. Save.

### IFrame

1. Add tile then **Widget → IFrame**.
2. Paste the target URL.
3. Save. Some sites block embedding. Use a Link tile if that happens.

---

## Data and backups

* **Export**: **Settings → Data → Export** to download a JSON backup.
* **Import**: **Settings → Data → Import** and choose a backup file.
* Imported data is validated and normalized when possible.

---

## Navigation and menus

* Extra pages go into an overflow dropdown.
* Page tab menus let you rename or delete.
* The Settings panel has tabs for General, Data, APIs, and Advanced.

---

## Keyboard shortcuts

| Command        | Default | Scope          |
| -------------- | ------- | -------------- |
| Open Dashboard | custom  | Browser        |
| Toggle Edit    | custom  | Dashboard Core |
| Focus Search   | custom  | Dashboard Core |

Set shortcuts in `chrome://extensions/shortcuts`.

---

## Troubleshooting

* **Blank IFrame**: The site blocks embedding. Switch to a Link tile.
* **RSS not loading**: Try another feed. Some sites block direct requests.
* **Uptime empty**: Add or refresh your API key in **Settings → APIs**.
* **Slow page**: Remove heavy widgets or reduce counts.
* **Lost layout**: Restore a JSON backup in **Settings → Data**.

Diagnostics

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Open the extension service worker console and check errors.

---

## FAQ

**Incognito support**
Yes. Enable **Allow in Incognito** on the extension details page.

**Sync between devices**
Export on one device and import on another.

**Custom icons**
Upload PNG, JPG, or WebP. Square images at 128×128 px or higher look best.

---

## Support and feedback

* Issues: [https://github.com/OWNER/REPO/issues](https://github.com/OWNER/REPO/issues)
* Discussions: [https://github.com/OWNER/REPO/discussions](https://github.com/OWNER/REPO/discussions)
* Email: mailto:hello@example.com

---

## Changelog

Keep a `CHANGELOG.md` with entries like:

```
v<x.y.z> - <YYYY-MM-DD>
- Added: <feature>
- Changed: <change>
- Fixed: <bug>
```
