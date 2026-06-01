# CodeLink – Developer’s Collaborative Workspace

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
