# VideoVault 🎬

<!-- A YouTube video displayer app built with vanilla JavaScript -->

hello world

A simple YouTube video displayer app built with vanilla JavaScript. Add YouTube URLs, view video metadata, and play videos inline.

## Features

- **Add videos** by pasting a YouTube URL or video ID
- **Auto-fetches metadata** (title, author, thumbnail) via the YouTube oEmbed API
- **Inline video player** with autoplay support
- **Dark / light theme toggle** with persisted preference
- **LocalStorage persistence** — your videos survive page reloads
- **Video management** — remove individual videos, clear all, refresh metadata

## Usage

1. Paste a YouTube URL (or just a video ID) into the input field
2. Press **Add** or hit **Enter**
3. Click a video thumbnail to play it inline
4. Use **☀️ / 🌙** to toggle between dark and light themes

Supported URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- Plain video ID (e.g., `dQw4w9WgXcQ`)

## Running locally

Serve the directory with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Tests

Unit tests are written with [Jest](https://jestjs.io/). Run them with:

```bash
npm test
```

The test suite covers URL parsing, date formatting, video list operations, localStorage persistence, and theme preference persistence.

## Project structure

```
├── index.html        Main application HTML
├── js/
│   ├── app.js        Core logic (pure functions, no DOM dependency)
│   └── app.test.js   Jest unit tests
├── favicon.svg       App favicon
├── package.json      Node project configuration
└── README.md         This file
```
