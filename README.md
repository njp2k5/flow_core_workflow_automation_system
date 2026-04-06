# Flow Core Workflow Automation System

A unified automation platform for meeting capture, transcription, task extraction, Jira issue creation, Confluence documentation, GitHub progress analysis, and developer dashboards.

This repository contains:

- `backend/` — FastAPI backend for meeting recording ingestion, audio transcription, LLM summarization, Jira/Confluence integrations, SRS document processing, and developer analytics.
- `backend/github_mcp_server/` — supplemental GitHub MCP server that bridges GitHub repository metadata and LLM summarization to the frontend.
- `frontend/` — React + Vite dashboard for managers and developers, with auth, progress reporting, task assignment, meetings, Jira and Confluence views.
- `assets/architecture.jpg` — system architecture diagram.

---

## System Architecture

![System Architecture](assets/architecture.jpg)

> The architecture combines recording ingestion, transcription, LLM processing, database persistence, issue management, and UI surfaces.

---

## High-Level Overview

The system is organized into three main layers:

1. **Backend API** (`backend/`)
   - FastAPI application powering recording workflows, meeting analytics, developer summaries, GitHub commit data, and SRS document ingestion.
   - Database-backed models for members, meetings, transcriptions, tasks, and processing logs.
   - Modular services for transcription, LLM summarization, Jira, Confluence, task extraction, name matching, and scheduling.
2. **GitHub MCP Server** (`backend/github_mcp_server/`)
   - Standalone integration layer for GitHub repository commits, pull requests, contributors, branch data, and LLM-powered progress summaries.
   - Supports both MCP clients and REST access.
3. **Frontend Dashboard** (`frontend/`)
   - React application delivering manager and developer views.
   - Authentication, route protection, cached API helpers, and data dashboards.

---

## Key Capabilities

- Real-time and scheduled processing of meeting recordings
- Audio/video transcription via `faster-whisper`
- LLM-based meeting summarization and task extraction via Groq
- Jira Cloud ticket creation with duplicate detection and assignee matching
- Confluence page creation/update for meeting notes
- Database persistence of meetings, transcripts, tasks, and members
- SRS `.docx` document processing with page/task/story generation
- GitHub commit analytics and progress reporting via MCP server
- React dashboard for managers and developers with auth and role-based navigation

---

## Repository Structure

```text
.
├── README.md
├── assets/
│   └── architecture.jpg
├── backend/
│   ├── api/                 # FastAPI routers for health, auth, and SRS processing
│   ├── app/                 # Core backend services and business logic
│   ├── auth/                # JWT and OAuth2 security helpers
│   ├── db/                  # SQLAlchemy base and session helpers
│   ├── github_mcp_server/   # GitHub MCP server integration and summarizer
│   ├── models/              # Persistent user model
│   ├── schemas/             # Pydantic schemas for auth
│   ├── tests/               # Backend tests
│   ├── main.py              # FastAPI application entrypoint and routes
│   ├── requirements.txt     # Backend Python dependencies
│   ├── Dockerfile           # Backend container definition
│   ├── seed_sample_data.py  # Database seeding helper
│   └── check_routes.py      # Route checker utility
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Shared UI components and layout
│   │   ├── context/         # Authentication context provider
│   │   ├── pages/           # Manager/developer page screens
│   │   ├── services/        # API service wrapper
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json         # Frontend dependencies and scripts
│   └── README.md            # Frontend-specific README
└──
```

---

## Backend Deep Dive

### `backend/main.py`

The main FastAPI app does the following:

- Loads environment configuration via `app.config.settings`
- Initializes the database and creates tables on startup
- Starts a scheduler for recording folder polling
- Registers APIs for:
  - recording health/status
  - recording files listing and processing
  - scheduler control
  - file watcher control
  - meeting/task queries
  - developer summaries
  - natural-language task assignment
  - GitHub commit tracking and progress analysis

It also optionally integrates `backend/github_mcp_server` if installed.

### Backend API modules

- `backend/api/routes/health.py`
  - `/health/`

