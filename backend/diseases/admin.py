
from django.contrib import admin
from .models import Disease, Treatment

class TreatmentInline(admin.StackedInline):
    model = Treatment
    extra = 1

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'plant', 'created_at')
    list_filter = ('plant',)
    search_fields = ('name', 'plant__name', 'symptoms')
    inlines = [TreatmentInline]

@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'disease', 'type')
    list_filter = ('type', 'disease__plant')
    search_fields = ('title', 'description', 'disease__name')
