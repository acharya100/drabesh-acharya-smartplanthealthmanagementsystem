from django.db import models
from django.conf import settings


SOIL_TYPE_CHOICES = [
    ('sandy', 'Sandy'),
    ('loamy', 'Loamy'),
    ('clay', 'Clay'),
    ('silty', 'Silty'),
    ('peaty', 'Peaty'),
    ('chalky', 'Chalky'),
]


class SoilAnalysis(models.Model):
    """Records a user's soil data and stores the generated recommendations."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='soil_analyses')
    
    # Input parameters
    nitrogen = models.FloatField(help_text="Nitrogen content (kg/ha)")
    phosphorus = models.FloatField(help_text="Phosphorus content (kg/ha)")
    potassium = models.FloatField(help_text="Potassium content (kg/ha)")
    ph_level = models.FloatField(help_text="Soil pH (0-14)")
    moisture = models.FloatField(help_text="Moisture percentage (0-100)")
    organic_matter = models.FloatField(null=True, blank=True, help_text="Organic matter percentage (0-15%)")
    soil_type = models.CharField(max_length=20, choices=SOIL_TYPE_CHOICES, default='loamy')
    
    # Results stored as JSON
    health_score = models.IntegerField(default=0, help_text="Computed 0-100 score")
    deficiencies = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    suggested_products = models.JSONField(default=list, help_text="Product IDs from ecommerce")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Soil Analysis'
        verbose_name_plural = 'Soil Analyses'
    
    def __str__(self):
        return f"Soil Analysis #{self.id} - {self.user.username} ({self.soil_type})"
