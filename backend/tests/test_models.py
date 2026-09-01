import pytest
from django.db import IntegrityError
from ecommerce.models import Category, Product
from plants.models import Plant
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestDatabaseModels:
    """
    Database Model Tests (PostgreSQL integration)
    Validates data creation and constraint integrity.
    """
    
    def test_product_model_creation(self):
        """Test Case: Model Creation and Relationships validation."""
        # Arrange
        cat = Category.objects.create(name='Tools', slug='tools')
        
        # Act
        product = Product.objects.create(
            category=cat,
            name='Shovel',
            price=150.00,
            stock=10
        )
        
        # Assert
        assert product.name == 'Shovel'
        assert product.category.name == 'Tools'
        assert product.price == 150.00

    def test_user_email_unique_constraint(self):
        """Test Case: Database constraints (unique email)."""
        User.objects.create_user(username='user1', email='unique@test.com', password='pw')
        
        with pytest.raises(IntegrityError):
            User.objects.create_user(username='user1', email='other@test.com', password='pw')
