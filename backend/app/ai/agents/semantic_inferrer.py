import json
from typing import Dict, Any, List, Optional, Callable, Awaitable
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.semantic_inferrer")

INFERENCE_PROMPT = """
You are the **Universal Semantic Schema & Domain Inferrer Agent**.
Your job is to examine ANY tabular dataset (regardless of column naming, industry, or format) and infer its semantic roles, primary targets, domain context, and natural business entity.

Dataset Name: {dataset_name}
Total Rows: {total_rows}
Total Columns: {total_columns}

Columns & Profiling Meta:
{columns_meta}

Sample Rows:
{sample_rows}

Instructions:
1. Detect the **domain_theme** (e.g. "Human Resources / Employee Retention", "E-Commerce / Retail Sales", "Telecom Customer Churn", "Streaming Media / Music Analytics", "Healthcare / Clinical Operations", "B2B SaaS / Subscriptions", "IoT Sensor Logs", "Financial Risk / Credit").
2. Detect the **entity_name** (plural noun representing what each row is, e.g. "employees", "transactions", "customers", "patients", "orders", "songs", "flights", "items").
3. Identify:
   - `primary_metric`: The most important continuous numerical measure to optimize or investigate (e.g., MonthlyIncome, Sales, Revenue, Streams, MonthlyCharges, TotalBill, Temperature).
   - `secondary_metrics`: Other numeric metrics (e.g., TotalWorkingYears, YearsAtCompany, Profit, Discount, Tenure, Age).
   - `target_or_outcome_column`: If there is a key binary/status column representing an outcome (e.g., Attrition, Churn, Loan_Status, Is_Fraud, Converted, Survived), identify it and its positive event value (e.g. "Yes", 1, "True").
   - `cohort_dimensions`: Categorical columns with 2 to 50 unique values that represent natural business segments (e.g., Department, JobRole, OverTime, EducationField, Region, Category, Contract).
   - `temporal_dimensions`: Any date, time, year, or month columns.
   - `entity_identifiers`: High-cardinality keys (ID, EmployeeNumber, SKU, Name).
4. Outline the core strategic question for this domain (e.g. "What root drivers accelerate employee attrition, and how can retention be maximized?", "Which customer cohorts have the highest churn hazard?").

Return ONLY a valid JSON object matching this schema:
{{
  "domain_theme": "Industry / Domain Category",
  "entity_name": "employees",
  "primary_metric": "Column_Name",
  "secondary_metrics": ["Col1", "Col2"],
  "target_column": "Outcome_Column_Or_Null",
  "target_positive_value": "Yes_Or_Null",
  "cohort_dimensions": ["ColA", "ColB", "ColC"],
  "temporal_dimensions": ["DateCol"],
  "entity_identifiers": ["IDCol"],
  "core_strategic_question": "High stakes executive inquiry..."
}}
"""