- `backend/api/routes/auth.py`
  - `/auth/signup`
  - `/auth/token`
  - `/auth/me`
  - Uses OAuth2 password flow, JWT tokens, and password hashing.

- `backend/api/routes/srs.py`
  - `/srs/upload`
  - `/srs/status`
  - Accepts `.docx` files and runs them through the SRS processing pipeline.

### Core backend services

#### `backend/app/config.py`

- Loads environment variables from `.env`
- Defines critical settings for:
  - PostgreSQL connection
  - recording folder paths
  - Whisper model configuration
  - Jira and Confluence credentials
  - Groq LLM credentials
  - polling interval and application mode

#### `backend/app/db.py`

- Creates SQLAlchemy engine and session factory
- Provides `get_db()` dependency for FastAPI
- Exposes `init_db()` and `check_db_connection()` helpers
- Enables connection pooling and debug logging

#### `backend/app/models.py`

Defines the core relational schema:

- `Member` — team members and authentication details
- `Transcription` — meeting transcript summaries
- `Meeting` — meeting records, Confluence metadata
- `Task` — action items assigned to members
- `ProcessingLog` — optional processing history and errors

#### `backend/app/transcriber.py`

- Uses `faster-whisper` to transcribe recorded audio/video files
- Supports `.mp3`, `.mp4`, `.wav`, `.m4a`, `.mpeg`, `.webm`
- Loads one Whisper model instance for reuse
- Supports timestamped transcription and duration retrieval

#### `backend/app/llm.py`

- Wraps Groq via `langchain_groq` for:
  - meeting title extraction
  - project name extraction
  - meeting summarization
  - task extraction in strict JSON format
- Implements retry/backoff behavior and robust JSON cleanup
- Falls back to regex if LLM output is malformed

#### `backend/app/jira_client.py`

- Connects to Jira Cloud using API token and Basic Auth
- Supports:
  - issue type discovery
  - assignee lookup
  - task creation with ADF description
  - duplicate issue detection via keyword search
  - issue search and retrieval
- Includes fuzzy matching for team names and alias handling.

#### `backend/app/confluence_client.py`

- Connects to Confluence Cloud via REST API v1
- Creates or updates pages in the configured Confluence space
- Builds meeting content HTML with:
  - summaries
  - action items
  - Jira links
  - expandable transcript sections
- Supports both page creation and versioned updates

#### `backend/app/recording_watcher.py`

- Watches a configured recordings directory
- Detects new files and avoids duplicate processing via an in-memory cache
- Runs full pipeline per file:
  1. Transcribe audio/video
  2. Summarize meeting with LLM
  3. Extract tasks
  4. Create Jira issues
  5. Create/update Confluence page
  6. Persist meeting and transcription records
- Exposes both scheduled polling and manual watcher control

#### `backend/app/scheduler.py`

- Uses `apscheduler` to poll the recordings directory repeatedly
- Exposes endpoints to start/stop scheduler and trigger immediate polls
- Prevents overlapping processing with locks

#### `backend/app/task_extractor.py`

- Parses raw LLM JSON output and falls back to regex extraction
- Normalizes task fields: description, assignee, due date
- Ensures stable downstream Jira/task creation

#### `backend/app/member_matching.py`

- Matches extracted names to internal team members
- Uses aliases, initials expansion, fuzzy similarity, and substring matches
- Supports team member names such as:
  - `Nikhil J Prasad`
  - `Kailas S S`
  - `S Govind Krishnan`
  - `Mukundan V S`

---

## GitHub MCP Server

The GitHub MCP server in `backend/github_mcp_server/` is a separate integration layer for repository insights.

### Purpose

- Fetch GitHub commits, branches, contributors, PRs, and repo metadata
- Generate LLM progress summaries of commit activity
- Support both MCP clients and REST-API access for the frontend

### Important files

- `config.py` — environment values for GitHub and Groq
- `github_client.py` — GitHub API wrapper
- `summarizer.py` — LLM summarization functions
- `server.py` — MCP server / REST API runner
- `api.py` — FastAPI REST bridge for frontend consumption
- `__main__.py` — command-line entrypoint

