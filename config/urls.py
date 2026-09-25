"""
Root URL configuration.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # OpenAPI schema + Swagger UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # API v1
    path("api/auth/", include("apps.users.urls")),
    path("api/centres/", include("apps.centres.urls")),
    path("api/tests/", include("apps.centres.urls_tests")),
    path("api/", include("apps.bookings.urls")),
    path("api/payments/", include("apps.payments.urls")),
]
