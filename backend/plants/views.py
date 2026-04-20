"""
Plant API Views
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from typing import Any

from .models import Plant
from .serializers import (
    PlantListSerializer,
    PlantDetailSerializer,
    PlantCreateUpdateSerializer
)


class PlantViewSet(viewsets.ModelViewSet):
   
    queryset = Plant.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # Enable filtering, searching and ordering
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
        'health_status': ['exact'],
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
    
    def get_serializer_class(self): # type: ignore[reportIncompatibleMethodOverride]
      
        if self.action == 'list':
            return PlantListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PlantCreateUpdateSerializer
        return PlantDetailSerializer
    
    def get_permissions(self): # type: ignore[reportIncompatibleMethodOverride]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self): # type: ignore[reportIncompatibleMethodOverride]
        # Global plants for Treatment
        
        if self.request.query_params.get('global') == 'true':
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
        user = self.request.user
        queryset = self.get_queryset()

        total_plants = queryset.count()

        # Plant-based classification counts (from My Plants)
        healthy_plant_count    = queryset.filter(health_status='healthy').count()
        unhealthy_plant_count  = queryset.filter(health_status='unhealthy').count()
        non_plant_count        = queryset.filter(health_status='non_leaf').count()
        out_of_scope_count     = queryset.filter(health_status='out_of_scope').count()

        # Also count from Disease Detection history (Predictions) for users who
        # didn't save their scanned images as plants - ensures dashboard is always accurate
        try:
            from predictions.models import Prediction
            det_qs = Prediction.objects.filter(user=user, source='disease_detection')

            healthy_det    = det_qs.filter(is_healthy=True).count()
            unhealthy_det  = det_qs.filter(is_healthy=False, is_plant_image=True,
                                           treatment_status__in=['untreated', 'in_progress', 'treated']).count()
            non_plant_det  = det_qs.filter(treatment_status='non_plant').count()
            oos_det        = det_qs.filter(treatment_status='out_of_scope').count()

            # Use detection counts only where the plant count is 0 (avoid double counting)
            if total_plants == 0:
                healthy_count   = healthy_det
                unhealthy_count = unhealthy_det
                non_plant_count = non_plant_det
                out_of_scope_count = oos_det
            else:
                healthy_count   = max(healthy_plant_count,   healthy_det)
                unhealthy_count = max(unhealthy_plant_count, unhealthy_det)
                non_plant_count = max(non_plant_count,       non_plant_det)
                out_of_scope_count = max(out_of_scope_count, oos_det)
        except Exception:
            healthy_count   = healthy_plant_count
            unhealthy_count = unhealthy_plant_count

        # Import dynamically to avoid circular dependencies
        from diseases.models import Treatment

        # Treatments available globally
        treatments_available = Treatment.objects.count()

        return Response({
            'total_plants': total_plants,
            'healthy_plants': healthy_count,
            'unhealthy_plants': unhealthy_count,
            'non_plant_images': non_plant_count,
            'out_of_scope': out_of_scope_count,
            'treatments_available': treatments_available,
        })
    
    @action(detail=True, methods=['get'])
    def diseases(self, request, pk=None):
        
        plant = self.get_object()
        diseases = plant.diseases.all()
        
        # Import here to avoid circular dependency
        from diseases.serializers import DiseaseListSerializer
        
        serializer = DiseaseListSerializer(diseases, many=True)
        return Response(serializer.data)
