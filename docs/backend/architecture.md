

````markdown
# DataViz AI — Backend Architecture

## 1. Purpose

This document defines the backend architecture, technology choices, folder structure, responsibilities, conventions, and engineering rules for **DataViz AI**.

DataViz AI is an analytics platform that allows users to:

- Upload datasets such as CSV, Excel, and Parquet.
- Connect live/external data sources.
- Automatically profile and understand datasets.
- Query data using natural language.
- Generate tables, KPIs, and visualizations.
- Build interactive dashboards.
- Compare datasets and time periods.
- Perform statistical analysis.
- Detect anomalies and trends.
- Communicate with data through an AI-powered chat interface.
- Eventually combine structured data with unstructured documents using RAG.
- Eventually expose DataViz AI capabilities through MCP.

The backend must prioritize:

1. Correctness
2. Data safety
3. Maintainability
4. Clear separation of responsibilities
5. Deterministic data processing
6. AI reliability
7. Performance
8. Extensibility
9. Simplicity

The backend must **not** be unnecessarily over-engineered.

---

# 2. Core Architectural Principle

The most important architectural principle is:

> **The LLM reasons about the data. The analytical engine calculates the data.**

The LLM must never be treated as the source of truth for numerical results.

For example:

```text
User:
"Which region generated the highest revenue?"

        ↓

AI Agent
        ↓
Understand question
        ↓
Generate analytical operation / SQL
        ↓
Validate operation
        ↓
DuckDB
        ↓
Actual dataset
        ↓
Actual result
        ↓
LLM explains result
        ↓
Frontend renders result
````

The system must never rely on the LLM to calculate large datasets itself.

---

# 3. High-Level Architecture

```text
                              ┌─────────────────────┐
                              │      Next.js        │
                              │      Frontend       │
                              └──────────┬──────────┘
                                         │
                                  HTTPS / SSE
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │       FastAPI       │
                              │        API          │
                              └──────────┬──────────┘
                                         │
              ┌──────────────────────────┼─────────────────────────┐
              │                          │                         │
              ▼                          ▼                         ▼
      ┌───────────────┐          ┌───────────────┐         ┌───────────────┐
      │ Dataset       │          │ AI Agent      │         │ Dashboard     │
      │ Services      │          │ System        │         │ Services      │
      └───────┬───────┘          └───────┬───────┘         └───────┬───────┘
              │                          │                         │
              ▼                          ▼                         │
      ┌───────────────┐          ┌─────────────────┐              │
      │ Ingestion     │          │ Agent Tools     │              │
      │ Profiling     │          │                 │              │
      │ Normalization │          │ Schema          │              │
      │ Conversion    │          │ SQL             │              │
      └───────┬───────┘          │ Statistics      │              │
              │                  │ Comparison      │              │
              ▼                  │ Anomaly         │              │
      ┌───────────────┐          │ Visualization   │              │
      │ Parquet /     │          └───────┬─────────┘              │
      │ Object        │                  │                        │
      │ Storage       │                  ▼                        │
      └───────┬───────┘          ┌───────────────┐                │
              │                  │ DuckDB        │◄───────────────┘
              │                  │ Analytics     │
              │                  │ Engine        │
              │                  └───────┬───────┘
              │                          │
              └──────────────────────────┤
                                         ▼
                                  Actual Data
```

Application metadata is stored separately:

```text
                         ┌─────────────────────┐
                         │    PostgreSQL       │
                         │                     │
                         │ Users               │
                         │ Datasets            │
                         │ Data Sources        │
                         │ Dashboards          │
                         │ Conversations       │
                         │ Jobs                │
                         │ Metadata            │
                         └─────────────────────┘
```

---

# 4. Technology Stack

## Backend API

**FastAPI**

Responsibilities:

* HTTP API
* Authentication/authorization integration
* Request validation
* Response serialization
* Streaming responses
* Dependency injection
* API documentation
* Coordination between services

---

## Primary Application Database

**PostgreSQL**

PostgreSQL stores DataViz AI's application state and metadata.

Examples:

```text
users
organizations
datasets
data_sources
dashboards
dashboard_widgets
conversations
messages
analysis_jobs
```

PostgreSQL should NOT automatically become the storage location for every uploaded dataset.

---

## Analytics Engine

**DuckDB**

DuckDB is the analytical execution engine.

Responsibilities:

* SQL queries
* Filtering
* Aggregation
* Grouping
* Sorting
* Joins
* Time-series analysis
* Analytical queries against Parquet/CSV
* Fast local analytical processing

DuckDB is not the primary application database.

Conceptually:

```text
PostgreSQL
    =
