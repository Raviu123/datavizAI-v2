# DataViz AI — Frontend Architecture

## 1. Purpose

This document defines the frontend architecture, folder structure, technology choices, coding conventions, state-management rules, data-fetching patterns, component boundaries, and implementation standards for **DataViz AI**.

This document is an engineering contract for both human developers and AI coding agents.

Any new frontend code must follow the architecture defined here unless there is a documented and justified reason to deviate.

The objective is to build a frontend that is:

* Production-grade
* Maintainable
* Type-safe
* Performant
* Accessible
* Testable
* Responsive
* Easy for AI coding agents to understand
* Easy for developers to extend
* Appropriately engineered for the current product stage

The architecture must avoid both:

**Under-engineering**

* giant components
* duplicated logic
* untyped API responses
* random folders
* API calls directly inside UI components
* global state used for everything

and:

**Over-engineering**

* unnecessary abstractions
* excessive design patterns
* premature micro-frontends
* excessive dependency injection
* dozens of layers for simple features
* generic abstractions without real reuse

---

# 2. Product Context

DataViz AI is an AI-powered data intelligence workspace.

The frontend will eventually support:

* Dataset upload
* Dataset browsing
* Dataset preview
* Data profiling
* Data cleaning workflows
* Live data connections
* Data-source management
* Visualization generation
* Visualization configuration
* Dashboard creation
* Dashboard editing
* Dashboard viewing
* Data comparison
* Analytics
* AI-powered data questions
* AI-generated insights
* Reports
* Monitoring
* Authentication
* User/workspace management
* Settings

The core workflow is:

```text
Data Source
    ↓
Dataset
    ↓
Data Understanding
    ↓
Analysis
    ↓
Visualization
    ↓
Dashboard
    ↓
AI Interaction
    ↓
Insight / Communication
```

The frontend architecture must reflect these domain boundaries.

---

# 3. Core Architectural Principle

Use:

> **Next.js App Router + feature-oriented architecture + shared UI primitives + explicit server/client state separation.**

Do NOT organize the entire application around technical categories such as:

```text
components/
hooks/
services/
utils/
pages/
```

with every feature scattered across them.

Instead, organize product-specific code around **features/domains**.

For example:

```text
features/
├── datasets/
├── data-sources/
├── dashboards/
├── visualizations/
├── ai-chat/
└── analysis/
```

A developer or AI agent working on datasets should be able to find most dataset-related code inside `features/datasets`.

---

# 4. Technology Stack

## Core

* Next.js
* React
* TypeScript
* Tailwind CSS

Next.js App Router is the default routing architecture.

Next.js uses filesystem-based routing and supports nested layouts and route colocation. Use these capabilities rather than building a custom routing architecture.

---

## UI

Use:

* Tailwind CSS
* shadcn/ui
* Radix-based primitives where provided by shadcn/ui
* Lucide icons or the project's established icon library

Do not create a custom design system from scratch unless the existing UI requirements genuinely require it.

shadcn/ui components should be treated as starting primitives that can be adapted to DataViz AI's visual language.

---

## Server State

Use:

**TanStack Query**

for:

* API queries
* API mutations
* caching
* background refetching
* invalidation
* synchronization
* server-state lifecycle

TanStack Query is specifically designed to handle asynchronous server state, including caching, synchronization, background updates, retries, and stale data.

Do NOT use Zustand/Redux/local React state to duplicate server data.

---

## Client State

Use local React state by default.

Use a client-state library such as Zustand only for genuinely shared client-side state.

Examples:

```text
UI state
- sidebar open/closed
- selected workspace panel
- active visualization
- dashboard editing mode
- temporary builder state
- user preferences

```

Do NOT store:

```text
datasets
dashboards
users
data sources
API responses
server entities
```

in Zustand merely because multiple components need them.

Those belong to server-state management.

TanStack Query's own documentation makes this distinction explicit: server state and client state are different concerns, and most applications need relatively little global client state after server state is moved to a dedicated query/cache layer.

---

# 5. Recommended Folder Structure

The frontend should approximately follow:

```text
frontend/
│
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/
│   │   ├── layout.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── datasets/
│   │   │   ├── page.tsx
│   │   │   └── [datasetId]/
│   │   │       ├── page.tsx
│   │   │       ├── analysis/
│   │   │       │   └── page.tsx
│   │   │       └── preview/
│   │   │           └── page.tsx
│   │   │
│   │   ├── dashboards/
│   │   │   ├── page.tsx
│   │   │   └── [dashboardId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── data-sources/
│   │   │   ├── page.tsx
│   │   │   └── [sourceId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── explore/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   └── ...
│   │
│   ├── providers.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── ...
│   │
│   └── shared/
│       ├── empty-state.tsx
│       ├── error-state.tsx
│       ├── loading-state.tsx
│       ├── page-header.tsx
│       └── ...
│
├── features/
│   ├── datasets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── types.ts
│   │   └── utils/
│   │
│   ├── data-sources/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   └── types.ts
│   │
│   ├── dashboards/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── types.ts
│   │   └── utils/
│   │
│   ├── visualizations/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── charts/
│   │   ├── types.ts
│   │   └── utils/
│   │
│   ├── ai-chat/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types.ts
│   │   └── utils/
│   │
│   └── analysis/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── schemas/
│       ├── types.ts
│       └── utils/
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── errors.ts
│   │   └── types.ts
│   │
│   ├── query/
│   │   ├── client.ts
│   │   └── keys.ts
│   │
│   ├── auth/
│   │   └── ...
│   │
│   ├── env/
│   │   └── ...
│   │
│   ├── formatting/
│   │   ├── numbers.ts
│   │   ├── dates.ts
│   │   └── bytes.ts
│   │
│   └── utils/
│       ├── cn.ts
│       └── ...
│
├── hooks/
│   └── ...
│
├── types/
│   ├── api.ts
│   ├── common.ts
│   └── ...
│
├── config/
│   ├── site.ts
│   ├── navigation.ts
│   └── environment.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── e2e/
│   ├── auth/
│   ├── datasets/
│   ├── dashboards/
│   └── ai-chat/
│
├── .env.example
├── eslint.config.*
├── next.config.*
├── package.json
├── tsconfig.json
├── tailwind.config.*
└── README.md
```

This structure is a starting architecture, not a requirement to create every directory immediately.

**Do not create empty folders just to satisfy the diagram.**

Create directories when the feature requires them.

---

# 6. `app/` Responsibilities

The `app/` directory owns:

* routes
* layouts
* loading states
* error boundaries
* route-level metadata
* route composition
* route-specific server components

It should NOT become the primary home for business logic.

A page should generally compose feature components rather than contain hundreds of lines of business logic.

Example:

```tsx
export default function DatasetPage() {
  return (
    <DatasetPageView />
  )
}
```

The actual implementation belongs inside:

```text
features/datasets/
```

when it is feature-specific.

---

# 7. Route Structure

Use route groups to organize application areas without changing URLs.

Example:

```text
app/
├── (marketing)/
├── (auth)/
└── (app)/
```

This allows different layouts for different areas while keeping URLs clean.

Use dynamic segments for entity IDs:

```text
datasets/[datasetId]
dashboards/[dashboardId]
data-sources/[sourceId]
```

Do not manually implement routing logic when Next.js filesystem routing already provides the required behavior.

---

# 8. Server Components vs Client Components

Default to:

**Server Components.**

Use Client Components only when the component actually requires browser-side behavior.

Client Components are appropriate for:

* event handlers
* interactive forms
* local state
* browser APIs
* drag/drop
* charts requiring browser APIs
* dashboard editing
* interactive visualization
* AI streaming UI
* WebSocket/SSE interactions

Do NOT add:

```tsx
'use client'
```

to every component.

Keep the client boundary as small as practical.

---

# 9. Feature Architecture

Each major domain should be isolated inside `features/`.

Example:

```text
features/datasets/
├── api/
├── components/
├── hooks/
├── schemas/
├── types.ts
└── utils/
```

A feature owns its domain-specific implementation.

For example:

```text
features/datasets/components/dataset-table.tsx
features/datasets/components/dataset-upload.tsx
features/datasets/components/dataset-profile.tsx
features/datasets/hooks/use-dataset.ts
features/datasets/api/get-dataset.ts
features/datasets/api/upload-dataset.ts
features/datasets/types.ts
```

---

# 10. Feature Components

Feature components are components whose meaning is specific to a product domain.

Examples:

