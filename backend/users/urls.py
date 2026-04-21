from django.urls import path
from .views import (
    UserRegistrationView, ChangePasswordView, UpdateProfileView, 
    DeleteAccountView, UserListView, SwitchUserView,
    ForgotPasswordCodeView, ForgotPasswordResetView, VerifyOtpView,
    SendPhoneOtpView, VerifyPhoneOtpView,
    AdminDashboardView, AdminUsersView, AdminUserDetailView,
    AdminAllPredictionsView, AdminToggleStaffView, AdminAllPlantsView,
    AdminEcommerceOverviewView, AdminOrderManageView,
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordCodeView.as_view(), name='forgot-password'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify-otp'),
    path('reset-password/', ForgotPasswordResetView.as_view(), name='reset-password'),
    path('send-phone-otp/', SendPhoneOtpView.as_view(), name='send-phone-otp'),
    path('verify-phone-otp/', VerifyPhoneOtpView.as_view(), name='verify-phone-otp'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('switch/', SwitchUserView.as_view(), name='switch-user'),

    # Admin Panel Endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/predictions/', AdminAllPredictionsView.as_view(), name='admin-predictions'),
    path('admin/plants/', AdminAllPlantsView.as_view(), name='admin-plants'),
    path('admin/users/<int:user_id>/toggle-staff/', AdminToggleStaffView.as_view(), name='admin-toggle-staff'),

    # Admin E-Commerce Endpoints
    path('admin/ecommerce/overview/', AdminEcommerceOverviewView.as_view(), name='admin-ecommerce-overview'),
    path('admin/orders/<int:order_id>/update-status/', AdminOrderManageView.as_view(), name='admin-order-update'),
]
