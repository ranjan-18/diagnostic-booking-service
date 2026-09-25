"""
Tests URL patterns (standalone from centres app).
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DiagnosticTestViewSet

router = DefaultRouter()
router.register(r"", DiagnosticTestViewSet, basename="test")

urlpatterns = [
    path("", include(router.urls)),
]
