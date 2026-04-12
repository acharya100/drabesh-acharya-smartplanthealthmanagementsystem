from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count, Q
from .models import (
    Category, Product, Order, Review, SavedAddress,
    DiseaseProductMapping, Wishlist, Coupon, Notification
)
from .serializers import (
    CategorySerializer, ProductSerializer, ProductMiniSerializer,
    OrderSerializer, OrderCreateSerializer, ReviewSerializer,
    SavedAddressSerializer, DiseaseProductMappingSerializer,
    WishlistSerializer, CouponSerializer, CouponValidateSerializer,
    NotificationSerializer
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
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['price', 'created_at', 'average_rating', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        is_featured = self.request.query_params.get('featured')
        is_organic = self.request.query_params.get('organic')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        tag = self.request.query_params.get('tag')

        if category:
            qs = qs.filter(category__id=category)
        if is_featured:
            qs = qs.filter(is_featured=True)
        if is_organic:
            qs = qs.filter(is_organic=True)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if tag:
            qs = qs.filter(tags__icontains=tag)
        return qs

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Return featured products."""
        products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductMiniSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Return products in the same category."""
        product = self.get_object()
        related = self.get_queryset().filter(
            category=product.category
        ).exclude(id=product.id)[:6]
        serializer = ProductMiniSerializer(related, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Admin: Return products with low stock."""
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)
        products = Product.objects.filter(stock__lte=10, is_active=True).order_by('stock')
        serializer = ProductMiniSerializer(products, many=True)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        # Create order notification for user
        Notification.objects.create(
            user=self.request.user,
            notification_type='order_placed',
            title=f'Order #{order.id} Placed Successfully!',
            message=f'Your order for NPR {order.total_amount} has been placed. We will process it shortly.',
            link='/orders'
        )
        
        # Send an email confirmation for the order
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            subject = f"Order #{order.id} Placed Successfully!"
            body = f"Hello {self.request.user.username},\n\nYour order for NPR {order.total_amount} has been successfully placed.\nWe will process it shortly. Thank you very much!\n\n- Smart Plant Health Management System"
            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                [self.request.user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send order email to {self.request.user.email}: {e}")

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a pending order."""
        order = self.get_object()
        if order.status not in ['pending', 'processing']:
            return Response({'error': 'Only pending or processing orders can be cancelled.'}, status=400)
        order.status = 'cancelled'
        order.save()
        Notification.objects.create(
            user=order.user,
            notification_type='order_cancelled',
            title=f'Order #{order.id} Cancelled',
            message='Your order has been cancelled. If you paid online, a refund will be initiated.',
            link='/orders'
        )
        return Response({'status': 'Order cancelled successfully.'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analytics(self, request):
        """Admin: Sales analytics dashboard data."""
        from django.utils import timezone
        from datetime import timedelta

        orders = Order.objects.exclude(status='cancelled')
        total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = orders.count()
        pending = orders.filter(status='pending').count()
        processing = orders.filter(status='processing').count()
        shipped = orders.filter(status='shipped').count()
        delivered = orders.filter(status='delivered').count()

        # Top selling products
        from .models import OrderItem
        top_products = (
            OrderItem.objects
            .values('product__id', 'product__name', 'product__image')
            .annotate(total_sold=Sum('quantity'), total_revenue=Sum('price'))
            .order_by('-total_sold')[:5]
        )

        # Monthly revenue (last 6 months)
        monthly = []
        for i in range(5, -1, -1):
            month_start = timezone.now().replace(day=1) - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            rev = orders.filter(
                created_at__gte=month_start, created_at__lt=month_end
            ).aggregate(t=Sum('total_amount'))['t'] or 0
            monthly.append({
                'month': month_start.strftime('%b %Y'),
                'revenue': float(rev)
            })

        return Response({
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'by_status': {
                'pending': pending,
                'processing': processing,
                'shipped': shipped,
                'delivered': delivered,
            },
            'top_products': list(top_products),
            'monthly_revenue': monthly,
        })


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('user', 'product')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return super().get_permissions()

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return self.queryset.filter(product__id=product_id)
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Use update_or_create so a user can update their existing review."""
        product_id = request.data.get('product')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        if not product_id or not rating:
            return Response({'error': 'product and rating are required.'}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        review, created = Review.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={'rating': int(rating), 'comment': comment}
        )
        serializer = self.get_serializer(review)
        status_code = 201 if created else 200
        return Response(serializer.data, status=status_code)

    @action(detail=False, methods=['get'])
    def my_review(self, request):
        """Return the current user's review for a given product."""
        product_id = request.query_params.get('product')
        if not product_id:
            return Response({'error': 'product query param required'}, status=400)
        try:
            review = Review.objects.get(user=request.user, product_id=product_id)
            return Response(self.get_serializer(review).data)
        except Review.DoesNotExist:
            return Response(None, status=204)


class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Add or remove a product from wishlist."""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            wishlist_item.delete()
            return Response({'status': 'removed', 'wishlisted': False})
        return Response({'status': 'added', 'wishlisted': True})

    @action(detail=False, methods=['get'])
    def ids(self, request):
        """Return just the product IDs in the user's wishlist."""
        ids = self.get_queryset().values_list('product_id', flat=True)
        return Response(list(ids))


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'list']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code and return discount amount."""
        serializer = CouponValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        code = serializer.validated_data['code']
        order_total = serializer.validated_data['order_total']

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'error': 'Coupon code not found.'}, status=404)

        if not coupon.is_valid:
            return Response({'valid': False, 'error': 'This coupon is expired or no longer active.'}, status=400)

        if order_total < coupon.min_order_amount:
            return Response({
                'valid': False,
                'error': f'Minimum order amount of NPR {coupon.min_order_amount} required for this coupon.'
            }, status=400)

        discount = coupon.calculate_discount(order_total)
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_amount': float(discount),
            'final_total': float(order_total - discount),
        })


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


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Return count of unread notifications."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})


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
