"""
Booking serializers.
"""
from rest_framework import serializers

from apps.centres.serializers import DiagnosticCentreListSerializer, DiagnosticTestSerializer

from .models import Booking


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Input serializer for creating a booking.

    Note: `amount` is intentionally excluded from writable fields.
    It is always derived server-side from test.price.
    """

    class Meta:
        model = Booking
        fields = ["test", "centre", "appointment_datetime", "notes"]


class BookingSerializer(serializers.ModelSerializer):
    """Full read-only booking representation."""
    test = DiagnosticTestSerializer(read_only=True)
    centre = DiagnosticCentreListSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "test",
            "centre",
            "appointment_datetime",
            "amount",
            "status",
            "status_display",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
