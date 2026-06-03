from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "supplierhub",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.order_tasks", "app.tasks.shopee_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    beat_schedule={
        "sync-shopee-orders-every-15min": {
            "task": "app.tasks.shopee_tasks.sync_all_sellers_orders",
            "schedule": crontab(minute="*/15"),
        },
        "refresh-shopee-tokens-hourly": {
            "task": "app.tasks.shopee_tasks.refresh_expiring_tokens",
            "schedule": crontab(minute=0),
        },
    },
)
