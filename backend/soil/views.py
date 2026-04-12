from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SoilAnalysis
from .serializers import SoilAnalysisSerializer, SoilAnalysisInputSerializer
from .analyzer import analyze_soil


class SoilAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    """Soil analysis — POST to /analyze/ to run; GET list/detail for history."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SoilAnalysisSerializer

    def get_queryset(self):
        return SoilAnalysis.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Run soil analysis and store result."""
        input_ser = SoilAnalysisInputSerializer(data=request.data)
        if not input_ser.is_valid():
            return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        data = input_ser.validated_data
        result = analyze_soil(**data)

        # Save to DB
        analysis = SoilAnalysis.objects.create(
            user=request.user,
            nitrogen=data['nitrogen'],
            phosphorus=data['phosphorus'],
            potassium=data['potassium'],
            ph_level=data['ph_level'],
            moisture=data['moisture'],
            soil_type=data['soil_type'],
            health_score=result['health_score'],
            deficiencies=result['deficiencies'],
            recommendations=result['recommendations'],
            suggested_products=result['suggested_products'],
        )

        return Response(SoilAnalysisSerializer(analysis).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def quick_analyze(self, request):
        """Run analysis WITHOUT saving — for real-time preview."""
        input_ser = SoilAnalysisInputSerializer(data=request.data)
        if not input_ser.is_valid():
            return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        result = analyze_soil(**input_ser.validated_data)
        return Response(result)
