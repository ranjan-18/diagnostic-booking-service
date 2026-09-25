"""
Custom DRF exception handler.

Normalises all error responses to a consistent shape:
{
    "error": {
        "code": "...",
        "message": "...",
        "details": {...}   # optional field-level validation errors
    }
}
"""
import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler output in a standardised envelope.
    """
    # Let DRF handle its own exceptions first
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log it and return 500
        logger.exception("Unhandled exception in view %s", context.get("view"))
        return Response(
            {
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later.",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Map exception types to error codes
    code = _get_error_code(exc)
    message = _get_message(exc, response)
    details = _get_details(response.data)

    payload = {"error": {"code": code, "message": message}}
    if details:
        payload["error"]["details"] = details

    response.data = payload
    return response


def _get_error_code(exc) -> str:
    if isinstance(exc, exceptions.AuthenticationFailed):
        return "authentication_failed"
    if isinstance(exc, exceptions.NotAuthenticated):
        return "not_authenticated"
    if isinstance(exc, exceptions.PermissionDenied):
        return "permission_denied"
    if isinstance(exc, exceptions.NotFound) or isinstance(exc, Http404):
        return "not_found"
    if isinstance(exc, exceptions.MethodNotAllowed):
        return "method_not_allowed"
    if isinstance(exc, exceptions.ValidationError):
        return "validation_error"
    if isinstance(exc, exceptions.Throttled):
        return "throttled"
    if hasattr(exc, "default_code"):
        return exc.default_code
    return "error"


def _get_message(exc, response) -> str:
    """Return a single human-readable message string."""
    if isinstance(exc, exceptions.ValidationError):
        return "Invalid input. Please check the details field for more information."
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            first = detail[0]
            return str(first) if not isinstance(first, dict) else "Validation error."
    return str(response.status_code)


def _get_details(data) -> dict | None:
    """Extract field-level validation details if present."""
    if isinstance(data, dict):
        # Standard DRF validation error shape: {"field": ["msg"]}
        # Exclude our own 'error' wrapper to avoid recursion
        if "error" not in data:
            return data
    return None
