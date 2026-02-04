
from django.urls import path
from .views import UserRegistrationView, ChangePasswordView, UpdateProfileView, DeleteAccountView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
]
