"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from users.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

def api_root(request):
    return JsonResponse({
        "status": "online",
        "message": "Smart Plant Health Management System - API is running",
        "application": "Smart Plant Health Management System",
        "frontend_url": "Smart Plant Health Management System",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "plants": "/api/plants/",
            "diseases": "/api/diseases/",
            "predictions": "/api/predictions/",
            "ecommerce": "/api/ecommerce/",
            "chat": "/api/chat/",
            "soil": "/api/soil/",
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/plants/', include('plants.urls')),
    path('api/diseases/', include('diseases.urls')),
    path('api/predictions/', include('predictions.urls')),
    path('api/ecommerce/', include('ecommerce.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/soil/', include('soil.urls')),
    path('', api_root),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    
    pass
