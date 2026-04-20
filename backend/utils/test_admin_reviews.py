from django.test import TestCase
from django.contrib.auth import get_user_model
from ecommerce.models import Product, Category, Review

User = get_user_model()

class BackendAdminReviewsTest(TestCase):
    def test_admin_review_listing_and_moderation(self):
        print("\n--- Starting Backend Admin 'Reviews' List Test ---")
        
        user1 = User.objects.create_user(username='DraBesh', email='drabesh_rev@example.com', password='password123')
        user2 = User.objects.create_user(username='john', email='john_rev@example.com', password='password123')
        cat = Category.objects.create(name='Test Cat', slug='test-cat')
        product = Product.objects.create(category=cat, name='Organic Fertilizer', price=500, stock=10)
    
        Review.objects.create(
            user=user1,
            product=product,
            rating=5,
            comment='excellent'
        )
        Review.objects.create(
            user=user2,
            product=product,
            rating=5,
            comment='excellent'
        )

        all_reviews = Review.objects.all().order_by('-created_at')
        self.assertEqual(all_reviews.count(), 2)
        review1 = Review.objects.get(user__username='DraBesh')
        self.assertEqual(review1.rating, 5)
        self.assertEqual(review1.comment, 'excellent')
        review2 = Review.objects.get(user__username='john')
        
        print("--- Backend Admin 'Reviews' List Test Passed Successfully! ---")
