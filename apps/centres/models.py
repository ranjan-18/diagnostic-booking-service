"""
DiagnosticCentre and DiagnosticTest models.
"""
from django.db import models


class DiagnosticCentre(models.Model):
    """
    Represents a physical diagnostic healthcare centre.
    """
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    address = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["location"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.location})"


class DiagnosticTest(models.Model):
    """
    A diagnostic test offered by a specific centre.

    Price uses DecimalField (never FloatField) to avoid floating-point
    rounding issues with monetary values.
    """
    centre = models.ForeignKey(
        DiagnosticCentre,
        related_name="tests",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["centre", "is_active"])]

    def __str__(self) -> str:
        return f"{self.name} @ {self.centre.name} ({self.price})"
