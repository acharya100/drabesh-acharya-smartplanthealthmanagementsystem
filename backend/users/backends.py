
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
   
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
            
        try:
            # Look for a user whose email matches the input, or whose username matches
            user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
            
            # If a user is found, check if their password is correct
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            # If no user is found, we just return None and let other backends try
            return None
        except User.MultipleObjectsReturned:
            # This shouldn't happen with unique constraints, but as a safety measure
            return User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).first()
        
        return None
