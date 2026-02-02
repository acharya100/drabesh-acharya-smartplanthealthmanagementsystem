
from django.db import models

class Plant(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Common name of the plant")
    scientific_name = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='plants/icons/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
