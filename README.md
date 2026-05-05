# TransBandung Smart Monitoring (TBSM)

Implementasi lengkap aplikasi monitoring transportasi publik berbasis cloud AWS sesuai PRD. Aplikasi menyediakan portal monitoring rute transportasi, sistem pelaporan masyarakat, upload bukti ke S3, dan dashboard admin untuk validasi laporan.

---

## 📋 Quick Links — Dokumentasi Lengkap

| Dokumen | Tujuan |
|---------|--------|
| [ETS2_DEPLOYMENT_RUNBOOK.md](docs/ETS2_DEPLOYMENT_RUNBOOK.md) | **MULAI DI SINI**: Step-by-step guide untuk deploy ke AWS di hari evaluasi (45-60 min) |
| [GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md) | Setup GitHub Secrets + IAM user + S3 backend Terraform |
| [TERRAFORM_ECS_SETUP.md](docs/TERRAFORM_ECS_SETUP.md) | Tambah ECS task definition, service, ALB ke Terraform |
| [SECRETS_MANAGER_SETUP.md](docs/SECRETS_MANAGER_SETUP.md) | Setup AWS Secrets Manager untuk database credentials |
| [ARCHITECTURE_DIAGRAM_GUIDE.md](docs/ARCHITECTURE_DIAGRAM_GUIDE.md) | Panduan membuat architecture diagram manual (draw.io) |
| [PROMPT_CHECK.md](docs/PROMPT_CHECK.md) | Checklist lengkap evaluasi ETS2 (compliance matrix) |

---

## 🏗️ Technology Stack

**Frontend**:
- React 18.3.1 + Vite 6.0.5
- Axios untuk HTTP client
- Fitur: Transport monitoring, report form, evidence upload, admin dashboard

**Backend**:
- FastAPI 0.115.6 + SQLAlchemy 2.0.36
- Pydantic 2.10.3 untuk validation
- boto3 1.35.79 untuk AWS S3 integration
- Fitur: REST API untuk routes, reports, evidence upload, admin validation

**Database**:
- PostgreSQL 15 (RDS, private subnet, no public access)
- Local development: SQLite 3
- Models: TransportRoute, RouteSchedule, Report, EvidenceFile

**Cloud Infrastructure**:
- **Compute**: AWS ECS Fargate + ECR
- **Load Balancing**: Application Load Balancer (ALB)
- **Storage**: S3 bucket (block all public) + CloudFront CDN (OAC)
- **Database**: RDS PostgreSQL (private subnet)
- **Secrets**: AWS Secrets Manager (encrypted credentials)
- **Logging**: CloudWatch Logs (/ecs/tbsm-backend)
- **IaC**: Terraform 1.6+ (modular structure)

**CI/CD**:
- GitHub Actions workflows (backend-ci, frontend-ci, deploy-ecr-ecs, terraform)
- Automated build → ECR push → ECS deployment

---

## 🚀 Getting Started — Local Development

### Prerequisites
- Python 3.11+ (backend)
- Node.js 20+ (frontend)
- Docker & Docker Compose (optional)

### Backend

```bash
cd backend

# Setup Python virtual environment
python -m venv .venv
source .venv/bin/activate    # Linux/Mac
# atau
.\.venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest -v
```

**Environment Variables** (.env):
```
DATABASE_URL=sqlite:///./tbsm.db
AWS_REGION=ap-southeast-1
S3_BUCKET=tbsm-evidence-local
CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net
UPLOAD_EXPIRY_SECONDS=900
ADMIN_TOKEN=change-me-admin-token
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Environment Variables** (.env):
```
VITE_API_BASE_URL=http://localhost:8000
```

### Docker Compose (Integrated Local Setup)

```bash
# From repo root
docker compose up --build

