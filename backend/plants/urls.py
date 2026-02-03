"""
URL Configuration for Plants API

This module defines URL patterns for plant-related API endpoints.
Uses Django REST Framework's router for automatic URL generation.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantViewSet

# Create a router and register our viewset
router = DefaultRouter()
router.register(r'', PlantViewSet, basename='plant')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
