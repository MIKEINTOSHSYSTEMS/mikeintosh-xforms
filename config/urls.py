"""
URL configuration for config project.

The `urlconfig for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path

from .api import api
from .views import spa_entrypoint

# Define FRONTEND_DIR here as well
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / 'frontend'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    
    # Root path should also serve the Vue app
    path('', spa_entrypoint, name='spa_root'),
    
    # XLSPlay route
    path('xlsplay', spa_entrypoint, name='spa_xlsplay'),
    
    # Catch-all patterns for Vue Router - must be last
    re_path(r'^forms/.*$', spa_entrypoint, name='spa_forms'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve xlsform_examples from the frontend public directory
    urlpatterns += static('xlsform_examples/', document_root=FRONTEND_DIR / 'public/xlsform_examples')