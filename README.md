# Database Agent – Frontend (Next.js)

Modern, responsive frontend for the **Database Agent** application, built with **Next.js** and **Tailwind CSS**. It provides a chat-based UI to talk to your database through the FastAPI backend.

## Features

- **AI Chat Interface** – chat with the database agent using natural language
- **Database View** – view schema / tables returned from the backend
- **Conversation History** – see previous questions and answers
- **Responsive Layout** – works on desktop and mobile

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)
- Backend running on `http://localhost:8000` (Database Agent FastAPI backend)

### Installation & Run

```bash
# install dependencies
npm install

# start dev server
npm run dev

# app will be available at
http://localhost:3000
```

Make sure the backend server is running so the chat and database calls work correctly.

## Project Structure

Top‑level (simplified):

```text
.
├── public/                 # Static assets (images, icons, etc.)
├── src/
│   └── app/
│       ├── components/     # Reusable UI components for the app
│       ├── services/       # API client and helpers
│       ├── favicon.ico
│       ├── globals.css     # Global styles + Tailwind layers
│       ├── layout.js       # Root layout for the App Router
│       └── page.js         # Main page (chat & DB UI)
├── eslint.config.mjs
├── jsconfig.json
├── mdx-components.tsx
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── tailwind.config.* / lockfiles
```

### Frontend Flow

1. User opens `page.js` (home) which renders the main chat + database UI.
2. UI components (from `src/app/components`) call functions in `src/app/services`.
3. Service layer sends HTTP requests to the FastAPI backend (`http://localhost:8000`).
4. Responses are rendered back into the chat / tables on the page.

## Scripts (package.json)

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run start` – run production build
- `npm run lint` – run ESLint

## Environment / Configuration

The base backend URL is defined in the service layer under `src/app/services`. If you deploy the backend elsewhere, update that URL accordingly.

## Related Project

This frontend is designed to work with the **Database Agent FastAPI backend** located in:

`Database-agent-backend-fastapi/`

Make sure to follow the backend README to configure database access and environment variables.