### REST API endpoints

The MCP server exposes paths such as:

- `/health`
- `/api/commits`
- `/api/commits/{sha}`
- `/api/commits/{sha}/summary`
- `/api/commits-summary`
- `/api/progress-report`
- `/api/contributors`
- `/api/repo-info`
- `/api/commit-activity`
- `/api/pull-requests`
- `/api/branches`

This makes GitHub data available to the frontend dashboard and to the backend developer summary flow.

---

## Frontend Overview

The React frontend lives in `frontend/` and includes:

- `src/App.jsx` — route definitions and protected route wrapper
- `src/context/AuthContext.jsx` — user session, login, logout, role mapping
- `src/components/ProtectedRoute.jsx` — manager/developer role restrictions
- `src/components/DashboardLayout.jsx` — shared layout, sidebar, header
- `src/pages/` — page modules for managers and developers
- `src/services/api.js` — API client layer with caching and retry

### User roles

- `manager` — access manager dashboard routes
- `developer` — access developer dashboard routes

### Major UI pages

Manager pages:

- `ManagerOverview` — manager landing page
- `ProgressPage` — progress metrics and GitHub reports
- `TaskAssignPage` — task assignment UI
- `TeamPage` — team roster and status
- `MeetingsPage` — meeting summaries list
- `JiraPage` — Jira integration view
- `ConfluencePage` — Confluence documentation view
- `GetStartedPage` — onboarding and setup guide

Developer pages:

- `DeveloperOverview` — developer dashboard landing
- `MyWorkPage` — personal task and workload view

### Frontend service integration

The frontend uses `src/services/api.js` to communicate with the backend:

- Authentication: `/auth/token`, `/auth/me`
- Task endpoints: `/tasks`, `/api/tasks/assign-nl`
- Developer summaries: `/developers/{id}/summary`
- Meeting summaries: `/meetings`
- GitHub and progress data if proxied through backend APIs

It also uses a lightweight in-memory cache with stale-while-revalidate logic.

---

## Setup Guide

### Prerequisites

- Python 3.11+
- Node 20+ / npm 10+ or Yarn
- PostgreSQL 14+
- Jira Cloud account with API token
- Confluence Cloud access and API token
- Groq API key
- Optional: GitHub Personal Access Token for MCP integration

### Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Backend environment variables

Create `backend/.env` with values for:

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/meet_processor
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=meet_processor
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

RECORDINGS_DIR=./recordings
WHISPER_MODEL_SIZE=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

JIRA_SERVER=https://your-domain.atlassian.net
JIRA_EMAIL=your_email@example.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=PROJ

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

CONFLUENCE_BASE_URL=https://your-domain.atlassian.net/wiki
CONFLUENCE_EMAIL=your_email@example.com
CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_SPACE_KEY=MEET

RECORDINGS_POLL_INTERVAL=30
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO
```

> Note: `app.config.Settings` loads `.env` relative to the working directory.

### Initialize the database

```bash
# If you use PostgreSQL locally
createdb meet_processor
```

The database tables are created automatically during startup by `backend/main.py`.

### Run the backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Optional: Run the file watcher manually

```bash
python -c "from app.recording_watcher import run_watcher_cli; run_watcher_cli()"
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend is served by Vite. Configure `VITE_FASTAPI_URL` in `frontend/.env` if backend runs on a non-default origin.

### GitHub MCP Server Setup

```bash
cd backend/github_mcp_server
pip install -r requirements.txt
```

Add GitHub variables to `backend/.env` or environment:

```ini
GITHUB_TOKEN=ghp_your_token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repo-name
GITHUB_DEFAULT_BRANCH=main
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
MCP_SERVER_PORT=3003
```

Run:

```bash
cd backend/github_mcp_server
python -m github_mcp_server --mode rest
```

---

## Backend API Endpoints

### Health & System