```text
DatasetUpload
DatasetProfile
DatasetTable
DashboardGrid
DashboardWidget
VisualizationBuilder
ChartConfigurator
AIChatPanel
InsightCard
DataSourceConnectionForm
```

These belong inside the relevant feature.

Do not put them into:

```text
components/ui/
```

unless they are truly generic.

---

# 11. Shared Components

`components/` should contain only components that are genuinely shared across multiple features.

## `components/ui`

Low-level reusable primitives:

```text
Button
Dialog
Input
Select
Popover
Tooltip
Tabs
Table
Badge
DropdownMenu
```

These should not contain business logic.

---

## `components/shared`

Cross-feature components:

```text
PageHeader
EmptyState
ErrorState
LoadingState
ConfirmDialog
SearchInput
DateRangePicker
```

These may contain limited reusable application behavior but should not belong to a specific domain.

---

# 12. Rule: Do Not Create "God Components"

Avoid components such as:

```text
Dashboard.tsx
```

containing:

* API requests
* state management
* chart configuration
* filters
* table rendering
* dialogs
* AI interaction
* business logic

Instead decompose by responsibility.

Example:

```text
DashboardPage
├── DashboardHeader
├── DashboardFilters
├── DashboardGrid
│   ├── DashboardWidget
│   ├── DashboardWidget
│   └── DashboardWidget
└── AIInsightsPanel
```

---

# 13. API Architecture

All API communication must have a defined boundary.

Do NOT scatter:

```tsx
fetch(...)
```

throughout UI components.

Preferred structure:

```text
features/
└── datasets/
    └── api/
        ├── get-dataset.ts
        ├── get-datasets.ts
        ├── upload-dataset.ts
        └── delete-dataset.ts
```

Example:

```text
Component
   ↓
Feature Hook
   ↓
TanStack Query
   ↓
Feature API Function
   ↓
Shared API Client
   ↓
Backend
```

---

# 14. Shared API Client

Create one shared API client responsible for:

* base URL
* headers
* authentication
* JSON parsing
* error normalization
* common request behavior

Example:

```text
lib/api/client.ts
```

Do not create a new HTTP client for every feature.

Feature API functions should use the shared client.

---

# 15. API Functions

API functions should be small and focused.

Example:

```text
getDataset(id)
uploadDataset(file)
deleteDataset(id)
updateDataset(id, payload)
```

They should not render UI.

They should not manipulate React state.

They should not know about components.

---

# 16. TanStack Query

Use TanStack Query for:

* GET requests
* server entities
* mutations
* caching
* invalidation
* background refresh
* polling
* optimistic updates where justified

Example conceptual flow:

```text
useDataset()
      ↓
useQuery()
      ↓
getDataset()
      ↓
apiClient()
      ↓
Backend
```

For live data, use:

* polling
* invalidation
* WebSocket/SSE integration

depending on backend capabilities.

Do not manually implement caching unless TanStack Query cannot satisfy the requirement.

---

# 17. Query Keys

Centralize query-key conventions.

Example:

```text
lib/query/keys.ts
```

Use predictable hierarchical keys:

```text
datasets
datasets.list
datasets.detail(id)
dashboards
dashboards.detail(id)
dataSources
dataSources.detail(id)
```

Never use random query-key strings throughout components.

---

# 18. Server State Rules

Server state includes:

* datasets
* dashboards
* users
* data sources
* visualization definitions persisted on backend
* analysis results
* reports
* AI conversations persisted on backend

These belong in TanStack Query.

Do not duplicate them into global client state.

---

# 19. Client State Rules

Client state includes:

* sidebar state
* modal state
* active tabs
* selected chart
* temporary builder state
* drag/drop state
* unsaved dashboard layout
* local UI preferences

Use:

1. local `useState`
2. URL state
3. Zustand

in that order.

Only promote state when there is a real need.

---

# 20. URL State

Use URL query parameters for state that should be:

* shareable
* bookmarkable
* browser-navigation aware

Examples:

```text
/datasets/123?tab=analysis
/datasets/123?search=revenue
/dashboard/123?dateRange=30d
```

Do not store shareable filter state exclusively in React state.

---

# 21. Forms

Use:

* React Hook Form
* Zod

for complex forms and validation.

Use local React state for simple forms where React Hook Form adds no meaningful value.

Validation should exist at the appropriate boundaries.

Client validation improves UX.

Backend validation remains authoritative.

---

# 22. Schemas

