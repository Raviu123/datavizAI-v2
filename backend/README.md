# DataViz AI - Backend

AI-powered data intelligence and visualization platform backend built with FastAPI.

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Docs

Once running, visit:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- Health: http://localhost:8000/api/v1/health

## Tech Stack

- **FastAPI** - HTTP API framework
- **DuckDB** - Analytical query engine
- **SQLAlchemy + SQLite/PostgreSQL** - Application metadata
- **Pydantic** - Data validation
- **Pandas / Parquet** - Data processing
