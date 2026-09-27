# Local Setup & Installation Guide - DUO SYSTEMS LEAD FINDER

Follow these steps to run the application locally on Windows, macOS, or Linux.

---

## Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & npm
- (Optional for Production) **PostgreSQL** or **Docker**

---

## 1. Backend Setup

```bash
# Clone the repository
git clone <repo-url>
cd "Duo Systems Lead Finder"

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env from template
cp .env.example .env
```

### Start Backend Server:
```bash
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend Web Application will be live at: `http://localhost:5173`

---

## 3. Running Test Suites

```bash
# Run backend pytest suite
pytest
```
All unit tests and integration acceptance tests will execute and validate:
- Deduplication by Place ID
- Duo Systems Lead Scoring
- Multi-area query expansion
- CRM updates and outreach drafts
- Google Sheets export duplicate prevention
