from decimal import Decimal
from django.test import TestCase
from ecommerce.models import Product, Category

class BackendAdminCreateProductTest(TestCase):
    def test_product_creation_validation(self):
        print("\n--- Starting Backend 'Create Product' Validation Test ---")
        
        # 1. Setup a category first as it is required
        category = Category.objects.create(name='Tools', slug='tools')
        
        # 2. Simulate the data sent from the 'Create Product' form
        product_data = {
            'name': 'Ergonomic Garden Trowel',
            'price': Decimal('450.00'),
            'discount_price': Decimal('399.00'),
            'stock': 50,
            'sku': 'TOOL-001',
            'category': category,
            'description': 'A high-quality garden trowel with an ergonomic handle.',
            'usage_instructions': 'Use for digging small holes and planting seeds.'
        }
        # 3. Simulate the backend saving the new product
        new_product = Product.objects.create(**product_data)
        
        # 4. Verify the backend successfully saved all fields
        self.assertEqual(new_product.name, 'Ergonomic Garden Trowel')
        self.assertEqual(new_product.price, Decimal('450.00'))
        self.assertEqual(new_product.discount_price, Decimal('399.00'))
        self.assertEqual(new_product.stock, 50)
        self.assertEqual(new_product.sku, 'TOOL-001')
        self.assertEqual(new_product.category.name, 'Tools')
        self.assertEqual(new_product.description, 'A high-quality garden trowel with an ergonomic handle.')
        
        print("--- Backend 'Create Product' Test Passed Successfully! ---")
