hello world

# Mini App Collection 🧩

A collection of interactive mini web apps built with vanilla HTML, CSS, and JavaScript. Features dark/light theme support, responsive design, localStorage persistence, and keyboard accessibility.

> **📌 A:** This is a living project that continues to evolve. New features, apps, and improvements are added regularly, with each change committed and tracked via git for full traceability.
>
> **📌 B:** Every app in this collection is designed with mobile-first responsive principles, ensuring a consistent and usable experience across devices of all sizes — from phones to desktops.
>
> **📌 C:** The project uses a modular architecture where shared utilities (theme management, local storage helpers) are abstracted into `js/app.js`, while each app's unique logic stays in its own file — balancing reuse with separation of concerns.

## Apps

### 🔍 Search Landing Page
Brand landing page with hero section, typing animation, feature cards, and theme toggle.

- Animated typing headline cycling through multiple phrases
- Dark/light theme toggle with persisted preference
- Feature showcase with six highlight cards
- Responsive design with decorative background orbs

**Files:** `index.html`, `style.css`, `script.js`

### 🧮 Calculator
A full-featured calculator with keyboard support.

- Basic operations: add, subtract, multiply, divide, percentage
- Expression display showing pending operations
- Active operator highlighting
- Keyboard support (0-9, +, -, *, /, Enter, Backspace, Escape)
- Dark/light theme toggle

**Files:** `calculator.html`, `calculator.css`, `calculator.js`

### ✅ Todo List
Task manager with add, delete, and complete functionality.

- Add and remove tasks
- Mark tasks as complete with strikethrough styling
- Clean, responsive UI

**Files:** `todo.html`, `todo.css`, `todo.js`

### 🍅 Pomodoro Timer
Focus timer with 25-minute work / 5-minute break cycling.

- Circular SVG progress ring with animated countdown
- Session counter tracking completed focus sessions
- Sound notification (Web Audio API chime) on session complete
- Session history persisted in localStorage
- Start / Pause / Reset controls
- Dark/light theme toggle

**Files:** `pomodoro.html`, `pomodoro.css`, `pomodoro.js`

### ⏱️ Stopwatch
Precision lap timer with millisecond accuracy.

- Start / Stop / Lap / Reset controls
- Lap history with automatic best-lap highlighting
- Centisecond precision display (00:00.00)
- Keyboard shortcuts: Space (start/stop), L (lap)
- Dark/light theme toggle

**Files:** `stopwatch.html`, `stopwatch.css`, `stopwatch.js`

### 📓 Notebook
Simple note-taking app with search and auto-save.

- Create, edit, and delete notes
- Auto-save with debounce (400ms)
- Full-text search across titles and content
- Empty notes are automatically removed
- Keyboard shortcuts: N (new note), Escape (back to list)
- Dark/light theme toggle

**Files:** `notes.html`, `notes.css`, `notes.js`

### ℹ️ About
Simple informational page with navigation, centered layout, and a dark mode toggle.

**Files:** `about.html`

## Features

- **Dark/light themes** across all apps — preferences saved to localStorage
- **Responsive design** — works on desktop and mobile
- **Keyboard accessible** — calculator and other apps support keyboard input
- **No frameworks** — built with vanilla HTML, CSS, and JavaScript

## Running locally

Serve the directory with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> **💡 Tip:** All apps store their theme preference in `localStorage`. If you want to reset a theme, just clear your browser's local storage for the site, or toggle the theme back in the app's UI.
>
> **📝 Note:** Each app is a standalone HTML file — you can open them individually without needing a server, though some features (like favicon loading) work best when served via HTTP.
>
> **🔧 Compatibility:** All apps target modern browsers (Chrome, Firefox, Safari, Edge). The Pomodoro timer's sound notification uses the Web Audio API, which requires a secure context (HTTPS or localhost) to play automatically.
>
> **📌 Comment A:** This project was built incrementally across multiple sessions, with each mini app added as a self-contained feature. The todo list, pomodoro timer, calculator, and about page were each developed independently and later integrated into a unified collection with shared theming and navigation.
>
> **📌 Comment B:** All mini apps share a common design language through CSS custom properties defined in `style.css`. This makes global theme changes (colors, spacing, fonts) as simple as updating a few variable values — no need to touch each app's individual stylesheet.
>
> **📌 Comment C:** The JavaScript for each app is kept in separate files (`calculator.js`, `todo.js`, `pomodoro.js`, `script.js`) to maintain clear separation of concerns. Shared utility logic lives in `js/app.js`, which is tested independently with Jest.
>
> **📌 Comment X:** This project demonstrates that vanilla JavaScript remains a powerful and practical choice for building interactive web applications without the overhead of frameworks. Every mini app follows the same architecture: a standalone HTML file that references a dedicated CSS and JS file, making each app independently deployable and maintainable.
>
> **📌 Comment Y:** The project's CSS architecture uses a layered approach: global custom properties in `style.css` define the design tokens (colors, spacing, typography), while each app's individual stylesheet handles component-specific layout and styling. This keeps the global CSS lean and prevents style conflicts between apps.
>
> **📌 Comment Z:** Testing is a first-class concern in this project. The shared utility functions in `js/app.js` are fully covered by Jest unit tests, providing a safety net for core logic like video ID extraction, deduplication, and localStorage operations. Each test uses mocked dependencies to ensure isolation and reliability.
>
> **📌 Setup:** The project follows a zero-configuration setup — just clone the repository and serve the directory with any static file server (`npx serve .` or `python3 -m http.server 8080`). No build step, no dependency installation, no environment variables. For running tests, a single `npm install` followed by `npm test` is all that's needed.
>
> **📌 after conv:** This comment was added in a new conversation session to demonstrate how the README continues to evolve across multiple independent work sessions — each addition building on the previous state of the project.
>
> **📌 T2-A:** first

## Tests

Unit tests are written with [Jest](https://jestjs.io/). Run them with:

```bash
npm test
```

## Project structure

```
├── index.html          Search landing page
├── calculator.html     Calculator app
├── todo.html           Todo list app
├── pomodoro.html       Pomodoro timer
├── stopwatch.html      Stopwatch
├── notes.html          Notebook
├── about.html          About page
├── style.css           Global styles (themes, landing page)
├── script.js           Typing animation + theme toggle
├── calculator.css      Calculator styles
├── calculator.js       Calculator logic
├── todo.css            Todo list styles
├── todo.js             Todo list logic
├── pomodoro.css        Pomodoro styles
├── pomodoro.js         Pomodoro logic
├── stopwatch.html      Stopwatch app
├── stopwatch.css       Stopwatch styles
├── stopwatch.js        Stopwatch logic
├── notes.html          Notebook app
├── notes.css           Notebook styles
├── notes.js            Notebook logic
├── favicon.svg         App favicon
├── js/
│   ├── app.js          Core logic (pure functions, no DOM dependency)
│   └── app.test.js     Jest unit tests
├── package.json        Node project configuration
└── README.md           This file
```
