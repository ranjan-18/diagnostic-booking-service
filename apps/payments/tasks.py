import logging
from celery import shared_task
from .services import process_webhook

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5,
)
def async_process_webhook_task(
    self,
    event_id: str,
    booking_id: int,
    status_value: str,
    payload: dict,
):
    """
    Background Celery worker task for asynchronous webhook processing.
    
    Includes:
    - Automatic exponential backoff retries (up to 5 attempts)
    - Full retry jitter to prevent thundering herd on third-party failure
    - Atomic DB idempotency via process_webhook()
    """
    logger.info("Executing async_process_webhook_task for event %s (Attempt %s)", event_id, self.request.retries)
    try:
        result = process_webhook(
            event_id=event_id,
            booking_id=booking_id,
            status_value=status_value,
            payload=payload,
        )
        return {
            "success": True,
            "event_id": event_id,
            "idempotent": result.get("idempotent", False),
            "already_confirmed": result.get("already_confirmed", False),
        }
    except Exception as exc:
        logger.error("Error processing async webhook %s: %s", event_id, exc)
        raise exc
