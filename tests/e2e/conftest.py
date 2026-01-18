import os

import pytest

# Allow running live server interactions from synchronous Playwright tests.
os.environ.setdefault("DJANGO_ALLOW_ASYNC_UNSAFE", "true")


@pytest.fixture(scope="session", autouse=True)
def use_compiled_vite_assets():
    """Force django-vite to serve built assets so Vue renders in tests."""
    from django.conf import settings as django_settings

    django_settings.DJANGO_VITE["default"]["dev_mode"] = False


@pytest.fixture(scope="session")
def base_url(live_server):
    """Expose the live server URL so Playwright tests can build absolute URLs."""
    return live_server.url
