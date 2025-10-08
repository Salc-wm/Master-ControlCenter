<!-- Improved compatibility of back to top link -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<div align="center">
  <a href="https://github.com/Salc-wm/Master-ControlCenter">
    <img src="https://img.shields.io/badge/ACTIVE-success?style=for-the-badge&label=%F0%9F%9F%A2%20STATUS&labelColor=000000&color=5C0010" alt="Status" />
  </a>
  <a href="https://github.com/Salc-wm/Master-ControlCenter/issues">
    <img src="https://img.shields.io/github/issues/Salc-wm/Master-ControlCenter.svg?style=for-the-badge&label=%F0%9F%90%9E%20ISSUES&labelColor=000000&color=5C0010" alt="Issues" />
  </a>
  <a href="https://github.com/Salc-wm/Master-ControlCenter/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Salc-wm/Master-ControlCenter?style=for-the-badge&label=%E2%9A%96%EF%B8%8F%20LICENSE&labelColor=000000&color=444444" alt="License" />
  </a>
  <a href="https://github.com/Salc-wm/Master-ControlCenter/commits/main">
    <img src="https://img.shields.io/github/last-commit/Salc-wm/Master-ControlCenter?style=for-the-badge&label=%E2%8F%B3%20LAST%20COMMIT&labelColor=000000&color=5C0010" alt="Last Commit" />
  </a>
  <a href="https://github.com/Salc-wm/Master-ControlCenter">
    <img src="https://img.shields.io/badge/LOVE-red?style=for-the-badge&label=%E2%9D%A4%20MADE%20WITH&labelColor=000000&color=5C0010" alt="Made with Love" />
  </a>
</div>


<!-- PROJECT LOGO -->
<div align="center">
  <br />
  <img src="icon/stackdash-128.png" alt="Logo" width="110" height="110" />
  <h1 align="center">Master Control Center</h1>
  <p align="center">
    Multi-page, local-first dashboard for links, apps and live widgets, with optional native and custom protocol launching.
    <br />
    <a href="#about-the-project"><strong>Explore the docs »</strong></a>
    ·
    <a href="#getting-started">Get Started</a>
    ·
    <a href="#roadmap">Roadmap</a>
    ·
    <a href="#contributing">Contribute</a>
  </p>
</div>

---

<details>
  <summary><img src="https://img.shields.io/badge/📑-Table%20of%20Contents-1E1E1E?style=flat-square&labelColor=111111" /></summary>
  <ol>
    <li><a href="#about-the-project"><img src="https://img.shields.io/badge/📂-About%20the%20Project-3A6EA5?style=flat-square&labelColor=1E1E1E" /></a>
      <ul>
        <li><a href="#core-structure"><img src="https://img.shields.io/badge/🧩-Core%20Structure-6C63FF?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#key-features"><img src="https://img.shields.io/badge/✨-Key%20Features-D46A6A?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#tech-stack"><img src="https://img.shields.io/badge/🛠️-Tech%20Stack-3A9188?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#built-with"><img src="https://img.shields.io/badge/🏗️-Built%20With-C97E4E?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#architecture-overview"><img src="https://img.shields.io/badge/📐-Architecture%20Overview-8C8C8C?style=flat-square&labelColor=1E1E1E" /></a></li>
      </ul>
    </li>
    <li><a href="#screenshots--showcase"><img src="https://img.shields.io/badge/🖼️-Screenshots%20%2F%20Showcase-4AA564?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#getting-started"><img src="https://img.shields.io/badge/🚀-Getting%20Started-B34747?style=flat-square&labelColor=1E1E1E" /></a>
      <ul>
        <li><a href="#prerequisites"><img src="https://img.shields.io/badge/📋-Prerequisites-5C7285?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#installation-as-extension"><img src="https://img.shields.io/badge/💻-Installation%20(Extension)-4C7BB4?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#optional-native-launching"><img src="https://img.shields.io/badge/⚙️-Native%20Launching-A97155?style=flat-square&labelColor=1E1E1E" /></a></li>
        <li><a href="#optional-custom-url-protocols-windows"><img src="https://img.shields.io/badge/🔗-Custom%20URL%20Protocols-855E99?style=flat-square&labelColor=1E1E1E" /></a></li>
      </ul>
    </li>
    <li><a href="#usage"><img src="https://img.shields.io/badge/📖-Usage-3B9C9C?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#widgets"><img src="https://img.shields.io/badge/🧸-Widgets-A569BD?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#configuration"><img src="https://img.shields.io/badge/⚙️-Configuration-9E9E51?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#data-export--import"><img src="https://img.shields.io/badge/📤-Export%20%2F%20Import-D4A017?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#performance-and-caching"><img src="https://img.shields.io/badge/⚡-Performance%20%26%20Caching-C0392B?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#security--privacy"><img src="https://img.shields.io/badge/🔒-Security%20%26%20Privacy-922B21?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#directory-structure"><img src="https://img.shields.io/badge/📂-Directory%20Structure-4B8B3B?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#roadmap"><img src="https://img.shields.io/badge/🗺️-Roadmap-3B5CA0?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#contributing"><img src="https://img.shields.io/badge/🤝-Contributing-D4AF37?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#faq"><img src="https://img.shields.io/badge/❓-FAQ-B45F9A?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#license"><img src="https://img.shields.io/badge/⚖️-License-555555?style=flat-square&labelColor=1E1E1E" /></a></li>
    <li><a href="#acknowledgments"><img src="https://img.shields.io/badge/🙏-Acknowledgments-B45F9A?style=flat-square&labelColor=1E1E1E" /></a></li>
  </ol>
