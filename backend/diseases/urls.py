"""
URL Configuration for Disease and Treatment APIs

Uses DRF DefaultRouter to generate URL patterns for browsing diseases
and their corresponding treatment strategies.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiseaseViewSet, TreatmentViewSet

# Register viewsets with the router
router = DefaultRouter()
router.register(r'treatments', TreatmentViewSet, basename='treatment')
router.register(r'', DiseaseViewSet, basename='disease')

urlpatterns = [
    path('', include(router.urls)),
]