"What exists in DataViz AI?"

DuckDB
    =
"What does the user's data tell us?"
```

---

## Dataset Storage

Use an abstraction around storage.

Development:

```text
Local filesystem
```

Production:

```text
S3-compatible object storage
```

Examples:

* AWS S3
* MinIO
* Cloudflare R2
* Other S3-compatible storage

The application must not tightly couple itself to a particular storage provider.

---

## Analytical File Format

Prefer:

**Parquet**

for normalized analytical datasets.

Typical flow:

```text
CSV / Excel
    ↓
Ingestion
    ↓
Validation
    ↓
Normalization
    ↓
Parquet
    ↓
DuckDB
```

The original uploaded file should be retained separately when required.

---

## AI / LLM

The AI layer must use an abstraction around the LLM provider.

The application should not tightly couple business logic to one LLM vendor.

Potential providers:

* OpenAI
* Google Gemini
* Anthropic
* Other compatible providers

The exact provider can change without rewriting the agent architecture.

---

## Background Processing

Start simple.

For MVP:

```text
FastAPI
    ↓
Background task / worker
```

As workloads increase:

```text
FastAPI
    ↓
Redis / Queue
    ↓
Worker processes
```

Do not introduce distributed infrastructure before it is necessary.

---

# 5. Backend Folder Structure

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   │
│   ├── api/
│   │   ├── router.py
│   │   ├── auth.py
│   │   ├── datasets.py
│   │   ├── data_sources.py
│   │   ├── queries.py
│   │   ├── chat.py
│   │   ├── dashboards.py
│   │   ├── visualizations.py
│   │   └── health.py
│   │
│   ├── core/
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── logging.py
│   │   └── constants.py
│   │
│   ├── db/
│   │   ├── postgres.py
│   │   ├── duckdb.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── dataset.py
│   │   │   ├── data_source.py
│   │   │   ├── dashboard.py
│   │   │   ├── conversation.py
│   │   │   └── job.py
│   │   └── migrations/
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── dataset.py
│   │   ├── data_source.py
│   │   ├── query.py
│   │   ├── chat.py
│   │   ├── dashboard.py
│   │   └── visualization.py
│   │
│   ├── repositories/
│   │   ├── dataset_repository.py
│   │   ├── dashboard_repository.py
│   │   ├── conversation_repository.py
│   │   ├── data_source_repository.py
│   │   └── job_repository.py
│   │
│   ├── services/
│   │   │
│   │   ├── datasets/
│   │   │   ├── ingestion.py
│   │   │   ├── profiler.py
│   │   │   ├── schema_detector.py
│   │   │   ├── semantic_profiler.py
│   │   │   └── format_converter.py
│   │   │
│   │   ├── analytics/
│   │   │   ├── query_service.py
│   │   │   ├── statistics.py
│   │   │   ├── comparison.py
│   │   │   └── anomaly_detection.py
│   │   │
│   │   ├── data_sources/
│   │   │   ├── base.py
│   │   │   ├── csv.py
│   │   │   ├── excel.py
│   │   │   ├── postgres.py
│   │   │   ├── mysql.py
│   │   │   └── rest_api.py
│   │   │
│   │   └── dashboards/
│   │       ├── dashboard_service.py
│   │       └── refresh_service.py
│   │
│   ├── ai/
│   │   ├── agent.py
│   │   ├── context.py
│   │   ├── planner.py
│   │   ├── prompts/
│   │   │   ├── system.txt
│   │   │   ├── sql.txt
│   │   │   └── visualization.txt
│   │   ├── tools/
│   │   │   ├── schema_tool.py
│   │   │   ├── sql_tool.py
│   │   │   ├── statistics_tool.py
│   │   │   ├── comparison_tool.py
│   │   │   ├── anomaly_tool.py
│   │   │   └── visualization_tool.py
│   │   └── providers/
│   │       ├── base.py
│   │       ├── openai.py
│   │       ├── google.py
│   │       └── anthropic.py
│   │
│   ├── analytics_engine/
│   │   ├── duckdb_engine.py
│   │   ├── parquet.py
│   │   ├── sql_validator.py
│   │   └── result_formatter.py
│   │
│   ├── storage/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── object_storage.py
│   │
│   ├── workers/
│   │   ├── ingestion_worker.py
│   │   ├── profiling_worker.py
│   │   └── refresh_worker.py
│   │
│   └── utils/
│       ├── dates.py
│       └── serialization.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── alembic.ini
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 6. Layer Responsibilities

The following separation is mandatory.

## `api/`

HTTP layer only.

Responsibilities:

* Parse HTTP requests
* Validate request schemas
* Authenticate requests
* Call services
* Return HTTP responses

Controllers/routes must not contain:

* SQL queries
* LLM prompts
* DuckDB business logic
* Dataset processing
* Complex business rules

Bad:

```python
@router.post("/query")
def query(request):
    sql = ...
    duckdb.execute(...)
    llm.generate(...)
