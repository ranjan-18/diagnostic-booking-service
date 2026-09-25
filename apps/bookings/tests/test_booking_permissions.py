"""
Tests for booking ownership permission enforcement.
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
def user_a(db):
    return User.objects.create_user(username="user_a", password="Securepass123!")


@pytest.fixture
def user_b(db):
    return User.objects.create_user(username="user_b", password="Securepass123!")


@pytest.fixture
def auth_client_a(client, user_a):
    c = APIClient()
    refresh = RefreshToken.for_user(user_a)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return c


@pytest.fixture
def auth_client_b(user_b):
    c = APIClient()
    refresh = RefreshToken.for_user(user_b)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return c


@pytest.fixture
def booking_for_a(user_a, db):
    centre = DiagnosticCentre.objects.create(name="Perm Lab", location="Bangalore")
    test = DiagnosticTest.objects.create(centre=centre, name="ECG", price=Decimal("300.00"))
    future = datetime.now(tz=timezone.utc) + timedelta(days=5)
    return Booking.objects.create(
        user=user_a, test=test, centre=centre,
        appointment_datetime=future, amount=test.price
    )


@pytest.mark.django_db
class TestBookingPermissions:
    def test_owner_can_retrieve(self, auth_client_a, booking_for_a):
        url = reverse("booking-detail", kwargs={"pk": booking_for_a.pk})
        response = auth_client_a.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_other_user_gets_403(self, auth_client_b, booking_for_a):
        """User B accessing User A's booking → 403, not 404."""
        url = reverse("booking-detail", kwargs={"pk": booking_for_a.pk})
        response = auth_client_b.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_gets_401(self, client, booking_for_a):
        url = reverse("booking-detail", kwargs={"pk": booking_for_a.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_owner_can_cancel_pending(self, auth_client_a, booking_for_a):
        url = reverse("booking-cancel", kwargs={"pk": booking_for_a.pk})
        response = auth_client_a.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == Booking.Status.CANCELLED

    def test_other_user_cannot_cancel(self, auth_client_b, booking_for_a):
        url = reverse("booking-cancel", kwargs={"pk": booking_for_a.pk})
        response = auth_client_b.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_cancel_already_cancelled(self, auth_client_a, booking_for_a):
        booking_for_a.status = Booking.Status.CANCELLED
        booking_for_a.save()
        url = reverse("booking-cancel", kwargs={"pk": booking_for_a.pk})
        response = auth_client_a.post(url)
        assert response.status_code == status.HTTP_409_CONFLICT
