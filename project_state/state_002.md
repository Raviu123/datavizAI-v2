# Project State 002: Complete End-to-End System Architecture & Data Flow

## 🌟 Executive Overview
DataViz AI is an end-to-end AI-powered data intelligence platform. It combines **DuckDB vectorized SQL execution**, an **OpenRouter LLM strategy engine**, **PostgreSQL Docker persistent storage**, an **Excel-like data grid with AI scanning animations**, and a **modular frontend chart engine**.

---

## 📁 Key File Responsibilities & Directory Structure

```
datavizai/
├── docker-compose.yml                     # PostgreSQL 16 (:5432) & Redis 7 (:6379) database containers
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── prompts/
│   │   │   │   └── strategy_prompt.py     # Constructs LLM prompt payload with data profiles & frontend capabilities
│   │   │   ├── providers/
│   │   │   │   ├── base.py               # Abstract BaseLLMProvider interface
│   │   │   │   ├── openrouter.py         # OpenRouter API adapter (NVIDIA Nemotron / Claude / Llama)
│   │   │   │   └── factory.py            # Provider factory for swappable LLM adapters
│   │   ├── analytics_engine/
│   │   │   ├── profiler.py               # Column data-type inference & statistical summary profiler
│   │   │   └── duckdb_engine.py          # Executes live analytical SQL queries on files via embedded DuckDB
│   │   ├── api/
│   │   │   └── datasets.py               # Endpoints for file upload, grid pagination, profiling & AI analysis
│   │   └── config.py                     # Pydantic v2 application settings (.env config loader)
│   └── storage/
│       ├── datasets/                     # Raw uploaded files (.csv, .xlsx, .parquet, .json)
│       └── datasets_meta.json            # Persistent dataset metadata & cached AI visual strategies
└── frontend/
    ├── app/
    │   └── datasets/
    │       ├── page.tsx                  # File upload drag-and-drop & dataset list view
    │       └── [datasetId]/page.tsx      # Interactive detail page with grid, scanner, auto-tab switch & charts
    ├── components/
    │   ├── data-grid/
    │   │   ├── DataGrid.tsx              # Tabular viewer with column data-type badges & pagination
    │   │   └── AiScannerOverlay.tsx      # Animated laser sweep beam & glowing column pulse highlights
    │   └── charts/
    │       ├── registry.ts               # Frontend Chart Registry layer defining supported capabilities
    │       ├── ChartEngine.tsx           # Universal chart router selecting component for strategy JSON
    │       ├── BarChartComponent.tsx     # Grouped & stacked bar charts
    │       ├── LineChartComponent.tsx    # Smooth multi-series trend line charts
    │       ├── AreaChartComponent.tsx    # Area chart with gradient shading
    │       ├── PieDonutChartComponent.tsx# Pie & Donut share charts
    │       ├── ScatterPlotComponent.tsx  # Correlation scatter plots
    │       ├── RadarChartComponent.tsx   # Polar radar charts
    │       ├── ComposedChartComponent.tsx# Dual-axis Bar + Line hybrid charts
    │       └── KpiCardComponent.tsx      # Executive metric summary cards
    └── lib/
        └── api-client.ts                 # Axios API client connecting frontend to FastAPI backend
```

---

## 🔄 Complete Step-by-Step Data Processing & Chart Generation Flow

### Step 1: File Ingestion & Profiling
1. User uploads a data file (`.csv`, `.xlsx`, `.parquet`, `.json`) on `/datasets`.
2. Backend API (`POST /api/v1/datasets/upload` in `datasets.py`) saves the raw file on disk at `storage/datasets/{id}.{ext}`.
3. `DataProfiler` (`backend/app/analytics_engine/profiler.py`) inspects column values and infers semantic data types:
   - `# Integer` / `# Float` / `# Numeric`
   - `📅 Datetime`
   - `🏷️ Categorical`
   - `✓ Boolean`
   - `🔤 Text`
4. Calculates statistical metrics (min, max, mean, std, null count, unique values, top 5 sample values).
5. Dataset record and profile metadata are written to persistent storage `storage/datasets_meta.json`.

---

### Step 2: Interactive Data Grid View & AI Scanning Overlay
1. User opens `/datasets/{datasetId}`.
2. `DataGrid.tsx` displays tabular cell data with search filtering, column data-type badges, and pagination.
3. When AI profiling or analysis is active, `AiScannerOverlay.tsx` overlays an animated cyan laser sweep beam across column headers and glowing pulse badges showing active AI reasoning steps.

---

### Step 3: Frontend Capability Handshake
1. `registry.ts` registers all supported chart capabilities on the frontend (`bar`, `line`, `area`, `pie`, `donut`, `scatter`, `radar`, `composed`, `kpi`).
2. When the user clicks **Generate AI Visualizations**, `api-client.ts` sends `supported_capabilities` in the payload to `POST /api/v1/datasets/{id}/analyze`.

---

### Step 4: OpenRouter LLM Visual Strategy Generation
1. `OpenRouterAdapter` (`backend/app/ai/providers/openrouter.py`) constructs a prompt via `strategy_prompt.py` containing:
   - Dataset column profiles & statistical distributions
   - First 10 sample rows
   - Frontend chart registry capabilities
2. OpenRouter model (`nvidia/nemotron-3-ultra-550b-a55b:free` or configured provider) analyzes data relationships and generates 4 to 6 visualization strategies containing:
   - `title` & `description`
   - `chart_type` (e.g. "bar", "line", "donut", "composed", "kpi")
   - `config`: `{ "xAxisKey": "col_a", "yAxisKeys": ["col_b"], "aggregation": "SUM", "colorPalette": [...] }`

---

### Step 5: DuckDB Vectorized SQL Data Execution Engine
1. For each visual strategy returned by OpenRouter (or strategy fallback), `DuckDBEngine` (`backend/app/analytics_engine/duckdb_engine.py`) generates and executes a live analytical SQL query directly against the stored file on disk:
   ```sql
   SELECT "region" AS region, SUM("mrr") AS mrr 
   FROM dataset 
   WHERE "region" IS NOT NULL AND "mrr" IS NOT NULL 
   GROUP BY "region" 
   ORDER BY mrr DESC 
   LIMIT 15;
   ```
2. DuckDB calculates exact numerical aggregations and attaches the resulting data array directly to the strategy object.
3. Backend saves the complete analysis to `storage/datasets_meta.json`.

---

### Step 6: UX Auto-Tab Navigation & Chart Rendering
1. During analysis, `[datasetId]/page.tsx` displays animated lazy-loading skeleton cards.
2. Once the backend response returns, the view automatically switches to the **AI Generated Visualizations** tab.
3. `ChartEngine.tsx` dynamically routes each strategy object to its modular chart component (`BarChartComponent`, `LineChartComponent`, `AreaChartComponent`, etc.), rendering responsive Recharts visualizations with custom tooltips and legends.

---

## 💾 Where Data Is Stored
| Data Type | Storage Location | Responsible Module |
|---|---|---|
| **Raw Upload Files** | `./storage/datasets/{id}.{ext}` | `backend/app/api/datasets.py` |
| **Dataset Metadata & AI Analysis** | `./storage/datasets_meta.json` | `backend/app/api/datasets.py` |
| **Relational Transactional DB** | PostgreSQL 16 Container (`:5432`) | `docker-compose.yml` / SQLAlchemy |
| **Analytical Query Processing** | DuckDB In-Memory Engine | `backend/app/analytics_engine/duckdb_engine.py` |
