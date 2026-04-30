# 🧠 Explainable AI Credit Scoring System

> An AI-powered credit decisioning platform that solves the **"black box" problem** in digital lending — with full explainability, fairness auditing, and tamper-proof logging for three distinct user roles.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange?style=flat-square)
![SHAP](https://img.shields.io/badge/SHAP-XAI-purple?style=flat-square)

---

## 🎯 Problem Statement

Traditional ML credit scoring systems are **black boxes** — applicants don't know why they were rejected, auditors can't verify decisions, and regulators can't prove fairness. This system solves all three simultaneously.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **XGBoost ML Model** | Trained on UCI German Credit dataset with 69 features |
| 🔍 **SHAP Explainability** | TreeExplainer-based post-hoc explanations grounded in actual model weights |
| ⚖️ **Fairness Metrics** | Demographic Parity, Equalized Odds, Equal Opportunity, 4/5ths Rule |
| 🔐 **Tamper-Evident Audit Log** | SHA-256 hash chaining — any modification mathematically detectable |
| 🌐 **3 Language Support** | English, Tamil (தமிழ்), Hindi (हिंदी) via react-i18next |
| 👥 **3 Role-Based Views** | Applicant, Auditor, Regulator with JWT authentication |
| 📊 **Drift Detection** | scipy KS-test based model drift monitoring |
| 📄 **Compliance Reports** | PDF and CSV export for regulatory submissions |

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│         (TypeScript + shadcn/ui + Tailwind)         │
│    Applicant View │ Auditor View │ Regulator View   │
└──────────────────────┬──────────────────────────────┘
│ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │ XGBoost  │ │   SHAP   │ │Fairlearn │ │Audit  │ │
│  │  Model   │ │Explainer │ │ Metrics  │ │Logger │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────┘ │
└──────────────────────┬──────────────────────────────┘
│
┌──────────────────────▼──────────────────────────────┐
│              PostgreSQL (Supabase)                   │
│  users │ applications │ audit_logs │ fairness_metrics│
└─────────────────────────────────────────────────────┘
```

---

## 👥 Three Persona Architecture

### 🙋 Applicant
- Submit loan application (income, loan amount, credit history, employment, age)
- View APPROVED/REJECTED decision with confidence score
- Read plain-language SHAP explanations
- Get actionable improvement suggestions (if rejected)

### 🔎 Auditor
- Dashboard with approval/rejection stats and anomaly counts
- Per-decision drill-down with SHAP factor breakdown
- Audit log with SHA-256 hash chain verification
- Statistical anomaly detection (2σ deviation flagging)

### 📋 Regulator
- Fairness dashboard across protected attributes (gender, age, geography)
- Four fairness metrics: Demographic Parity, Equalized Odds, Equal Opportunity, 4/5ths Rule
- Model drift monitoring via KS-test
- One-click PDF/CSV compliance report export

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| ML Model | XGBoost (XGBClassifier) |
| Explainability | SHAP TreeExplainer |
| Fairness | Fairlearn |
| Drift Detection | scipy.stats.ks_2samp |
| Database ORM | SQLAlchemy (async) |
| Authentication | JWT (python-jose + passlib/bcrypt) |
| PDF Export | ReportLab |
| Dataset | UCI German Credit (69 features) |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Forms | react-hook-form + Zod |
| i18n | react-i18next |

### Infrastructure
| Component | Technology |
|---|---|
| Database | PostgreSQL 15 (Supabase) |
| Containerization | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop
- pnpm

### 1. Clone the repository
```bash
git clone https://github.com/shivam499-pro/explainable-lending-xai.git
cd explainable-lending-xai
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Configure environment
```bash
copy .env.example .env
# Fill in your DATABASE_URL and SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Start backend
```bash
python -m uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 5. Frontend setup
```bash
cd ../frontend
pnpm install
pnpm run dev
# Frontend running at http://localhost:5173
```

### 6. Docker (full stack)
```bash
docker compose up --build
```

---

## 📡 API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/v1/auth/token` | All | Login and get JWT |
| POST | `/api/v1/predict` | Applicant, Auditor | Run prediction + SHAP |
| GET | `/api/v1/audit/log` | Auditor | Paginated audit log |
| GET | `/api/v1/audit/verify` | Auditor | Verify SHA-256 chain |
| GET | `/api/v1/fairness/metrics` | Regulator | Fairness metrics |
| GET | `/api/v1/fairness/drift` | Regulator | Drift report |
| GET | `/api/v1/dashboard/stats` | Auditor, Regulator | Aggregate stats |
| GET | `/api/v1/report/export` | Regulator | PDF/CSV export |
| GET | `/health` | All | Health check |

---

## 🔐 Security Architecture

### JWT Authentication
- Role-based access control: `applicant` | `auditor` | `regulator`
- Token signed with HS256 algorithm
- Role encoded in JWT claims

### SHA-256 Audit Chain

Any modification to any historical entry breaks all subsequent hashes — mathematically detectable via `/api/v1/audit/verify`.

---

## ⚖️ Fairness Metrics

| Metric | Definition | Threshold |
|---|---|---|
| Demographic Parity | Approval rate equal across groups | < 0.1 difference |
| Equalized Odds | TPR + FPR equal across groups | < 0.1 difference |
| Equal Opportunity | TPR equal across groups | < 0.1 difference |
| 4/5ths Rule | Min group approval ≥ 80% of max group | ≥ 0.8 ratio |

Protected attributes: **gender**, **age group**, **geography**

---

## 🌐 Internationalization

| Language | Code | Status |
|---|---|---|
| English | `en` | ✅ Complete |
| Tamil | `ta` | ✅ Complete |
| Hindi | `hi` | ✅ Complete |

Translation files: `frontend/public/locales/{lang}/translation.json`

---

## 📁 Project Structure
```
saveetha-hackathon/
├── backend/
│   ├── src/
│   │   ├── models/           # XGBoost training + prediction
│   │   ├── explainability/   # SHAP TreeExplainer
│   │   ├── fairness/         # Fairlearn metrics + drift
│   │   ├── audit/            # SHA-256 hash chain logger
│   │   ├── utils/            # JWT auth helpers
│   │   └── db/               # SQLAlchemy models + connection
│   ├── data/                 # German credit dataset
│   ├── main.py               # FastAPI app + all routes
│   ├── seed.py               # Database seeder
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, LanguageSwitcher, shadcn/ui
│   │   ├── pages/            # Login, Applicant, Auditor, Regulator
│   │   ├── lib/              # API client, auth, i18n
│   │   └── types/            # TypeScript interfaces
│   └── public/locales/       # EN, TA, HI translations
│
├── docker-compose.yml
└── README.md
```
---

## 🧪 Test Credentials

| Role | Username | Password |
|---|---|---|
| Applicant | `applicant` | `applicant123` |
| Auditor | `auditor` | `auditor123` |
| Regulator | `regulator` | `regulator123` |

---

## 📊 Model Performance

- **Dataset**: UCI German Credit Risk (1000 samples, 69 features after encoding)
- **Algorithm**: XGBoost (XGBClassifier)
- **Train/Test Split**: 80/20 stratified
- **Explainability**: SHAP TreeExplainer (post-hoc, model-agnostic)

---

## 🏆 Compliance Standards

This system is designed to satisfy requirements from:
- **RBI** (Reserve Bank of India) — AI in lending guidelines
- **GDPR** — Right to explanation for automated decisions
- **CFPB** — Fair lending compliance (US equivalent reference)

---

## 👨‍💻 Developer

**Shivam Jaiswal**
- CSE Student | Full-Stack Developer
- Rajalakshmi Engineering College
- GitHub: [@shivam499-pro](https://github.com/shivam499-pro)

---