Use Zod schemas for external/untrusted data where runtime validation provides value.

Examples:

* API responses where necessary
* form input
* URL parameters
* imported configuration
* external data-source configuration

Do not create schemas for every trivial internal object simply to increase code volume.

---

# 23. TypeScript Rules

TypeScript must run in strict mode.

Avoid:

```typescript
any
```

unless there is a documented reason.

Prefer:

```typescript
unknown
```

when receiving untrusted data.

Do not use type assertions to silence errors without understanding the underlying type problem.

Bad:

```typescript
const data = response as Dataset
```

when the response has not actually been validated.

---

# 24. Types Location

Feature-specific types belong inside the feature:

```text
features/datasets/types.ts
features/dashboards/types.ts
features/visualizations/types.ts
```

Truly global types belong in:

```text
types/
```

Do not create one enormous:

```text
types/index.ts
```

containing every type in the application.

---

# 25. Business Logic

Business logic should not live inside JSX.

Bad:

```tsx
<div>
  {rows
    .filter(...)
    .map(...)
    .sort(...)
}
```

for complex domain logic.

Prefer:

```text
features/datasets/utils/
features/analysis/utils/
```

or dedicated hooks when the logic depends on React state.

Keep presentation components focused on rendering.

---

# 26. Utilities

`lib/utils` should contain genuinely generic utilities.

Examples:

```text
cn()
formatDate()
formatBytes()
formatCurrency()
```

Do not put dataset-specific logic inside generic utilities.

Bad:

```text
lib/utils/calculateDatasetRevenue.ts
```

Better:

```text
features/analysis/utils/calculate-revenue.ts
```

---

# 27. Configuration

Application configuration belongs in:

```text
config/
```

Examples:

```text
config/site.ts
config/navigation.ts
config/environment.ts
```

Do not hardcode navigation definitions repeatedly across components.

---

# 28. Environment Variables

Use:

```text
.env.local
.env.example
```

Never commit secrets.

Only variables explicitly intended for browser exposure may use the appropriate public environment-variable convention.

Never expose:

* API secrets
* database credentials
* private tokens
* service-account credentials

to client-side code.

---

# 29. Data Visualization Architecture

Visualization is a first-class feature.

Use:

```text
features/visualizations/
├── api/
├── charts/
├── components/
├── hooks/
├── schemas/
├── types.ts
└── utils/
```

Separate:

**chart rendering**

from:

**chart configuration**

from:

**data transformation**

from:

**API retrieval**

Example:

```text
Backend Data
     ↓
Data Transformation
     ↓
Visualization Configuration
     ↓
Chart Component
```

A chart component should not be responsible for fetching arbitrary backend data.

---

# 30. Chart Components

Charts should receive structured props.

Example conceptual API:

```tsx
<LineChart
  data={data}
  xKey="date"
  series={[
    { key: "revenue", label: "Revenue" }
  ]}
/>
```

Avoid making every chart independently understand backend response formats.

Normalize data before rendering where appropriate.

---

# 31. Dashboard Architecture

Dashboards are a composition layer.

A dashboard should contain:

```text
Dashboard
├── metadata
├── filters
├── layout
└── widgets
```

Widgets should reference visualization configurations rather than duplicate chart logic.

Conceptually:

```text
Dashboard
   ↓
Widget
   ↓
Visualization Definition
   ↓
Chart Renderer
```

This allows the same visualization to potentially appear in multiple contexts.

---

# 32. Dashboard Builder State

Dashboard editing can contain significant client state.

Do not immediately persist every drag operation.

Use local client state for:

* position
* size
* selected widget
* editing mode

Persist changes through explicit mutations or controlled autosave.

Do not create a global state architecture until dashboard editing actually requires it.

---

# 33. AI Chat Architecture

AI chat belongs to:

```text
features/ai-chat/
```

Suggested structure:

```text
features/ai-chat/
├── api/
│   ├── send-message.ts
│   └── get-conversation.ts
│
├── components/
│   ├── chat-panel.tsx
│   ├── message-list.tsx
│   ├── message.tsx
│   ├── chat-input.tsx
│   └── generated-chart.tsx
│
├── hooks/
│   └── use-chat.ts
│
├── types.ts
└── utils/
```

The AI chat must understand the current data context.

The UI should support structured responses such as:

