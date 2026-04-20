from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from ecommerce.models import Order
User = get_user_model()
class BackendAdminOrdersListTest(TestCase):
    def test_admin_orders_listing_and_statuses(self):
        print("\n--- Starting Backend Admin 'Orders' List Test ---")
        user1 = User.objects.create_user(username='DraBesh', email='drabesh@example.com', password='password123')
        user2 = User.objects.create_user(username='john', email='john@example.com', password='password123')
        Order.objects.create(
            id=31, user=user1, status='delivered',
            payment_status='paid',
            total_amount=Decimal('580.00'),
            payment_method='cod')
        Order.objects.create(
            id=29, user=user1, status='shipped',
            payment_status='unpaid',
            total_amount=Decimal('575.00'),
            payment_method='cod')
        Order.objects.create(
            id=28, user=user2, status='cancelled',
            payment_status='refunded',
            total_amount=Decimal('540.00'),
            payment_method='cod')
        all_orders = Order.objects.all().order_by('-id')
        self.assertEqual(all_orders.count(), 3)
        order_31 = Order.objects.get(id=31)
        self.assertEqual(order_31.user.username, 'DraBesh')
        self.assertEqual(order_31.status, 'delivered')
        self.assertEqual(order_31.payment_status, 'paid')
        self.assertEqual(order_31.total_amount, Decimal('580.00'))
        order_28 = Order.objects.get(id=28)
        self.assertEqual(order_28.user.username, 'john')
        self.assertEqual(order_28.status, 'cancelled')
        self.assertEqual(order_28.payment_status, 'refunded')
        print("--- Backend Admin 'Orders' List Test Passed Successfully! ---")
