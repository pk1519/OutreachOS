# Deployment Guide - DUO SYSTEMS LEAD FINDER

DUO SYSTEMS LEAD FINDER is containerized and ready for production deployment on AWS, Google Cloud Run, Azure, DigitalOcean, or any Kubernetes cluster.

---

## 1. Quick Docker Compose Production Deployment

The platform provides a complete multi-container setup including:
- **FastAPI Backend** (Python 3.12, Uvicorn workers)
- **React Frontend** (Production Nginx Alpine build with reverse proxy)
- **PostgreSQL 16** (Persistent volume database)

### Deployment Steps:

1. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit GOOGLE_PLACES_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, POSTGRES_PASSWORD
   ```

2. Start all services using Docker Compose:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d --build
   ```

3. Verify service health:
   ```bash
   docker-compose -f docker/docker-compose.yml ps
   ```

4. Access the production application:
   - **Frontend UI**: `http://your-server-ip` or `https://leads.duosystems.com`
   - **API Docs (Swagger)**: `http://your-server-ip/api/docs`

---

## 2. Google Cloud Run Deployment (Serverless)

You can also deploy the backend directly to Google Cloud Run:
```bash
gcloud builds submit --tag gcr.io/[PROJECT_ID]/duo-lead-finder-backend ./backend

gcloud run deploy duo-lead-finder-backend \
  --image gcr.io/[PROJECT_ID]/duo-lead-finder-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://user:pass@host/db",GOOGLE_PLACES_API_KEY="AIzaSy..."
```

---

## 3. Database Migration & Backups

- Automated table migration runs automatically on application startup (`Base.metadata.create_all`).
- PostgreSQL automated daily dumps:
  ```bash
  docker exec -t duo_systems_db pg_dump -U postgres duo_leads > backup_$(date +%F).sql
  ```
