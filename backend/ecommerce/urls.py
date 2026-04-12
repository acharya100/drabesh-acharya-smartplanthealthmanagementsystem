from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, OrderViewSet,
    ReviewViewSet, SavedAddressViewSet, DiseaseProductMappingViewSet,
    WishlistViewSet, CouponViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'addresses', SavedAddressViewSet)
router.register(r'disease-mappings', DiseaseProductMappingViewSet)
router.register(r'wishlist', WishlistViewSet)
router.register(r'coupons', CouponViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
