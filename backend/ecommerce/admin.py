from django.contrib import admin
from .models import (
    Category, Product, Order, OrderItem, Review,
    SavedAddress, DiseaseProductMapping, Wishlist, Coupon, Notification
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'price', 'quantity']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'discount_price', 'stock', 'is_featured', 'is_organic', 'is_active', 'is_low_stock']
    list_filter = ['category', 'is_active', 'is_featured', 'is_organic']
    search_fields = ['name', 'description', 'sku', 'tags']
    list_editable = ['is_featured', 'is_organic', 'is_active']
    readonly_fields = ['average_rating', 'review_count', 'effective_price', 'is_low_stock']
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'category', 'description', 'image', 'sku')}),
        ('Pricing', {'fields': ('price', 'discount_price', 'effective_price')}),
        ('Inventory', {'fields': ('stock', 'low_stock_threshold', 'is_low_stock')}),
        ('Flags & Tags', {'fields': ('is_active', 'is_featured', 'is_organic', 'tags', 'usage_instructions')}),
        ('Stats', {'fields': ('average_rating', 'review_count')}),
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'payment_status', 'total_amount', 'discount_amount', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method']
    search_fields = ['user__username', 'user__email', 'shipping_address']
    readonly_fields = ['user', 'total_amount', 'created_at']
    inlines = [OrderItemInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user__username', 'product__name', 'comment']


@admin.register(SavedAddress)
class SavedAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'label', 'phone', 'is_default']
    list_filter = ['is_default']
    search_fields = ['user__username', 'full_address']


@admin.register(DiseaseProductMapping)
class DiseaseProductMappingAdmin(admin.ModelAdmin):
    list_display = ['disease_name', 'product', 'priority']
    search_fields = ['disease_name', 'product__name']
    ordering = ['disease_name', 'priority']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'added_at']
    search_fields = ['user__username', 'product__name']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'min_order_amount', 'used_count', 'max_uses', 'is_active', 'valid_until']
    list_filter = ['discount_type', 'is_active']
    search_fields = ['code']
    list_editable = ['is_active']
    readonly_fields = ['used_count', 'created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'title', 'message']
    list_editable = ['is_read']
