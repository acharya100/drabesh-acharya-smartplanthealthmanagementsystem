
from django.db import models
from django.conf import settings
from plants.models import Plant
from diseases.models import Disease

class Prediction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions')
    image = models.ImageField(upload_to='predictions/images/')
    predicted_plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True)
    predicted_disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    # Raw AI results
    plant_name = models.CharField(max_length=100, blank=True, null=True)
    disease_name = models.CharField(max_length=150, blank=True, null=True)
    
    confidence = models.DecimalField(max_digits=5, decimal_places=2, help_text="Confidence core (0-100)")
    severity = models.CharField(max_length=20, blank=True, null=True)
    
    TREATMENT_STATUS_CHOICES = [
        ('untreated', 'Untreated'),
        ('in_progress', 'Treatment in Progress'),
        ('treated', 'Treated/Resolved'),
    ]
    treatment_status = models.CharField(
        max_length=20,
        choices=TREATMENT_STATUS_CHOICES,
        default='untreated',
        help_text="Status of the treatment for this diagnosis"
    )
    
    is_healthy = models.BooleanField(default=False)
    is_plant_image = models.BooleanField(default=True, help_text="False if image is not a plant leaf")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction by {self.user.username} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']
