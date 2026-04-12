from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SoilAnalysisViewSet

router = DefaultRouter()
router.register(r'', SoilAnalysisViewSet, basename='soil')

urlpatterns = [
    path('', include(router.urls)),
]
