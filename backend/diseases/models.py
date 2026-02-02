
from django.db import models
from plants.models import Plant

class Disease(models.Model):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='diseases')
    name = models.CharField(max_length=150, help_text="Name of the disease")
    symptoms = models.TextField(help_text="Detailed symptoms of the disease")
    cause = models.TextField(blank=True, help_text="What causes this disease?")
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='diseases/images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.plant.name})"

    class Meta:
        unique_together = ('plant', 'name')
        ordering = ['plant', 'name']


class Treatment(models.Model):
    TYPE_CHOICES = (
        ('organic', 'Organic'),
        ('chemical', 'Chemical'),
    )

    disease = models.ForeignKey(Disease, on_delete=models.CASCADE, related_name='treatments')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200, help_text="Short title of the treatment")
    description = models.TextField()
    instructions = models.TextField(help_text="Step-by-step instructions")
    
    def __str__(self):
        return f"{self.type.title()} treatment for {self.disease.name}"

    class Meta:
        ordering = ['disease', 'type']
