
from django.urls import path
from .views import (
    UserRegistrationView, ChangePasswordView, UpdateProfileView, 
    DeleteAccountView, UserListView, SwitchUserView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('switch/', SwitchUserView.as_view(), name='switch-user'),
]
