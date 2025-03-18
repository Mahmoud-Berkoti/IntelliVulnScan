import os
from celery import Celery

from app.core.config import settings

# Redis URL for Celery
redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
if settings.REDIS_PASSWORD:
    redis_url = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

# Create Celery app
celery_app = Celery(
    "intellivulnscan",
    broker=redis_url,
    backend=redis_url,
    include=[
        "app.tasks.scan_tasks",
        "app.tasks.ml_tasks",
        "app.tasks.notification_tasks",
    ],
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    worker_max_tasks_per_child=1000,
    worker_prefetch_multiplier=1,
)

# Optional: Configure task routes
celery_app.conf.task_routes = {
    "app.tasks.scan_tasks.*": {"queue": "scan_queue"},
    "app.tasks.ml_tasks.*": {"queue": "ml_queue"},
    "app.tasks.notification_tasks.*": {"queue": "notification_queue"},
}

# Optional: Configure periodic tasks
celery_app.conf.beat_schedule = {
    "update-vulnerability-database": {
        "task": "app.tasks.scan_tasks.update_vulnerability_database",
        "schedule": 86400.0,  # Once a day (in seconds)
    },
    "retrain-ml-model": {
        "task": "app.tasks.ml_tasks.retrain_model",
        "schedule": 604800.0,  # Once a week (in seconds)
    },
}


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f"Request: {self.request!r}") 