# Backend available at: http://localhost:8000
# Frontend available at: http://localhost
```

---

## 📁 Project Structure

```
.
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # App initialization + routes
│   │   ├── config.py             # Configuration (Pydantic Settings)
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── api/                  # API routers
│   │   └── db/                   # Database setup
│   ├── tests/                    # Unit tests (pytest)
│   ├── requirements.txt           # Dependencies
│   ├── Dockerfile                # Backend Docker image
│   └── pytest.ini
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx               # Root component
│   │   ├── components/           # React components
│   │   ├── services/             # API client (axios)
│   │   └── App.css
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile                # Frontend Docker image (nginx)
│   └── .env.example
│
├── infrastructure/
│   └── terraform/                # Infrastructure as Code
│       ├── main.tf               # VPC, RDS, ECS, ALB, S3, CloudFront
│       ├── variables.tf           # Input variables
│       ├── outputs.tf             # Output values
│       └── terraform.tfvars.example
│
├── .github/
│   └── workflows/                # CI/CD pipelines
│       ├── backend-ci.yml         # Backend test
│       ├── frontend-ci.yml        # Frontend build
│       ├── deploy-ecr-ecs.yml     # Docker build → ECR → ECS
│       └── terraform.yml          # Terraform plan
│
├── docs/                         # Documentation
│   ├── PROMPT_CHECK.md           # ETS2 evaluation checklist
│   ├── GITHUB_SECRETS_SETUP.md   # Secrets configuration
│   ├── TERRAFORM_ECS_SETUP.md    # ECS infrastructure
│   ├── SECRETS_MANAGER_SETUP.md  # AWS Secrets Manager
│   ├── ARCHITECTURE_DIAGRAM_GUIDE.md  # Diagram instructions
│   ├── ETS2_DEPLOYMENT_RUNBOOK.md    # Deployment guide
│   └── images/                   # Diagrams & screenshots
│
├── .aws/
│   └── task-definition.json      # ECS task definition template
│
├── docker-compose.yml             # Local development compose
└── README.md                      # This file
```

---

## 🌐 API Endpoints

### Transport Routes
- `GET /api/routes` — List semua rute + schedules
- `GET /api/health` — Health check (ALB)

### Reports (Public)
- `POST /api/reports` — Submit laporan baru
- `GET /api/reports` — List reports (dengan filtering optional)

### Evidence Upload
- `POST /api/evidence/presigned-url` — Generate S3 presigned PUT URL
- `POST /api/evidence/confirm-upload` — Confirm upload selesai, store CloudFront URL

### Admin
- `GET /api/admin/reports` — List semua reports (require Bearer token)
- `PATCH /api/admin/reports/{id}/status` — Update status + notes

---

## 📊 Key Features

✅ **Transport Monitoring**
- View available routes dengan schedules
- Real-time route information (semi-polling)

✅ **Public Reporting**
- Submit reports (delay, accident, condition)
- Attach location + details
- Author identification

✅ **Evidence Management**
- Image upload ke S3 (presigned URL flow)
- CloudFront CDN serving (OAC enabled, no direct S3)
- Secure URL generation

✅ **Admin Dashboard**
- Token-based authentication
- View all reports dengan filters
- Update status + add notes
- Evidence thumbnail display

✅ **Cloud-Native Architecture**
- VPC dengan public/private subnets
- RDS PostgreSQL (encrypted, backups)
- S3 + CloudFront (secure, compliant)
- ECS Fargate (serverless, auto-scaling ready)
- Automated CI/CD (GitHub Actions)

---

## 🔐 Security Features (PRD Compliance)

✓ **Database Security**
- PostgreSQL di private subnet (no public access)
- SSL/TLS connection (per AWS RDS best practice)
- Encrypted backups (7-day retention)

✓ **Storage Security**
- S3: Block all public access ✓
- CloudFront: Origin Access Control (OAC) ✓
- No direct S3 URLs (only CloudFront) ✓

✓ **Credential Management**
- AWS Secrets Manager (encrypted at rest)
- Environment variables (not hardcoded)
- CloudTrail audit logging

✓ **Network Security**
- Security groups (ALB: 80/443, ECS: 8000, RDS: 5432 from ECS)
- VPC: Isolated subnets
- NAT Gateway: ECS → Internet (outbound only)

✓ **API Security**
- Admin endpoints: Bearer token auth
- Health checks: Public (for ALB)
- CORS: Configured per env

---

## 🚢 Deployment to AWS

### Phase 1: Infrastructure (Terraform)
```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

