"""
Centres URL patterns.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DiagnosticCentreViewSet, DiagnosticTestViewSet

router = DefaultRouter()
router.register(r"", DiagnosticCentreViewSet, basename="centre")

urlpatterns = [
    path("", include(router.urls)),
]
