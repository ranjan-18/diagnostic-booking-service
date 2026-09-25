from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "test", "centre", "status", "amount", "appointment_datetime", "created_at"]
    list_filter = ["status", "centre"]
    search_fields = ["user__username", "user__email", "test__name"]
    readonly_fields = ["amount", "created_at", "updated_at"]
    ordering = ["-created_at"]
