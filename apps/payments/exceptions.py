"""
Domain-specific exceptions for the payments app.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class PaymentConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "payment_conflict"

    def __init__(self, detail: str = None):
        self.detail = detail or "Payment cannot be processed for this booking in its current state."


class WebhookProcessingError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "webhook_processing_error"

    def __init__(self, detail: str = None):
        self.detail = detail or "Webhook payload could not be processed."
