"""
Plant API Views
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
      
        if self.action == 'list':
            return PlantListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PlantCreateUpdateSerializer
        return PlantDetailSerializer
    
    def get_permissions(self):
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        # Global plants for Treatment
        # Returns plants owned by superusers/admins (System Plants)
        if self.request.query_params.get('global') == 'true':
            # We want unique names but since we ensure_plants creates distinct names for superuser,
            # this should be fine.
            return Plant.objects.filter(user__is_superuser=True).order_by('name')

        # Start with all plants and then filter down to the owner
        queryset = Plant.objects.filter(user=self.request.user)
        
        queryset = queryset.prefetch_related('diseases')
        
        # If the user wants to find easy-to-care-for plants we filter them here.
        if self.request.query_params.get('low_maintenance') == 'true':
            queryset = queryset.filter(
                difficulty_level__in=['beginner', 'intermediate']
            )
        
        # Temperature filtering - useful for users in specific climates.
        min_temp = self.request.query_params.get('min_temp')
        max_temp = self.request.query_params.get('max_temp')
        
        if min_temp:
            queryset = queryset.filter(min_temperature__gte=int(min_temp))
        if max_temp:
            queryset = queryset.filter(max_temperature__lte=int(max_temp))
        
        return queryset
    
    def list(self, request, *args, **kwargs):
       
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
      
        return super().retrieve(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
       
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
      
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        
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
        
        plant = self.get_object()
        diseases = plant.diseases.all()
        
        # Import here to avoid circular dependency
        from diseases.serializers import DiseaseListSerializer
        
        serializer = DiseaseListSerializer(diseases, many=True)
        return Response(serializer.data)
