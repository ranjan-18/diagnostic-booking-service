"""
Tests for user signup endpoint.
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
def signup_url():
    return reverse("auth-signup")


@pytest.fixture
def valid_signup_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Str0ngP@ssw0rd!",
        "confirm_password": "Str0ngP@ssw0rd!",
    }


@pytest.mark.django_db
class TestSignup:
    def test_signup_success(self, client, signup_url, valid_signup_data):
        response = client.post(signup_url, valid_signup_data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == valid_signup_data["email"]
        assert User.objects.filter(email=valid_signup_data["email"]).exists()

    def test_signup_password_not_in_response(self, client, signup_url, valid_signup_data):
        response = client.post(signup_url, valid_signup_data, format="json")
        assert "password" not in response.data

    def test_signup_duplicate_email(self, client, signup_url, valid_signup_data):
        client.post(signup_url, valid_signup_data, format="json")
        # Second signup with same email
        valid_signup_data["username"] = "anotheruser"
        response = client.post(signup_url, valid_signup_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_password_mismatch(self, client, signup_url, valid_signup_data):
        valid_signup_data["confirm_password"] = "differentpassword"
        response = client.post(signup_url, valid_signup_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_weak_password(self, client, signup_url, valid_signup_data):
        valid_signup_data["password"] = "123"
        valid_signup_data["confirm_password"] = "123"
        response = client.post(signup_url, valid_signup_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_missing_email(self, client, signup_url, valid_signup_data):
        del valid_signup_data["email"]
        response = client.post(signup_url, valid_signup_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