</details>

---

## About the Project

[![About the Project](https://img.shields.io/badge/ℹ️%20About%20the%20Project-Details-blue.svg)](#about-the-project)

**Master Control Center** is a modular, local-first dashboard for homelab, productivity and app-launching workflows. It provides:

- Multi-page/tabbed layout
- Grouped tiles for links, programs and widgets
- Live data widgets (weather, RSS, uptime, iframe, COVID)
- Visual customization (themes, fonts, glow accent)
- Local persistence with backup and restore
- Optional native and custom protocol launching

### Core Structure
[![Core Structure](https://img.shields.io/badge/🏗️%20Core%20Structure-Outlined-blue.svg)](#core-structure)
| Layer | Purpose |
|-------|---------|
| UI (HTML/CSS/ES Modules) | Renders pages, groups, modals and settings |
| State Manager | Loads, migrates and persists data to extension storage |
| Renderers | Pages bar and groups/widgets orchestration |
| Widgets Engine | Weather, RSS, UptimeRobot, IFrame, COVID |
| Settings Panel | Theme, font, glow, cache, backup, APIs |
| Actions & Events | Export/import/reset and delegated interactions |
| Native Bridge (MV3) | Optional messaging for local program launch |
| Windows Helpers | Protocol registration and batch launchers |

### Key Features
| Feature | Description |
|-------|---------|
| Layout & Interaction | Multi-page tabs, per-page groups, drag and drop ordering, edit mode toggle. |
| Customization | Themes (system/light/dark/crimson), searchable font catalog, glow effect with safety controls. |
| Link & Program Management | Icon modes (favicon/logo.dev/URL/upload), domain guessing, and native/program launch support. |
| Widgets | Weather (Open-Meteo), RSS (proxy fallback + highlighting), UptimeRobot, sandboxed IFrame, COVID stats. |
| Data & Persistence | Local storage, timestamped export, migration-safe IDs. |
| Performance | Lazy icon loading, unified cache pool, idle scheduling, lean service worker. |
| Reliability & Safety | Defensive error handling, sandboxed iframes, native allowlist, CORS fallback. |


### Tech Stack
| Domain | Technologies |
|--------|--------------|
| Frontend | HTML5, CSS3, ES Modules |
| Browser Extension | Chrome MV3 (service worker + storage) |
| Scripts | PowerShell, Batch (.bat), Python (utility GUI), Node.js (native host example) |
| Data | JSON state + in-memory caches |
| APIs | Open-Meteo, logo.dev, UptimeRobot, disease.sh, RSS feeds |

### Built With

<p align="center">
  <a href="https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5"><img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"></a>
  <a href="https://developer.mozilla.org/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"></a>
  <a href="https://developer.mozilla.org/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
</p>


### Architecture Overview
1. Extension action opens the dashboard.
2. `main.js` loads and migrates state to initial render.
3. User edits update in-memory state with debounced persist.
4. Widgets hydrate from cache or network (proxy fallback logic for RSS).
5. Program tiles launch via scheme or native host.

---

## Screenshots / Showcase

### Dashboard
<p align="center">
<img src="https://i.imgur.com/F2Mp7Hu.png" alt="Dashboard" width="80%" />
<br/>
<img src="https://i.imgur.com/0vw3aV2.png" alt="Dashboard example" width="80%" />
<br/>
<img src="https://i.imgur.com/mMPiJ5F.png" alt="Dashboard example" width="80%" />
</p>

### Pages Overflow & Widgets
<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
  <img src="https://i.imgur.com/7rsaU4j.png" alt="Pages Overflow" style="width: 48%; object-fit: contain;"/>
  <img src="https://i.imgur.com/4iSEVrs.png" alt="Pages Overflow" style="width: 47%; object-fit: contain;"/>
  <img src="https://i.imgur.com/Re9j0Ii.png" alt="Pages Overflow" style="width: 45%; object-fit: contain;"/>
  <img src="https://i.imgur.com/Aj7vZMp.png" alt="Widgets" style="width: 54%; object-fit: contain;"/>
  <img src="https://i.imgur.com/jgy3DBS.png" alt="Settings" style="width: 45%; object-fit: contain;"/>
  <img src="https://i.imgur.com/rZrp1wG.png" alt="Settings" style="width: 54%; object-fit: contain;"/>
  <img src="https://i.imgur.com/SLUquLC.png" alt="Settings" style="width: 45%; object-fit: contain;"/>
  <img src="https://i.imgur.com/0TNFCvt.png" alt="Widgets" style="width: 54%; object-fit: contain;"/>
</div>


### Modals & Settings
<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
<img src="https://i.imgur.com/4tdMfHD.png" alt="General" width="30%" />
<img src="https://i.imgur.com/wuRm6HH.png" alt="Data" width="42%" />

<img src="https://i.imgur.com/whNVO9C.png" alt="APIs" width="30%" />
<img src="https://i.imgur.com/DFdaXrf.png" alt="Advanced" width="34%" />
</div>

---

## Getting Started

[![Getting Started](https://img.shields.io/badge/🚀%20Getting%20Started-Guide-blue.svg)](#getting-started)

Run as an unpacked Chromium extension (recommended) or open `dashboard.html` directly (reduced feature set outside extension context).

### Prerequisites
* Chromium-based browser (Chrome / Edge / Brave)
* (Optional) Node.js 18+ (native host example)
* (Optional) PowerShell (Windows) for protocol registration

### Installation (as Extension)
1. Clone the repository
2. Open `chrome://extensions` and enable Developer Mode
3. Click **Load unpacked** and select the project root
4. Click the extension icon to open the dashboard

### Optional Native Launching
1. Edit the `native/host-manifest.json` path
2. Adapt `native/stackdash-native.js` to whitelist commands
3. Register the native host per Chrome documentation
4. Set program tiles to the native launch method

### Optional Custom URL Protocols (Windows)
<a id="optional-custom-url-protocols-windows"></a>
1. Run PowerShell: `CommandManager/Register-ExecutableProtocols.ps1 -Force`
2. Test: `start someprogramx:`
3. Batch launchers are stored under `helpers/windows/`

---

## Usage
[![Usage](https://img.shields.io/badge/▶️%20Usage-Examples-blue.svg)](#usage)
| Action | How |
|--------|-----|
| Add Page | Click the **Add Page** button (top bar) |
| Add Group | Click the **Create Group** card at the end of groups |
| Add Link / Program / Widget | Use the group menu or edit mode buttons |
| Rearrange Tiles | Drag and drop in edit mode |
| Theme / Font | Settings → General |
| Glow | Settings → General |
| Backup | Settings → Data → Export JSON |
| Restore | Settings → Data → Import JSON |
| Reset Pages | Settings → Advanced (Danger) |
| Toggle Edit Mode | Use the settings panel switch |

---

## Widgets
[![Widgets](https://img.shields.io/badge/🧩%20Widgets-Available-blue.svg)](#widgets)
| Widget | Summary | Notes |
|--------|---------|-------|
| Weather | Current conditions and details | Open-Meteo (no key) |
| RSS | Feed items with new highlighting | Multi-proxy fallback |
| UptimeRobot | Uptime percentage and status | API key required |
| IFrame | Embed external page | Subject to X-Frame/CSP |
| COVID | Basic statistics | Uses disease.sh API |

---

## Configuration
[![Configuration](https://img.shields.io/badge/⚙️%20Configuration-Available-blue.svg)](#configuration)
| Setting | Location | Description |
|---------|----------|-------------|
| Theme | Settings → General | System / Light / Dark / Crimson |
| Font | Settings → General | Searchable catalog |
| Glow | Settings → General | Enable + color + reset |
| Cache Max Age | Settings → Advanced | Hours before pruning |
| Cache Max Entries | Settings → Advanced | Per-cache cap |
| Perf Flag | Settings → Advanced | Internal diagnostics toggle |
| Logo.dev Key | Settings → APIs | Enables logo fetching |

---

## Data Export / Import
[![Data Export / Import](https://img.shields.io/badge/📥%20Data%20Export%20%2F%20Import-Supported-blue.svg)](#data-export--import)
* Export: timestamped JSON (pages, groups, links, widgets, programs, settings)
* Import: schema normalization (IDs, arrays, safety checks)
* Compatible across future minor migrations

---

## Performance and Caching
[![Performance & Caching](https://img.shields.io/badge/⚡%20Performance%20%26%20Caching-Optimized-green.svg)](#performance--caching)
* Lazy loading for icons and images
* Unified cache pool (RSS, weather, COVID, uptime)
* TTL + max entries pruning (idle scheduled)
* Lightweight full re-render model (low state size)

---

## Security & Privacy
[![Security & Privacy](https://img.shields.io/badge/🔒%20Security%20%26%20Privacy-Important-red.svg)](#security--privacy)
| Aspect | Approach |
|--------|----------|
| Storage | Local (extension and localStorage only) |
| Native Execution | Explicit command allowlist sample |
| Logo API Key | Kept only in settings (not serialized per item) |
| IFrames | Sandbox with opt-in permissions |
| RSS | Proxy fallback avoids noisy CORS errors |
| Uploads | Size-limited; never auto-exfiltrated |

---

## Directory Structure
[![Directory Structure](https://img.shields.io/badge/📂%20Directory%20Structure-Available-blue.svg)](#directory-structure)
```
oh/
 ├─ dashboard.html
 ├─ manifest.json
 ├─ service-worker.js
 ├─ css/
     └─ dashboard.css
 ├─ js/
 │   ├─ API/
 │   │   └─ fileSystemAccess.js
 │   ├─ main.js
 │   ├─ state.js
 │   ├─ render-pages.js
 │   ├─ render-groups.js
 │   ├─ settings.js
 │   ├─ actions.js
 │   ├─ modals.js
 │   ├─ utils.js
 │   ├─ events.js
 │   ├─ fonts.js
 │   └─ favicon.js

 **├─ CommandManager/**
 │   └─ Register-ExecutableProtocols.ps1
 **├─ helpers/windows/*.bat**

 ├─ dashboard-natives/
 │   ├─ homelab.json
 ├─ native/
 │   ├─ host-manifest.json
 │   └─ stackdash-native.js
 ├─ assets/
     ├─ images/
     └─ icon/
 │     └─ stackdash-*.png / .svg
 └─ README.md
```

---

## Roadmap
[![Roadmap](https://img.shields.io/badge/🗺️%20Roadmap-Planned-blue.svg)](#roadmap)
- [ ] Extract widget code into modular sub-files
- [ ] Unit tests for migrations and import
- [ ] Additional widgets (Grafana / Prometheus)
- [ ] Optional encrypted cloud sync
- [ ] Performance metrics panel UI
- [ ] Auto theme schedule
- [ ] Profiles / multi-config switcher

---

## Contributing
[![Contributing](https://img.shields.io/badge/🤝%20Contributing-Guidelines-blue.svg)](#contributing)
1. Fork the repository
2. Create a feature branch (`git checkout -b feat/awesome`)
3. Commit (`git commit -m "feat: add awesome"`)
4. Push (`git push origin feat/awesome`)
5. Open a Pull Request

**Good first contributions:** widget extraction, accessibility polish, performance measurement harness, new icon sources, additional program launch modes.

---
## Acknowledgments
[![Acknowledgments](https://img.shields.io/badge/🙏%20Acknowledgments-Thanks-blue.svg)](#acknowledgments)

* logo.dev (logo resolution)
* Open-Meteo (weather)
* UptimeRobot (uptime API)
* disease.sh (COVID stats)
* Favicon & logo fallbacks (Google & Clearbit)
* Community dashboard and homelab inspirations

---

<!-- MARKDOWN LINKS & BADGES -->
[status-badge]: https://img.shields.io/badge/status-active-success?style=for-the-badge
[issues-shield]: https://img.shields.io/github/issues/YOUR_USERNAME/YOUR_REPO.svg?style=for-the-badge
[issues-url]: https://github.com/YOUR_USERNAME/YOUR_REPO/issues
[license-shield]: https://img.shields.io/github/license/YOUR_USERNAME/YOUR_REPO?style=for-the-badge
[license-url]: LICENSE
[last-commit-shield]: https://img.shields.io/github/last-commit/YOUR_USERNAME/YOUR_REPO?style=for-the-badge
[last-commit-url]: https://github.com/YOUR_USERNAME/YOUR_REPO/commits
[love-badge]: https://img.shields.io/badge/made%20with-%E2%9D%A4-red?style=for-the-badge
[repo-url]: https://github.com/YOUR_USERNAME

## Idea of Original Credit
</a>
<a href="https://www.tiktok.com/@benjaminspowell">
  <img src="https://img.shields.io/badge/By%3A%20Benjamin%20S%20Powell%20--%20Idea%20Came%20from%3A%20LabDash-000000?style=flat&logo=tiktok&logoColor=white" alt="TikTok - By: Benjamin S Powell - Idea Came from: LabDash">
</a>
</div>
</div>
</div>

<p align="right">
  <a href="#readme-top">
    <img src="https://img.shields.io/badge/☝️%20Back_to_Top-%232c2c2c?style=for-the-badge&labelColor=%23141414" alt="Back to top" />
  </a>
</p>