```text
Answer
↓
Evidence
↓
Visualization
↓
Suggested follow-up
```

Do not treat AI output as arbitrary text only.

---

# 34. AI Streaming

If the backend supports streaming:

* use streaming APIs
* show incremental responses
* handle cancellation
* handle connection failures
* preserve completed content
* avoid duplicating messages

Do not block the entire interface while the AI generates a response.

---

# 35. Data Source Architecture

Data sources should be represented as a feature:

```text
features/data-sources/
```

Eventually this may support:

```text
CSV
Excel
JSON
REST API
PostgreSQL
MySQL
Google Sheets
Webhooks
Streaming sources
```

Each connector should follow a common conceptual interface without forcing all implementations into premature abstraction.

Start with the connectors actually required.

---

# 36. Live Data

Live data requires explicit freshness handling.

The UI should be capable of displaying:

* last updated
* source status
* refresh state
* stale state
* connection error

Example:

```text
Updated 18 seconds ago
● Live
```

Do not pretend data is real-time when it is actually polling.

---

# 37. Loading / Error / Empty States

Every data-driven feature must consider:

```text
Loading
Success
Empty
Error
Refreshing
Stale
```

Do not design only the successful state.

---

# 38. Accessibility

Accessibility is a requirement, not an optional enhancement.

Ensure:

* semantic HTML
* keyboard navigation
* visible focus
* accessible labels
* correct heading hierarchy
* sufficient contrast
* accessible dialogs
* accessible form errors
* non-color-only status communication

Interactive components must be keyboard usable.

---

# 39. Responsive Architecture

Design from the beginning for:

```text
Desktop
Tablet
Mobile
```

Do not build desktop-only layouts and attempt to repair them later.

For complex data interfaces:

* prioritize important information
* collapse secondary controls
* use responsive panels
* allow horizontal scrolling for wide tables
* simplify dashboard layouts on smaller screens

---

# 40. Performance

Performance must be considered from the beginning.

Important areas:

### Large datasets

Use:

* pagination
* virtualization
* server-side filtering
* server-side sorting

where appropriate.

Do not render 100,000 table rows in the browser.

### Charts

Avoid unnecessarily rendering every visualization simultaneously.

Use lazy loading where appropriate.

### Code

Avoid:

* unnecessary client components
* unnecessary global state
* repeated API calls
* expensive calculations during every render
* unnecessary dependencies

---

# 41. Testing Strategy

Use multiple testing levels.

## Unit tests

Use for:

* utility functions
* data transformations
* validation
* chart configuration logic
* business rules

## Integration tests

Use for:

* feature interactions
* API integration
* forms
* complex components

## E2E tests

Use for critical user workflows:

```text
Login
Upload dataset
Inspect dataset
Generate visualization
Create dashboard
Ask AI question
Connect data source
```

Do not attempt to achieve arbitrary 100% test coverage.

Prioritize important behavior.

---

# 42. Test Organization

Keep tests close to the relevant feature where practical.

Example:

```text
features/
└── datasets/
    ├── components/
    │   └── dataset-table.tsx
    └── components/
        └── dataset-table.test.tsx
```

Use:

```text
tests/
```

for cross-feature integration tests and shared fixtures.

Use:

```text
e2e/
```

for browser-level workflows.

---

# 43. Naming Conventions

Use:

### Files

```text
kebab-case
```

Examples:

```text
dataset-table.tsx
data-source-card.tsx
use-dataset.ts
```

### React Components

```text
PascalCase
```

Examples:

```text
DatasetTable
DataSourceCard
DashboardGrid
```

### Hooks

```text
useSomething
```

Example:

```text
useDataset
useDashboard
useChat
```

### Functions

Use:

```text
camelCase
```

### Types

Use:

```text
PascalCase
```

---

# 44. Imports

Prefer configured path aliases.

Example:

```typescript
import { Button } from "@/components/ui/button"
import { DatasetTable } from "@/features/datasets/components/dataset-table"
```

Avoid excessive relative imports such as:

```typescript
../../../../components/...
```

Do not use aliases to hide poor architecture.

---

# 45. Dependency Rules

Before adding a dependency, ask:

1. Does the project already have something that solves this?
2. Is the dependency actively maintained?
3. Is it appropriate for production?
4. Is the functionality important enough to justify the dependency?
5. Does it create unnecessary bundle size?
6. Does it conflict with the current architecture?