```

Good:

```python
@router.post("/query")
def query(request):
    return query_service.execute(request)
```

---

# 7. `schemas/`

Pydantic request/response models.

Schemas define API contracts.

Example:

```python
class ChatRequest(BaseModel):
    dataset_id: UUID
    message: str
```

Do not use database ORM models directly as API contracts.

---

# 8. `services/`

Business logic.

Services coordinate application operations.

Examples:

```text
DatasetService
QueryService
DashboardService
DataSourceService
```

Services may call:

* repositories
* analytics engine
* storage
* AI layer
* other domain services

Services should not depend directly on HTTP request objects.

---

# 9. `repositories/`

Database access abstraction.

Repositories handle PostgreSQL persistence.

Example:

```text
DatasetRepository

create()
get_by_id()
update()
delete()
list_for_user()
```

Do not put business logic inside repositories.

Repository:

```text
"How do I retrieve this dataset?"
```

Service:

```text
"What should happen when a dataset is retrieved?"
```

---

# 10. `db/`

Database configuration and ORM models.

PostgreSQL is used for application state.

DuckDB connection management belongs in:

```text
analytics_engine/
```

rather than mixing analytical execution with PostgreSQL ORM code.

---

# 11. Dataset Ingestion

Dataset ingestion must be treated as a pipeline.

```text
                    Upload
                      │
                      ▼
                File validation
                      │
                      ▼
                Format detection
                      │
                      ▼
                     Parse
                      │
                      ▼
                 Data profiling
                      │
                      ▼
               Schema detection
                      │
                      ▼
             Semantic profiling
                      │
                      ▼
              Normalize dataset
                      │
                      ▼
              Convert to Parquet
                      │
                      ▼
              Store dataset
                      │
                      ▼
            Persist metadata
                      │
                      ▼
                 Dataset ready
```

The ingestion pipeline should detect:

* column names
* data types
* null values
* duplicate values
* unique values
* cardinality
* numerical ranges
* date columns
* categorical columns
* potential measures
* potential dimensions
* potential identifiers

---

# 12. Dataset Semantic Metadata

The AI should not receive an entire dataset as context.

Instead, generate semantic metadata.

Example:

```json
{
  "dataset": "sales",
  "row_count": 2000000,
  "columns": [
    {
      "name": "revenue",
      "type": "decimal",
      "semantic_type": "currency",
      "role": "measure",
      "allowed_aggregations": [
        "sum",
        "avg",
        "min",
        "max"
      ]
    },
    {
      "name": "region",
      "type": "string",
      "semantic_type": "category",
      "role": "dimension"
    },
    {
      "name": "order_date",
      "type": "datetime",
      "semantic_type": "date",
      "role": "time_dimension"
    }
  ]
}
```

This metadata is used as AI context.

---

# 13. AI Architecture

The initial AI architecture is a **controlled tool-calling agent**.

Do not initially introduce a complex multi-agent system.

```text
                         User
                           │
                           ▼
                      FastAPI
                           │
                           ▼
                       AI Agent
                           │
                           ▼
                    Context Builder
                           │
                           ▼
                         LLM
                           │
                 Tool selection
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         Schema           SQL          Analysis
          Tool            Tool            Tool
            │              │              │
            │              ▼              ▼
            │           DuckDB          Python
            │
            └──────────────┬──────────────┘
                           ▼
                         Result
                           │
                           ▼
                         LLM
                           │
                           ▼
                    Final Response
