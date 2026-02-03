"""
Predictions API URL Configuration
Defines routing for AI-based plant identification and diagnosis.

Author: Smart Plant Health Management System
Sprint: 4 - Disease Detection & AI Assistance
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PredictionViewSet

router = DefaultRouter()
router.register(r'', PredictionViewSet, basename='prediction')

urlpatterns = [
    path('', include(router.urls)),
]