class SemanticInferrer:
    """Universal schema & domain inference engine allowing autonomous investigation of ANY dataset."""

    @staticmethod
    async def infer(
        dataset_name: str,
        profile: Dict[str, Any],
        sample_rows: List[Dict[str, Any]],
        on_event: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    ) -> Dict[str, Any]:
        print(f"\n[Semantic Inferrer] --> Classifying semantic roles for ANY-data architecture: '{dataset_name}'...")
        logger.info(f"[Semantic Inferrer] Inferring semantics for '{dataset_name}'")

        cols = profile.get("columns", [])
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]
        date_cols = [c["name"] for c in cols if c.get("inferred_type") in ["datetime", "date"]]

        # Clean meta summary for prompt
        clean_cols = []
        for c in cols[:20]:
            clean_cols.append({
                "name": c["name"],
                "type": c.get("inferred_type"),
                "null_pct": c.get("null_percentage"),
                "unique": c.get("unique_count"),
                "sample": c.get("sample_values", [])[:3]
            })

        if on_event:
            await on_event({
                "type": "thought",
                "agent": "Semantic Inferrer",
                "thought": f"Examining schema profile ({len(cols)} columns, {len(num_cols)} numerical, {len(cat_cols)} categorical) to infer industry domain, primary continuous metric, and natural cohort dimensions."
            })

        provider = LLMProviderFactory.get_provider()
        prompt = INFERENCE_PROMPT.format(
            dataset_name=dataset_name,
            total_rows=profile.get("total_rows", 0),
            total_columns=profile.get("total_columns", 0),
            columns_meta=json.dumps(clean_cols, indent=2),
            sample_rows=json.dumps(sample_rows[:3], indent=2),
        )

        try:
            res = await provider.analyze_json(prompt=prompt)
            domain = res.get("domain_theme", "General Tabular Analytics")
            entity = res.get("entity_name", "records")
            primary = res.get("primary_metric") or (num_cols[0] if num_cols else cols[0]["name"])
            secondary = res.get("secondary_metrics", [c for c in num_cols if c != primary])
            cohorts = res.get("cohort_dimensions", cat_cols[:4])
            temporals = res.get("temporal_dimensions", date_cols)
            strategic_q = res.get("core_strategic_question", "What are the primary operational performance drivers?")
            target_col = res.get("target_column")
            target_val = res.get("target_positive_value")

            print(f"   [Semantic Inferrer] Domain: \"{domain}\" | Entity: \"{entity}\"")
            print(f"   [Semantic Inferrer] Primary Metric: [{primary}] | Target: [{target_col} = {target_val}]")
            print(f"   [Semantic Inferrer] Cohort Dimensions: {cohorts} | Temporal: {temporals}")
            print(f"   [Semantic Inferrer] Strategic Focus: \"{strategic_q}\"")

            if on_event:
                await on_event({
                    "type": "thought",
                    "agent": "Semantic Inferrer",
                    "thought": f"Domain identified: '{domain}' ({entity}). Primary metric: '{primary}'. Cohorts: {', '.join(cohorts[:3])}."
                })

            return {
                "domain_theme": domain,
                "entity_name": entity,
                "primary_metric": primary,
                "secondary_metrics": secondary,
                "target_column": target_col,
                "target_positive_value": target_val,
                "cohort_dimensions": cohorts,
                "temporal_dimensions": temporals,
                "entity_identifiers": res.get("entity_identifiers", []),
                "core_strategic_question": strategic_q,
            }
        except Exception as e:
            logger.warning(f"[Semantic Inferrer] LLM error ({e}), using rule-based universal inference.")

        # Heuristic universal inference fallback
        primary = num_cols[0] if num_cols else (cols[0]["name"] if cols else "value")
        secondary = [c for c in num_cols if c != primary][:3]
        cohorts = cat_cols[:4] if cat_cols else [cols[0]["name"]] if cols else ["dimension"]

        domain = "General Business Operations"
        if any("sale" in c.lower() or "price" in c.lower() or "cost" in c.lower() for c in [c["name"] for c in cols]):
            domain = "E-Commerce & Retail Transactions"
        elif any("churn" in c.lower() or "contract" in c.lower() or "tenure" in c.lower() for c in [c["name"] for c in cols]):
            domain = "Customer Retention & Subscription Analytics"
        elif any("patient" in c.lower() or "hospital" in c.lower() or "diagnosis" in c.lower() for c in [c["name"] for c in cols]):
            domain = "Healthcare & Clinical Operations"
        elif any("stream" in c.lower() or "track" in c.lower() or "song" in c.lower() or "bpm" in c.lower() for c in [c["name"] for c in cols]):
            domain = "Streaming Media & Music Intelligence"

        print(f"   [Semantic Inferrer] Rule-based Inferred Domain: \"{domain}\"")
        return {
            "domain_theme": domain,
            "primary_metric": primary,
            "secondary_metrics": secondary,
            "cohort_dimensions": cohorts,
            "temporal_dimensions": date_cols,
            "entity_identifiers": [],
            "core_strategic_question": f"How is {primary} distributed across key operational cohorts?",
        }
