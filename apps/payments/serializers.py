"""
Payment serializers.
"""
from rest_framework import serializers

from apps.bookings.serializers import BookingSerializer

from .models import Payment, WebhookEvent


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "booking", "amount", "status", "transaction_id", "created_at"]
        read_only_fields = fields


class PaymentSimulateSerializer(serializers.Serializer):
    """Input: just a booking_id."""
    booking_id = serializers.IntegerField()


class PaymentResponseSerializer(serializers.Serializer):
    """Output: payment result + updated booking."""
    payment = PaymentSerializer()
    booking = BookingSerializer()


class WebhookSerializer(serializers.Serializer):
    """
    Webhook payload shape.

    Production note: In a real system, the provider signs the payload
    with HMAC-SHA256 and we verify the signature here before processing.
    Skipped for this demo.
    """
    event_id = serializers.CharField(max_length=100)
    booking_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["SUCCESS", "FAILED"])
