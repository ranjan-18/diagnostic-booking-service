"""
User views — signup only. Login/refresh are handled by simplejwt built-ins.
"""
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import SignupSerializer, UserSerializer


class SignupView(CreateAPIView):
    """
    POST /api/auth/signup/

    Register a new user account. Returns the created user profile.
    Does not require authentication.
    """

    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
