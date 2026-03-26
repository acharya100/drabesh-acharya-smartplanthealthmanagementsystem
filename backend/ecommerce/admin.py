from django.contrib import admin
from .models import Category, Product, Order, OrderItem, Review, SavedAddress, DiseaseProductMapping

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_active', 'created_at']
    list_filter = ['is_active', 'category', 'created_at']
    list_editable = ['price', 'stock', 'is_active']
    search_fields = ['name', 'description']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_amount', 'phone_number', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    inlines = [OrderItemInline]

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']

@admin.register(SavedAddress)
class SavedAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'label', 'phone', 'is_default']
    list_filter = ['is_default']

@admin.register(DiseaseProductMapping)
class DiseaseProductMappingAdmin(admin.ModelAdmin):
    list_display = ['disease_name', 'product']
    search_fields = ['disease_name']
