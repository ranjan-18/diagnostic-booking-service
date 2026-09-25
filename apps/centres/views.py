"""
Read-only viewsets for centres and tests.
"""
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.viewsets import ReadOnlyModelViewSet

from .filters import DiagnosticCentreFilter, DiagnosticTestFilter
from .models import DiagnosticCentre, DiagnosticTest
from .serializers import (
    DiagnosticCentreListSerializer,
    DiagnosticCentreSerializer,
    DiagnosticTestSerializer,
)


class DiagnosticCentreViewSet(ReadOnlyModelViewSet):
    """
    GET /api/centres/        - list all active centres (paginated)
    GET /api/centres/{id}/   - detail with nested tests

    Supports filtering by ?location=<str> and ?is_active=true
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = DiagnosticCentreFilter
    search_fields = ["name", "location"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return DiagnosticCentre.objects.filter(is_active=True).prefetch_related("tests")

    def get_serializer_class(self):
        if self.action == "list":
            return DiagnosticCentreListSerializer
        return DiagnosticCentreSerializer


class DiagnosticTestViewSet(ReadOnlyModelViewSet):
    """
    GET /api/tests/             - list tests
    GET /api/tests/?centre_id=  - filter by centre
    GET /api/tests/?search=     - search by name

    Supports ?min_price, ?max_price, ?is_active filters.
    """
    serializer_class = DiagnosticTestSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = DiagnosticTestFilter
    search_fields = ["name", "description"]
    ordering_fields = ["name", "price"]

    def get_queryset(self):
        return DiagnosticTest.objects.filter(is_active=True).select_related("centre")
