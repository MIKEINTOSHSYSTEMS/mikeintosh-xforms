import pytest
from playwright.sync_api import expect


@pytest.mark.e2e
def test_forms_empty_state(page, base_url):
    page.goto(f"{base_url}/forms/", wait_until="networkidle")
    expect(
        page.get_by_text("No forms available yet. Create one to get started.")
    ).to_be_visible()
