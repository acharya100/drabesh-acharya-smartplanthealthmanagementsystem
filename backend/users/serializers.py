
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
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
        # EmailOrUsernameModelBackend will check if input is an email or username and verify the password.
        user = authenticate(
            request=self.context.get('request'),
            username=attrs.get('username'), 
            password=attrs.get('password')
        )
        
        if user is None:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed('No active account found with the given credentials')
        
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'email': user.email,
            'user_id': user.id,
        }
        
        return data
