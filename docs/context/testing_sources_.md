1. Weather — probably the best first live-data source

Use Open-Meteo. It provides continuously updated weather data through an API and exposes variables such as temperature, humidity, precipitation, wind, pressure, radiation, etc. It also supports hourly data and multiple locations.

For example, your DataViz AI could connect to:

Weather API → Calicut/Kochi/Bangalore/Delhi → fetch every 5 minutes → store → dashboard updates

Then the user could ask:

"Show temperature over the last 24 hours."
"Compare rainfall between Kerala cities."
"Which city had the highest temperature this week?"
"Show the relationship between humidity and temperature."
"Create a weather monitoring dashboard."

This is almost perfect for testing your live-source → dashboard → chat-with-data concept.

2. Indian Government data — very useful for demonstrating serious datasets

The Open Government Data (OGD) Platform India is especially interesting for your project. It provides datasets and APIs covering areas such as economy, education, environment, health, labour, population, rainfall, etc. The portal currently lists hundreds of thousands of resources and a large number of APIs/web services.

Explore data.gov.in

You could build things like:

"India Economic Dashboard"

Government API
      ↓
DataViz AI
      ↓
Automatic data understanding
      ↓
Charts + KPIs + trends
      ↓
AI questions

Then:

"Compare Kerala's rainfall with Tamil Nadu over the last 10 years."

"Which states have experienced the largest population growth?"

"Create a dashboard showing India's education statistics."

That demonstrates that your system isn't limited to toy datasets.

3. IMD — particularly good for an India-focused live-data demo

The India Meteorological Department (IMD) now has an official API management platform for real-time weather observations, forecasts, warnings, and other meteorological data.

IMD API Management

This could eventually give DataViz AI a very convincing demo:

"Connect live weather source" → select IMD → choose locations → DataViz AI automatically builds a monitoring dashboard.

4. API Setu

Another interesting source for your longer-term connector architecture is India's API Setu, which provides a platform for discovering, consuming, publishing, and managing APIs from government and other organizations.

API Setu

This is useful because your eventual product shouldn't think in terms of:

"Upload CSV."

It should think:

"Connect a data source."

CSV/Excel is just one connector.

But I would build your testing around 5 categories

Don't test DataViz AI with only weather.

Data source	What it tests
CSV/Excel	Basic upload + analysis
Weather API	Live time-series
Government API	Large/real-world datasets
Financial/market API	Rapidly changing numerical data
Your own database/API	Real enterprise use case

And then test progressively harder scenarios.

Level 1 — Static
sales.xlsx
       ↓
DataViz AI
       ↓
Clean → Understand → Visualize → Chat

Questions:

"What are my top 10 products?"

"Compare sales by region."

"Why did revenue decrease?"

Level 2 — Live API
Weather API
      ↓
DataViz AI
      ↓
Every 5 minutes
      ↓
Database
      ↓
Dashboard updates

Now you can test whether your system actually handles changing data, not just visualization.

Level 3 — Multiple live sources

This is where the idea starts becoming much more interesting.

For example:

Weather API ───────┐
                   │
Sales API ─────────┤
                   ├──→ DataViz AI
Inventory DB ──────┤
                   │
Excel ─────────────┘

Then the AI can potentially answer cross-source questions.

For example:

"Did bad weather correlate with lower store sales?"

That's substantially more interesting than:

"Make me a bar chart."

One thing I would change in your architecture

Don't make "live dashboard" a separate feature bolted onto the visualization engine.

Make Data Source a first-class concept.

Something like:

                    DATA VIZ AI
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Upload         Connect         Stream
          │              │              │
     CSV / Excel      REST API       WebSocket
     JSON / PDF       Database       Events
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                  Data Understanding
                         ↓
                Semantic Data Model
                         ↓
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
     Visualization    AI Chat       Analytics
          ↓              ↓              ↓
       Dashboard      Answers       Insights

That gives you a much cleaner product foundation.

And for your first actual live-data implementation, I'd use Open-Meteo because you can get meaningful continuously updated time-series data without dealing with complicated authentication, while the API exposes enough variables to stress-test your ingestion, chart selection, aggregation, filtering, comparison, and natural-language querying.