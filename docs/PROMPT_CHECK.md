# PROMPT CHECK — Daftar Periksa Penilaian ETS2

**Tujuan**: Memastikan tidak ada poin penilaian yang terlewat sebelum melakukan `git push` dan submission ke ETS2.

---

## ✓ Checklist Persiapan Infrastruktur

### Networking (VPC & Subnets)
- [ ] VPC sudah dibuat dengan CIDR `10.0.0.0/16` (atau sesuai `terraform.tfvars`)
- [ ] Public Subnet `10.0.1.0/24` sudah ada untuk ALB dan ECS tasks
- [ ] Private Subnet `10.0.2.0/24` sudah ada untuk RDS
- [ ] Internet Gateway (IGW) sudah terhubung ke VPC
- [ ] Route table public mengarahkan `0.0.0.0/0` ke IGW
- [ ] NAT Gateway sudah dibuat di public subnet (opsional untuk private outbound)
- [ ] Security groups sudah dibuat untuk ALB (port 80/443), ECS (port 8000), RDS (port 5432)

### Database (RDS)
- [ ] RDS PostgreSQL instance sudah dibuat dengan parameter:
  - Engine: `postgres`
  - Version: `15.x` atau lebih baru
  - Instance class: `db.t3.micro` (minimum untuk cost-effective)
  - Database name: `tbsm_db` (sesuai config)
  - Master username: `tbsm_admin`
  - Master password: **disimpan di AWS Secrets Manager**
- [ ] RDS **TIDAK** memiliki akses publik (`publicly_accessible = false`)
- [ ] RDS berada di **Private Subnet** (tidak di public)
- [ ] Security group RDS hanya menerima traffic dari security group ECS (port 5432)
- [ ] Automated backups sudah enabled (retention 7 hari minimum)
- [ ] Multi-AZ sudah dipertimbangkan untuk production (opsional untuk v1)

### Storage & CDN (S3 + CloudFront)
- [ ] S3 bucket `tbsm-evidence-{AWS_ACCOUNT_ID}` sudah dibuat
- [ ] **Block Public Access** sudah diaktifkan di S3 bucket (semua toggle ON)
- [ ] CloudFront distribution sudah dibuat dengan S3 bucket sebagai origin
- [ ] CloudFront menggunakan **Origin Access Control (OAC)** (bukan OAI lama)
- [ ] S3 bucket policy hanya mengizinkan akses dari CloudFront OAC
- [ ] CloudFront protocol: `redirect-to-https` (pastikan HTTPS enforcement)
- [ ] Pastikan **tidak ada** direct S3 GET URLs di database/frontend — selalu gunakan CloudFront domain
- [ ] Versioning di S3 bucket **enabled** untuk recovery

### Compute (ECS + ECR)
- [ ] ECS Cluster `tbsm-cluster` sudah dibuat di VPC yang benar
- [ ] ECR repository `tbsm-backend` sudah dibuat
- [ ] ECR repository `tbsm-frontend` sudah dibuat (opsional jika frontend di S3+CloudFront)
- [ ] ECS task definition template `.aws/task-definition.json` sudah tersedia
- [ ] ECS task definition menggunakan image dari ECR (bukan hardcoded public images)
- [ ] Environment variables task definition mengambil DB credentials dari **Secrets Manager**
- [ ] Container port mapping benar: backend port 8000, frontend port 80 (jika dipakai)
- [ ] Task execution role sudah attached ke CloudWatch Logs policy
- [ ] Task role sudah attached ke S3 PutObject/GetObject policy untuk upload

### CI/CD (GitHub Actions)
- [ ] `.github/workflows/deploy-ecr-ecs.yml` sudah updated dengan template lengkap
- [ ] GitHub Secrets sudah diisi di repository settings:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_ACCOUNT_ID`
  - `TF_BACKEND_BUCKET` (untuk Terraform remote state)
- [ ] Workflow dapat di-trigger manual (workflow_dispatch) untuk testing
- [ ] Build process menghasilkan image dengan tag `${{ github.sha }}`
- [ ] ECS service update menggunakan `aws ecs update-service --force-new-deployment`

---

## ✓ Checklist Kode Aplikasi

### Backend (FastAPI)
- [ ] `backend/Dockerfile` sudah di-build lokal tanpa error
- [ ] `backend/requirements.txt` include semua dependencies (fastapi, sqlalchemy, boto3, pydantic-settings, dll)
- [ ] `backend/app/config.py` membaca **environment variables** untuk semua AWS/DB config:
  - `DATABASE_URL`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DOMAIN`
  - Pastikan punya fallback untuk local dev
