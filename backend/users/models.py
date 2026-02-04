
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """
    Custom user model for the Smart Plant Health platform.
    
    We've customized this to use 'email' as the primary identifier instead
    of a traditional username. However, we still support a 'username' field
    for personalization and to allow login via your preferred choice.
    """
    email = models.EmailField(unique=True)
    
    # We prioritize the email for identification
    USERNAME_FIELD = 'email'
    # These fields are required when creating a user via 'createsuperuser'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
