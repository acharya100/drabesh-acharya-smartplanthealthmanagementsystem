"""
Disease and Treatment API Views

This module defines ViewSets for managing plant diseases and their corresponding
treatments. It provides comprehensive filtering capabilities and custom actions
for treatment history and recommendations.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count

from .models import Disease, Treatment
from .serializers import (
    DiseaseListSerializer,
    DiseaseDetailSerializer,
    DiseaseCreateUpdateSerializer,
    TreatmentListSerializer,
    TreatmentDetailSerializer,
    TreatmentCreateUpdateSerializer
)


class DiseaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing plant diseases.
    
    Provides standard CRUD operations with advanced filtering by:
    - disease_type
    - severity_level
    - affected_plants (via plant ID)
    - name (search)
    """
    queryset = Disease.objects.all().prefetch_related('treatments', 'affected_plants')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtering options
    filterset_fields = {
        'disease_type': ['exact'],
        'severity_level': ['exact'],
        'affected_plants': ['exact'],
        'is_contagious': ['exact'],
    }
    
    # Search functionality
    search_fields = ['name', 'scientific_name', 'symptoms', 'causes']
    
    # Default ordering
    ordering = ['name']

    def get_serializer_class(self):
        """
        Dynamically selects the serializer based on the current action.
        """
        if self.action == 'list':
            return DiseaseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DiseaseCreateUpdateSerializer
        return DiseaseDetailSerializer

    def get_permissions(self):
        """
        Only admin users can modify disease data.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=['get'])
    def treatments(self, request, pk=None):
        """
        Custom action to retrieve all treatments for a specific disease.
        """
        disease = self.get_object()
        treatments = disease.treatments.all()
        serializer = TreatmentListSerializer(treatments, many=True)
        return Response(serializer.data)


class TreatmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing disease treatments.
    
    Allows browsing treatments by type and disease.
    """
    queryset = Treatment.objects.all().select_related('disease')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    filterset_fields = {
        'disease': ['exact'],
        'treatment_type': ['exact'],
        'is_preventive': ['exact'],
    }
    
    search_fields = ['name', 'description', 'instructions', 'products_needed']

    def get_serializer_class(self):
        """
        Selects serializer based on action.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return TreatmentCreateUpdateSerializer
        if self.action == 'retrieve':
            return TreatmentDetailSerializer
        return TreatmentListSerializer

    def get_permissions(self):
        """
        Restrict write access to admin users.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]
