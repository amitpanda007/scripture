# Scripture — Ancient Wisdom PWA

A modern Progressive Web App for listening to and reading ancient scriptures like the Bhagavad Gita and Ramayana. Features synchronized text highlighting with sequential audio playback.

## Architecture

```
scripture_cursor/
├── backend/             # FastAPI + SQLAlchemy (async)
│   ├── app/
│   │   ├── main.py      # FastAPI app entry, CORS, static files
│   │   ├── models.py    # SQLAlchemy ORM models
│   │   ├── schemas.py   # Pydantic response models
│   │   ├── database.py  # Async engine & session
│   │   └── routes/
│   │       └── scriptures.py  # REST endpoints with pagination
│   ├── seed.py          # Database population script
│   ├── audio/           # Pre-generated TTS audio files
│   └── requirements.txt
└── frontend/            # Vite + React + TypeScript
    ├── src/
    │   ├── components/  # VerseCard, AudioPlayerBar, etc.
    │   ├── hooks/       # useApi, useScriptures, useAudioPlayer
    │   ├── pages/       # Home, Scripture, Chapter views
    │   └── types/       # TypeScript interfaces
    └── vite.config.ts   # Tailwind + PWA config
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8002
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
npm run dev
```

Open **http://localhost:5200** in your browser.

### Docker Compose (Frontend + Backend)

```bash
docker compose up --build
```

- Frontend: **http://localhost:5200**
- Backend API: **http://localhost:8002**

To stop:

```bash
docker compose down
```

If you need to re-seed the database inside the backend container:

```bash
docker compose exec backend python seed.py
```

## Audio Strategy

The app serves pre-generated TTS audio files rather than generating on the fly. Place `.mp3` files in `backend/audio/gita/1/` following the naming convention:

- `{verse_number}_verse.mp3` — Sanskrit verse audio
- `{verse_number}_meaning.mp3` — Hindi meaning audio

The playback engine plays the verse audio first, then seamlessly transitions to the meaning audio, highlighting the corresponding text in real time.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scriptures/` | List all scriptures |
| GET | `/api/scriptures/{slug}` | Scripture detail with chapters |
| GET | `/api/scriptures/{slug}/chapters` | List chapters |
| GET | `/api/scriptures/{slug}/chapters/{n}` | Chapter detail with verses |
| GET | `/api/scriptures/{slug}/chapters/{n}/verses?page=1&per_page=20` | Paginated verses |
| GET | `/api/scriptures/{slug}/chapters/{n}/verses/{v}` | Single verse |

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), aiosqlite, Pydantic v2
- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS v4
- **PWA**: vite-plugin-pwa with Workbox (CacheFirst for audio, NetworkFirst for API)
- **Audio**: HTML5 Audio API with sequential playback and `onEnded` chaining
