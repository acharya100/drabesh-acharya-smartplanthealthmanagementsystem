from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Category, Product, Order, Review, SavedAddress, DiseaseProductMapping
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    OrderCreateSerializer, ReviewSerializer, SavedAddressSerializer,
    DiseaseProductMappingSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'average_rating']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__id=category)
        return qs


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return self.queryset.filter(product__id=product_id)
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedAddressViewSet(viewsets.ModelViewSet):
    queryset = SavedAddress.objects.all()
    serializer_class = SavedAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this address as the default."""
        SavedAddress.objects.filter(user=request.user).update(is_default=False)
        address = self.get_object()
        address.is_default = True
        address.save()
        return Response({'status': 'default set'})


class DiseaseProductMappingViewSet(viewsets.ModelViewSet):
    queryset = DiseaseProductMapping.objects.all()
    serializer_class = DiseaseProductMappingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        disease_name = self.request.query_params.get('disease_name')
        if disease_name:
            return self.queryset.filter(
                disease_name__icontains=disease_name
            ).select_related('product')
        return self.queryset

    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get recommended products for a detected disease."""
        disease_name = request.query_params.get('disease_name', '')
        if not disease_name:
            return Response({'error': 'disease_name required'}, status=400)

        mappings = DiseaseProductMapping.objects.filter(
            disease_name__icontains=disease_name
        ).select_related('product')[:6]

        serializer = self.get_serializer(mappings, many=True)
        return Response(serializer.data)
