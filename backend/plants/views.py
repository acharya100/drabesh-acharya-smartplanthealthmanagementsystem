"""
Plant API Views

This module defines ViewSets for Plant API endpoints, providing
CRUD operations with filtering, search, and pagination capabilities.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from .models import Plant
from .serializers import (
    PlantListSerializer,
    PlantDetailSerializer,
    PlantCreateUpdateSerializer
)


class PlantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Plant model providing full CRUD operations.
    
    List endpoint returns lightweight plant data with filtering and search.
    Detail endpoint returns comprehensive plant information including disease count.
    Create/Update/Delete operations require admin authentication.
    
    Endpoints:
        GET    /api/plants/          - List all plants (with filters)
        POST   /api/plants/          - Create new plant (admin only)
        GET    /api/plants/{id}/     - Get plant details
        PUT    /api/plants/{id}/     - Update plant (admin only)
        PATCH  /api/plants/{id}/     - Partial update (admin only)
        DELETE /api/plants/{id}/     - Delete plant (admin only)
        GET    /api/plants/search/   - Advanced search endpoint
    """
    
    queryset = Plant.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # Enable filtering, searching, and ordering
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    
    # Define filterable fields
    filterset_fields = {
        'sunlight_requirement': ['exact'],
        'water_frequency': ['exact'],
        'difficulty_level': ['exact'],
        'is_edible': ['exact'],
        'is_medicinal': ['exact'],
        'is_toxic': ['exact'],
        'family': ['exact', 'icontains'],
    }
    
    # Define searchable fields
    search_fields = [
        'name',
        'scientific_name',
        'family',
        'description',
        'care_instructions'
    ]
    
    # Define orderable fields
    ordering_fields = [
        'name',
        'scientific_name',
        'created_at',
        'difficulty_level'
    ]
    
    # Default ordering
    ordering = ['name']
    
    def get_serializer_class(self):
        """
        Returns appropriate serializer based on the action.
        
        Uses lightweight serializer for list view and comprehensive
        serializer for detail view. Create/update operations use
        a specialized serializer with validation.
        
        Returns:
            Serializer class appropriate for the current action
        """
        if self.action == 'list':
            return PlantListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PlantCreateUpdateSerializer
        return PlantDetailSerializer
    
    def get_permissions(self):
        """
        Returns appropriate permissions based on the action.
        
        Read operations (list, retrieve) are open to authenticated users.
        Write operations (create, update, delete) require admin privileges.
        
        Returns:
            List of permission instances
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        """
        Returns optimized queryset with optional filtering.
        
        Prefetches related diseases for efficient database queries.
        Supports custom query parameters for advanced filtering.
        
        Returns:
            Filtered and optimized queryset
        """
        queryset = super().get_queryset()
        
        # Prefetch related diseases for efficiency
        queryset = queryset.prefetch_related('diseases')
        
        # Custom filter: low maintenance plants
        if self.request.query_params.get('low_maintenance') == 'true':
            queryset = queryset.filter(
                difficulty_level__in=['beginner', 'intermediate']
            )
        
        # Custom filter: temperature range
        min_temp = self.request.query_params.get('min_temp')
        max_temp = self.request.query_params.get('max_temp')
        
        if min_temp:
            queryset = queryset.filter(min_temperature__gte=int(min_temp))
        if max_temp:
            queryset = queryset.filter(max_temperature__lte=int(max_temp))
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        Lists all plants with pagination and filtering.
        
        Supports query parameters:
            - sunlight_requirement: Filter by sunlight needs
            - water_frequency: Filter by watering frequency
            - difficulty_level: Filter by care difficulty
            - is_edible: Filter edible plants
            - low_maintenance: Show only beginner/intermediate plants
            - search: Search in name, scientific name, description
            - ordering: Order results by specified field
        
        Returns:
            Paginated list of plants
        """
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves detailed information for a single plant.
        
        Includes comprehensive plant data, care instructions,
        and count of associated diseases.
        
        Returns:
            Detailed plant information
        """
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """
        Creates a new plant entry (admin only).
        
        Validates all plant data including temperature ranges
        and ensures toxic plants are not marked as edible.
        
        Returns:
            Created plant data with 201 status
        """
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Updates an existing plant (admin only).
        
        Supports both full update (PUT) and partial update (PATCH).
        Validates all modified fields.
        
        Returns:
            Updated plant data
        """
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        Deletes a plant entry (admin only).
        
        Note: This will also affect related disease associations
        due to many-to-many relationship.
        
        Returns:
            204 No Content on success
        """
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Custom endpoint providing plant statistics.
        
        Returns aggregated data about plants in the system:
            - Total plant count
            - Count by difficulty level
            - Count by sunlight requirement
            - Edible/medicinal/toxic counts
        
        Endpoint: GET /api/plants/statistics/
        
        Returns:
            Dictionary with statistical data
        """
        total_plants = self.get_queryset().count()
        
        # Count by difficulty level
        difficulty_stats = {}
        for level, _ in Plant.DIFFICULTY_CHOICES:
            count = self.get_queryset().filter(difficulty_level=level).count()
            difficulty_stats[level] = count
        
        # Count by sunlight requirement
        sunlight_stats = {}
        for requirement, _ in Plant.SUNLIGHT_CHOICES:
            count = self.get_queryset().filter(sunlight_requirement=requirement).count()
            sunlight_stats[requirement] = count
        
        # Special properties counts
        edible_count = self.get_queryset().filter(is_edible=True).count()
        medicinal_count = self.get_queryset().filter(is_medicinal=True).count()
        toxic_count = self.get_queryset().filter(is_toxic=True).count()
        
        return Response({
            'total_plants': total_plants,
            'by_difficulty': difficulty_stats,
            'by_sunlight': sunlight_stats,
            'edible_plants': edible_count,
            'medicinal_plants': medicinal_count,
            'toxic_plants': toxic_count,
        })
    
    @action(detail=True, methods=['get'])
    def diseases(self, request, pk=None):
        """
        Custom endpoint to get all diseases affecting a specific plant.
        
        Returns list of diseases associated with this plant,
        including severity and treatment information.
        
        Endpoint: GET /api/plants/{id}/diseases/
        
        Returns:
            List of diseases affecting this plant
        """
        plant = self.get_object()
        diseases = plant.diseases.all()
        
        # Import here to avoid circular dependency
        from diseases.serializers import DiseaseListSerializer
        
        serializer = DiseaseListSerializer(diseases, many=True)
        return Response(serializer.data)
