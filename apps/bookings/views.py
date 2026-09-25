"""
Booking views.
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .models import Booking
from .permissions import IsBookingOwner
from .serializers import BookingCreateSerializer, BookingSerializer
from .services import cancel_booking, create_booking

logger = logging.getLogger(__name__)


class BookingViewSet(CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """
    POST   /api/bookings/           — create booking (status=PENDING)
    GET    /api/bookings/           — list current user's bookings
    GET    /api/bookings/{id}/      — retrieve single booking (owner only)
    POST   /api/bookings/{id}/cancel/ — cancel booking (owner only)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "appointment_datetime"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        For list/create: filter to current user's bookings only.
        For retrieve/cancel: return ALL bookings so IsBookingOwner can
        distinguish 403 (exists but not yours) from 404 (doesn't exist).
        """
        if self.action in ("retrieve", "cancel"):
            # Unfiltered — object-level permission handles ownership check
            return Booking.objects.select_related("test", "centre", "test__centre")
        return (
            Booking.objects.filter(user=self.request.user)
            .select_related("test", "centre", "test__centre")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.action in ("retrieve", "cancel"):
            return [IsAuthenticated(), IsBookingOwner()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Delegate to service layer which enforces all business rules."""
        booking = create_booking(self.request.user, serializer.validated_data)
        # Re-assign so the response serializer uses the created instance
        serializer.instance = booking

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_serializer = BookingSerializer(serializer.instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """
        POST /api/bookings/{id}/cancel/

        Cancel a PENDING or CONFIRMED booking.
        Returns 409 if the booking is in a non-cancellable state.
        Returns 403 if the booking belongs to another user.
        """
        booking = self.get_object()  # triggers IsBookingOwner check → 403 if not owner
        updated_booking = cancel_booking(booking, request.user)
        return Response(
            BookingSerializer(updated_booking).data,
            status=status.HTTP_200_OK,
        )
