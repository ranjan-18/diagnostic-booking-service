"""
Payments URL patterns.
"""
from django.urls import path

from .views import PaymentSimulateView, WebhookView

urlpatterns = [
    path("", PaymentSimulateView.as_view(), name="payment-simulate"),
    path("webhook/", WebhookView.as_view(), name="payment-webhook"),
]
