from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from typing import Any
from .models import SoilAnalysis
from .serializers import SoilAnalysisSerializer, SoilAnalysisInputSerializer
from .analyzer import analyze_soil


class SoilAnalysisViewSet(mixins.DestroyModelMixin, viewsets.ReadOnlyModelViewSet):
    """Soil analysis - POST to /analyze/ to run; GET list/detail for history; DELETE to remove."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SoilAnalysisSerializer

    def get_queryset(self): # type: ignore[reportIncompatibleMethodOverride]
        return SoilAnalysis.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Run a full soil analysis and persist result to the database."""
        input_ser = SoilAnalysisInputSerializer(data=request.data)
        if not input_ser.is_valid():
            return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            data: dict = dict(input_ser.validated_data)
            result = analyze_soil(
                nitrogen=data['nitrogen'],
                phosphorus=data['phosphorus'],
                potassium=data['potassium'],
                ph_level=data['ph_level'],
                moisture=data['moisture'],
                soil_type=data['soil_type'],
                organic_matter=data.get('organic_matter'),
            )

            # Persist to database
            analysis = SoilAnalysis.objects.create(
                user=request.user,
                nitrogen=data['nitrogen'],
                phosphorus=data['phosphorus'],
                potassium=data['potassium'],
                ph_level=data['ph_level'],
                moisture=data['moisture'],
                organic_matter=data.get('organic_matter') or result.get('organic_matter'),
                soil_type=data['soil_type'],
                health_score=result['health_score'],
                deficiencies=result['deficiencies'],
                recommendations=result['recommendations'],
                suggested_products=result['suggested_products'],
            )

            # Attach non-stored fields to the serializer output
            # Convert to dict to ensure mutability across DRF versions
            serialized = dict(SoilAnalysisSerializer(analysis).data)
            serialized['overall_explanation'] = result['overall_explanation']
            serialized['organic_matter'] = result['organic_matter']

            return Response(serialized, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                "error": "Internal engine failure during analysis.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def quick_analyze(self, request):
        """Run analysis WITHOUT saving - for real-time preview."""
        input_ser = SoilAnalysisInputSerializer(data=request.data)
        if not input_ser.is_valid():
            return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        result = analyze_soil(**dict(input_ser.validated_data))
        return Response(result)
