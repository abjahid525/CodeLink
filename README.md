# CodeLink - Developer's Collaborative Workspace

CodeLink is a full-stack developer workspace for writing small web experiments, saving reusable snippets, discussing bugs, and finding project ideas with other developers.

## Features

- Live HTML, CSS, and JavaScript editor with preview
- Snippet library with syntax highlighting
- Bug-fix forum with simple diff views
- Project idea posts with join and apply actions
- Cheat-sheet modal and dark/light theme toggle
- LocalStorage fallback for selected features
- Express backend API

## Tech stack

- Frontend: HTML, CSS, and JavaScript
- Backend: Node.js and Express
- Security and middleware: Helmet, CORS, rate limiting, bcrypt, and JSON Web Tokens

## Run locally

Requirements: Node.js 18 or newer.

1. Clone the repository and enter the project directory:

```powershell
git clone https://github.com/abjahid525/CodeLink.git
cd CodeLink
```

2. Install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

4. Open http://localhost:3000 in your browser.

For development with automatic restarts:

```powershell
npm run dev
```

## Project structure

- `frontend/` - static pages, styles, and client-side modules
- `backend/` - Express server and API routes
- `backend/data/` - demo persistence data

## Deployment note

The GitHub Pages site serves the static frontend only. The Express backend must be run separately on a Node.js host for API-backed features.

## Status

This is a learning project that demonstrates full-stack JavaScript structure, browser UI work, REST-style backend routes, and local persistence.# CodeLink – Developer’s Collaborative Workspace

A cyberpunk-inspired full-stack developer workspace with live code preview, snippets library, bug-fix forum, and project matchmaker.

## Features

- Live HTML/CSS/JS editor with preview
- Snippet management with syntax highlighting
- Bug-fix posting forum with simple diff views
- Project idea posting with join/apply actions
- Cheat sheet modal and dark/light toggle
- LocalStorage fallback and Express backend API

## Run locally

1. Install dependencies:

```powershell
cd C:\Users\Jahid\CodeLink
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open your browser:

```text
http://localhost:4000
```

## Project structure

- `/frontend` – static pages, styles, and client-side modules
- `/components` – modular JavaScript for editor, snippets, forum, and matchmaker
- `/backend` – Express server and API routes
- `/backend/data` – storage file for demo persistence
