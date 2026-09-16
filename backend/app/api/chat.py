import json
import uuid
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.api.datasets import DATASETS_DB
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.api.chat")

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
Your task is to classify user intent and convert data questions into accurate DuckDB SQL queries against table `dataset`.

Schema & Data Context:
- Table name: `dataset`
- Column profiles, data types, and sample rows are provided below.
- You must use exact column names from the schema.
- For positional queries (e.g. 3rd highest, 2nd lowest), use appropriate ORDER BY and LIMIT / OFFSET or ROW_NUMBER().
- For listing queries (e.g. "all sales rep names", "list regions"), use SELECT DISTINCT "col_name" FROM dataset ORDER BY 1.
- For aggregations (e.g. total sales per region, average price), use GROUP BY and aggregate functions.
- If the user's question asks for an overview, summary, description, explanation, or metadata about the dataset, datasource, or file (e.g., "describe the datasource", "explain me this data", "what is in this dataset", "what are the columns"), set `"intent": "overview"`, `"sql": null`, and explain in `"explanation"`.

Return ONLY a valid JSON object matching this schema:
{
  "intent": "sql_query" | "overview",
  "sql": "SELECT ... FROM dataset ..." (or null if intent is overview),
  "explanation": "Brief explanation of what this query calculates or dataset overview...",
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

OVERVIEW_SYNTHESIS_PROMPT = """
You are an expert Data Analyst. Answer the user's question about the dataset's purpose, contents, or metadata.

Dataset Name: {dataset_name}
Total Rows: {total_rows:,}
Total Columns: {total_columns}
Categorical Columns: {cat_cols}
Numeric Metric Columns: {num_cols}

Sample Data (First 5 rows):
{sample_rows}

User Question: "{user_message}"

Instructions:
1. Give a warm, executive-level summary explaining what this dataset is about, its key dimensions, and its metrics.
2. Suggest 2-3 specific analytical questions the user can ask (e.g., "Which region has highest sales?").
3. Keep the tone helpful, professional, and clear.
"""

OVERVIEW_KEYWORDS = [
    "what", "about", "describe", "summary", "overview", "columns",
    "structure", "explain", "contents", "details", "datat", "data",
    "tell me", "datasource", "dataset", "source", "file", "info",
    "information", "schema", "fields", "meaning", "understand"
]

AGGREGATION_KEYWORDS = [
    "sum", "avg", "average", "count", "top", "highest", "lowest",
    "total", "min", "max", "group by", "order by", "filter", "where",
    "distribution", "trend", "chart", "plot"
]

@router.post("", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    General NL-to-SQL & Overview Retrieval Pipeline:
    1. LLM analyzes dataset schema & prompt to output DuckDB SQL query or overview intent.
    2. DuckDB Engine executes SQL against dataset file to fetch real data rows.
    3. LLM synthesizes natural language answer from real data results or dataset metadata profile.
    4. Optional visualization attached if user requested a chart or query represents a distribution.
    """
    dataset_id = request.dataset_id
    if dataset_id not in DATASETS_DB:
        logger.warning(f"[Chat API] Dataset ID '{dataset_id}' not found in active database.")
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    d = DATASETS_DB[dataset_id]
    profile = d.get("profile", {})
    file_path = d.get("file_path")
    sample_rows = d.get("preview_rows", [])[:5]

    logger.info(f"[Chat Query Received] Dataset: '{d['name']}' | User Prompt: \"{request.message}\"")

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

    cols = profile.get("columns", [])
    col_names = [c["name"] for c in cols]
    num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
    cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]

    msg_lower = request.message.lower()
    is_overview_keyword_match = (
        any(w in msg_lower for w in OVERVIEW_KEYWORDS)
        and not any(w in msg_lower for w in AGGREGATION_KEYWORDS)
    )

    try:
        # Step 1: Generate SQL Query / Intent via LLM
        logger.info("[Chat Pipeline Step 1] Analyzing prompt & generating SQL via LLM...")
        sql_payload = await provider.analyze_json(prompt=prompt, system_prompt=CHAT_SYSTEM_PROMPT)
        sql_query = sql_payload.get("sql")
        wants_chart = sql_payload.get("wants_chart", False)
        llm_intent = sql_payload.get("intent", "").lower()

        is_overview_question = (
            llm_intent == "overview"
            or not sql_query
            or is_overview_keyword_match
        )
        logger.info(f"[Chat Pipeline Step 1 Complete] Intent: '{llm_intent or ('overview' if is_overview_question else 'sql_query')}' | Generated SQL: {sql_query}")

        # Step 2: Execute SQL Query using DuckDB Engine if present
        if sql_query and file_path and not is_overview_question:
            logger.info("[Chat Pipeline Step 2] Executing SQL query in DuckDB engine...")
            try:
                chart_data = DuckDBEngine.query_file(file_path, sql_query)
                logger.info(f"[Chat Pipeline Step 2 Complete] DuckDB returned {len(chart_data) if chart_data else 0} rows.")
            except Exception as sql_err:
                logger.error(f"[DuckDB Execution Error] {sql_err}. Falling back to default query.")
                cat = cat_cols[0] if cat_cols else (col_names[0] if col_names else "")
                num = num_cols[0] if num_cols else ""
                if num and cat:
                    sql_query = f'SELECT "{cat}", SUM("{num}") as "{num}" FROM dataset GROUP BY "{cat}" ORDER BY "{num}" DESC LIMIT 10'
                else:
                    sql_query = f'SELECT * FROM dataset LIMIT 10'
                chart_data = DuckDBEngine.query_file(file_path, sql_query)

        # Step 3: Synthesize Natural Language Answer
        if chart_data is not None and len(chart_data) > 0 and not is_overview_question:
            logger.info("[Chat Pipeline Step 3] Synthesizing response from SQL query results...")
            synth_prompt = ANSWER_SYNTHESIS_PROMPT.format(
                user_message=request.message,
                sql_query=sql_query,
                query_data=json.dumps(chart_data[:20], indent=2)
            )
            try:
                ai_reply_text = await provider.generate(prompt=synth_prompt, temperature=0.1)
                logger.info("[Chat Pipeline Step 3 Complete] Answer synthesized successfully.")
            except Exception as synth_err:
                logger.warning(f"[Answer Synthesis Fallback] {synth_err}")
                if len(chart_data) == 1:
                    row_str = ", ".join([f"**{k}**: {v}" for k, v in chart_data[0].items()])
                    ai_reply_text = f"Query Result for '{request.message}':\n\n{row_str}"
                else:
                    ai_reply_text = f"Retrieved {len(chart_data)} results for '{request.message}'."
        else:
            # Handle general dataset summary/overview questions
            logger.info("[Chat Pipeline Step 3] Synthesizing dataset overview / metadata response...")
            overview_prompt = OVERVIEW_SYNTHESIS_PROMPT.format(
                dataset_name=d['name'],
                total_rows=profile.get('total_rows', 0),
                total_columns=profile.get('total_columns', 0),
                cat_cols=', '.join(cat_cols) if cat_cols else 'None',
                num_cols=', '.join(num_cols) if num_cols else 'None',
                sample_rows=json.dumps(sample_rows, indent=2),
                user_message=request.message
            )
            try:
                ai_reply_text = await provider.generate(prompt=overview_prompt, temperature=0.2)
                logger.info("[Chat Pipeline Step 3 Complete] Dataset overview synthesized successfully.")
            except Exception as overview_err:
                logger.warning(f"[Overview Synthesis Error] {overview_err}")
                ai_reply_text = (
                    f"Dataset **{d['name']}** contains **{profile.get('total_rows', 0):,} rows** and **{profile.get('total_columns', 0)} columns**.\n\n"
                    f"• **Key Dimensions**: {', '.join(cat_cols[:5]) if cat_cols else 'N/A'}\n"
                    f"• **Numeric Metrics**: {', '.join(num_cols[:5]) if num_cols else 'N/A'}\n\n"
                    f"You can ask questions like *'Which {cat_cols[0] if cat_cols else 'category'} has highest {num_cols[0] if num_cols else 'sales'}?'* or *'Show total revenue per region'*."
                )

        # Step 4: Conditional Visualization Attachment
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
        logger.error(f"[Chat Pipeline Error] {type(outer_err).__name__}: {outer_err}")
        ai_reply_text = (
            f"Dataset **{d['name']}** contains **{profile.get('total_rows', 0):,} rows** across **{len(col_names)} columns**.\n\n"
            f"• **Dimensions**: {', '.join(cat_cols[:5]) if cat_cols else 'N/A'}\n"
            f"• **Metrics**: {', '.join(num_cols[:5]) if num_cols else 'N/A'}\n\n"
            f"Try asking questions like *'What are the top 5 {cat_cols[0] if cat_cols else 'items'}?'*"
        )

    return ChatResponse(
        conversation_id=conv_id,
        message=ai_reply_text,
        sql=sql_query,
        chart_data=chart_data,
        visualization=visualization
    )
