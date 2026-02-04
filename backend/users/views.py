
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'Both old and new passwords are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )

class UpdateProfileView(APIView):
    """
    Handles fetching and updating the user's personal profile information.
    
    This is where users can come to change their display name (username) or 
    update their email address if it changes. We make sure to check for 
    duplicates so nobody accidentally takes someone else's username or email!
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Simply return the current user's details so the frontend can pre-fill the form
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email
        })

    def post(self, request):
        user = request.user
        email = request.data.get('email')
        username = request.data.get('username')

        # If a new email is provided, we need to make sure it's not already in use
        if email:
            # Check if email is already taken by another user
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response(
                    {'error': 'Whoops! That email is already registered to another account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = email

        # Same goes for the username - it needs to be unique across our platform
        if username:
            # Check if username is already taken by another user
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return Response(
                    {'error': 'Sorry, that username is already taken. Try something more unique!'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = username

        # Save the changes to our database
        user.save()

        return Response(
            {
                'message': 'Your profile has been updated successfully! ✨',
                'email': user.email,
                'username': user.username
            },
            status=status.HTTP_200_OK
        )

class DeleteAccountView(APIView):
    """
    The 'Danger Zone' view. This allows a user to permanently say goodbye
    and remove their account from our system.
    
    WARNING: This action is destructive and removes all plants and history
    associated with the user.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        # We find the requesting user and let them delete themselves
        user = request.user
        user.delete()
        # No content returned (204) since the user object is gone
        return Response(
            {'message': 'Your account has been permanently removed. We hope to see you again!'},
            status=status.HTTP_204_NO_CONTENT
        )

class UserListView(APIView):
    """
    Provides a list of all registered users.
    Useful for the 'Switch Account' feature to see available identities.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email')
        return Response(list(users))

class SwitchUserView(APIView):
    """
    Allows an authenticated user to switch to another account by obtaining its token.
    This facilitates easy testing and multi-account management.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(target_user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': target_user.username,
                'email': target_user.email
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
