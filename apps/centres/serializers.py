"""
Centres and tests serializers.
"""
from rest_framework import serializers

from .models import DiagnosticCentre, DiagnosticTest


class DiagnosticTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticTest
        fields = [
            "id",
            "name",
            "description",
            "price",
            "is_active",
            "centre",
        ]


class DiagnosticCentreSerializer(serializers.ModelSerializer):
    """Centre detail with nested tests."""
    tests = DiagnosticTestSerializer(many=True, read_only=True)

    class Meta:
        model = DiagnosticCentre
        fields = [
            "id",
            "name",
            "location",
            "address",
            "phone",
            "is_active",
            "tests",
            "created_at",
        ]


class DiagnosticCentreListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested tests)."""
    test_count = serializers.IntegerField(source="tests.count", read_only=True)

    class Meta:
        model = DiagnosticCentre
        fields = ["id", "name", "location", "address", "phone", "is_active", "test_count"]
