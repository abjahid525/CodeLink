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
