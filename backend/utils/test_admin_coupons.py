from decimal import Decimal
from django.test import TestCase
from ecommerce.models import Coupon

class BackendAdminCouponsTest(TestCase):
    def test_admin_coupon_listing_and_types(self):
        print("\n--- Starting Backend Admin 'Coupons' List Test ---")
        Coupon.objects.create(
            code='goo122',
            discount_type='fixed', 
            discount_value=Decimal('5.00'),
            min_order_amount=Decimal('2.00'),
            is_active=True
        )
        Coupon.objects.create(
            code='PROPLANT2026',
            discount_type='percentage',
            discount_value=Decimal('15.00'),
            min_order_amount=Decimal('0.00'),
            is_active=True
        )
        active_coupons = Coupon.objects.filter(is_active=True).order_by('code')
        
        self.assertEqual(active_coupons.count(), 2)
        
        fixed_coupon = Coupon.objects.get(code='goo122')
        self.assertEqual(fixed_coupon.discount_value, Decimal('5.00'))
        self.assertEqual(fixed_coupon.min_order_amount, Decimal('2.00'))
        
        percentage_coupon = Coupon.objects.get(code='PROPLANT2026')
        self.assertEqual(percentage_coupon.discount_value, Decimal('15.00'))
        self.assertEqual(percentage_coupon.discount_type, 'percentage')
        self.assertEqual(percentage_coupon.min_order_amount, Decimal('0.00'))
        
        print("--- Backend Admin 'Coupons' List Test Passed Successfully! ---")
