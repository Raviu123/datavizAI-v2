import json
import uuid
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.api.datasets import DATASETS_DB
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory

router = APIRouter()

class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    sql: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None

CHAT_SYSTEM_PROMPT = """
You are an expert Data Scientist and NL-to-SQL Analytics Assistant.
Your task is to convert the user's natural language question into an accurate DuckDB SQL query against the table `dataset`.

Schema & Data Context:
- Table name: `dataset`
- Column profiles, data types, and sample rows are provided below.
- You must use exact column names from the schema.
- For positional queries (e.g. 3rd highest, 2nd lowest), use appropriate ORDER BY and LIMIT / OFFSET or ROW_NUMBER().
- For listing queries (e.g. "all sales rep names", "list regions"), use SELECT DISTINCT "col_name" FROM dataset ORDER BY 1.
- For aggregations (e.g. total sales per region, average price), use GROUP BY and aggregate functions.

Return ONLY a valid JSON object matching this schema:
{
  "sql": "SELECT ... FROM dataset ...",
  "explanation": "Brief explanation of what this query calculates...",
  "wants_chart": boolean (true ONLY if user asked for visual chart/plot/graph or if query returns multi-category breakdown)
}
"""

ANSWER_SYNTHESIS_PROMPT = """
You are an expert Data Analyst. Synthesize a clear, direct, and concise natural language answer for the user's question based strictly on the executed SQL query results provided.

User Question: "{user_message}"
Executed SQL Query: {sql_query}
QueryResult Data (JSON):
{query_data}

Instructions:
1. Provide a direct, professional, natural language answer addressing the question directly (e.g. name the exact item, value, or list).
2. If query returned a list of items, format them nicely as a bulleted or comma-separated list.
3. Do not mention technical DuckDB internals unless relevant. Keep it clean and executive-ready.
"""

