# Code Analysis — Craftguy-Billies/search

**Date:** 2026-07-07

## 1. Project Overview

A collection of 6 mini web apps built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools. Includes an Express.js backend for the YouTube downloader feature.

**Tech Stack:** Vanilla JS, CSS3 (custom properties), HTML5, Express.js, Jest

## 2. Application Inventory

| App | Files | Features |
|-----|-------|----------|
| Search Landing Page | `index.html`, `style.css`, `script.js` | Typing animation, dark/light theme, hero section, feature cards |
| Calculator | `calculator.html`, `calculator.css`, `calculator.js` | Arithmetic ops, expression display, keyboard support, operator highlighting |
| Todo List | `todo.html`, `todo.css`, `todo.js` | Add/delete/complete tasks, localStorage persistence, empty state |
| Pomodoro Timer | `pomodoro.html`, `pomodoro.css`, `pomodoro.js` | 25/5 min focus/break cycle, SVG progress ring, Web Audio chime, session history |
| YouTube Downloader | `yt-downloader.html`, `yt-downloader.css`, `yt-downloader.js`, `server.js` | Fetch video info, format listing, download links |
| About Page | `about.html` | Simple info page with theme toggle |

## 3. Architecture

**Shared Logic (`js/app.js`):** Pure functions with no DOM dependencies:
- `extractVideoId()` — YouTube URL parsing with 6 regex patterns
- `timeAgo()` — Relative time formatting
- `buildVideoObject()` — Video metadata with fallbacks
- `isDuplicate()`, `addVideoToList()`, `removeVideoFromList()` — Immutable list operations
- `saveVideos()`/`loadVideos()` — localStorage round-trip with JSON error handling

**Theme System:** CSS custom properties with `[data-theme="light"]` selector; `localStorage` key `landing_theme` shared across all apps.

**Server (`server.js`):** Express.js with two endpoints:
- `GET /api/info?url=` — Fetches YouTube video metadata, deduplicates formats
- `GET /api/download?url=&itag=` — Streams video file for download

## 4. Test Coverage (43 tests — all passing)

| Suite | Tests | Coverage |
|-------|-------|----------|
| `extractVideoId` | 15 | All YouTube URL variants + edge cases |
| `timeAgo` | 8 | Fake timers, boundary conditions |
| `buildVideoObject` | 2 | Complete data + missing fields fallbacks |
| `isDuplicate` | 3 | True/false/empty list |
| `addVideoToList` | 2 | Prepending + immutability |
| `removeVideoFromList` | 4 | Index removal + out-of-bounds |
| `saveVideos`/`loadVideos` | 4 | Round-trip, empty, corrupted JSON |
| `saveTheme`/`loadTheme` | 3 | Light/dark/default |
| `hello`/`goodbye` | 2 | Simple return values |

## 5. Strengths

- Clean separation of concerns — each app has its own CSS/JS file
- Shared utilities are pure functions (testable, DOM-independent)
- Consistent dark/light theme via CSS custom properties across all apps
- Immutable array operations in list management
- Keyboard accessibility in calculator
- Web Audio API for Pomodoro notification (no external files)
- Comprehensive test coverage for core utility functions

## 6. Minor Observations

- Theme toggle logic duplicated across 6 locations — candidate for centralization
- `server.js` uses `ytdl-core` v4 (deprecated; newer alternatives exist)
- `hello()`/`goodbye()` in `app.js` appear to be stub functions
- Different localStorage naming conventions: `videovault_list` vs `taskflow_todos`