```

---

# 14. Agent Responsibilities

The agent is responsible for:

* Understanding user intent
* Inspecting dataset context
* Selecting tools
* Generating SQL when appropriate
* Requesting additional context when necessary
* Interpreting tool results
* Generating a final response
* Generating visualization instructions

The agent is NOT responsible for:

* Direct database access
* Authentication
* Authorization
* Raw file management
* Executing arbitrary code
* Performing large calculations itself

---

# 15. Initial Agent Tools

The first version should contain only a small number of well-defined tools.

## `get_schema`

Returns:

```text
columns
types
semantic roles
relationships
```

---

## `get_profile`

Returns:

```text
statistics
null percentages
distinct values
ranges
sample values
```

---

## `run_sql`

Executes validated analytical SQL against the authorized dataset.

---

## `calculate_statistics`

Used for operations such as:

```text
mean
median
standard deviation
correlation
percentiles
```

---

## `compare_data`

Used for:

```text
year-over-year comparison
period comparison
dataset comparison
category comparison
```

---

## `detect_anomalies`

Used for:

```text
unusual spikes
drops
outliers
unexpected patterns
```

---

## `create_visualization`

Converts analytical results into a structured visualization specification.

---

# 16. Agent Loop

The agent should use a controlled loop.

Conceptually:

```python
while not finished:

    response = llm.generate(
        messages=messages,
        tools=available_tools
    )

    if response.is_tool_call():

        validate_tool_call()

        result = execute_tool()

        messages.append(result)

    else:

        return response
```

Production implementation MUST additionally enforce:

```text
maximum agent steps
maximum execution time
maximum tool calls
maximum returned rows
LLM token limits
query timeouts
authorization checks
```

Recommended initial maximum:

```text
5 agent/tool steps
```

The exact limit can be adjusted based on real workloads.

---

# 17. Simple Query Example

User:

```text
"What is the total revenue in Kerala?"
```

Flow:

```text
User
 ↓
FastAPI
 ↓
Agent
 ↓
LLM
 ↓
run_sql()
 ↓
DuckDB
 ↓
Result
 ↓
LLM
 ↓
Final answer
```

SQL:

```sql
SELECT SUM(revenue) AS total_revenue
FROM dataset
WHERE region = 'Kerala';
```

The LLM does not calculate the result.

DuckDB calculates it.

---

# 18. Complex Query Example

User:

```text
"Show me the monthly revenue trend for Kerala this year and identify any unusual drops."
```

Possible flow:

```text
Agent
 │
 ├── get_schema()
 │
 ├── run_sql()
 │      ↓
 │   monthly revenue
 │
 ├── detect_anomalies()
 │      ↓
 │   unusual months
 │
 └── create_visualization()
        ↓
     line chart
```

The agent decides which tools are necessary.

---

# 19. SQL Safety

LLM-generated SQL must NEVER be executed blindly.

Required flow:

```text
LLM-generated SQL
       ↓
SQL parser
       ↓
Syntax validation
       ↓
Statement validation
       ↓
Dataset authorization
       ↓
Column validation
       ↓
Resource limits
       ↓
DuckDB
```

Only explicitly permitted operations should be allowed.

Initially prefer:

```text
SELECT
WITH
```

Disallow destructive operations such as:

```text
DROP
DELETE
UPDATE
INSERT
ALTER
CREATE
ATTACH
COPY
```

unless there is an explicit and separately secured reason to support them.

The AI must never be able to access another user's dataset.

---

# 20. Query Result Limits

Queries must have controlled result sizes.

Do not return millions of rows to the LLM or frontend.

For example:

```text
Analytical query:
→ aggregation preferred

Raw query:
→ enforce LIMIT

LLM context:
→ aggressively limit rows

Frontend:
→ paginate or summarize
```

The system should prefer:

```sql
GROUP BY
SUM
AVG
COUNT
MIN
MAX
```

over returning raw datasets.

---

# 21. Visualization Architecture

The LLM should not generate arbitrary frontend code.

Bad:

```text
LLM → React code → execute
```

Good:

```text
LLM
 ↓
Visualization specification
 ↓
Backend validation
 ↓
Frontend chart renderer
```

Example:

```json
{
  "type": "line",
  "title": "Monthly Revenue",
  "x_axis": {
    "field": "month"
  },
  "y_axis": {
    "field": "revenue"
  }
}
```

The frontend contains trusted visualization components.

Example:

```text
line
bar
area
pie
scatter
table
kpi
heatmap
```

The AI selects the visualization type and configuration.

The frontend renders it.

---

# 22. Dashboards

A dashboard is a collection of persistent visualization definitions.

Conceptually:

```text
Dashboard
│
├── Widget
│    ├── Query
│    ├── Visualization type
│    └── Configuration
│
├── Widget
│    ├── Query
│    ├── Visualization type
│    └── Configuration
│
└── Widget
     ├── Query
     ├── Visualization type
     └── Configuration
```

Store dashboard definitions in PostgreSQL.

Do not store generated chart images as the primary representation.

---

# 23. Live Dashboards

For live data sources:

```text
External Source
       │
       ▼
