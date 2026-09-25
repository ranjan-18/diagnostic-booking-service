"""
Tests for JWT login endpoint.
"""
import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def login_url():
    return reverse("auth-login")


@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        username="loginuser",
        email="login@example.com",
        password="Str0ngP@ssw0rd!",
    )


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, client, login_url, test_user):
        response = client.post(
            login_url,
            {"username": test_user.username, "password": "Str0ngP@ssw0rd!"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, client, login_url, test_user):
        response = client.post(
            login_url,
            {"username": test_user.username, "password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client, login_url):
        response = client.post(
            login_url,
            {"username": "nobody", "password": "somepassword"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, client, login_url):
        response = client.post(login_url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
