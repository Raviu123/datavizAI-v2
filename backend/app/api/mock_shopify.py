import asyncio
import random
import time
from typing import Dict, Any, List
from fastapi import APIRouter, Query

router = APIRouter()

REGIONS = ["North America", "Europe", "Asia-Pacific", "Latin America"]
CATEGORIES = ["Electronics", "Apparel", "Home & Kitchen", "Beauty", "Sports"]
PAYMENT_METHODS = ["Credit Card", "Shop Pay", "PayPal", "Apple Pay"]
CHANNELS = ["Online Store", "Mobile App", "Social Shop", "POS"]

GLOBAL_ORDER_HISTORY: List[Dict[str, Any]] = []
START_TIME = time.time()

def _generate_order() -> Dict[str, Any]:
    order_id = f"SHOPIFY-#{random.randint(10000, 99999)}"
    cat = random.choice(CATEGORIES)
    qty = random.randint(1, 4)
    unit_price = round(random.uniform(15.0, 350.0), 2)
    amount = round(qty * unit_price, 2)
    
    return {
        "order_id": order_id,
        "timestamp": pd.Timestamp.now().isoformat(),
        "unix_time": time.time(),
        "customer": f"Customer_{random.randint(100, 999)}",
        "product_category": cat,
        "quantity": qty,
        "amount": amount,
        "region": random.choice(REGIONS),
        "payment_method": random.choice(PAYMENT_METHODS),
        "sales_channel": random.choice(CHANNELS),
        "status": "paid"
    }

import pandas as pd

# Seed initial 50 historical orders
for _ in range(50):
    GLOBAL_ORDER_HISTORY.append(_generate_order())

@router.get("/live-orders")
async def get_live_shopify_orders(limit: int = Query(50, ge=5, le=200)):
    """
    Simulates a live Shopify API webhook stream endpoint.
    Appends a new live order on every request to simulate real-time transactions.
    """
    # Simulate continuous live order incoming
    new_order = _generate_order()
    GLOBAL_ORDER_HISTORY.append(new_order)
    
    # Keep last 200 orders in window
    if len(GLOBAL_ORDER_HISTORY) > 200:
        GLOBAL_ORDER_HISTORY.pop(0)

    recent_orders = list(reversed(GLOBAL_ORDER_HISTORY[-limit:]))
    
    # Compute aggregate live metrics
    total_sales = round(sum(o["amount"] for o in GLOBAL_ORDER_HISTORY), 2)
    avg_order_val = round(total_sales / len(GLOBAL_ORDER_HISTORY), 2) if GLOBAL_ORDER_HISTORY else 0.0

    return {
        "status": "streaming",
        "source": "Shopify Live Webhook Simulator",
        "timestamp": pd.Timestamp.now().isoformat(),
        "total_orders": len(GLOBAL_ORDER_HISTORY),
        "live_metrics": {
            "total_revenue": total_sales,
            "avg_order_value": avg_order_val,
            "active_checkout_rate": random.randint(12, 45)
        },
        "orders": recent_orders
    }
