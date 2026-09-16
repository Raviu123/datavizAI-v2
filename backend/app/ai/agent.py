import json
import re
from typing import Dict, Any, Optional, List
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.ai.agent")

AGENT_SYSTEM_PROMPT = """
You are an expert Data Analyst & Autonomous Analytics Agent.
Your goal is to parse user questions about a dataset and output accurate DuckDB SQL queries.

Schema & Context:
- Table Name: `dataset`
- Exact Column Names, Types, and Profiles are provided in the prompt.
- Always use double quotes around column names in SQL (e.g. `SELECT DISTINCT "Product_Category" FROM dataset`).

Query Generation Guidelines:

1. **Listing & Distinct Value Inquiries** (e.g. "which are all the products available?", "list products", "show all sales reps", "what categories exist"):
   - Find the matching column (e.g., `Product_Category`, `Product_ID`, `Sales_Rep`, `Region`).
   - Generate: `SELECT DISTINCT "Column_Name" FROM dataset WHERE "Column_Name" IS NOT NULL ORDER BY 1 LIMIT 50`.
   - Set `"intent": "sql_query"`.

2. **Trend & Time-Series Queries** (e.g., "sales trend", "monthly revenue", "over time"):
   - Use date truncation or strftime: `SELECT STRFTIME(TRY_CAST("Date" AS DATE), '%Y-%m') AS "Month", SUM("Sales_Amount") AS "Total_Sales" FROM dataset WHERE "Date" IS NOT NULL GROUP BY 1 ORDER BY 1`.
   - Set `"wants_chart": true` and `"chart_type": "line"`.

3. **Quarterly & Filtered Queries** (e.g., "sales of electronics in 2nd quarter", "Q3 sales"):
   - Filter by Quarter and Category: `SELECT SUM("Sales_Amount") AS "Total_Sales" FROM dataset WHERE EXTRACT(QUARTER FROM TRY_CAST("Date" AS DATE)) = 2 AND "Product_Category" = 'Electronics'`.

4. **Comparative & Top N Queries** (e.g., "top 5 products by revenue", "sales by region"):
   - Use `GROUP BY` and `ORDER BY ... DESC LIMIT N`.
   - Set `"wants_chart": true` and `"chart_type": "bar"`.

5. **Pure Metadata Overview** (ONLY if prompt explicitly asks "describe dataset metadata" or "what dataset is this" without asking for items, products, metrics, or rows):
   - Set `"intent": "overview"` and `"sql": null`.

Return ONLY a valid raw JSON object:
{
  "intent": "sql_query" | "overview",
  "sql": "SELECT ... FROM dataset ...",
  "explanation": "Brief explanation of query strategy...",
  "wants_chart": boolean,
  "chart_type": "line" | "bar" | "pie" | "scatter"
}
"""

ANSWER_SYNTHESIS_PROMPT = """
You are an expert Data Analyst. Synthesize a direct, executive-level natural language answer for the user's question based strictly on the executed query results.

User Question: "{user_message}"
Executed SQL Query: {sql_query}
QueryResult Data (JSON):
{query_data}

Instructions:
1. State exact items, numerical totals, key trends, peak periods, or top categories clearly.
2. If query returned a list of distinct items/products/names, present them cleanly as a bulleted or comma-separated list.
3. Keep the answer professional, concise, and formatted with clean markdown.
"""

OVERVIEW_SYNTHESIS_PROMPT = """
You are an expert Data Analyst. Synthesize a dataset metadata overview.

Dataset Name: {dataset_name}
Total Rows: {total_rows:,}
Total Columns: {total_columns}
Categorical Dimensions: {cat_cols}
Numeric Metrics: {num_cols}

Sample Rows:
{sample_rows}

User Question: "{user_message}"

Instructions:
1. Summarize what this dataset represents, key metrics, and key dimensions.
2. Suggest 2-3 specific analytical questions the user can ask next (e.g., "What is the sales trend over time?", "Top 5 products by revenue").
"""

