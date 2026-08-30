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
| App Database | SQLite (dev) → PostgreSQL (prod) |
| Storage | Local (dev) → S3-compatible (prod) |

## Architecture

See `docs/` for full architecture documentation:
- `docs/backend/architecture.md` - Backend design
- `docs/ui/fronetend_architecture.md` - Frontend design
- `docs/ui/design_doc.md` - UI/UX design guidelines
- `docs/context/product_context.md` - Product vision
