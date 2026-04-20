from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from ecommerce.models import Product, Order, Category, Coupon
User = get_user_model()
class BackendEcommerceOverviewTest(TestCase):
    def test_ecommerce_analytics_and_status(self):
        print("\n--- Starting Backend E-Commerce Overview Test ---")
        user = User.objects.create_user(username='buyer1', password='password123')
        category = Category.objects.create(name='Test Category', slug='test-cat')
        for i in range(15):
            Product.objects.create(
                category=category,
                name=f'Product {i}',
                price=Decimal('100.00'),
                stock=20,
                sku=f'SKU-{i}'
            )   
        Coupon.objects.create(code='SAVE10', discount_value=Decimal('10.00'), is_active=True)
        Coupon.objects.create(code='FALL20', discount_value=Decimal('20.00'), is_active=True)
        for _ in range(7):
            Order.objects.create(user=user, status='pending', total_amount=Decimal('500.00'), payment_status='unpaid')
        for _ in range(2):
            Order.objects.create(user=user, status='shipped', total_amount=Decimal('400.00'), payment_status='paid')
        for _ in range(3):
            Order.objects.create(user=user, status='delivered', total_amount=Decimal('771.33'), payment_status='paid')
        Order.objects.create(user=user, status='cancelled', total_amount=Decimal('0.00'), payment_status='unpaid')
        self.assertEqual(Product.objects.count(), 15)
        self.assertEqual(Order.objects.count(), 13)
        self.assertEqual(Coupon.objects.filter(is_active=True).count(), 2)
        self.assertEqual(Order.objects.filter(status='pending').count(), 7)
        self.assertEqual(Order.objects.filter(status='delivered').count(), 3)
        total_revenue = sum(o.total_amount for o in Order.objects.filter(payment_status='paid'))
        self.assertEqual(total_revenue, Decimal('3113.99'))
        
        print("--- Backend E-Commerce Overview Test Passed Successfully! ---")
