# CodeLink - Developer's Collaborative Workspace

[![CodeLink CI](https://github.com/abjahid525/CodeLink/actions/workflows/ci.yml/badge.svg)](https://github.com/abjahid525/CodeLink/actions/workflows/ci.yml)

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

3. Optional: copy `.env.example` to `.env` and set a strong `JWT_SECRET`.

4. Start the server:

```powershell
npm start
```

5. Open http://localhost:3000 in your browser.

For development with automatic restarts:

```powershell
npm run dev
```

## API overview

The Express server exposes:

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Admin token |
| `GET` | `/api/admin/users` | Admin token |
| `GET` | `/api/admin/logs` | Admin token |
| `GET` | `/api/admin/content` | Admin token |
| `GET` | `/api/admin/activities` | Admin token |
| `GET` | `/api/admin/summary` | Admin token |
| `GET` | `/api/admin/records-per-day` | Admin token |

Protected routes expect the JWT returned by login or registration:

```text
Authorization: Bearer <token>
```

## Verification

Run the backend smoke test after installing dependencies:

```powershell
npm test
```

The test starts CodeLink on an isolated local port, verifies that `/api/health` responds successfully, confirms that the protected admin users endpoint rejects requests without a JWT, and checks that production startup fails when `JWT_SECRET` is missing.

## Project structure

- `frontend/` - static pages, styles, and client-side modules
- `backend/` - Express server and API routes
- `backend/data/` - demo persistence data

## Deployment note

The GitHub Pages site serves the static frontend only. The Express backend must be run separately on a Node.js host for API-backed features.

### Environment variables

Production requires `JWT_SECRET`. See [`.env.example`](.env.example) for optional Firebase and initial-admin settings. Never commit `.env` or service-account credentials.

## Status

This is a learning project that demonstrates full-stack JavaScript structure, browser UI work, REST-style backend routes, and local persistence.
