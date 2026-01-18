# Webapp to manage Monitoring and Evaluation data

## Structure
- Django backend, with settings in `config/`
- Vue+TypeScript frontend in `frontend/`, built with Vite.
  - `npm run build` builds to `frontend/dist/`
  - Uses `django-vite` to integrate with Django, which will connect Django to the Vue server in development and serve the built files in production.
- Python libraries are managed with `uv`

## Backend

- APIs managed with `django-ninja`
- Custom user model in `accounts/models.py`
- Form related models in `forms/models.py` and API views in `forms/api.py`
- Tests in `forms/tests.py`

## Frontend

- Vue components for form creation and management in `frontend/src/views/`
- Reusable UI components in `frontend/src/components/ui/` (see [here](./frontend/src/components/ui/README.md)), includes Card, CardHeader, Table, TableHeader, TableCell, FormField, Input, Textarea, Button, Link, Snackbar, Modal, Tooltip
- Testing with Vitest: `npm run test`