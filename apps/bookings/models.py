"""
Booking model with status state machine.
"""
from django.contrib.auth.models import User
from django.db import models

from apps.centres.models import DiagnosticCentre, DiagnosticTest


class Booking(models.Model):
    """
    Core booking entity.

    Design decisions:
    - `amount` is snapshotted from test.price at creation time so that
      subsequent price changes to the test don't affect historic bookings.
    - FKs to test and centre use PROTECT to prevent silent data corruption
      from cascading deletes on bookings with existing payments.
    - Status is managed exclusively by the payment service — never updated
      directly by the booking serializer or view.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(
        User,
        related_name="bookings",
        on_delete=models.CASCADE,
    )
    test = models.ForeignKey(
        DiagnosticTest,
        on_delete=models.PROTECT,  # PROTECT: don't allow deleting a test with bookings
        related_name="bookings",
    )
    centre = models.ForeignKey(
        DiagnosticCentre,
        on_delete=models.PROTECT,  # PROTECT: same reasoning
        related_name="bookings",
    )
    appointment_datetime = models.DateTimeField()
    # Snapshot of test.price at booking time — immune to future price changes
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Booking #{self.pk} — {self.test.name} [{self.status}]"

    @property
    def is_cancellable(self) -> bool:
        """A booking can be cancelled if it is PENDING or CONFIRMED."""
        return self.status in (self.Status.PENDING, self.Status.CONFIRMED)

    @property
    def is_payable(self) -> bool:
        """
        A booking can be paid (or retried) if it is PENDING or FAILED.
        CANCELLED bookings cannot be paid.
        """
        return self.status in (self.Status.PENDING, self.Status.FAILED)
