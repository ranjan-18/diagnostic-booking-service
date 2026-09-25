"""
Booking-level permission classes.
"""
from rest_framework.permissions import BasePermission


class IsBookingOwner(BasePermission):
    """
    Object-level permission: only the booking's owner can access it.

    Returns 403 (not 404) on mismatch — we deliberately acknowledge
    that the resource exists but deny access. Using 404 to obscure
    would be misleading for authenticated users who know their own IDs.
    """

    message = "You do not have permission to access this booking."

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.pk
