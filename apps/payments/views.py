"""
Payment simulation and webhook views.
"""
import logging

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.serializers import BookingSerializer
from .serializers import (
    PaymentResponseSerializer,
    PaymentSimulateSerializer,
    WebhookSerializer,
)
from .services import process_webhook, simulate_payment

logger = logging.getLogger(__name__)


class PaymentSimulateView(APIView):
    """
    POST /api/payments/

    Simulate a payment for a booking.
    Requires authentication — only the booking owner can pay.

    On success, booking transitions PENDING→CONFIRMED or PENDING→FAILED.
    On FAILED booking, retrying is allowed (FAILED→CONFIRMED or FAILED→FAILED).
    CANCELLED bookings return 409.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentSimulateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = simulate_payment(
            booking_id=serializer.validated_data["booking_id"],
            user=request.user,
        )

        response_serializer = PaymentResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class WebhookView(APIView):
    """
    POST /api/payments/webhook/

    Idempotent webhook receiver.

    Does NOT require authentication (real providers use HMAC signatures —
    see WebhookSerializer docstring). Returns 200 for both new events
    and duplicates so the provider doesn't retry unnecessarily.

    Race condition protection:
    - DB UNIQUE constraint on event_id prevents duplicate rows.
    - select_for_update() on the booking prevents concurrent transitions.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = WebhookSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Malformed webhook payload: %s", serializer.errors)
            return Response(
                {"error": {"code": "validation_error", "message": "Invalid webhook payload.", "details": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        result = process_webhook(
            event_id=data["event_id"],
            booking_id=data["booking_id"],
            status_value=data["status"],
            payload=request.data,
        )

        if result.get("idempotent"):
            return Response(
                {"message": "Duplicate event. Already processed.", "event_id": result["event_id"]},
                status=status.HTTP_200_OK,
            )

        if result.get("already_confirmed"):
            return Response(
                {
                    "message": result.get("message", f"Booking #{data['booking_id']} is already CONFIRMED. Webhook acknowledged."),
                    "event_id": result["event_id"],
                    "booking": BookingSerializer(result["booking"]).data if result.get("booking") else None,
                },
                status=status.HTTP_200_OK,
            )

        response_serializer = PaymentResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