@router.post("", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    General NL-to-SQL Retrieval Pipeline:
    1. LLM analyzes dataset schema & prompt to output DuckDB SQL query.
    2. DuckDB Engine executes SQL against dataset file to fetch real data rows.
    3. LLM synthesizes natural language answer from real data results.
    4. Optional visualization attached if user requested a chart or query represents a distribution.
    """
    dataset_id = request.dataset_id
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    profile = d.get("profile", {})
    file_path = d.get("file_path")
    sample_rows = d.get("preview_rows", [])[:5]

    prompt = f"""
Dataset Name: {d['name']}
Total Rows: {profile.get('total_rows', 0)}
Total Columns: {profile.get('total_columns', 0)}

Column Profiles:
{json.dumps(profile.get('columns', []), indent=2)}

Sample Data (First 5 rows):
{json.dumps(sample_rows, indent=2)}

User Question: "{request.message}"
"""

    provider = LLMProviderFactory.get_provider()
    conv_id = request.conversation_id or str(uuid.uuid4())

    sql_query = None
    chart_data = None
    visualization = None
    ai_reply_text = ""

    try:
        # Step 1: Generate SQL Query via LLM
        sql_payload = await provider.analyze_json(prompt=prompt, system_prompt=CHAT_SYSTEM_PROMPT)
        sql_query = sql_payload.get("sql")
        wants_chart = sql_payload.get("wants_chart", False)

        # Step 2: Execute SQL Query using DuckDB Engine
        if sql_query and file_path:
            try:
                chart_data = DuckDBEngine.query_file(file_path, sql_query)
            except Exception as sql_err:
                print(f"DuckDB execution error ({sql_err}), attempting fallback query.")
                # Basic safety fallback if LLM generated invalid syntax
                cols = profile.get("columns", [])
                cat = next((c["name"] for c in cols if c.get("inferred_type") == "categorical"), cols[0]["name"] if cols else "")
                num = next((c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]), "")
                if num and cat:
                    sql_query = f'SELECT "{cat}", SUM("{num}") as "{num}" FROM dataset GROUP BY "{cat}" ORDER BY "{num}" DESC LIMIT 10'
                else:
                    sql_query = f'SELECT * FROM dataset LIMIT 10'
                chart_data = DuckDBEngine.query_file(file_path, sql_query)

        # Step 3: Synthesize Natural Language Answer from actual Query Results
        if chart_data is not None:
            synth_prompt = ANSWER_SYNTHESIS_PROMPT.format(
                user_message=request.message,
                sql_query=sql_query,
                query_data=json.dumps(chart_data[:20], indent=2)
            )
            try:
                ai_reply_text = await provider.generate(prompt=synth_prompt, temperature=0.1)
            except Exception:
                # Direct string formatting fallback if LLM answer synthesis times out
                if len(chart_data) == 1:
                    row_str = ", ".join([f"**{k}**: {v}" for k, v in chart_data[0].items()])
                    ai_reply_text = f"Query Result for '{request.message}':\n\n{row_str}"
                else:
                    ai_reply_text = f"Retrieved {len(chart_data)} results for '{request.message}'."
        else:
            ai_reply_text = f"Could not retrieve data for question: '{request.message}'."

        # Step 4: Conditional Visualization Attachment
        msg_lower = request.message.lower()
        user_explicitly_asked_chart = any(w in msg_lower for w in ["chart", "plot", "graph", "visualize", "bar", "line", "pie", "trend", "distribution"])

        if (wants_chart or user_explicitly_asked_chart) and chart_data and len(chart_data) >= 2:
            first_row = chart_data[0]
            keys = list(first_row.keys())
            x_key = keys[0]
            y_key = keys[1] if len(keys) > 1 else keys[0]

            visualization = {
                "chart_type": "bar",
                "title": f"Result: {request.message[:40]}",
                "config": {
                    "xAxisKey": x_key,
                    "yAxisKeys": [y_key],
                    "colorPalette": ["#6366f1", "#10b981", "#f59e0b", "#ec4899"]
                },
                "data": chart_data
            }

    except Exception as outer_err:
        print(f"Chat pipeline error: {outer_err}")
        cols = profile.get("columns", [])
        col_names = [c["name"] for c in cols]
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]

        msg_lower = request.message.lower()

        # Handle overview questions like "what is the data about?"
        if any(w in msg_lower for w in ["what", "about", "describe", "summary", "overview", "columns", "structure"]):
            ai_reply_text = (
                f"Dataset **{d['name']}** contains **{profile.get('total_rows', 0):,} rows** and **{profile.get('total_columns', 0)} columns**.\n\n"
                f"• **Key Categorical Dimensions**: {', '.join(cat_cols[:5]) if cat_cols else 'N/A'}\n"
                f"• **Numeric Metrics**: {', '.join(num_cols[:5]) if num_cols else 'N/A'}\n\n"
                f"You can ask specific questions like *'Which {cat_cols[0] if cat_cols else 'category'} has highest {num_cols[0] if num_cols else 'sales'}?'* or *'List all {cat_cols[0] if cat_cols else 'items'}'*."
            )
        else:
            # Fallback dynamic DuckDB query execution when OpenRouter API Key is unauthenticated
            matched_cat = next((c for c in cat_cols if c.lower() in msg_lower), cat_cols[0] if cat_cols else None)
            matched_num = next((c for c in num_cols if c.lower() in msg_lower), num_cols[0] if num_cols else None)

            if matched_cat and matched_num and file_path:
                x_key, y_key = matched_cat, matched_num
                sql_query = f'SELECT "{x_key}", SUM("{y_key}") as "{y_key}" FROM dataset WHERE "{x_key}" IS NOT NULL GROUP BY "{x_key}" ORDER BY "{y_key}" DESC LIMIT 10'
                try:
                    chart_data = DuckDBEngine.query_file(file_path, sql_query)
                    top_row = chart_data[0] if chart_data else {}
                    top_name = top_row.get(x_key, 'N/A')
                    top_val = top_row.get(y_key, 0)
                    ai_reply_text = f"Based on dataset **{d['name']}**, **{top_name}** has the highest aggregate **{y_key}** with total value **{top_val:,.2f}**."
                except Exception:
                    ai_reply_text = f"Dataset **{d['name']}** profile: {profile.get('total_rows', 0)} rows."
            else:
                ai_reply_text = f"Dataset **{d['name']}** contains {profile.get('total_rows', 0)} rows across {len(col_names)} columns ({', '.join(col_names[:6])})."

    return ChatResponse(
        conversation_id=conv_id,
        message=ai_reply_text,
        sql=sql_query,
        chart_data=chart_data,
        visualization=visualization
    )
