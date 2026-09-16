# DataViz AI

AI-powered data intelligence and visualization platform.

## Project Structure

```
datavizai/
├── backend/        - FastAPI backend (Python)
├── frontend/       - Next.js frontend (TypeScript)
└── docs/           - Architecture and design docs
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000/api/v1
Docs: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Backend | FastAPI (Python) |
| Analytics Engine | DuckDB |
| Data Processing | Pandas, PyArrow |
| File Formats | Parquet, CSV, Excel, JSON |
| App Database | PostgreSQL (Primary DB via Docker Compose) |
| Caching & Tasks | Redis (In-Memory Data Store) |
| Analytics Engine | DuckDB (OLAP Query Engine for Dataframes & Parquet) |
| Storage | Local (dev) → S3-compatible (prod) |

## Database Setup & Management

This project uses **PostgreSQL** as the primary relational database, **Redis** for caching/tasks, and **DuckDB** as an embedded analytical engine for query processing.

### 1. PostgreSQL & Redis (via Docker Compose)

The primary database and cache services run as Docker containers defined in [`docker-compose.yml`](file:///C:/Users/Ravinarayana%20U/projects/datavizai/docker-compose.yml).

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

#### Start Database Services
To start PostgreSQL and Redis in detached mode:
```bash
docker compose up -d
```

#### Stop Database Services
```bash
docker compose down
```

#### Check Status & Logs
```bash
docker compose ps
docker compose logs -f postgres
```

#### Connection Details
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `datavizai`
- **User / Password**: `postgres` / `postgres`
- **Async Connection String**: `postgresql+asyncpg://postgres:postgres@localhost:5432/datavizai`

### 2. DuckDB (Embedded Analytics Engine)
- **DuckDB** is an embedded in-process SQL database engine used by the FastAPI backend to process tabular datasets (CSV, Parquet, JSON, Excel) at high speed without needing a separate service or container to start.

## Architecture

See `docs/` for full architecture documentation:
- `docs/backend/architecture.md` - Backend design
- `docs/ui/fronetend_architecture.md` - Frontend design
- `docs/ui/design_doc.md` - UI/UX design guidelines
- `docs/context/product_context.md` - Product vision