- [ ] Backend API endpoints:
  - [ ] `GET /api/health` ✓
  - [ ] `GET /api/routes` ✓
  - [ ] `POST /api/reports` ✓ (menyimpan ke RDS)
  - [ ] `POST /api/evidence/presigned-url` ✓ (generate S3 presigned PUT)
  - [ ] `POST /api/evidence/confirm-upload` ✓ (verify & store CloudFront URL)
  - [ ] `GET /api/admin/reports` ✓ (auth required)
  - [ ] `PATCH /api/admin/reports/{id}/status` ✓ (auth required)
- [ ] Semua evidence URLs di database adalah **CloudFront domain**, bukan S3 direct URL
- [ ] S3 presigned URL endpoint membatasi file type (jpg, jpeg, png, webp only)
- [ ] Admin auth menggunakan JWT token atau Bearer token (header `Authorization: Bearer <token>`)
- [ ] Error handling & logging sudah implemented
- [ ] Database migrations (Alembic opsional untuk v1, tapi direkomendasikan) sudah siap

### Frontend (React/Vite)
- [ ] `frontend/Dockerfile` sudah di-build lokal tanpa error
- [ ] `frontend/package.json` sudah include dependencies (axios, react, vite, dll)
- [ ] `frontend/.env.example` ada dengan `VITE_API_BASE_URL=<backend_url>`
- [ ] Frontend pages:
  - [ ] Transportation Monitor (list rute & jadwal) ✓
  - [ ] Report Form (submit laporan) ✓
  - [ ] Evidence Upload (presigned URL → S3 → confirm) ✓
  - [ ] Admin Dashboard (list laporan + thumbnails + update status) ✓
- [ ] Evidence images ditampilkan dari **CloudFront URL**, bukan S3
- [ ] Admin login meminta token/JWT sebelum menampilkan dashboard
- [ ] `npm run build` menghasilkan `dist/` folder tanpa error
- [ ] Build output sudah optimized (minified, chunked)

### Database & Models
- [ ] Semua models sudah di-create di `backend/app/models/`:
  - `TransportRoute`, `RouteSchedule`
  - `Report`
  - `EvidenceFile`
- [ ] Database schema tercermin di models (Pydantic + SQLAlchemy)
- [ ] Evidence table `upload_status` field ada & support pending/completed/failed
- [ ] Evidence table `cloudfront_url` field exist & indexed
- [ ] Report table `status` field support pending/verified/resolved/dismissed
- [ ] Foreign key constraints sudah di-define

### Terraform & IaC
- [ ] `infrastructure/terraform/main.tf` include:
  - [ ] VPC creation ✓
  - [ ] Public & Private subnets ✓
  - [ ] Security groups (ALB, ECS, RDS) ✓
  - [ ] RDS PostgreSQL ✓
  - [ ] S3 bucket + CloudFront ✓
  - [ ] ECR repositories ✓
  - [ ] ECS cluster ✓
- [ ] `infrastructure/terraform/variables.tf` expose semua config parameter
- [ ] `infrastructure/terraform/outputs.tf` output:
  - RDS endpoint
  - S3 bucket name
  - CloudFront domain
  - ECR repository URLs
- [ ] `terraform plan` berjalan tanpa error (gunakan `.example` tfvars untuk dry run)
- [ ] Semua resources sudah di-tag dengan `project_name = "tbsm"`

---

## ✓ Checklist Keamanan (Security Best Practices)

- [ ] S3 bucket public access **BLOCKED** (all 4 toggles ON)
- [ ] RDS **tidak** memiliki akses internet publik
- [ ] Secrets Manager sudah digunakan untuk DB password & AWS credentials
- [ ] GitHub Secrets sudah di-set dengan IAM access key (bukan root credentials)
- [ ] IAM policy sudah **least-privilege**:
  - ECS task role: hanya S3 PutObject/GetObject/ListBucket ke evidence bucket
  - ECR push: hanya ke tbsm-* repositories
  - RDS: hanya dari ECS security group
- [ ] Admin token sudah strong & **tidak hardcoded** di git (gunakan Secrets Manager)
- [ ] S3 presigned URL **expiry 15 menit** (900 seconds)
- [ ] Rate limiting / CAPTCHA dipertimbangkan untuk report submission publik
- [ ] CORS headers di backend sudah di-configure untuk frontend domain
- [ ] Logging:
  - [ ] CloudWatch Logs enabled untuk ECS
  - [ ] CloudTrail enabled untuk S3/API calls
  - [ ] VPC Flow Logs opsional untuk network debugging

---

## ✓ Checklist Testing & Validation

- [ ] Backend tests:
  - [ ] `pytest` di-run, semua test passed ✓
  - [ ] Health check endpoint `/api/health` return 200 OK
  - [ ] Report creation test (POST `/api/reports`) ✓
  - [ ] Presigned URL generation test ✓