Data Source Adapter
       │
       ▼
Analytics Layer
       │
       ▼
DuckDB / source query
       │
       ▼
Dashboard query
       │
       ▼
Visualization data
       │
       ▼
Frontend
```

Depending on the source, DataViz AI may use:

```text
Direct querying
```

or:

```text
Scheduled ingestion
    ↓
Parquet
    ↓
DuckDB
```

The choice depends on:

* data size
* latency requirements
* source capabilities
* rate limits
* freshness requirements
* cost

Do not force one strategy for every source.

---

# 24. Data Source Abstraction

All external sources should follow a common interface.

Conceptually:

```python
class DataSource(ABC):

    def test_connection():
        ...

    def get_schema():
        ...

    def query():
        ...

    def refresh():
        ...
```

Implementations can include:

```text
CSV
Excel
PostgreSQL
MySQL
REST API
Parquet
```

Additional sources can be added later without changing the core analytics architecture.

---

# 25. RAG

RAG is NOT the primary mechanism for structured dataset querying.

For structured data:

```text
Natural language
 ↓
SQL / analytical tool
 ↓
DuckDB
```

For unstructured content:

```text
PDF
Documentation
Reports
Policies
Text
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector database
 ↓
Retrieval
 ↓
LLM
```

RAG becomes useful when DataViz AI needs to answer questions such as:

```text
"Why did revenue decline according to the annual report?"
```

The agent can combine:

```text
SQL Tool
+
RAG Tool
```

Example:

```text
                  Agent
                    │
             ┌──────┴──────┐
             ▼             ▼
          SQL Tool       RAG Tool
             │             │
          DuckDB       Vector DB
             │             │
             └──────┬──────┘
                    ▼
                   LLM
```

---

# 26. MCP

MCP is NOT the foundation of DataViz AI's internal agent architecture.

MCP should initially be treated as an integration/interface layer.

Potential future architecture:

```text
External AI Client
        │
        │ MCP
        ▼
DataViz AI MCP Server
        │
        ├── Query Dataset
        ├── Analyze Dataset
        ├── Get Schema
        ├── Get Dashboard
        └── Generate Visualization
```

The core application must continue to work without MCP.

Do not make internal business logic dependent on MCP.

---

# 27. LLM Provider Abstraction

Do not scatter provider-specific code throughout the application.

Bad:

```python
# random service
openai.chat.completions.create(...)
```

and elsewhere:

```python
google.generativeai...
```

Instead:

```text
ai/providers/
    base.py
    openai.py
    google.py
    anthropic.py
```

Business logic depends on the common interface.

Example:

```python
class LLMProvider(ABC):

    async def generate(...):
        ...

    async def generate_with_tools(...):
        ...
```

This makes model/provider changes easier.

---

# 28. Conversation Architecture

Store conversations in PostgreSQL.

Conceptually:

```text
Conversation
│
├── Message
├── Message
├── ToolCall
├── ToolResult
└── Message
```

Important metadata should include:

```text
dataset_id
user_id
conversation_id
timestamp
model
token usage
tool calls
execution time
```

Tool calls should be logged for debugging and auditing.

---

# 29. Observability

AI systems are difficult to debug without proper logging.

Every AI request should be traceable.

Record:

```text
request ID
user ID
dataset ID
conversation ID
LLM provider
model
agent step
tool called
tool arguments
query execution time
query result size
LLM latency
token usage
errors
```

Never log sensitive raw dataset contents unnecessarily.

---

# 30. Error Handling

Use structured application exceptions.

Examples:

```text
DatasetNotFound
DatasetAccessDenied
InvalidDataset
UnsupportedFormat
QueryValidationError
QueryExecutionError
AgentStepLimitExceeded
LLMProviderError
DataSourceConnectionError
VisualizationGenerationError
```

API responses should expose safe, useful errors.

Internal implementation details must not leak to users.

---

# 31. Authentication and Authorization

Every dataset must belong to an authorized owner/context.

Before any dataset operation:

```text
Authenticate user
      ↓
Identify user
      ↓
Check dataset ownership/access
      ↓
Perform operation
```

Never trust:

```text
dataset_id
```

provided by the client by itself.

The backend must verify access through the database.

This applies to:

* datasets
* dashboards
* conversations
* data sources
* files
* query execution

---

# 32. Background Jobs

Long-running operations should not block HTTP requests.

Examples:

```text
Large file ingestion
Dataset profiling
Format conversion
Large data source synchronization
Dashboard refresh
Anomaly detection
```

Architecture:

```text
FastAPI
   │
   ▼
