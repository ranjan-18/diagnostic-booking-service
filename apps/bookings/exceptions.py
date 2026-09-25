"""
Domain-specific exceptions for the bookings app.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class BookingConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "booking_conflict"

    def __init__(self, detail: str = None):
        self.detail = detail or "This action conflicts with the current booking state."


class BookingForbidden(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "booking_forbidden"

    def __init__(self, detail: str = None):
        self.detail = detail or "You do not have permission to perform this action on this booking."
