
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'
    
    def validate(self, attrs):
        # Map 'username' to 'email' for authentication
        credentials = {
            'email': attrs.get('username'),
            'password': attrs.get('password')
        }
        
        # Call parent validate with modified attrs
        attrs_copy = attrs.copy()
        attrs_copy['email'] = attrs_copy.pop('username')
        
        # Use the parent class validation but with email
        from django.contrib.auth import authenticate
        
        user = authenticate(
            request=self.context.get('request'),
            username=credentials['email'],  # Django's authenticate uses 'username' kwarg but checks USERNAME_FIELD
            password=credentials['password']
        )
        
        if user is None:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed('No active account found with the given credentials')
        
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        return data