**Creates**:
- VPC + Subnets + Gateway + Route Tables
- RDS PostgreSQL (multi-AZ ready, 7-day backup)
- ECS Cluster + Service + Task Definition
- ALB + Target Groups + Listeners
- ECR Repositories (backend + frontend)
- S3 Bucket + CloudFront Distribution
- Security Groups + IAM Roles
- CloudWatch Log Group

**Outputs**:
```
alb_url = http://tbsm-alb-123456.ap-southeast-1.elb.amazonaws.com
rds_endpoint = tbsm-db.c123def456.ap-southeast-1.rds.amazonaws.com
s3_bucket = tbsm-evidence-123456789
cloudfront_domain = dXXXXXXXXXXXXXX.cloudfront.net
```

### Phase 2: Secrets Manager
```bash
aws secretsmanager create-secret --name tbsm/database-url --secret-string "postgresql://..."
aws secretsmanager create-secret --name tbsm/db-password --secret-string "..."
```

### Phase 3: GitHub Actions
- Push code ke main branch
- GitHub Actions otomatis:
  1. Build backend + frontend images
  2. Push ke ECR
  3. Update ECS service dengan image terbaru
  4. Health check ECS tasks

**Monitoring**:
```bash
# Watch ECS service
aws ecs describe-services --cluster tbsm-cluster --services tbsm-backend-service

# Tail logs
aws logs tail /ecs/tbsm-backend --follow

# ALB health
curl http://<ALB_DNS>/api/health
```

---

## ✅ ETS2 Evaluation Checklist

Refer ke [PROMPT_CHECK.md](docs/PROMPT_CHECK.md) untuk detailed rubric checklist mencakup:

✓ Networking (VPC, subnets, security groups)  
✓ Database (RDS configuration, private subnet)  
✓ Storage & CDN (S3, CloudFront, OAC)  
✓ Compute (ECS, ECR, health checks)  
✓ CI/CD (GitHub Actions workflows)  
✓ Code quality (backend/frontend completeness)  
✓ Security (credentials, encryption, audit)  
✓ Testing (unit tests, integration tests)  
✓ Documentation (guides, deployment runbook)  

---

## 📚 Documentation Index

| Audience | Start With |
|----------|-----------|
| **ETS2 Evaluators** | [PROMPT_CHECK.md](docs/PROMPT_CHECK.md) + [ARCHITECTURE_DIAGRAM_GUIDE.md](docs/ARCHITECTURE_DIAGRAM_GUIDE.md) |
| **DevOps/Infrastructure** | [TERRAFORM_ECS_SETUP.md](docs/TERRAFORM_ECS_SETUP.md) + [GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md) |
| **Deployment Day** | [ETS2_DEPLOYMENT_RUNBOOK.md](docs/ETS2_DEPLOYMENT_RUNBOOK.md) |
| **Security Review** | [SECRETS_MANAGER_SETUP.md](docs/SECRETS_MANAGER_SETUP.md) + [PROMPT_CHECK.md](docs/PROMPT_CHECK.md) Security section |
| **Developers** | Backend: [backend/README.md](backend/README.md), Frontend: [frontend/README.md](frontend/README.md) |

---

## 🐛 Troubleshooting

### Backend tests not running
**Fix**: `pytest.ini` configured dengan `pythonpath = .`

### Frontend not connecting to backend
**Fix**: Verify `VITE_API_BASE_URL` in `.env` matches backend URL

### Docker compose permission denied
**Fix**: Check Docker daemon running, or run with `sudo` (Linux)

### Terraform plan showing resource conflicts
**Fix**: Ensure different `project_name` in tfvars, or `terraform destroy` first

### ECS task failing to start
**Fix**: Check task logs in CloudWatch `/ecs/tbsm-backend`, verify Secrets Manager credentials

**More help**: See [ETS2_DEPLOYMENT_RUNBOOK.md](docs/ETS2_DEPLOYMENT_RUNBOOK.md) troubleshooting section.

---

## 📞 Support & Contact

- **Project**: TransBandung Smart Monitoring (TBSM)
- **Status**: Ready for ETS2 evaluation
- **Architecture**: AWS ECS + RDS + S3 + CloudFront
- **CI/CD**: GitHub Actions automated deployment

---

**Last Updated**: ETS2 Evaluation Ready  
**Version**: 1.0.0  
**PRD Compliance**: Section 1-6 complete
