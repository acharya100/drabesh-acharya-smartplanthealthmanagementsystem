
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
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
            return Response({'error': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'username': user.username, 'email': user.email})

    def post(self, request):
        user = request.user
        email = request.data.get('email')
        username = request.data.get('username')
        if email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({'error': 'Whoops! That email is already registered to another account.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
        if username:
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return Response({'error': 'Sorry, that username is already taken. Try something more unique!'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
        user.save()
        return Response({'message': 'Your profile has been updated successfully!', 'email': user.email, 'username': user.username}, status=status.HTTP_200_OK)

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'message': 'Your account has been permanently removed.'}, status=status.HTTP_204_NO_CONTENT)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email')
        return Response(list(users))

class SwitchUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=user_id)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(target_user)
            return Response({'refresh': str(refresh), 'access': str(refresh.access_token), 'username': target_user.username, 'email': target_user.email})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# ============================================================
# ADMIN PANEL VIEWS
# ============================================================

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from plants.models import Plant
        from predictions.models import Prediction
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        total_users = User.objects.count()
        total_plants = Plant.objects.count()
        total_predictions = Prediction.objects.count()
        diseased_predictions = Prediction.objects.filter(is_healthy=False).count()
        healthy_predictions = Prediction.objects.filter(is_healthy=True).count()
        new_users_7d = User.objects.filter(date_joined__gte=last_7_days).count()
        new_predictions_7d = Prediction.objects.filter(created_at__gte=last_7_days).count()
        new_predictions_30d = Prediction.objects.filter(created_at__gte=last_30_days).count()
        recent_predictions = Prediction.objects.select_related('user', 'predicted_disease').order_by('-created_at')[:10]
        recent_list = []
        for p in recent_predictions:
            recent_list.append({'id': p.id, 'username': p.user.username, 'disease': p.predicted_disease.name if p.predicted_disease else 'Unknown', 'confidence': float(p.confidence), 'severity': p.severity, 'is_healthy': p.is_healthy, 'created_at': p.created_at.isoformat()})
        top_users = User.objects.annotate(pred_count=Count('predictions')).order_by('-pred_count')[:5].values('id', 'username', 'email', 'pred_count', 'date_joined')
        return Response({'stats': {'total_users': total_users, 'total_plants': total_plants, 'total_predictions': total_predictions, 'diseased_predictions': diseased_predictions, 'healthy_predictions': healthy_predictions, 'new_users_7d': new_users_7d, 'new_predictions_7d': new_predictions_7d, 'new_predictions_30d': new_predictions_30d}, 'recent_predictions': recent_list, 'top_users': list(top_users)})


class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.annotate(plant_count=Count('plants', distinct=True), prediction_count=Count('predictions', distinct=True)).order_by('-date_joined')
        user_list = []
        for u in users:
            user_list.append({'id': u.id, 'username': u.username, 'email': u.email, 'is_staff': u.is_staff, 'is_superuser': u.is_superuser, 'is_active': u.is_active, 'date_joined': u.date_joined.isoformat(), 'last_login': u.last_login.isoformat() if u.last_login else None, 'plant_count': u.plant_count, 'prediction_count': u.prediction_count})
        return Response(user_list)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        from plants.models import Plant
        from predictions.models import Prediction
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        plants = Plant.objects.filter(user=user).values('id', 'name', 'scientific_name', 'created_at')
        predictions = Prediction.objects.filter(user=user).select_related('predicted_disease').order_by('-created_at')
        pred_list = []
        for p in predictions:
            pred_list.append({'id': p.id, 'disease': p.predicted_disease.name if p.predicted_disease else 'Unknown', 'confidence': float(p.confidence), 'severity': p.severity, 'is_healthy': p.is_healthy, 'created_at': p.created_at.isoformat(), 'image': request.build_absolute_uri(p.image.url) if p.image else None})
        return Response({'user': {'id': user.id, 'username': user.username, 'email': user.email, 'is_staff': user.is_staff, 'date_joined': user.date_joined.isoformat(), 'last_login': user.last_login.isoformat() if user.last_login else None}, 'plants': list(plants), 'predictions': pred_list})

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if user == request.user:
                return Response({'error': 'You cannot delete your own account here.'}, status=status.HTTP_400_BAD_REQUEST)
            username = user.username
            user.delete()
            return Response({'message': f'User {username} deleted successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminAllPredictionsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from predictions.models import Prediction
        predictions = Prediction.objects.select_related('user', 'predicted_disease').order_by('-created_at')[:100]
        pred_list = []
        for p in predictions:
            pred_list.append({'id': p.id, 'username': p.user.username, 'user_id': p.user.id, 'disease': p.predicted_disease.name if p.predicted_disease else 'Unknown', 'confidence': float(p.confidence), 'severity': p.severity, 'is_healthy': p.is_healthy, 'created_at': p.created_at.isoformat(), 'image': request.build_absolute_uri(p.image.url) if p.image else None})
        return Response(pred_list)


class AdminToggleStaffView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        if not request.user.is_superuser:
            return Response({'error': 'Only superusers can change staff status.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=user_id)
            user.is_staff = not user.is_staff
            user.save()
            return Response({'message': f'Staff status for {user.username} set to {user.is_staff}.', 'is_staff': user.is_staff})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
