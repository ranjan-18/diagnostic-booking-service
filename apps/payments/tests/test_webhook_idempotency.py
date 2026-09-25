"""
Critical tests for webhook idempotency.

This is the highest-signal section of the assignment.
"""
import pytest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.centres.models import DiagnosticCentre, DiagnosticTest
from apps.bookings.models import Booking
from apps.payments.models import Payment, WebhookEvent


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="webhookuser", password="Securepass123!")


@pytest.fixture
def centre(db):
    return DiagnosticCentre.objects.create(name="Hook Lab", location="Hyderabad")


@pytest.fixture
def test_item(centre):
    return DiagnosticTest.objects.create(centre=centre, name="MRI", price=Decimal("3000.00"))


@pytest.fixture
def pending_booking(user, centre, test_item):
    return Booking.objects.create(
        user=user,
        test=test_item,
        centre=centre,
        appointment_datetime=datetime.now(tz=timezone.utc) + timedelta(days=4),
        amount=test_item.price,
        status=Booking.Status.PENDING,
    )


@pytest.fixture
def webhook_url():
    return reverse("payment-webhook")


@pytest.mark.django_db
class TestWebhookIdempotency:
    def test_webhook_success_confirms_booking(self, client, webhook_url, pending_booking):
        event_id = str(uuid.uuid4())
        payload = {"event_id": event_id, "booking_id": pending_booking.pk, "status": "SUCCESS"}
        response = client.post(webhook_url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        pending_booking.refresh_from_db()
        assert pending_booking.status == Booking.Status.CONFIRMED

    def test_webhook_failed_fails_booking(self, client, webhook_url, pending_booking):
        event_id = str(uuid.uuid4())
        payload = {"event_id": event_id, "booking_id": pending_booking.pk, "status": "FAILED"}
        response = client.post(webhook_url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        pending_booking.refresh_from_db()
        assert pending_booking.status == Booking.Status.FAILED

    def test_duplicate_webhook_does_not_create_duplicate_payment(self, client, webhook_url, pending_booking):
        """
        THE critical idempotency test.

        Posting the same webhook payload twice must:
        1. Return 200 both times
        2. Create exactly ONE Payment row
        3. Not double-transition the booking
        """
        event_id = str(uuid.uuid4())
        payload = {"event_id": event_id, "booking_id": pending_booking.pk, "status": "SUCCESS"}

        # First delivery
        response1 = client.post(webhook_url, payload, format="json")
        assert response1.status_code == status.HTTP_200_OK

        # Second delivery (duplicate)
        response2 = client.post(webhook_url, payload, format="json")
        assert response2.status_code == status.HTTP_200_OK

        # Exactly ONE payment row must exist
        payment_count = Payment.objects.filter(booking=pending_booking).count()
        assert payment_count == 1, f"Expected 1 Payment, got {payment_count}"

        # Exactly ONE WebhookEvent row
        webhook_count = WebhookEvent.objects.filter(event_id=event_id).count()
        assert webhook_count == 1

    def test_different_event_ids_create_separate_payments(self, client, webhook_url, pending_booking):
        """Different event_ids are not duplicates and process independently."""
        event_id_1 = str(uuid.uuid4())
        event_id_2 = str(uuid.uuid4())
        payload1 = {"event_id": event_id_1, "booking_id": pending_booking.pk, "status": "FAILED"}
        payload2 = {"event_id": event_id_2, "booking_id": pending_booking.pk, "status": "SUCCESS"}

        client.post(webhook_url, payload1, format="json")
        client.post(webhook_url, payload2, format="json")

        # Two distinct events → two Payment rows
        assert Payment.objects.filter(booking=pending_booking).count() == 2

    def test_malformed_webhook_returns_400(self, client, webhook_url):
        """Malformed payload must return 400, never crash."""
        response = client.post(webhook_url, {"bad": "data"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_booking_id_returns_404(self, client, webhook_url):
        payload = {"event_id": str(uuid.uuid4()), "booking_id": 99999, "status": "SUCCESS"}
        response = client.post(webhook_url, payload, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_status_returns_400(self, client, webhook_url, pending_booking):
        payload = {"event_id": str(uuid.uuid4()), "booking_id": pending_booking.pk, "status": "INVALID"}
        response = client.post(webhook_url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
