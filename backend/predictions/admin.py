
from django.contrib import admin
from .models import Prediction

@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ('user', 'predicted_plant', 'predicted_disease', 'confidence', 'created_at')
    list_filter = ('created_at', 'predicted_plant', 'predicted_disease')
    readonly_fields = ('created_at',)
