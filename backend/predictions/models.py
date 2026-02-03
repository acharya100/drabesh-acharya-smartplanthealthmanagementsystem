
from django.db import models
from django.conf import settings
from plants.models import Plant
from diseases.models import Disease

class Prediction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions')
    image = models.ImageField(upload_to='predictions/images/')
    predicted_plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True)
    predicted_disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=2, help_text="Confidence core (0-100)")
    severity = models.CharField(max_length=20, blank=True, null=True)
    is_healthy = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction by {self.user.username} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']
