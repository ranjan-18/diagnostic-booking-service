"""
Tests for the centres and tests catalog endpoints.
"""
import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.centres.models import DiagnosticCentre, DiagnosticTest


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="centreuser", password="pass1234word")


@pytest.fixture
def auth_client(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def centre(db):
    return DiagnosticCentre.objects.create(name="City Lab", location="Mumbai")


@pytest.fixture
def test_item(centre):
    return DiagnosticTest.objects.create(
        centre=centre, name="Blood Test", price="500.00"
    )


@pytest.mark.django_db
class TestCentresList:
    def test_list_centres_authenticated(self, auth_client, centre):
        url = reverse("centre-list")
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_centres_unauthenticated(self, client, centre):
        url = reverse("centre-list")
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_location(self, auth_client, centre):
        url = reverse("centre-list")
        response = auth_client.get(url, {"location": "Mumbai"})
        assert response.status_code == status.HTTP_200_OK
        for result in response.data["results"]:
            assert "Mumbai" in result["location"]

    def test_centre_detail_has_tests(self, auth_client, centre, test_item):
        url = reverse("centre-detail", kwargs={"pk": centre.pk})
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "tests" in response.data
        assert len(response.data["tests"]) == 1
