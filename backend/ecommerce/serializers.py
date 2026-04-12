from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, Review, SavedAddress, DiseaseProductMapping, Wishlist, Coupon, Notification


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_ne', 'description', 'description_ne', 'slug', 'icon']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    effective_price = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    tag_list = serializers.ReadOnlyField()
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'name', 'name_ne', 'description', 'description_ne',
            'price', 'discount_price', 'effective_price', 'sku',
            'stock', 'is_low_stock', 'low_stock_threshold',
            'image', 'is_active', 'is_featured', 'is_organic',
            'usage_instructions', 'usage_instructions_ne', 'tags', 'tag_list',
            'created_at', 'average_rating', 'review_count', 'reviews'
        ]


class ProductMiniSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product references."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    effective_price = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'name_ne', 'price', 'discount_price', 'effective_price', 'image', 'category_name', 'is_organic', 'is_featured', 'average_rating', 'stock']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'price', 'quantity', 'subtotal']

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product.image:
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'status', 'payment_status',
            'total_amount', 'discount_amount', 'coupon', 'coupon_code',
            'shipping_address', 'phone_number', 'payment_method',
            'notes', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = ['shipping_address', 'phone_number', 'payment_method', 'notes', 'items', 'coupon_code', 'total_amount', 'discount_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        coupon_code = validated_data.pop('coupon_code', None)
        coupon = None

        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code, is_active=True)
                validated_data['coupon'] = coupon
            except Coupon.DoesNotExist:
                pass

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = int(item_data.get('quantity', 1))
            OrderItem.objects.create(
                order=order,
                product=product,
                price=product.effective_price,
                quantity=quantity
            )
            # Reduce stock
            if product.stock >= quantity:
                product.stock -= quantity
                product.save()

        if coupon:
            coupon.used_count += 1
            coupon.save()

        return order


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductMiniSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['id', 'added_at']


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'min_order_amount', 'max_uses', 'used_count',
            'is_active', 'is_valid', 'valid_from', 'valid_until', 'created_at'
        ]
        read_only_fields = ['id', 'used_count', 'created_at']


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2)


class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = ['id', 'label', 'full_address', 'phone', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']


class DiseaseProductMappingSerializer(serializers.ModelSerializer):
    product = ProductMiniSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = DiseaseProductMapping
        fields = ['id', 'disease_name', 'disease_name_ne', 'product', 'product_id', 'priority', 'notes']
