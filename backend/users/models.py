
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
  
    email = models.EmailField(unique=True)
    
    # We prioritize the email for identification
    USERNAME_FIELD = 'email'
    # These fields are required when creating a user via 'createsuperuser'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