Create Job
   │
   ▼
Queue
   │
   ▼
Worker
   │
   ├── Execute
   ├── Update progress
   └── Save result
```

For MVP, a lightweight worker mechanism is sufficient.

Introduce Redis-based queues when actual workload requires it.

---

# 33. API Versioning

Use versioned APIs from the beginning.

Example:

```text
/api/v1/datasets
/api/v1/chat
/api/v1/queries
/api/v1/dashboards
/api/v1/data-sources
```

Do not expose unversioned production APIs such as:

```text
/api/chat
```

---

# 34. API Categories

Initial API structure:

```text
/api/v1

/auth
    POST /login
    POST /register

/datasets
    POST /
    GET /
    GET /{dataset_id}
    DELETE /{dataset_id}
    GET /{dataset_id}/schema
    GET /{dataset_id}/profile

/chat
    POST /
    GET /{conversation_id}
    GET /{conversation_id}/messages

/queries
    POST /
    GET /{query_id}

/dashboards
    POST /
    GET /
    GET /{dashboard_id}
    PATCH /{dashboard_id}
    DELETE /{dashboard_id}

/data-sources
    POST /
    GET /
    GET /{source_id}
    DELETE /{source_id}
    POST /{source_id}/test

/visualizations
    POST /
    
/health
    GET /
```

The exact API should evolve with product requirements.

---

# 35. Async vs Sync

Use asynchronous FastAPI endpoints where appropriate.

Good candidates:

```text
HTTP requests
LLM API calls
External API calls
Database operations using async drivers
```

CPU-heavy analytical operations should not blindly be forced into async code.

DuckDB execution, file processing, and CPU-heavy operations should be handled appropriately through workers or controlled execution.

Do not use `async` everywhere simply because FastAPI supports it.

---

# 36. Configuration

All environment-specific configuration belongs in environment variables/configuration.

Example:

```text
DATABASE_URL
DUCKDB_PATH
STORAGE_PROVIDER
STORAGE_BUCKET
STORAGE_PATH
REDIS_URL
LLM_PROVIDER
LLM_MODEL
LLM_API_KEY
MAX_AGENT_STEPS
QUERY_TIMEOUT
MAX_RESULT_ROWS
```

Never hardcode:

```text
API keys
passwords
database credentials
secret tokens
```

Commit:

```text
.env.example
```

Never commit:

```text
.env
```

---

# 37. Testing Strategy

Testing must exist at multiple levels.

## Unit Tests

Test:

```text
SQL validation
Dataset profiling
Schema detection
Statistics
Visualization validation
Agent decision logic
Services
```

---

## Integration Tests

Test:

```text
FastAPI + PostgreSQL
FastAPI + DuckDB
Dataset ingestion
Object storage
AI tools
```

---

## End-to-End Tests

Test complete flows:

```text
Upload dataset
      ↓
Dataset ready
      ↓
Ask question
      ↓
AI generates query
      ↓
DuckDB executes
      ↓
Result returned
      ↓
Visualization rendered
```

---

# 38. Security Rules

The backend must enforce:

### Never

* Execute arbitrary Python generated by an LLM.
* Execute arbitrary SQL without validation.
* Trust dataset IDs without authorization checks.
* Send entire large datasets to the LLM.
* Expose API keys to the frontend.
* Store secrets in source code.
* Allow an LLM to access arbitrary filesystem paths.
* Allow one user to query another user's data.
* Return unlimited query results.

### Always

* Validate input.
* Authorize dataset access.
* Validate SQL.
* Apply query limits.
* Apply agent step limits.
* Apply execution timeouts.
* Log important operations.
* Sanitize errors.
* Keep provider credentials server-side.

---

# 39. Performance Principles

Prefer:

```text
Parquet
DuckDB
Column pruning
Predicate pushdown
Aggregations
Caching where useful
Background jobs
Streaming where appropriate
```

Avoid:

```text
Loading huge datasets entirely into Python memory
Sending huge datasets to LLMs
Repeatedly converting CSV files
Running expensive operations synchronously inside HTTP handlers
```

---

# 40. Caching

Caching may eventually be used for:

```text
Dataset schema
Dataset profile
Repeated queries
Dashboard results
LLM responses where safe
```

However, caching must respect data freshness.

For live data sources, cached results must have explicit freshness semantics.

Do not add a complex caching layer before there is a measurable need.

---

# 41. Data Freshness

Every live dataset should have metadata such as:

```text
last_synced_at
source_updated_at
refresh_interval
refresh_status
```

Dashboards should know whether they display:

```text
real-time data
recently synchronized data
cached data
historical snapshot
```

The UI must not imply real-time freshness when the backend is serving cached data.

---

# 42. AI Reliability Principles

The AI system must follow these rules:

### Never fabricate numerical results.

If the database did not return the value, the AI must not invent it.

### Never hide query errors.

If the generated query fails:

```text
query failure
    ↓
