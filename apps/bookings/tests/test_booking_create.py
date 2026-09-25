"""
Tests for booking creation endpoint.
"""
import pytest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.centres.models import DiagnosticCentre, DiagnosticTest
from apps.bookings.models import Booking


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="bookinguser", password="Securepass123!")


@pytest.fixture
def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def centre(db):
    return DiagnosticCentre.objects.create(name="Apollo Diagnostics", location="Delhi")


@pytest.fixture
def test_item(centre):
    return DiagnosticTest.objects.create(
        centre=centre, name="CBC", price=Decimal("750.00")
    )


@pytest.fixture
def bookings_url():
    return reverse("booking-list")


@pytest.fixture
def future_datetime():
    return (datetime.now(tz=timezone.utc) + timedelta(days=3)).isoformat()


@pytest.mark.django_db
class TestBookingCreate:
    def test_create_booking_success(self, auth_client, bookings_url, centre, test_item, future_datetime):
        payload = {
            "test": test_item.pk,
            "centre": centre.pk,
            "appointment_datetime": future_datetime,
        }
        response = auth_client.post(bookings_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == Booking.Status.PENDING

    def test_amount_is_snapshotted_from_test_price(self, auth_client, bookings_url, centre, test_item, future_datetime):
        """Client cannot tamper with amount — always derived from test.price."""
        payload = {
            "test": test_item.pk,
            "centre": centre.pk,
            "appointment_datetime": future_datetime,
            "amount": "1.00",  # Tampered!
        }
        response = auth_client.post(bookings_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data["amount"]) == test_item.price

    def test_past_appointment_rejected(self, auth_client, bookings_url, centre, test_item):
        past = (datetime.now(tz=timezone.utc) - timedelta(days=1)).isoformat()
        payload = {"test": test_item.pk, "centre": centre.pk, "appointment_datetime": past}
        response = auth_client.post(bookings_url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_test_centre_mismatch_rejected(self, auth_client, bookings_url, future_datetime, db):
        other_centre = DiagnosticCentre.objects.create(name="Other Lab", location="Mumbai")
        centre_a = DiagnosticCentre.objects.create(name="Lab A", location="Pune")
        test_for_a = DiagnosticTest.objects.create(centre=centre_a, name="MRI", price=Decimal("2000.00"))
        payload = {
            "test": test_for_a.pk,
            "centre": other_centre.pk,  # Mismatch!
            "appointment_datetime": future_datetime,
        }
        response = auth_client.post(bookings_url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_rejected(self, client, bookings_url, centre, test_item, future_datetime):
        payload = {"test": test_item.pk, "centre": centre.pk, "appointment_datetime": future_datetime}
        response = client.post(bookings_url, payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_booking_list_filtered_to_current_user(self, auth_client, bookings_url, centre, test_item, future_datetime, db):
        """User should only see their own bookings."""
        other_user = User.objects.create_user(username="other", password="Securepass123!")
        Booking.objects.create(
            user=other_user, test=test_item, centre=centre,
            appointment_datetime=future_datetime, amount=test_item.price
        )
        response = auth_client.get(bookings_url)
        assert response.status_code == status.HTTP_200_OK
        # Our user has no bookings — should return empty
        assert response.data["count"] == 0
