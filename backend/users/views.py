
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
import random
from .serializers import UserRegistrationSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class ForgotPasswordCodeView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get('email') # the payload still uses key 'email'
        if not identifier:
            return Response({'error': 'Email or phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        from django.db.models import Q
        user = User.objects.filter(Q(email=identifier) | Q(phone_number=identifier)).first()
        if not user:
            return Response({'error': 'invalid id'}, status=status.HTTP_404_NOT_FOUND)
        code = str(random.randint(100000, 999999))
        cache.set(f"pwd_reset_{identifier}", code, timeout=120) # Valid for 2 minutes
        if user.phone_number and identifier == user.phone_number:
            print(f"\n[{timezone.now()}] > MOCK SMS SENT TO {user.phone_number}    \nYour Smart Plant Health reset code is {code}\n")
            return Response({'message': 'Reset code sent via SMS successfully.'}, status=status.HTTP_200_OK)
        if not user.email:
            return Response({'error': 'Account has no email attached to send code to.'}, status=status.HTTP_400_BAD_REQUEST)
        email = user.email
        html_message = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                <tr><td style="padding:32px 40px 0;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Smart Plant Health</p>
                </td></tr>
                <tr><td style="padding:32px 40px;">
                  <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Reset your password</h1>
                  <p style="margin:0 0 32px;font-size:16px;color:#6b7280;line-height:1.6;">Use the code below to reset your password. If you didn't request this, ignore this email.</p>
                  <div style="background:#f3f4f6;border-radius:10px;padding:28px;text-align:center;margin-bottom:32px;">
                    <span style="font-size:40px;font-weight:800;letter-spacing:16px;color:#111827;font-family:monospace;">{code}</span>
                  </div>
                  <p style="margin:0;font-size:14px;color:#9ca3af;">This code expires in 2 minutes.</p>
                </td></tr>
                <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:13px;color:#9ca3af;">&copy; 2026 Smart Plant Health Management System. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        plain_message = f'Your password reset code is: {code}\n\nThis code expires in 2 minutes.\n\nIf you did not request this, ignore this email.'
        try:
            send_mail(
                subject='Reset your password - Smart Plant Health',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
                html_message=html_message,
            )
        except Exception as e:
            error_msg = str(e)
            return Response({
                'error': f'Failed to send email: {error_msg}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'Reset code sent successfully.'}, status=status.HTTP_200_OK)
class VerifyOtpView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get('email')
        code = request.data.get('code')
        if not identifier or not code:
            return Response({'error': 'Identifier and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        cached_code = cache.get(f"pwd_reset_{identifier}")
        if not cached_code or str(cached_code) != str(code):
            return Response({'error': 'wrong code'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'message': 'Code verified successfully.'}, status=status.HTTP_200_OK)

class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not identifier or not code or not new_password:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            
        cached_code = cache.get(f"pwd_reset_{identifier}")
        
        if not cached_code or str(cached_code) != str(code):
            return Response({'error': 'wrong code'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db.models import Q
        user = User.objects.get(Q(email=identifier) | Q(phone_number=identifier))
        user.set_password(new_password)
        user.save()
        cache.delete(f"pwd_reset_{identifier}")
        
        return Response({'message': 'Password has been reset successfully. You can now login.'}, status=status.HTTP_200_OK)

class SendPhoneOtpView(APIView):
    """Send a one-time code to a phone number before account creation."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone_number = request.data.get('phone_number', '').strip()
        if not phone_number:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(phone_number=phone_number).exists():
            return Response({'error': 'This phone number is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        code = str(random.randint(100000, 999999))
        cache.set(f"phone_verify_{phone_number}", code, timeout=300)  # 5 minutes

        # Mock SMS - print to console (replace with Twilio/SparkPost for production)
        print(f"\n[{timezone.now()}] > MOCK SMS TO {phone_number}    \nYour Smart Plant Health verification code is: {code}\n")

        return Response({
            'message': f'Verification code sent to {phone_number}.',
            'mock_code': code  # For testing/demo purposes
        }, status=status.HTTP_200_OK)


class VerifyPhoneOtpView(APIView):
    """Verify the one-time code for a phone number."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone_number = request.data.get('phone_number', '').strip()
        code = request.data.get('code', '').strip()

        if not phone_number or not code:
            return Response({'error': 'Phone number and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_code = cache.get(f"phone_verify_{phone_number}")
        if not cached_code or str(cached_code) != str(code):
            return Response({'error': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark as verified so registration can proceed
        cache.set(f"phone_verified_{phone_number}", True, timeout=600)  # 10 minutes to complete registration
        return Response({'message': 'Phone number verified successfully.'}, status=status.HTTP_200_OK)


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
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required to delete account.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(password):
            return Response({'error': 'Incorrect password. Account deletion aborted.'}, status=status.HTTP_403_FORBIDDEN)
        
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
            return Response({
                'refresh': str(refresh), 
                'access': str(refresh.access_token), 
                'username': target_user.username, 
                'email': target_user.email,
                'user_id': target_user.id,
                'is_staff': target_user.is_staff,
                'is_superuser': target_user.is_superuser
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


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
        non_plant_predictions = Prediction.objects.filter(is_plant_image=False).count()
        healthy_predictions = Prediction.objects.filter(is_plant_image=True, is_healthy=True).count()
        diseased_predictions = Prediction.objects.filter(is_plant_image=True, is_healthy=False, predicted_disease__isnull=False).count()
        out_of_scope_predictions = Prediction.objects.filter(is_plant_image=True, is_healthy=False, predicted_disease__isnull=True).count()

        new_users_7d = User.objects.filter(date_joined__gte=last_7_days).count()
        new_predictions_7d = Prediction.objects.filter(created_at__gte=last_7_days).count()
        new_predictions_30d = Prediction.objects.filter(created_at__gte=last_30_days).count()
        recent_predictions = Prediction.objects.select_related('user', 'predicted_disease').order_by('-created_at')[:10]
        recent_list = []
        for p in recent_predictions:
            username = p.user.username if p.user else "Anonymous"
            image_url = p.image.url if p.image else None
            recent_list.append({
                'id': p.id, 
                'username': username, 
                'image': image_url,
                'disease': p.predicted_disease.name if p.predicted_disease else 'Unknown', 
                'confidence': float(p.confidence), 
                'severity': p.severity, 
                'is_healthy': p.is_healthy, 
                'created_at': p.created_at.isoformat()
            })
        top_users = User.objects.annotate(pred_count=Count('predictions')).order_by('-pred_count')[:5].values('id', 'username', 'email', 'pred_count', 'date_joined')
        return Response({
            'stats': {
                'total_users': total_users, 
                'total_plants': total_plants, 
                'total_predictions': total_predictions, 
                'diseased_predictions': diseased_predictions, 
                'healthy_predictions': healthy_predictions, 
                'out_of_scope_predictions': out_of_scope_predictions,
                'non_plant_predictions': non_plant_predictions,
                'new_users_7d': new_users_7d, 
                'new_predictions_7d': new_predictions_7d, 
                'new_predictions_30d': new_predictions_30d
            }, 
            'recent_predictions': recent_list, 
            'top_users': list(top_users)
        })


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
            disease_name = p.predicted_disease.name if p.predicted_disease else 'Unknown'
            image_url = request.build_absolute_uri(p.image.url) if p.image else None
            pred_list.append({
                'id': p.id, 
                'disease': disease_name, 
                'confidence': float(p.confidence), 
                'severity': p.severity, 
                'is_healthy': p.is_healthy, 
                'created_at': p.created_at.isoformat(), 
                'image': image_url
            })
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
            if not p.is_plant_image:
                category = "non_plant"
            elif p.is_healthy:
                category = "healthy"
            elif p.predicted_disease:
                category = "diseased"
            else:
                category = "out_of_scope"
                
            pred_list.append({
                'id': p.id, 
                'username': p.user.username if p.user else "Anonymous", 
                'user_id': p.user.id if p.user else None, 
                'disease': p.predicted_disease.name if p.predicted_disease else 'Unknown', 
                'confidence': float(p.confidence), 
                'severity': p.severity, 
                'is_healthy': p.is_healthy, 
                'category': category,
                'created_at': p.created_at.isoformat() if p.created_at else None, 
                'image': request.build_absolute_uri(p.image.url) if p.image else None
            })
        return Response(pred_list)


class AdminAllPlantsView(APIView):
    """View all plants in the system (Admin only)"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from plants.models import Plant
        # Removed .prefetch_related('diseases') as Plant model has no direct 'diseases' relationship field.
        plants = Plant.objects.select_related('user').order_by('-created_at')
        plant_list = []
        for p in plants:
            plant_list.append({
                'id': p.id,
                'name': p.name,
                'scientific_name': p.scientific_name,
                'owner': p.user.username if p.user else "Anonymous",
                'owner_id': p.user.id if p.user else None,
                'health_status': p.health_status,
                'is_healthy': p.health_status == 'healthy',
                'created_at': p.created_at.isoformat(),
                'image': request.build_absolute_uri(p.image.url) if p.image else None,
                'sunlight_display': p.get_sunlight_display_verbose(),
                'water_frequency_display': p.get_water_frequency_display_verbose()
            })
        return Response(plant_list)


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


class AdminEcommerceOverviewView(APIView):
    """Admin: E-commerce KPIs - products, orders, revenue, coupons, reviews."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from ecommerce.models import Product, Order, OrderItem, Coupon, Review, Category
        from django.db.models import Sum, Count, Q

        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        out_of_stock = Product.objects.filter(stock=0, is_active=True).count()
        low_stock_count = Product.objects.filter(stock__gt=0, stock__lte=10, is_active=True).count()
        total_categories = Category.objects.count()

        orders = Order.objects.all()
        total_orders = orders.count()
        pending_orders = orders.filter(status='pending').count()
        processing_orders = orders.filter(status='processing').count()
        shipped_orders = orders.filter(status='shipped').count()
        delivered_orders = orders.filter(status='delivered').count()
        cancelled_orders = orders.filter(status='cancelled').count()
        total_revenue = orders.exclude(status='cancelled').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        total_coupons = Coupon.objects.count()
        active_coupons = Coupon.objects.filter(is_active=True).count()
        total_reviews = Review.objects.count()
        avg_rating = Review.objects.aggregate(avg=models_avg_rating())['avg'] or 0

        # Top 5 selling products
        top_products = (
            OrderItem.objects
            .values('product__id', 'product__name')
            .annotate(units_sold=Sum('quantity'), revenue=Sum('price'))
            .order_by('-units_sold')[:5]
        )

        # Low stock products
        low_stock_products = list(
            Product.objects.filter(stock__lte=10, is_active=True)
            .order_by('stock')
            .values('id', 'name', 'stock', 'low_stock_threshold')[:10]
        )

        # Revenue last 6 months
        from django.utils import timezone
        from datetime import timedelta
        monthly = []
        for i in range(5, -1, -1):
            month_start = timezone.now().replace(day=1) - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            rev = orders.exclude(status='cancelled').filter(
                created_at__gte=month_start, created_at__lt=month_end
            ).aggregate(t=Sum('total_amount'))['t'] or 0
            monthly.append({'month': month_start.strftime('%b %Y'), 'revenue': float(rev)})

        return Response({
            'products': {
                'total': total_products,
                'active': active_products,
                'out_of_stock': out_of_stock,
                'low_stock': low_stock_count,
                'categories': total_categories,
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'processing': processing_orders,
                'shipped': shipped_orders,
                'delivered': delivered_orders,
                'cancelled': cancelled_orders,
                'total_revenue': float(total_revenue),
            },
            'coupons': {
                'total': total_coupons,
                'active': active_coupons,
            },
            'reviews': {
                'total': total_reviews,
                'avg_rating': round(float(avg_rating), 1),
            },
            'top_products': [
                {
                    **item, 
                    'revenue': float(item['revenue'] or 0)
                } for item in top_products
            ],
            'low_stock_products': low_stock_products,
            'monthly_revenue': monthly,
        })


def models_avg_rating():
    """Helper to avoid circular import - returns Avg expression for Review.rating."""
    from django.db.models import Avg
    return Avg('rating')


class AdminOrderManageView(APIView):
    """Admin: Update order status and payment status."""
    permission_classes = [IsAdminUser]

    def patch(self, request, order_id):
        from ecommerce.models import Order, Notification
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        new_payment_status = request.data.get('payment_status')

        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        valid_payment_statuses = ['unpaid', 'paid', 'refunded']

        if new_status and new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=400)
        if new_payment_status and new_payment_status not in valid_payment_statuses:
            return Response({'error': f'Invalid payment_status. Must be one of: {valid_payment_statuses}'}, status=400)

        changed = []
        if new_status and order.status != new_status:
            order.status = new_status
            changed.append('status')
            # Send notification to user
            notif_map = {
                'shipped': ('order_shipped', f'Order #{order.id} has been Shipped!', 'Your order is on its way.'),
                'delivered': ('order_delivered', f'Order #{order.id} Delivered!', 'Your order has been delivered successfully.'),
                'cancelled': ('order_cancelled', f'Order #{order.id} Cancelled', 'Your order has been cancelled by the admin.'),
            }
            if new_status in notif_map:
                ntype, title, msg = notif_map[new_status]
                Notification.objects.create(
                    user=order.user,
                    notification_type=ntype,
                    title=title,
                    message=msg,
                    link='/orders'
                )
                
                # Mock SMS sending to user's phone if attached
                if order.user.phone_number:
                    from django.utils import timezone
                    print(f"\n[{timezone.now()}] > MOCK E-COMMERCE SMS TO {order.user.phone_number}    \n{title}: {msg}\n")

        if new_payment_status and order.payment_status != new_payment_status:
            order.payment_status = new_payment_status
            changed.append('payment_status')

        if changed:
            order.save()

        return Response({
            'id': order.id,
            'status': order.status,
            'payment_status': order.payment_status,
            'updated_fields': changed,
            'message': f'Order #{order.id} updated successfully.'
        })