class DataAnalystAgent:
    """
    PandasAI-inspired Agentic Data Analyst Engine supporting tool calls, 
    resilient SQL execution with auto-correction, temporal aggregations, distinct value listing, and smart visualization selection.
    """

    def __init__(self, provider_name: Optional[str] = None):
        self.provider = LLMProviderFactory.get_provider(provider_name)

    async def process_query(self, dataset_record: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        d_name = dataset_record.get("name", "dataset")
        profile = dataset_record.get("profile", {})
        file_path = dataset_record.get("file_path")
        sample_rows = dataset_record.get("preview_rows", [])[:5]

        cols = profile.get("columns", [])
        col_names = [c["name"] for c in cols]
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]
        date_cols = [c["name"] for c in cols if c.get("inferred_type") in ["datetime", "date"]]

        msg_lower = user_message.lower()

        logger.info(f"[Agentic Analyst] Processing question: '{user_message}' on dataset '{d_name}'")

        # Intent classification heuristics
        listing_keywords = [
            "list", "show", "get", "find", "display", "all", "which", "available", 
            "avaibalbe", "product", "products", "item", "items", "category", "categories", 
            "rep", "reps", "names", "values", "what products", "what categories", "who are"
        ]
        has_listing_intent = any(k in msg_lower for k in listing_keywords)

        metric_keywords = [
            "sale", "sales", "revenue", "profit", "cost", "trend", "q1", "q2", "q3", "q4", 
            "month", "quarter", "year", "growth", "top", "highest", "lowest", "sum", "average", 
            "avg", "total", "count", "compare", "region"
        ]
        has_metric_keywords = any(k in msg_lower for k in metric_keywords)

        is_pure_overview = (
            any(k in msg_lower for k in ["describe dataset", "overview of dataset", "what dataset is this", "dataset structure"])
            and not (has_metric_keywords or has_listing_intent)
        )

        if is_pure_overview:
            logger.info("[Agentic Analyst] Routing to pure dataset metadata overview synthesis.")
            return await self._synthesize_overview_response(d_name, profile, sample_rows, cat_cols, num_cols, user_message)

        # Build schema context for LLM SQL compilation
        prompt = f"""
Dataset Name: {d_name}
Total Rows: {profile.get('total_rows', 0)}
Total Columns: {profile.get('total_columns', 0)}

Columns & Inferred Types:
{json.dumps(cols, indent=2)}

Detected Date Columns: {date_cols}
Detected Metric Columns: {num_cols}
Detected Categorical Columns: {cat_cols}

Sample Rows (First 5):
{json.dumps(sample_rows, indent=2)}

User Question: "{user_message}"
"""

        sql_query = None
        chart_data = None
        chart_type = "bar"
        wants_chart = False
        ai_reply_text = ""

        try:
            # LLM SQL Compilation
            logger.info("[Agentic Analyst] Compiling DuckDB SQL strategy...")
            sql_payload = await self.provider.analyze_json(prompt=prompt, system_prompt=AGENT_SYSTEM_PROMPT)
            sql_query = sql_payload.get("sql")
            wants_chart = sql_payload.get("wants_chart", False)
            chart_type = sql_payload.get("chart_type", "bar")

            # Fallback heuristic for listing queries if LLM omitted SQL
            if not sql_query and has_listing_intent:
                target_col = next((c for c in col_names if any(k in c.lower() for k in ["product", "item", "category", "rep", "name", "region"])), cat_cols[0] if cat_cols else col_names[0])
                if target_col:
                    sql_query = f'SELECT DISTINCT "{target_col}" FROM dataset WHERE "{target_col}" IS NOT NULL ORDER BY 1 LIMIT 50'

            # Fallback heuristic for trend/time queries if LLM omitted SQL
            elif not sql_query and any(k in msg_lower for k in ["trend", "month", "quarter", "q1", "q2", "q3", "q4", "over time", "year"]):
                d_col = date_cols[0] if date_cols else next((c for c in col_names if "date" in c.lower() or "time" in c.lower()), col_names[0] if col_names else "")
                m_col = num_cols[0] if num_cols else col_names[1] if len(col_names) > 1 else col_names[0]
                if d_col and m_col:
                    sql_query = f'SELECT STRFTIME(TRY_CAST("{d_col}" AS DATE), \'%Y-%m\') as "Period", SUM("{m_col}") as "{m_col}" FROM dataset WHERE "{d_col}" IS NOT NULL GROUP BY 1 ORDER BY 1'
                    chart_type = "line"
                    wants_chart = True

            # Step 4: Multi-Pass DuckDB Query Execution with Auto-Correction
            if sql_query and file_path:
                logger.info(f"[Agentic Analyst] Executing SQL: {sql_query}")
                try:
                    chart_data = DuckDBEngine.query_file(file_path, sql_query)
                except Exception as sql_err:
                    logger.warning(f"[Agentic Analyst Auto-Correct] Initial SQL error ({sql_err}). Attempting auto-correction query...")
                    corrected_sql = self._auto_correct_sql(sql_query, cols, msg_lower)
                    sql_query = corrected_sql
                    chart_data = DuckDBEngine.query_file(file_path, corrected_sql)

            # Step 5: Synthesize Answer from Query Results
            if chart_data and len(chart_data) > 0:
                logger.info(f"[Agentic Analyst] Query returned {len(chart_data)} rows. Synthesizing natural language answer...")
                synth_prompt = ANSWER_SYNTHESIS_PROMPT.format(
                    user_message=user_message,
                    sql_query=sql_query,
                    query_data=json.dumps(chart_data[:25], indent=2)
                )
                try:
                    ai_reply_text = await self.provider.generate(prompt=synth_prompt, temperature=0.1)
                except Exception:
                    ai_reply_text = f"Retrieved {len(chart_data)} analytical records for query '{user_message}'."
            else:
                logger.info("[Agentic Analyst] No data returned from SQL query. Generating metadata overview.")
                return await self._synthesize_overview_response(d_name, profile, sample_rows, cat_cols, num_cols, user_message)

            # Step 6: Smart Visualization Attachment
            visualization = None
            if (wants_chart or len(chart_data) >= 2) and chart_data:
                first_row = chart_data[0]
                keys = list(first_row.keys())
                x_key = keys[0]
                y_key = keys[1] if len(keys) > 1 else keys[0]

                # Determine chart type: line for dates/months, bar for categories
                if any(k in msg_lower for k in ["trend", "month", "over time", "yearly", "quarter", "timeline"]) or "month" in x_key.lower() or "date" in x_key.lower() or "period" in x_key.lower():
                    chart_type = "line"

                visualization = {
                    "chart_type": chart_type,
                    "title": f"Analytics: {user_message[:45]}",
                    "config": {
                        "xAxisKey": x_key,
                        "yAxisKeys": [y_key],
                        "colorPalette": ["#6366f1", "#10b981", "#f59e0b", "#ec4899"]
                    },
                    "data": chart_data
                }

            return {
                "message": ai_reply_text,
                "sql": sql_query,
                "chart_data": chart_data,
                "visualization": visualization
            }

        except Exception as outer_err:
            logger.error(f"❌ [Agentic Analyst Pipeline Error] {type(outer_err).__name__}: {outer_err}")
            return await self._synthesize_overview_response(d_name, profile, sample_rows, cat_cols, num_cols, user_message)

    async def _synthesize_overview_response(
        self, 
        d_name: str, 
        profile: Dict[str, Any], 
        sample_rows: List[Dict[str, Any]], 
        cat_cols: List[str], 
        num_cols: List[str], 
        user_message: str
    ) -> Dict[str, Any]:
        overview_prompt = OVERVIEW_SYNTHESIS_PROMPT.format(
            dataset_name=d_name,
            total_rows=profile.get('total_rows', 0),
            total_columns=profile.get('total_columns', 0),
            cat_cols=', '.join(cat_cols) if cat_cols else 'None',
            num_cols=', '.join(num_cols) if num_cols else 'None',
            sample_rows=json.dumps(sample_rows, indent=2),
            user_message=user_message
        )
        try:
            ai_reply_text = await self.provider.generate(prompt=overview_prompt, temperature=0.2)
        except Exception:
            ai_reply_text = (
                f"Dataset **{d_name}** contains **{profile.get('total_rows', 0):,} rows** and **{profile.get('total_columns', 0)} columns**.\n\n"
                f"• **Dimensions**: {', '.join(cat_cols[:5]) if cat_cols else 'N/A'}\n"
                f"• **Metrics**: {', '.join(num_cols[:5]) if num_cols else 'N/A'}"
            )
        return {
            "message": ai_reply_text,
            "sql": None,
            "chart_data": None,
            "visualization": None
        }

    def _auto_correct_sql(self, original_sql: str, cols: List[Dict[str, Any]], msg_lower: str) -> str:
        """Constructs a robust DuckDB fallback query if initial LLM SQL failed."""
        col_names = [c["name"] for c in cols]
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]
        date_cols = [c["name"] for c in cols if c.get("inferred_type") in ["datetime", "date"]]

        if any(k in msg_lower for k in ["trend", "month", "quarter", "over time"]) and (date_cols or col_names):
            d_col = date_cols[0] if date_cols else col_names[0]
            m_col = num_cols[0] if num_cols else (col_names[1] if len(col_names) > 1 else col_names[0])
            return f'SELECT "{d_col}" AS "Period", SUM("{m_col}") AS "{m_col}" FROM dataset WHERE "{d_col}" IS NOT NULL GROUP BY 1 ORDER BY 1 LIMIT 20'

        cat = cat_cols[0] if cat_cols else col_names[0]
        num = num_cols[0] if num_cols else (col_names[1] if len(col_names) > 1 else col_names[0])
        return f'SELECT "{cat}", SUM("{num}") AS "{num}" FROM dataset GROUP BY "{cat}" ORDER BY "{num}" DESC LIMIT 10'
