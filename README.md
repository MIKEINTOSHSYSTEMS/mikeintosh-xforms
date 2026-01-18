# MIKEINTOSH XForms Application

A full-stack web application for creating, managing, and submitting ODK XForms with Django backend and Vue.js frontend, integrated with ODK Web Forms engine for form rendering and submission.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │           Vue.js SPA (Port 5173/80)                │     │
│  │  • Form Management UI                              │     │
│  │  • ODK Web Forms Renderer                          │     │
│  │  • Real-time Validation                            │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                  Django Backend (Port 8000)                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Django REST API (django-ninja)                    │     │
│  │  • Form CRUD Operations                            │     │
│  │  • XLS to XForm Conversion                         │     │
│  │  • Submission Storage                              │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Database Layer (SQLite/PostgreSQL)                │     │
│  │  • Form Definitions                                │     │
│  │  • Form Submissions                                │     │
│  │  • User Accounts                                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend

- **Django 5.2** - Python web framework
- **Django Ninja** - Fast API framework (similar to FastAPI)
- **PyxForm** - XLSForm to XForm conversion
- **SQLite/PostgreSQL** - Database
- **django-vite** - Vue.js integration
- **UV** - Python package manager

### Frontend

- **Vue.js 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **ODK Web Forms** - ODK XForms rendering engine
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Vue** - Icon library

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)
- **Git** - Version control

## 📁 Project Structure

```
django-xforms-main/
├── .env.example                    # Environment variables template
├── .dockerignore                   # Docker ignore patterns
├── docker-compose.yml              # Docker Compose configuration
├── docker-compose.override.yml     # Development overrides
├── Dockerfile                      # Django backend Dockerfile
├── Makefile                        # Development commands
├── manage.py                       # Django management script
├── pyproject.toml                  # Python dependencies
├── uv.lock                         # Python lock file
├── README.md                       # This file
│
├── accounts/                       # Custom user model app
│   ├── migrations/
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   └── views.py
│
├── config/                         # Django project configuration
│   ├── __pycache__/
│   ├── __init__.py
│   ├── api.py                      # Ninja API router
│   ├── asgi.py
│   ├── settings.py                 # Django settings
│   ├── urls.py                     # URL routing
│   ├── views.py                    # SPA entry point
│   └── wsgi.py
│
├── forms/                          # Forms management app
│   ├── migrations/                 # Database migrations
│   ├── static/                     # Form static files
│   ├── __init__.py
│   ├── admin.py                    # Django admin config
│   ├── api.py                      # Forms API endpoints
│   ├── apps.py
│   ├── models.py                   # Form and Submission models
│   └── tests.py                    # Backend tests
│
├── frontend/                       # Vue.js frontend application
│   ├── Dockerfile                  # Production Dockerfile
│   ├── Dockerfile.dev              # Development Dockerfile
│   ├── nginx.conf                  # Nginx configuration
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Node.js dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── vitest.config.ts            # Testing configuration
│   │
│   ├── public/                     # Static assets
│   │   └── vite.svg
│   │
│   └── src/                        # Vue.js source code
│       ├── main.ts                 # Vue application entry
│       ├── App.vue                 # Root Vue component
│       │
│       ├── api/                    # API client functions
│       │   └── forms.ts           # Forms API service
│       │
│       ├── components/             # Reusable UI components
│       │   └── ui/                # UI component library
│       │
│       ├── router/                 # Vue Router configuration
│       │   └── index.ts
│       │
│       ├── views/                  # Page components
│       │   ├── FormCreateView.vue # Create new form
│       │   ├── FormEditView.vue   # Edit existing form
│       │   ├── FormListView.vue   # List all forms
│       │   └── FormSubmitView.vue # Submit form data
│       │
│       └── test-setup.ts          # Test setup configuration
│
├── templates/                      # Django templates
│   └── index.html                  # SPA template
│
├── tests/                          # Test suite
│   └── e2e/                        # End-to-end tests
│
├── media/                          # User-uploaded files (XLSForms)
│   └── xlsforms/
│
├── staticfiles/                    # Collected static files
│
└── db.sqlite3                      # SQLite database (development)
```

## 🔄 Data Flow

### 1. Form Creation Flow