- `GET /health/`
- `GET /api/recordings/health`
- `GET /api/recordings/status`
- `GET /api/recordings/files`
- `GET /api/recordings/scheduler/status`
- `POST /api/recordings/scheduler/trigger`
- `POST /api/recordings/scheduler/start`
- `POST /api/recordings/scheduler/stop`
- `POST /api/recordings/cache/clear`

### File Watcher

- `GET /api/watcher/status`
- `POST /api/watcher/start`
- `POST /api/watcher/stop`

### Meetings and Tasks

- `GET /api/recordings/meetings`
- `GET /api/recordings/meetings/{meeting_id}`
- `GET /api/recordings/tasks`
- `POST /api/recordings/process`
- `DELETE /api/recordings/meetings/{meeting_id}`
- `GET /api/meetings`
- `GET /api/developers/{developer_id}/summary`
- `POST /api/tasks/assign-nl`

### GitHub Commit Tracking

- `GET /api/github/health`
- `GET /api/github/commits`
- `GET /api/github/commits/{sha}`
- `GET /api/github/commits/{sha}/summary`
- `GET /api/github/commits-summary`
- `GET /api/github/progress-report`
- `GET /api/github/contributors`
- `GET /api/github/repo-info`
- `GET /api/github/commit-activity`
- `GET /api/github/pull-requests`
- `GET /api/github/branches`

### Authentication

- `POST /auth/signup`
- `POST /auth/token`
- `GET /auth/me`

### SRS Document Processing

- `POST /srs/upload`
- `GET /srs/status`

---

## Developer Notes

### Authentication

- Uses Pydantic models from `backend/schemas/auth.py`
- Uses JWT token creation in `backend/auth/jwt_handler.py`
- Uses OAuth2 password flow in `backend/auth/oauth2.py`
- Password hashing in `backend/auth/security.py`

### Database

- `backend/db/session.py` creates the database session factory used by both FastAPI and background jobs.
- `backend/db/base.py` defines `Base` for SQLAlchemy models.

### Testing

- Backend tests exist in `backend/tests/`
- Run tests by creating an activated Python environment and executing standard test runners configured for the project.

### Logging

- Logging is configured via `backend/app/logger.py` and uses `LOG_LEVEL` from settings.

---

## How Data Flows

1. A new meeting recording appears in `backend/app/config.py` configured `recordings_dir`.
2. The scheduler or watcher picks up the file in `backend/app/recording_watcher.py`.
3. `backend/app/transcriber.py` transcribes audio/video into text.
4. `backend/app/llm.py` summarizes the transcript and extracts structured tasks.
5. `backend/app/jira_client.py` creates Jira issues for action items.
6. `backend/app/confluence_client.py` creates or updates Confluence meeting notes.
7. `backend/app/db.py` persists the meeting, transcription summary, and task records.
8. The frontend queries the backend and displays status, summaries, and developer dashboards.

---

## Recommended Workflow

1. Configure `backend/.env` with database, LLM, Jira, Confluence, and optional GitHub settings.
2. Start PostgreSQL and ensure the database exists.
3. Run the backend API.
4. Run the frontend dashboard.
5. Place supported recording files in the configured recordings directory.
6. Use the scheduler or watcher APIs to process recordings.
7. Review generated Jira tickets and Confluence pages.
8. Use the dashboard for progress, task assignment, and team insights.

---

## Notes

- The current backend uses an in-memory processed-file cache for recording deduplication. If the service restarts, files may be reprocessed if still present in the directory.
- The LLM integrations require `langchain-groq` and a valid `GROQ_API_KEY`.
- The GitHub MCP features are optional and depend on the `backend/github_mcp_server` package being installed.
- The frontend route mapping is controlled by role conversion logic inside `frontend/src/context/AuthContext.jsx`.

---

## Contact

If you need to extend the application, begin with these entry points:

- `backend/main.py` for API routing and lifecycle
- `backend/app/recording_watcher.py` for pipeline orchestration
- `backend/app/llm.py` for LLM prompts and extraction logic
- `backend/app/jira_client.py` for issue creation
- `frontend/src/App.jsx` for route configuration
- `frontend/src/services/api.js` for backend integration

Enjoy using the Flow Core Workflow Automation System.
