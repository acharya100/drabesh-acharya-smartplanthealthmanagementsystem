from django.test import TestCase
from ecommerce.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendEcommerceOrdersTest(TestCase):
    def test_marketplace_order_processing(self):
        print("\n--- Starting Backend Marketplace Orders Test ---")
        
        # 1. Create a dummy buyer for the marketplace
        buyer = User.objects.create_user(username='customer_dave', password='password123')
        
        # 2. Simulate processing a new order checkout securely in the backend
        order = Order.objects.create(
            user=buyer,
            status='pending',
            payment_status='paid',
            total_amount=1500.50,
            shipping_address='123 Green Valley Road, Springfield',
            payment_method='credit_card'
        )
        
        # 3. Verify exactly what the marketplace database stored
        self.assertEqual(order.user.username, 'customer_dave')
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.payment_status, 'paid')
        self.assertEqual(order.total_amount, 1500.50)
        
        print("--- Backend Marketplace Orders Test Passed Successfully! ---")