agent receives error
    ↓
agent may correct query
    ↓
retry
```

### Never silently change the user's intent.

If ambiguity materially affects the result, ask for clarification.

Example:

```text
"Show sales last month."
```

If the dataset has multiple date fields:

```text
order_date
payment_date
shipment_date
```

the agent should identify the ambiguity rather than guessing silently.

---

# 43. Agent Retry Policy

The agent may retry failed analytical operations.

Example:

```text
Generate SQL
     ↓
Validation failure
     ↓
LLM receives error
     ↓
Correct SQL
     ↓
Retry
```

But retries must be bounded.

Example:

```text
MAX_QUERY_RETRIES = 2
MAX_AGENT_STEPS = 5
```

Never create an unlimited reasoning loop.

---

# 44. AI Context Management

The LLM context should contain only information required for the current task.

Possible context:

```text
System instructions
+
User question
+
Dataset semantic metadata
+
Relevant schema
+
Previous conversation context
+
Tool results
```

Do not blindly attach:

```text
entire CSV
entire database
entire conversation history
```

Use progressive context retrieval.

---

# 45. Conversation Memory

Conversation history should be used when relevant.

Example:

User:

```text
Show revenue by region.
```

Then:

```text
Now only show Kerala.
```

The system should understand that "only show Kerala" refers to the previous analysis.

However, conversation history must never override dataset authorization or factual database results.

---

# 46. Structured Output

AI-generated internal outputs should use structured schemas wherever possible.

For example:

```python
class VisualizationSpec(BaseModel):
    type: str
    title: str
    x_axis: str | None
    y_axis: str | None
```

Prefer:

```text
structured output
```

over parsing fragile natural-language responses.

---

# 47. Dependency Direction

Dependencies should flow inward.

Preferred:

```text
API
 ↓
Services
 ↓
Repositories / Engines
 ↓
Infrastructure
```

AI should be treated as a service/component, not as the owner of application state.

Avoid circular dependencies.

For example:

```text
services → api
```

is forbidden.

The API layer calls services.

Services should not import route handlers.

---

# 48. Avoid Over-Engineering

Do NOT introduce the following unless there is a concrete requirement:

```text
Microservices
Kubernetes
Kafka
Multiple AI agents
Complex event buses
LangGraph
MCP
Multiple vector databases
Multiple analytical databases
Complex distributed orchestration
```

The initial system should remain:

```text
Next.js
    ↓
FastAPI
    ↓
PostgreSQL
    +
DuckDB
    +
Object Storage
    +
LLM
```

This is enough to build a serious MVP.

---

# 49. Recommended Initial Architecture

The first production-capable version should target:

```text
Frontend
    │
    ▼
FastAPI
    │
    ├─────────────── PostgreSQL
    │
    ├─────────────── Object Storage
    │
    ├─────────────── DuckDB
    │
    └─────────────── AI Agent
                         │
                         ├── Schema Tool
                         ├── SQL Tool
                         ├── Statistics Tool
                         ├── Comparison Tool
                         └── Visualization Tool
```

Do not add RAG or MCP until their use cases actually exist.

---

# 50. Evolution Path

The architecture should evolve gradually.

## Phase 1 — Core Analytics

```text
CSV
Excel
Parquet
   ↓
Ingestion
   ↓
Profiling
   ↓
DuckDB
   ↓
Natural language → SQL
   ↓
Charts
```

---

## Phase 2 — AI Analytics

Add:

```text
Statistics
Anomaly Detection
Comparison
Trend Analysis
AI Insights
```

---

## Phase 3 — Dashboards

Add:

```text
Dashboard Builder
Saved Queries
Widgets
Filters
Scheduled Refresh
```

---

## Phase 4 — Live Data

Add:

```text
PostgreSQL
MySQL
REST APIs
Other external sources
```

---

## Phase 5 — Unstructured Data

Add:

```text
Documents
 ↓
Embeddings
 ↓
Vector DB
 ↓