```
User Uploads XLSForm (.xlsx/.xls)
        ↓
Frontend (FormCreateView.vue) → POST /api/forms/ (multipart/form-data)
        ↓
Backend (forms/api.py) validates and converts XLS to XForm
        ↓
PyxForm converts XLSForm → XForm XML
        ↓
Form record saved to database with XML definition
        ↓
XLS file stored in media/xlsforms/
        ↓
Response: Form object with ID, name, version, etc.
```

### 2. Form Submission Flow

```
User fills form in FormSubmitView.vue
        ↓
ODK Web Forms engine validates and generates XML submission
        ↓
Frontend POST /api/forms/{id}/submissions/ (XML payload)
        ↓
Backend validates XML against form definition
        ↓
FormSubmission record saved to database
        ↓
Response: Submission ID and metadata
```

### 3. Form Management Flow

```
GET /api/forms/ → List all forms (FormListView.vue)
GET /api/forms/{id}/ → Get form details (FormEditView.vue)
PATCH /api/forms/{id}/ → Update form (FormEditView.vue)
DELETE /api/forms/{id}/ → Delete form (FormEditView.vue)
```

## 📋 Prerequisites

### System Requirements

- **Python 3.12+** (with UV package manager)
- **Node.js 20+** (with npm)
- **Docker & Docker Compose** (optional, for containerized deployment)
- **Git** (for version control)

### Windows PowerShell Setup

```powershell
# Install UV (Python package manager)
irm https://astral.sh/uv/install.ps1 | iex

# Verify installations
python --version
node --version
npm --version
docker --version
docker-compose --version
```

## 🚀 Local Development Setup

### Option 1: Traditional Development (Two Servers)

1. **Clone and Setup**

```bash
git clone <repository-url>
cd django-xforms-main

# Create virtual environment and install Python dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .

# Install frontend dependencies
cd frontend
npm install
cd ..
```

1. **Database Setup**

```bash
# Run migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser
# Follow prompts to create admin account
```

1. **Create Required Directories**

```bash
mkdir -p media/xlsforms staticfiles frontend/dist
```

1. **Start Development Servers**

```bash
# Terminal 1: Django Backend
python manage.py runserver

# Terminal 2: Vue Frontend (with hot reload)
cd frontend
npm run dev
```

1. **Access the Application**

- Main Application: <http://localhost:8000>
- Django Admin: <http://localhost:8000/admin>
- API Documentation: <http://localhost:8000/api/docs>

### Option 2: Docker Development (Simplified)

1. **Copy Environment File**

```bash
cp .env.example .env
# Edit .env to configure your environment
```

1. **Build and Start**

```bash
# Using Makefile (recommended)
make build
make up-dev

# Or using Docker Compose directly
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

1. **Access Docker Services**

- Frontend (Dev): <http://localhost:5173>
- Backend: <http://localhost:8000>
- Admin: <http://localhost:8000/admin>

## 🐳 Docker Deployment

### Production Deployment

1. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with production values:
# DEBUG=False
# SECRET_KEY=your-secure-random-key
# DATABASE_URL=postgres://...
```

1. **Build and Deploy**

```bash
# Build production images
make build

# Start all services
make up

# View logs
make logs

# Run migrations
make migrate

# Create superuser
make superuser
```

1. **Production URLs**

- Application: <http://your-server-ip>
- API: <http://your-server-ip/api/>
- Admin: <http://your-server-ip/admin/>

### Docker Services Overview

| Service | Port | Purpose | Access URL |
|---------|------|---------|------------|
| frontend | 80 | Vue.js application (Nginx) | <http://localhost> |
| backend | 8000 | Django API server | <http://localhost:8000> |
| db | 5432 | PostgreSQL database | Internal only |
| frontend-dev | 5173 | Vite dev server (optional) | <http://localhost:5173> |

### Useful Docker Commands

```bash
# Start all services in background
make up

# Stop all services
make down

# View logs
make logs

# Rebuild images
make build

# Clean everything (containers, volumes, images)
make clean

# Run Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic
```

## 📚 API Documentation

### Base URL

- Development: <http://localhost:8000/api>
- Production: <http://your-domain/api>

### Available Endpoints

#### Forms Management

