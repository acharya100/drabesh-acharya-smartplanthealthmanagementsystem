
from django.db import models
from django.conf import settings
from plants.models import Plant
from diseases.models import Disease


class Prediction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions'
    )
    image = models.ImageField(upload_to='predictions/images/')
    predicted_plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True)
    predicted_disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)

    # Raw AI results
    plant_name   = models.CharField(max_length=100, blank=True, null=True)
    disease_name = models.CharField(max_length=150, blank=True, null=True)

    confidence     = models.DecimalField(max_digits=5, decimal_places=2, help_text="Confidence (0-100)")
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # ── Severity ──────────────────────────────────────────────────────────────
    SEVERITY_CHOICES = [
        ('minor',    'Minor'),
        ('moderate', 'Moderate'),
        ('severe',   'Severe'),
        ('low',      'Low'),
        ('high',     'High'),
        ('critical', 'Critical'),
        ('unknown',  'Unknown'),
    ]
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES, blank=True, null=True
    )

    # ── Treatment Status ──────────────────────────────────────────────────────
    TREATMENT_STATUS_CHOICES = [
        ('untreated',    'Not Started'),
        ('in_progress',  'Treatment In Progress'),
        ('treated',      'Mark as Treated'),
        ('healthy',      'Healthy (No Treatment Needed)'),
        ('non_plant',    'Non-Plant Image'),
        ('out_of_scope', 'Out of Scope'),
    ]
    treatment_status = models.CharField(
        max_length=20,
        choices=TREATMENT_STATUS_CHOICES,
        default='untreated',
        help_text="Current treatment status",
    )

    # ── Source (Where this scan originated) ──────────────────────────────
    SOURCE_CHOICES = [
        ('disease_detection', 'Disease Detection'),
        ('plant_identification', 'Plant Identification (My Plants)'),
    ]
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='disease_detection',
        help_text="Where this analysis originated from"
    )

    is_healthy     = models.BooleanField(default=False)
    is_plant_image = models.BooleanField(default=True, help_text="False if image is not a plant leaf")
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction by {self.user.username} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']
