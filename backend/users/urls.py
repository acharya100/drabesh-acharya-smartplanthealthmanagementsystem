
from django.urls import path
from .views import (
    UserRegistrationView, ChangePasswordView, UpdateProfileView, 
    DeleteAccountView, UserListView, SwitchUserView,
    AdminDashboardView, AdminUsersView, AdminUserDetailView,
    AdminAllPredictionsView, AdminToggleStaffView,
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('switch/', SwitchUserView.as_view(), name='switch-user'),

    # Admin Panel Endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/predictions/', AdminAllPredictionsView.as_view(), name='admin-predictions'),
    path('admin/users/<int:user_id>/toggle-staff/', AdminToggleStaffView.as_view(), name='admin-toggle-staff'),
]
