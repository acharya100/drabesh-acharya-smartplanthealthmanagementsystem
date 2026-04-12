from django.contrib import admin
from .models import SoilAnalysis


@admin.register(SoilAnalysis)
class SoilAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'soil_type', 'health_score', 'ph_level', 'nitrogen', 'created_at']
    list_filter = ['soil_type']
    search_fields = ['user__username']
    readonly_fields = ['health_score', 'deficiencies', 'recommendations', 'suggested_products', 'created_at']
