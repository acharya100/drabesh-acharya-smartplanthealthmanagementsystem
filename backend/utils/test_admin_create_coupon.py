from django.utils import timezone
from datetime import datetime
from decimal import Decimal
from django.test import TestCase
from ecommerce.models import Coupon

class BackendAdminCreateCouponTest(TestCase):
    def test_coupon_creation_validation(self):
        print("\n--- Starting Backend 'New Coupon' Validation Test ---")
      
        valid_date = timezone.make_aware(datetime(2026, 4, 30, 23, 59, 59))
        
        coupon_data = {
            'code': 'SAV23',
            'discount_value': Decimal('22.00'),
            'min_order_amount': Decimal('0.00'),
            'max_uses': None, # Blank = Unlimited
            'valid_until': valid_date,
            'is_active': True,
            'discount_type': 'fixed' 
        }
        
        # 2. Simulate the backend saving the new coupon
        new_coupon = Coupon.objects.create(**coupon_data)
        
        # 3. Verify exactly what the backend stored
        self.assertEqual(new_coupon.code, 'SAV23')
        self.assertEqual(new_coupon.discount_value, Decimal('22.00'))
        self.assertEqual(new_coupon.discount_type, 'fixed')
        self.assertEqual(new_coupon.valid_until, valid_date)
        self.assertTrue(new_coupon.is_active)
        self.assertIsNone(new_coupon.max_uses)
        
        print("--- Backend 'New Coupon' Test Passed Successfully! ---")
