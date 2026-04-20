from django.test import TestCase
from ecommerce.models import Category, Product

class BackendEcommerceTest(TestCase):
    def test_marketplace_product_creation(self):
        print("\n--- Starting Backend Marketplace Test ---")
        
        # 1. Simulate creating a category for the marketplace
        category = Category.objects.create(
            name='Fungicides',
            description='Treatment for fungal diseases.'
        )
        
        # 2. Simulate placing a new organic product on the shelf
        product = Product.objects.create(
            category=category,
            name='Organic Neem Oil',
            description='Safe treatment for various pests.',
            price=250.00,
            stock=15,
            is_organic=True
        )
        
        # 3. Verify exactly what the marketplace database stored
        self.assertEqual(product.name, 'Organic Neem Oil')
        self.assertEqual(product.price, 250.00)
        self.assertTrue(product.is_organic)
        self.assertEqual(product.category.name, 'Fungicides')
        
        print("--- Backend Marketplace Test Passed Successfully! ---")
