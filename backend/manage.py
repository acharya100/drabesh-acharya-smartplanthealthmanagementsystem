#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


# ------------------------------------------------------------------------------
# AUTO-FIX: Ensure project dependencies are found even if venv is not active.
# This allows 'python manage.py runserver' to work with the global python.
try:
    import torch
    import django
except ImportError:
    # If imports fail, we are likely running with the wrong python.
    # Forcefully add the venv site-packages to sys.path.
    import os
    import sys
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    venv_site_packages = os.path.join(project_root, 'venv', 'Lib', 'site-packages')
    
    if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
        sys.path.insert(0, venv_site_packages)
# ------------------------------------------------------------------------------


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
