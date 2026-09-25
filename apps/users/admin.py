from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

# Re-register with default UserAdmin (already registered by default,
# but explicit here for clarity)
admin.site.unregister(User)
admin.site.register(User, BaseUserAdmin)