Do not install libraries for trivial functionality.

---

# 46. State Management Decision Tree

When adding state, follow this order:

### Question 1

Is it derived directly from props/data?

→ Don't store it.

### Question 2

Is it local to one component?

→ `useState` / `useReducer`.

### Question 3

Is it server data?

→ TanStack Query.

### Question 4

Should it be reflected in the URL?

→ URL search params/path params.

### Question 5

Is it shared client-only state across unrelated components?

→ Consider Zustand.

Do not jump directly to global state.

---

# 47. Component Decision Tree

When creating a component:

### Is it a route?

→ `app/`

### Is it a generic UI primitive?

→ `components/ui/`

### Is it shared across multiple features?

→ `components/shared/`

### Is it specific to datasets?

→ `features/datasets/`

### Is it specific to dashboards?

→ `features/dashboards/`

### Is it specific to visualizations?

→ `features/visualizations/`

### Is it specific to AI?

→ `features/ai-chat/`

This rule should be followed consistently.

---

# 48. Avoid Circular Dependencies

Feature boundaries should remain clear.

Avoid:

```text
datasets → dashboards → datasets
```

If two features require shared functionality, move only the genuinely shared abstraction into an appropriate shared location.

Do not create a massive `shared/` dumping ground.

---

# 49. Feature Dependency Rule

Prefer:

```text
app
 ↓
features
 ↓
shared/lib
```

Avoid:

```text
shared
 ↓
features
 ↓
shared
```

Generic infrastructure must not depend on product-specific features.

For example:

```text
components/ui/button.tsx
```

must not import:

```text
features/datasets/...
```

---

# 50. Architecture Boundaries

The following boundaries should remain explicit:

```text
UI
 ↓
Feature
 ↓
API / Query
 ↓
Backend
```

Avoid:

```text
UI
 ↓
random fetch
 ↓
random utility
 ↓
global state
 ↓
another API
```

The architecture should make the data flow understandable.

---

# 51. AI Agent Rules

AI coding agents MUST:

1. Inspect the existing code before creating new files.
2. Reuse existing components when appropriate.
3. Search for existing utilities before creating new utilities.
4. Search for existing API functions before creating new API functions.
5. Follow the feature ownership rules.
6. Avoid creating duplicate components.
7. Avoid unnecessary abstractions.
8. Avoid unnecessary dependencies.
9. Keep TypeScript strict.
10. Preserve existing behavior unless the task requires changing it.
11. Run lint/typecheck/tests after meaningful changes.
12. Check the rendered UI for frontend tasks when browser tooling is available.
13. Consider loading, error, empty, and responsive states.
14. Avoid turning Server Components into Client Components without a reason.
15. Keep API calls outside presentation components.
16. Keep business logic outside JSX.
17. Update existing architecture rather than creating parallel architectures.

---

# 52. AI Agent — Before Creating a File

Before creating a new file, ask:

```text
Does this already exist?
        ↓
Can an existing component/function be reused?
        ↓
Does this belong to a feature?
        ↓
Is it genuinely shared?
        ↓
Does it belong in lib?
        ↓
Is a new abstraction actually justified?
```

If an existing file can reasonably be extended, prefer extending it over creating another similar file.

---

# 53. AI Agent — Before Adding a Dependency

The agent must inspect:

```text
package.json
```

and determine whether an existing dependency already solves the problem.

Do not install:

* duplicate UI libraries
* duplicate chart libraries
* duplicate HTTP clients
* duplicate state managers
* duplicate form libraries
* duplicate date libraries

without explicit justification.

---

# 54. AI Agent — Before Refactoring

Do not perform broad architectural refactors when implementing an unrelated feature.

For example:

If asked to add:

```text
dataset filtering
```

do not simultaneously:

* rewrite state management
* replace the chart library
* restructure all folders
* replace the API client
* introduce a new design system

unless the existing architecture genuinely prevents the feature from being implemented correctly.

Keep changes focused.

---

# 55. AI Agent — Do Not Over-Engineer

Do not create:

```text
repository/
service/
factory/
adapter/
strategy/
manager/
provider/
controller/
```

layers for a simple frontend feature unless they solve a real problem.

The architecture should grow with actual complexity.

---

# 56. AI Agent — Do Not Under-Engineer

Do not put everything into:

```text
page.tsx
```

or:

```text
components.tsx
```

or:

```text
utils.ts
```

when the feature has meaningful complexity.

Split responsibilities when they become independently understandable or reusable.

---

# 57. Documentation

Document non-obvious architectural decisions.

Do not write comments explaining obvious code.

Good comment:

```text
// Dashboard layout changes remain local until the user saves.
// This prevents a network mutation for every drag operation.
```

Bad comment:

```text
// This function gets the dataset.
```

---

# 58. Error Handling

Normalize API errors centrally.

The UI should receive meaningful error information.

Never expose:

* stack traces
* internal server implementation
* database errors
* secrets
* raw infrastructure errors

to end users.

Log technical information appropriately while showing concise user-facing messages.

---

# 59. Security

Frontend code must assume that:

* client input is untrusted
* API responses may be malformed
* authorization must be enforced by the backend
* frontend route protection is not sufficient security

Never rely on frontend checks for authorization.

Do not place secrets in client bundles.

Do not trust IDs or permissions supplied by the client.

---

# 60. Data Handling

DataViz AI will potentially process sensitive business datasets.

Therefore:

* avoid logging raw datasets
* avoid logging full API responses
* avoid exposing dataset contents unnecessarily
* avoid storing sensitive data in browser storage unless explicitly required
* minimize data sent to the client
* use server-side processing for large datasets where appropriate

---

# 61. Accessibility + Data Visualization

Charts must not be the only way to communicate important information.

Where appropriate, provide:

* textual summaries
* accessible labels
* tables
* metric values
* meaningful legends

A user should not be unable to understand an important insight simply because they cannot visually interpret a chart.

---

# 62. Production Readiness Checklist

Before considering a feature complete:

### Architecture

* [ ] Correct feature folder
* [ ] No duplicate component
* [ ] No unnecessary abstraction
* [ ] Clear data flow
* [ ] Correct server/client boundary

### TypeScript

* [ ] No unexplained `any`
* [ ] No unsafe assertions
* [ ] API types defined
* [ ] Strict type checking passes

### API

* [ ] API calls isolated
* [ ] TanStack Query used for server state
* [ ] Errors handled
* [ ] Loading states handled
* [ ] Cache invalidation handled where needed

### UI

* [ ] Responsive
* [ ] Accessible
* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Hover/focus states
* [ ] Consistent design system

### Performance

* [ ] No unnecessary rendering
* [ ] Large datasets handled appropriately
* [ ] Heavy components lazy-loaded when justified
* [ ] No unnecessary dependencies

### Testing

* [ ] Important logic tested
* [ ] Critical workflows tested
* [ ] E2E coverage added for important user journeys

### Quality

* [ ] Lint passes
* [ ] Typecheck passes
* [ ] Tests pass
* [ ] Production build succeeds
* [ ] Browser UI inspected when applicable

---

# 63. Golden Rule

The architecture exists to make DataViz AI easier to build and maintain.

It is not a goal in itself.

When choosing between:

```text
more architecture
```

and:

```text
simpler architecture
```

choose the simplest architecture that correctly handles the current problem while leaving a clean path for future growth.

The frontend should be:

**structured enough to scale, simple enough to understand, and disciplined enough that both humans and AI agents can safely modify it.**

---

# 64. Final Architecture Summary

The intended architecture is:

```text
                    NEXT.JS APP
                         │
                 ┌───────┴────────┐
                 │                │
               Routes          Providers
                 │
          ┌──────┴──────┐
          │             │
       Features      Shared UI
          │             │
    ┌─────┼─────┐       │
    │     │     │       │
 Datasets Dashboards AI Chat
    │       │      │
    └───────┼──────┘
            │
       TanStack Query
            │
        API Client
            │
         Backend
```

And the state model is:

```text
                 APPLICATION STATE
                        │
        ┌───────────────┼────────────────┐
        │               │                │
     Server           Client            URL
      State            State            State
        │               │                │
 TanStack Query    React/Zustand    Search Params
        │               │                │
        └───────────────┼────────────────┘
                        │
                       UI
```

The most important architectural principle is:

> **Features own product behavior. Shared components own reusable UI. TanStack Query owns server state. React/Zustand owns client state. The App Router owns routing and page composition.**

This should remain the default architecture unless the application develops a concrete requirement that justifies changing it.
