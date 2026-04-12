
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
  
    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    
    # We prioritize the username for identification
    USERNAME_FIELD = 'username'
    # These fields are required when creating a user via 'createsuperuser'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
