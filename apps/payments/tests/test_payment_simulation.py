"""
Tests for the payment simulation endpoint.
"""
import pytest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.centres.models import DiagnosticCentre, DiagnosticTest
from apps.bookings.models import Booking
from apps.payments.models import Payment


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="paymentuser", password="Securepass123!")


@pytest.fixture
def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def centre(db):
    return DiagnosticCentre.objects.create(name="MedLab", location="Chennai")


@pytest.fixture
def test_item(centre):
    return DiagnosticTest.objects.create(centre=centre, name="X-Ray", price=Decimal("1200.00"))


@pytest.fixture
def pending_booking(user, centre, test_item):
    return Booking.objects.create(
        user=user,
        test=test_item,
        centre=centre,
        appointment_datetime=datetime.now(tz=timezone.utc) + timedelta(days=2),
        amount=test_item.price,
        status=Booking.Status.PENDING,
    )


@pytest.fixture
def payment_url():
    return reverse("payment-simulate")


@pytest.mark.django_db
class TestPaymentSimulation:
    def test_successful_payment_confirms_booking(self, auth_client, payment_url, pending_booking):
        with patch("apps.payments.services.random.random", return_value=0.1):  # 0.1 < 0.8 → success
            response = auth_client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["payment"]["status"] == Payment.Status.SUCCESS
        assert response.data["booking"]["status"] == Booking.Status.CONFIRMED

    def test_failed_payment_fails_booking(self, auth_client, payment_url, pending_booking):
        with patch("apps.payments.services.random.random", return_value=0.99):  # 0.99 > 0.8 → fail
            response = auth_client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["payment"]["status"] == Payment.Status.FAILED
        assert response.data["booking"]["status"] == Booking.Status.FAILED

    def test_failed_booking_can_be_retried(self, auth_client, payment_url, pending_booking):
        """FAILED bookings are retriable."""
        pending_booking.status = Booking.Status.FAILED
        pending_booking.save()
        with patch("apps.payments.services.random.random", return_value=0.1):
            response = auth_client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["booking"]["status"] == Booking.Status.CONFIRMED

    def test_cancelled_booking_returns_409(self, auth_client, payment_url, pending_booking):
        pending_booking.status = Booking.Status.CANCELLED
        pending_booking.save()
        response = auth_client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_confirmed_booking_returns_409(self, auth_client, payment_url, pending_booking):
        pending_booking.status = Booking.Status.CONFIRMED
        pending_booking.save()
        response = auth_client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_other_users_booking_returns_403(self, auth_client, payment_url, pending_booking, db):
        other_user = User.objects.create_user(username="other2", password="Securepass123!")
        other_booking = Booking.objects.create(
            user=other_user,
            test=pending_booking.test,
            centre=pending_booking.centre,
            appointment_datetime=pending_booking.appointment_datetime,
            amount=pending_booking.amount,
        )
        response = auth_client.post(payment_url, {"booking_id": other_booking.pk}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_booking_id_returns_404(self, auth_client, payment_url):
        response = auth_client.post(payment_url, {"booking_id": 99999}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthenticated_returns_401(self, client, payment_url, pending_booking):
        response = client.post(payment_url, {"booking_id": pending_booking.pk}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
