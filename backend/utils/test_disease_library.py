from django.test import TestCase
from diseases.models import Disease

class BackendDiseaseLibraryTest(TestCase):
    def test_adding_new_disease(self):
        print("\n--- Starting Backend Disease Library Test ---")
        
        # 1. Simulate saving a brand new disease profile to the database
        disease = Disease.objects.create(
            name='Powdery Mildew',
            disease_type='fungal',
            severity_level='moderate',
            symptoms='White powdery spots on leaves.',
            is_contagious=True
        )
        
        # 2. Verify exactly what the database recorded
        self.assertEqual(disease.name, 'Powdery Mildew')
        self.assertEqual(disease.disease_type, 'fungal')
        self.assertTrue(disease.is_contagious)
        
        print("--- Backend Disease Library Test Passed Successfully! ---")
