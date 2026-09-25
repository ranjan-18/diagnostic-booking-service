import django_filters

from .models import DiagnosticCentre, DiagnosticTest


class DiagnosticCentreFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(lookup_expr="icontains")
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = DiagnosticCentre
        fields = ["location", "is_active"]


class DiagnosticTestFilter(django_filters.FilterSet):
    centre = django_filters.NumberFilter(field_name="centre_id")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = DiagnosticTest
        fields = ["centre", "min_price", "max_price", "is_active"]
