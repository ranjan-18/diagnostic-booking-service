"""
Booking business logic.

All state transitions live here, not in views or serializers.
Views stay thin; logic stays testable without HTTP.
"""
import logging
from datetime import datetime, timezone

from rest_framework.exceptions import ValidationError

from .exceptions import BookingConflict
from .models import Booking

logger = logging.getLogger(__name__)


def create_booking(user, validated_data: dict) -> Booking:
    """
    Create a new PENDING booking.

    Business rules enforced here (not in the serializer):
    - test must belong to the specified centre
    - appointment_datetime must be in the future
    - amount is always derived from test.price (never trusted from client)
    """
    test = validated_data["test"]
    centre = validated_data["centre"]
    appointment_datetime = validated_data["appointment_datetime"]

    # Rule 1: test must belong to the given centre
    if test.centre_id != centre.pk:
        raise ValidationError(
            {"test": "This test does not belong to the specified centre."}
        )

    # Rule 2: test must be active
    if not test.is_active:
        raise ValidationError({"test": "This test is not currently available."})

    # Rule 3: appointment must be in the future
    now = datetime.now(tz=timezone.utc)
    if appointment_datetime <= now:
        raise ValidationError(
            {"appointment_datetime": "Appointment must be scheduled in the future."}
        )

    # Rule 4: snapshot price — never trust client-sent amount
    amount = test.price

    booking = Booking.objects.create(
        user=user,
        test=test,
        centre=centre,
        appointment_datetime=appointment_datetime,
        amount=amount,
        notes=validated_data.get("notes", ""),
    )

    logger.info("Booking #%s created for user %s", booking.pk, user.pk)
    return booking


def cancel_booking(booking: Booking, user) -> Booking:
    """
    Cancel a booking.

    Rules:
    - Only the owner can cancel.
    - Only PENDING or CONFIRMED bookings can be cancelled.
    """
    if booking.user_id != user.pk:
        from .exceptions import BookingForbidden
        raise BookingForbidden()

    if not booking.is_cancellable:
        raise BookingConflict(
            f"Cannot cancel a booking with status '{booking.status}'. "
            f"Only PENDING or CONFIRMED bookings can be cancelled."
        )

    booking.status = Booking.Status.CANCELLED
    booking.save(update_fields=["status", "updated_at"])

    logger.info("Booking #%s cancelled by user %s", booking.pk, user.pk)
    return booking
