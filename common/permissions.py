"""
Shared permission classes used across multiple apps.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission: read access is allowed to any authenticated user,
    write access only to the object's owner.

    The view must pass `obj` with an `owner` or `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "owner", None) or getattr(obj, "user", None)
        return owner == request.user


class ReadOnly(BasePermission):
    """Grants read-only access to any authenticated request."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
