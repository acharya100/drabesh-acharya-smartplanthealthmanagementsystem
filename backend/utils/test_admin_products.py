from decimal import Decimal
from django.test import TestCase
from ecommerce.models import Product, Category
class BackendAdminProductsTest(TestCase):
    def test_admin_product_inventory_listing(self):
        print("\n--- Starting Backend Admin 'Products' Inventory Test ---")
        seeds_cat = Category.objects.create(name='Seeds & Bulbs', slug='seeds-bulbs')
        tools_cat = Category.objects.create(name='Tools & Equipment', slug='tools-equipment')
        fert_cat = Category.objects.create(name='Fertilizers & Nutrients', slug='fertilizers-nutrients')
        Product.objects.create(
            category=seeds_cat,
            name='Disease-Resistant Tomato Seeds',
            sku='MED-1015', price=Decimal('515.00'),
            stock=99, is_active=True)
        Product.objects.create(
            category=tools_cat,
            name='Pro Mist Sprayer Bottle',
            sku='MED-1014', price=Decimal('560.00'),
            stock=13, is_active=True)
        Product.objects.create(
            category=fert_cat,
            name='Magnesium Epsom Salt',
            sku='MED-1010', price=Decimal('525.00'),
            stock=100, is_active=True)
        all_products = Product.objects.all().order_by('-sku')
        self.assertEqual(all_products.count(), 3)
        tomato_seeds = Product.objects.get(sku='MED-1015')
        self.assertEqual(tomato_seeds.name, 'Disease-Resistant Tomato Seeds')
        self.assertEqual(tomato_seeds.price, Decimal('515.00'))
        self.assertEqual(tomato_seeds.category.name, 'Seeds & Bulbs')
        sprayer = Product.objects.get(sku='MED-1014')
        self.assertEqual(sprayer.stock, 13)
        epsom_salt = Product.objects.get(sku='MED-1010')
        self.assertEqual(epsom_salt.category.name, 'Fertilizers & Nutrients')
        self.assertEqual(epsom_salt.stock, 100)
        print("--- Backend Admin 'Products' Inventory Test Passed Successfully! ---")
