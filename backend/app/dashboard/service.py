from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.orders.schemas import OrderStatus


async def get_seller_dashboard(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    orders_today = await db.orders.count_documents({
        "seller_id": seller_id,
        "created_at": {"$gte": today_start},
    })
    orders_month = await db.orders.count_documents({
        "seller_id": seller_id,
        "created_at": {"$gte": month_start},
    })
    orders_pending = await db.orders.count_documents({
        "seller_id": seller_id,
        "status": OrderStatus.PENDING.value,
    })
    orders_shipped = await db.orders.count_documents({
        "seller_id": seller_id,
        "status": OrderStatus.SHIPPED.value,
    })
    orders_processing = await db.orders.count_documents({
        "seller_id": seller_id,
        "status": OrderStatus.PROCESSING.value,
    })
    suppliers_active = await db.suppliers.count_documents({
        "seller_id": seller_id,
        "active": True,
    })
    products_active = await db.products.count_documents({
        "seller_id": seller_id,
        "active": True,
    })

    billing_pipeline = [
        {"$match": {"seller_id": seller_id, "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$fee_value"}}},
    ]
    billing_result = await db.billing.aggregate(billing_pipeline).to_list(length=1)
    fees_month = billing_result[0]["total"] if billing_result else 0.0

    # 30-day chart data
    chart_data = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = await db.orders.count_documents({
            "seller_id": seller_id,
            "created_at": {"$gte": day_start, "$lt": day_end},
        })
        chart_data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "orders": count,
        })

    return {
        "kpis": {
            "orders_today": orders_today,
            "orders_month": orders_month,
            "orders_pending": orders_pending,
            "orders_shipped": orders_shipped,
            "orders_processing": orders_processing,
            "suppliers_active": suppliers_active,
            "products_active": products_active,
            "fees_month": fees_month,
        },
        "chart_orders_30d": chart_data,
    }


async def get_admin_dashboard(db: AsyncIOMotorDatabase) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    total_sellers = await db.sellers.count_documents({})
    total_orders = await db.orders.count_documents({})
    new_sellers_month = await db.sellers.count_documents({
        "created_at": {"$gte": month_start},
    })

    revenue_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$fee_value"}}},
    ]
    revenue_result = await db.billing.aggregate(revenue_pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0

    month_revenue_pipeline = [
        {"$match": {"created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$fee_value"}}},
    ]
    month_revenue_result = await db.billing.aggregate(month_revenue_pipeline).to_list(length=1)
    month_revenue = month_revenue_result[0]["total"] if month_revenue_result else 0.0

    # Monthly growth chart (last 12 months)
    monthly_chart = []
    for i in range(11, -1, -1):
        ref = now - timedelta(days=i * 30)
        m_start = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            next_ref = now - timedelta(days=(i - 1) * 30)
            m_end = next_ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            m_end = now
        count = await db.orders.count_documents({
            "created_at": {"$gte": m_start, "$lt": m_end},
        })
        rev_pipe = [
            {"$match": {"created_at": {"$gte": m_start, "$lt": m_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$fee_value"}}},
        ]
        rev_res = await db.billing.aggregate(rev_pipe).to_list(length=1)
        monthly_chart.append({
            "month": m_start.strftime("%Y-%m"),
            "orders": count,
            "revenue": rev_res[0]["total"] if rev_res else 0.0,
        })

    return {
        "kpis": {
            "total_sellers": total_sellers,
            "total_orders": total_orders,
            "new_sellers_month": new_sellers_month,
            "total_revenue": total_revenue,
            "month_revenue": month_revenue,
        },
        "chart_monthly": monthly_chart,
    }