- [ ] Frontend build:
  - [ ] `npm run build` produce `dist/` folder tanpa error ✓
  - [ ] Vite bundle size reasonable (< 500KB gzipped ideal)
- [ ] Docker:
  - [ ] `docker build ./backend -t tbsm-backend:test` sukses
  - [ ] `docker build ./frontend -t tbsm-frontend:test` sukses
  - [ ] `docker compose up --build` berjalan di local tanpa error
- [ ] Local integration test:
  - [ ] Akses `http://localhost:8000/api/health` → 200 OK
  - [ ] Akses `http://localhost:3000` (atau port frontend) → page load
  - [ ] Create report via frontend → simpan di database
  - [ ] Upload evidence → generate presigned URL → mock S3 upload → confirm
- [ ] Acceptance test (manual):
  - [ ] Submit report form → laporan muncul di list
  - [ ] Upload foto → foto URL di database adalah CloudFront URL
  - [ ] Admin login → lihat laporan → ubah status → lihat change di UI

---

## ✓ Checklist Dokumentasi & Deliverables

- [ ] `README.md` di root dengan:
  - [ ] Stack summary
  - [ ] Local run instructions (backend, frontend, docker-compose)
  - [ ] AWS deployment steps
  - [ ] Environment variables explanation
- [ ] `docs/GITHUB_SECRETS_SETUP.md` sudah ada dengan copy-paste instructions
- [ ] `docs/SPECIFICATION.md` mencakup:
  - [ ] Feature descriptions
  - [ ] API contracts (JSON examples)
  - [ ] Data model diagrams
  - [ ] Architecture diagram (manual, bukan AI) — draw.io atau gambar manual
  - [ ] Deployment flow diagram
- [ ] `.env.example` files di backend & frontend sudah lengkap
- [ ] `infrastructure/terraform/terraform.tfvars.example` sudah ada
- [ ] `.github/workflows/` semua file sudah lengkap & tested
- [ ] CHANGELOG.md atau DEPLOYMENT.md untuk ETS2 submission

---

## ✓ Checklist Deployment (ETS2 Day)

- [ ] AWS credentials sudah di-set di GitHub Secrets
- [ ] Terraform state backend sudah di-configure (S3 bucket opsional untuk v1)
- [ ] Run `terraform plan` dengan correct tfvars → no errors
- [ ] Run `terraform apply` (atau via GitHub Actions) → resources created
- [ ] Push code ke `main` branch → GitHub Actions trigger automatically
- [ ] Wait for CI/CD pipeline → images pushed to ECR ✓
- [ ] ECS service updated → new tasks running ✓
- [ ] Health check endpoint returning 200 OK
- [ ] ALB DNS name accessible from browser → app load ✓
- [ ] Create report via UI → save to RDS ✓
- [ ] Upload evidence → file in S3, URL in DB is CloudFront ✓
- [ ] Admin dashboard → login → see reports ✓
- [ ] Change report status → update in RDS & UI ✓
- [ ] Screenshot/video evidence untuk setiap rubric criterion

---

## Pre-Submission Checklist (24 hours sebelum ETS2)

1. [ ] Code reviewed: no typos, imports correct, no debug statements
2. [ ] All tests passed locally
3. [ ] Docker images build & run successfully
4. [ ] Terraform dry-run (`terraform plan`) shows expected resources
5. [ ] GitHub Secrets all filled in & not exposed in code
6. [ ] README & SPECIFICATION complete & clear
7. [ ] Diagram dibuat manual (draw.io), bukan pakai AI
8. [ ] Architecture matches PRD section 5 requirements:
   - [ ] VPC & subnets ✓
   - [ ] ECS & ECR ✓
   - [ ] RDS private ✓
   - [ ] S3 + CloudFront ✓
   - [ ] CI/CD GitHub Actions ✓
9. [ ] Scoring rubric items (PRD section 6) all addressed:
   - [ ] Deploy Aplikasi (10%) — online & no errors
   - [ ] Docker + ECS (15%) — running in containers
   - [ ] ECR Deployment (5%) — images stored & used
   - [ ] Database RDS (10%) — private subnet & connected
   - [ ] Storage S3 (10%) — upload working
   - [ ] CDN CloudFront (10%) — all static via CDN
   - [ ] CI/CD GitHub (5%) — automated build & deploy
   - [ ] Arsitektur Cloud (5%) — all components present, manual diagram
10. [ ] Commit final changes & push to `main`
11. [ ] Verify GitHub Actions pipeline completed successfully
12. [ ] Note the ALB DNS / application URL for submission

---

**Selesai?** Jika semua checklist sudah ✓, kamu siap untuk submission ETS2!
