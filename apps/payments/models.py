"""
Payment and WebhookEvent models.
"""
import uuid

from django.db import models

from apps.bookings.models import Booking


class Payment(models.Model):
    """
    Records a single payment attempt for a booking.

    Multiple Payment rows can exist for one booking (retries on FAILED).
    The booking status is updated by the payment service after each attempt.
    """

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    booking = models.ForeignKey(
        Booking,
        related_name="payments",
        on_delete=models.CASCADE,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices)
    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        default=uuid.uuid4,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Payment {self.transaction_id} [{self.status}] for Booking #{self.booking_id}"


class WebhookEvent(models.Model):
    """
    Logs every webhook received and enforces idempotency.

    The unique constraint on `event_id` is the idempotency mechanism.
    On duplicate delivery, get_or_create on event_id short-circuits reprocessing.
    """
    event_id = models.CharField(max_length=100, unique=True)  # Provider-assigned idempotency key
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_at"]

    def __str__(self) -> str:
        return f"WebhookEvent {self.event_id} [processed={self.processed}]"
