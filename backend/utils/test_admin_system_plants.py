from django.test import TestCase
from django.contrib.auth import get_user_model
from plants.models import Plant
User = get_user_model()
class BackendAdminSystemPlantsTest(TestCase):
    def test_admin_system_plants_listing(self):
        print("\n--- Starting Backend Admin 'System Plants' Test ---")
        owner = User.objects.create_user(username='DraBesh', password='password123')
        Plant.objects.create(
            user=owner,
            name='Peach',
            scientific_name='Prunus persica',
            health_status='healthy',
            sunlight_requirement='partial_sun',
            water_frequency='weekly')
        Plant.objects.create(
            user=owner,
            name='Out Of Scope',
            health_status='out_of_scope',
            sunlight_requirement='not_available',
            water_frequency='not_available')
        Plant.objects.create(
            user=owner,
            name='Non-Plant Image',
            health_status='non_plant',
            is_non_plant=True)
        system_plants = Plant.objects.all()
        self.assertEqual(system_plants.count(), 3)
        peach = Plant.objects.get(name='Peach')
        self.assertEqual(peach.health_status, 'healthy')
        self.assertEqual(peach.user.username, 'DraBesh')
        out_of_scope = Plant.objects.get(health_status='out_of_scope')
        self.assertEqual(out_of_scope.name, 'Out Of Scope')
        non_plant = Plant.objects.get(is_non_plant=True)
        self.assertEqual(non_plant.name, 'Non-Plant Image')
        print("--- Backend Admin 'System Plants' Test Passed Successfully! ---")