```
GET    /api/forms/                 # List all forms
POST   /api/forms/                 # Create new form (multipart/form-data)
GET    /api/forms/{id}/            # Get form details
PATCH  /api/forms/{id}/            # Update form (JSON or multipart)
DELETE /api/forms/{id}/            # Delete form
```

#### Form Submissions

```
POST   /api/forms/{id}/submissions/  # Submit form data (XML)
```

### Example API Calls

**Create a Form (curl)**

```bash
curl -X POST http://localhost:8000/api/forms/ \
  -F "name=Survey Form" \
  -F "description=Customer satisfaction survey" \
  -F "xls_file=@/path/to/form.xlsx"
```

**Submit Form Data**

```bash
curl -X POST http://localhost:8000/api/forms/1/submissions/ \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?><data><name>John Doe</name></data>'
```

**Access API Documentation**

- Swagger UI: <http://localhost:8000/api/docs>
- ReDoc: <http://localhost:8000/api/redoc>

## 🧪 Testing

### Backend Tests

```bash
# Run Django tests
python manage.py test

# Run with coverage
coverage run manage.py test
coverage report
```

### Frontend Tests

```bash
cd frontend
npm run test          # Run tests once
npm run test:ui       # Run with UI
npm run test:coverage # Run with coverage
```

### End-to-End Tests

```bash
# Install Playwright browsers
uv run playwright install

# Run E2E tests
uv run pytest -m e2e
```

### Docker Testing

```bash
# Run tests in Docker container
docker-compose exec backend python manage.py test
docker-compose exec frontend npm run test
```

## 🔧 Troubleshooting

### Common Issues

1. **"Media files not accessible"**

```bash
# Ensure media directory exists
mkdir -p media/xlsforms
chmod -R 755 media

# Check Django is running in DEBUG mode
# DEBUG must be True for serving media files in development
```

1. **"Database connection failed"**

```bash
# Reset database
python manage.py flush
python manage.py migrate

# Or for Docker
docker-compose down -v
docker-compose up -d
```

1. **"Vite dev server not connecting"**

```bash
# Check both servers are running
# Django: http://localhost:8000
# Vite: http://localhost:5173

# Restart both servers
# In Django terminal: Ctrl+C then python manage.py runserver
# In frontend terminal: Ctrl+C then npm run dev
```

1. **"Permission denied" (Docker)**

```bash
# Rebuild with proper permissions
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

1. **"Missing dependencies"**

```bash
# Reinstall all dependencies
cd frontend && npm ci
cd .. && uv sync
```

### Logs and Debugging

**Django Logs**

```bash
# View Django server logs
python manage.py runserver --verbosity 2

# Or check Docker logs
docker-compose logs backend -f
```

**Frontend Logs**

```bash
# Check browser console (F12)
# Check Vite dev server output
npm run dev -- --debug
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Set `DEBUG = False` in `.env`
- [ ] Generate new `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Configure firewall rules

### Performance Optimization

1. **Enable Caching**

```python
# In settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
    }
}
```

1. **Database Optimization**

```bash
# Use PostgreSQL in production
# Add connection pooling
# Regular database maintenance
```

1. **Static Files**

```bash
# Collect static files
python manage.py collectstatic --noinput

# Serve via CDN or separate static file server
```

### Monitoring

- **Application**: Django Debug Toolbar (dev), Sentry (prod)
- **Database**: pgAdmin, Django Admin
- **Server**: Prometheus, Grafana
- **Logs**: ELK Stack, CloudWatch

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Run test suite
6. Submit pull request

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **JavaScript/TypeScript**: Use ESLint, Prettier
- **Vue**: Follow Vue Style Guide
- **Commits**: Use Conventional Commits

### Testing Requirements

- All new features must include tests
- Maintain at least 80% test coverage
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [ODK](https://getodk.org/) for the Web Forms engine
- [Django](https://www.djangoproject.com/) web framework
- [Vue.js](https://vuejs.org/) progressive framework
- [Vite](https://vitejs.dev/) build tool

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Use GitHub Issues for bug reports
- **Questions**: Check existing issues or create a new one
- **Emergency**: Critical issues marked with 🚨 priority

---

**MIKEINTOSH XForms Application** - Empowering data collection with modern web technologies. Built with ❤️ for scalable form management and submission.
