from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, OrderViewSet,
    ReviewViewSet, SavedAddressViewSet, DiseaseProductMappingViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'addresses', SavedAddressViewSet)
router.register(r'disease-mappings', DiseaseProductMappingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
