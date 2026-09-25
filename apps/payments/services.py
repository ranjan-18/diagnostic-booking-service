"""
Payment business logic.

Key design patterns:
- All DB writes wrapped in transaction.atomic()
- select_for_update() on the booking row to prevent race conditions
  from concurrent payment requests or webhook deliveries
- Webhook idempotency via get_or_create on WebhookEvent.event_id
"""
import logging
import random

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import NotFound

from apps.bookings.models import Booking

from .exceptions import PaymentConflict
from .models import Payment, WebhookEvent

logger = logging.getLogger(__name__)


def simulate_payment(booking_id: int, user) -> dict:
    """
    Simulate a payment for a booking.

    Rules:
    - Booking must belong to the requesting user.
    - Booking must be in PENDING or FAILED state (retries are allowed on FAILED).
    - CANCELLED bookings cannot be paid — raises 409.
    - Success rate is configurable via PAYMENT_SUCCESS_RATE setting (default 80%).
    - All DB writes are in a single atomic transaction with select_for_update.

    Returns a dict with payment and updated booking data.
    """
    with transaction.atomic():
        # Lock the booking row to prevent concurrent payment attempts
        try:
            booking = (
                Booking.objects.select_for_update()
                .select_related("test", "centre")
                .get(pk=booking_id)
            )
        except Booking.DoesNotExist:
            raise NotFound("Booking not found.")

        # Ownership check
        if booking.user_id != user.pk:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to pay for this booking.")

        # State check — only PENDING or FAILED are payable
        if not booking.is_payable:
            raise PaymentConflict(
                f"Cannot process payment for a booking with status '{booking.status}'. "
                f"Only PENDING or FAILED bookings can be paid."
            )

        # Determine outcome
        success_rate = getattr(settings, "PAYMENT_SUCCESS_RATE", 0.8)
        is_success = random.random() < success_rate

        payment_status = Payment.Status.SUCCESS if is_success else Payment.Status.FAILED
        booking_status = Booking.Status.CONFIRMED if is_success else Booking.Status.FAILED

        # Create payment record
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.amount,
            status=payment_status,
        )

        # Update booking status
        booking.status = booking_status
        booking.save(update_fields=["status", "updated_at"])

        logger.info(
            "Payment %s for Booking #%s: %s",
            payment.transaction_id,
            booking.pk,
            payment_status,
        )

        return {"payment": payment, "booking": booking}


def process_webhook(event_id: str, booking_id: int, status_value: str, payload: dict) -> dict:
    """
    Process a webhook event idempotently.

    Idempotency mechanism:
    - get_or_create on WebhookEvent.event_id with a DB UNIQUE constraint.
    - If the event already exists (created=False), return early — no side effects.
    - All state changes wrapped in transaction.atomic() + select_for_update().

    Returns a dict with processed status and booking data.
    """
    with transaction.atomic():
        webhook_event, created = WebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={"payload": payload, "processed": False},
        )

        if not created:
            # Duplicate delivery — idempotent no-op
            logger.info("Duplicate webhook event %s — skipping.", event_id)
            return {"idempotent": True, "event_id": event_id}

        # Lock the booking row
        try:
            booking = (
                Booking.objects.select_for_update()
                .select_related("test", "centre")
                .get(pk=booking_id)
            )
        except Booking.DoesNotExist:
            logger.warning("Webhook %s references non-existent booking #%s", event_id, booking_id)
            raise NotFound(f"Booking #{booking_id} not found.")

        # Map and validate webhook status
        status_upper = status_value.upper()
        if status_upper not in ("SUCCESS", "FAILED"):
            from .exceptions import WebhookProcessingError
            raise WebhookProcessingError(f"Invalid status value: '{status_value}'. Must be SUCCESS or FAILED.")

        # Check if booking is CANCELLED
        if booking.status == Booking.Status.CANCELLED:
            raise PaymentConflict(
                f"Cannot process webhook for booking #{booking_id} because it is CANCELLED."
            )

        # Check if booking is already CONFIRMED and incoming webhook is SUCCESS
        if booking.status == Booking.Status.CONFIRMED and status_upper == "SUCCESS":
            webhook_event.processed = True
            webhook_event.save(update_fields=["processed"])
            logger.info("Webhook %s: Booking #%s was already CONFIRMED.", event_id, booking.pk)
            return {
                "idempotent": False,
                "already_confirmed": True,
                "message": f"Booking #{booking.pk} is already CONFIRMED. Webhook successfully acknowledged and reconciled.",
                "event_id": event_id,
                "payment": booking.payments.first(),
                "booking": booking,
            }


        payment_status = Payment.Status.SUCCESS if status_upper == "SUCCESS" else Payment.Status.FAILED
        booking_status = Booking.Status.CONFIRMED if status_upper == "SUCCESS" else Booking.Status.FAILED

        # Create a payment record for the webhook-driven transition
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.amount,
            status=payment_status,
        )

        # Update booking status
        booking.status = booking_status
        booking.save(update_fields=["status", "updated_at"])

        # Mark webhook as processed
        webhook_event.processed = True
        webhook_event.save(update_fields=["processed"])

        logger.info(
            "Webhook %s processed: Booking #%s → %s",
            event_id,
            booking.pk,
            booking_status,
        )

        return {
            "idempotent": False,
            "already_confirmed": False,
            "message": f"Booking #{booking.pk} status updated to {booking_status}.",
            "event_id": event_id,
            "payment": payment,
            "booking": booking,
        }