RAG Tool
```

The agent can then combine:

```text
SQL + RAG + Statistics
```

---

## Phase 6 — MCP

Expose selected DataViz capabilities through MCP:

```text
query_dataset
get_schema
analyze_dataset
get_dashboard
generate_visualization
```

MCP remains an interface layer rather than the core application architecture.

---

# 51. Example Complete Request

User asks:

> "Compare revenue between Kerala and Karnataka over the last six months and show me where the biggest difference occurred."

Backend flow:

```text
                    User
                      │
                      ▼
                   FastAPI
                      │
                      ▼
                  AI Agent
                      │
                      ▼
               Dataset Context
                      │
                      ▼
                    LLM
                      │
                      ▼
                run_sql()
                      │
                      ▼
                 SQL Validator
                      │
                      ▼
                   DuckDB
                      │
                      ▼
                Query Result
                      │
                      ▼
             comparison_tool()
                      │
                      ▼
              Analysis Result
                      │
                      ▼
          create_visualization()
                      │
                      ▼
              Visualization Spec
                      │
                      ▼
                    LLM
                      │
                      ▼
                Final Response
                      │
                      ▼
                  Next.js
```

The LLM is responsible for understanding the question and orchestrating tools.

DuckDB is responsible for calculating the actual numbers.

The backend validates everything in between.

---

# 52. Definition of Done for Backend MVP

The backend MVP is considered complete when it can reliably:

* Accept CSV uploads.
* Accept Excel uploads.
* Store original files.
* Convert supported datasets to Parquet.
* Profile datasets.
* Detect useful semantic metadata.
* Query datasets through DuckDB.
* Generate SQL from natural-language questions.
* Validate generated SQL.
* Execute queries safely.
* Return structured analytical results.
* Generate visualization specifications.
* Support conversational follow-up questions.
* Persist conversations.
* Create and persist dashboards.
* Enforce dataset-level authorization.
* Handle query failures.
* Limit agent loops.
* Log AI/tool activity.
* Run unit and integration tests.
* Expose versioned FastAPI endpoints.

---

# 53. Golden Rules

These rules apply to all backend development.

1. **FastAPI handles HTTP, not business logic.**

2. **PostgreSQL stores application state and metadata.**

3. **DuckDB performs analytical computation.**

4. **Object storage stores large uploaded files.**

5. **Parquet is the preferred analytical storage format.**

6. **The LLM never becomes the source of truth for numerical data.**

7. **AI interacts with data through controlled tools.**

8. **LLM-generated SQL must always be validated.**

9. **Never execute arbitrary LLM-generated Python.**

10. **Every dataset operation requires authorization.**

11. **Never send entire large datasets to the LLM.**

12. **Prefer structured AI outputs over free-form parsing.**

13. **Visualization should be represented as data/configuration, not generated frontend code.**

14. **Agent loops must have hard limits.**

15. **Long-running operations belong in background jobs.**

16. **RAG is for unstructured information, not the primary mechanism for structured analytics.**

17. **MCP is an integration layer, not the foundation of the internal architecture.**

18. **Do not introduce LangGraph or another agent framework until the workflow complexity justifies it.**

19. **Do not introduce microservices until there is a concrete scaling or organizational reason.**

20. **Prefer simple, explicit architecture over abstraction for abstraction's sake.**

21. **Every major component must have a single clear responsibility.**

22. **All external providers must be accessed through replaceable abstractions where provider lock-in would otherwise occur.**

23. **Every production data operation must be observable and traceable.**

24. **Correctness is more important than making the AI appear intelligent.**

25. **The system must fail safely rather than fabricate an answer.**

---

# 54. Target Architecture Summary

The intended backend can ultimately be summarized as:

```text
                         DATA VIZ AI
                              │
                              ▼
                           FastAPI
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
          PostgreSQL       AI Agent        Object Storage
              │               │                │
              │         ┌─────┼─────┐          │
              │         │     │     │          │
              │         ▼     ▼     ▼          │
              │      Schema  SQL  Analysis     │
              │       Tool   Tool   Tools       │
              │               │                │
              │               ▼                │
              │            DuckDB               │
              │               │                │
              └───────────────┼────────────────┘
                              │
                              ▼
                        Actual Results
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Visualization          LLM
                    │                   │
                    └─────────┬─────────┘
                              ▼
                           Frontend
```

The fundamental architecture is therefore:

**FastAPI + PostgreSQL + Object Storage + Parquet + DuckDB + Controlled AI Tool-Calling Agent.**

RAG, MCP, background queues, additional data sources, and more advanced agent orchestration should be added as capabilities on top of this foundation rather than being forced into the initial implementation.

```
```
