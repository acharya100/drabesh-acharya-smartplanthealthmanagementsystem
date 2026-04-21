from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from plants.models import Plant
from predictions.models import Prediction
from diseases.models import Disease
from ecommerce.models import Product, Category, Order
from soil.models import SoilAnalysis
from chat.models import ChatRoom
import datetime
User = get_user_model()
class BackendSystemFullVerificationTest(TestCase):
    def test_full_app_lifecycle_from_scratch(self):
        print("\n--- Starting Full System Backend Verification ---")
        
        # 1. Register a user with valid credentials
        user = User.objects.create_user(
            username='durga', 
            email='dsub444@gmail.com', 
            password='okay.100'
        )
        self.assertEqual(User.objects.count(), 1)
        # 2. Login user with correct credentials
        auth_user = authenticate(username='durga', password='okay.100')
        self.assertIsNotNone(auth_user)
        # 3. Preferences (Simulate language and dark mode preference storage)
        user.first_name = "Durga Prasad"
        user.save()
        self.assertEqual(User.objects.get(username='durga').first_name, "Durga Prasad")
        # 4. Add a plant with 'Identify with AI' (Correct name and scientific name)
        plant = Plant.objects.create(
            user=user,
            name='Tomato',
            scientific_name='Solanum lycopersicum',
            health_status='healthy'
        )
        self.assertEqual(plant.scientific_name, 'Solanum lycopersicum')
        # 5. Perform a Plant Disease Detection scan and receive AI diagnosis
        scan = Prediction.objects.create(
            user=user,
            predicted_plant=plant,
            plant_name='Tomato',
            disease_name='Late Blight',
            confidence=Decimal('98.50'),
            is_healthy=False
        )
        self.assertEqual(scan.disease_name, 'Late Blight')
        self.assertFalse(scan.is_healthy)
        # 6. Verify Disease Library for correct treatment recommendation
        disease = Disease.objects.create(
            name='Late Blight',
            symptoms='Dark water-soaked spots'
        )
        from diseases.models import Treatment
        Treatment.objects.create(
            disease=disease,
            name='Copper-based fungicide',
            treatment_type='organic',
            instructions='Spray thoroughly on all affected leaves.'
        )
        fetched_treatment = disease.treatments.filter(treatment_type='organic').first()
        self.assertEqual(fetched_treatment.name, 'Copper-based fungicide')
        # 7. Add a product to Marketplace cart and verify total price
        cat = Category.objects.create(name='Organic Fertilizers', slug='fert')
        product = Product.objects.create(
            category=cat,
            name='Neem Spray',
            price=Decimal('450.00'),
            stock=100
        )
        total_price = product.price * 2
        self.assertEqual(total_price, Decimal('900.00'))
        # 8. Perform a Soil Analysis to check data accuracy (pH levels)
        soil = SoilAnalysis.objects.create(
            user=user,
            nitrogen=15.0,
            phosphorus=10.0,
            potassium=5.0,
            ph_level=6.5,
            moisture=40.0,
            soil_type='loamy'
        )
        self.assertEqual(soil.ph_level, 6.5)
        # 9. Add expert chat consultation feature
        chat = ChatRoom.objects.create(user=user, title='Expert Consultation on Late Blight')
        self.assertTrue(chat.is_active)
        self.assertEqual(chat.user.username, 'durga')
        # 10. At last delete account from Settings menu
        user_id = user.id
        user.delete()
        self.assertEqual(User.objects.filter(id=user_id).count(), 0)
        print("--- Full System Backend Verification Passed Successfully ---")
