<!-- Improved compatibility of back to top link -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<div align="center">
  <a href="[repo-url]">
    <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge" alt="Status" />
  </a>
  <a href="[issues-url]">
    <img src="https://img.shields.io/github/issues/YOUR_USERNAME/YOUR_REPO.svg?style=for-the-badge" alt="Issues" />
  </a>
  <a href="https://github.com/Salc-wm/Master-ControlCenter/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Salc-wm/Master-ControlCenter/blob/main/LICENSE?style=for-the-badge" alt="License" />
  </a>
  <a href="[last-commit-url]">
    <img src="https://img.shields.io/github/last-commit/YOUR_USERNAME/YOUR_REPO?style=for-the-badge" alt="Last Commit" />
  </a>
  <a href="[repo-url]">
    <img src="https://img.shields.io/badge/made%20with-%E2%9D%A4-red?style=for-the-badge" alt="Made with Love" />
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
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About the Project</a>
      <ul>
        <li><a href="#core-structure">Core Structure</a></li>
        <li><a href="#key-features">Key Features</a></li>
        <li><a href="#tech-stack">Tech Stack</a></li>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#architecture-overview">Architecture Overview</a></li>
      </ul>
    </li>
    <li><a href="#screenshots--showcase">Screenshots / Showcase</a></li>
    <li><a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation-as-extension">Installation (Chrome Extension)</a></li>
        <li><a href="#optional-native-launching">Optional: Native Launching</a></li>
        <li><a href="#optional-custom-url-protocols-windows">Optional: Custom URL Protocols (Windows)</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#widgets">Widgets</a></li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#data-export--import">Data Export / Import</a></li>
    <li><a href="#performance-and-caching">Performance & Caching</a></li>
    <li><a href="#security--privacy">Security & Privacy</a></li>
    <li><a href="#directory-structure">Directory Structure</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#faq">FAQ</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
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
<p align="center">
<img src="https://i.imgur.com/7rsaU4j.png" alt="Pages Overflow" width="45%" />
<img src="https://i.imgur.com/4iSEVrs.png" alt="Pages Overflow" width="45%" />
<img src="https://i.imgur.com/Re9j0Ii.png" alt="Pages Overflow" width="45%" />
<img src="https://i.imgur.com/Aj7vZMp.png" alt="Widgets" width="45%" />
<img src="https://i.imgur.com/jgy3DBS.png" alt="Settings" width="45%" />
<img src="https://i.imgur.com/rZrp1wG.png" alt="Settings" width="45%" />
<img src="https://i.imgur.com/SLUquLC.png" alt="Settings" width="45%" />
<img src="https://i.imgur.com/0TNFCvt.png" alt="Widgets" width="45%" />
</p>


### Modals & Settings
<p align="center">
<img src="https://i.imgur.com/4tdMfHD.png" alt="General" width="30%" />
<img src="https://i.imgur.com/wuRm6HH.png" alt="Data" width="30%" />
<img src="https://i.imgur.com/whNVO9C.png" alt="APIs" width="30%" />
<img src="https://i.imgur.com/DFdaXrf.png" alt="Advanced" width="30%" />
</p>

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
 ├─ dashboard.css
 ├─ manifest.json
 ├─ service-worker.js
 ├─ js/
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
 ├─ CommandManager/
 │   └─ Register-ExecutableProtocols.ps1
 ├─ helpers/windows/*.bat
 ├─ native/
 │   ├─ host-manifest.json
 │   └─ stackdash-native.js
 ├─ icon/
 │   └─ stackdash-*.png / .svg
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

---

## License

[![License](https://img.shields.io/badge/📜%20License-Restricted-red.svg)](#license)

Copyright (c) 2025 Master-Control Center  

Permission is hereby granted to any person obtaining a copy of this software  
to use the Software for personal or commercial purposes, subject to the following conditions:  

1. Modification of the Software is **not permitted**.  
2. Redistribution of the Software, in whole or in part, is **not permitted**.  
3. The Software is provided **"as is"**, without warranty of any kind, express or implied,  
   including but not to the warranties of merchantability, fitness for a particular purpose,  
   and noninfringement. In no event shall the authors be liable for any claim, damages,  
   or other liability, whether in an action of contract, tort, or otherwise, arising from,  
   out of, or in connection with the Software or the use of the Software.  


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
<div align="center">
<div align="center">
<div align="center">
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
