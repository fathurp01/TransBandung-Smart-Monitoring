# Documentation Index — TransBandung Smart Monitoring (TBSM)

Complete guide untuk semua dokumentasi project. Gunakan sebagai reference untuk navigation.

---

## 📖 Documentatio nFiles

### 🎯 Core Documentation (Read These First)

#### 1. [README.md](../README.md) — PROJECT OVERVIEW
- **Audience**: Everyone
- **Content**: Project summary, tech stack, quick start, API endpoints, features
- **Time to read**: 10 minutes
- **Key sections**:
  - Quick links ke semua dokumentasi
  - Local development setup (backend + frontend)
  - API endpoints reference
  - Security features
  - Deployment overview

#### 2. [ETS2_DEPLOYMENT_RUNBOOK.md](ETS2_DEPLOYMENT_RUNBOOK.md) — DEPLOYMENT GUIDE ⭐ **START HERE FOR DEPLOYMENT**
- **Audience**: DevOps, deployment engineers, evaluators
- **Content**: Step-by-step guide untuk deploy ke AWS pada hari evaluasi
- **Time to execute**: 45-60 minutes (first time)
- **Key phases**:
  1. Pre-deployment checklist
  2. Manual AWS infrastructure provisioning (15 min)
  3. AWS Secrets Manager setup (5 min)
  4. Task definition configuration (5 min)
  5. GitHub Actions CI/CD trigger (5 min)
  6. Health verification (5 min)
  7. End-to-end testing (10 min)
  8. Submission evidence capture
  9. Troubleshooting guide

#### 3. [PROMPT_CHECK.md](PROMPT_CHECK.md) — ETS2 EVALUATION CHECKLIST ⭐ **RUBRIC COMPLIANCE**
- **Audience**: ETS2 evaluators, QA testers
- **Content**: Comprehensive checklist untuk evaluasi semua PRD requirements
- **Time to review**: 20 minutes (checklist), 2-3 hours (full validation)
- **Key sections**:
  - Networking (5 points)
  - Database (5 points)
  - Storage & CDN (5 points)
  - Compute & Deployment (15 points)
  - CI/CD Automation (10 points)
  - Code Quality (10 points)
  - Security (10 points)
  - Testing (10 points)
  - Documentation (15 points)
  - Bonus: Diagram, monitoring, etc.
- **Output**: Scored assessment dengan evidence

---

### 🏗️ Infrastructure & Cloud Setup

#### 4. [TERRAFORM_ECS_SETUP.md](TERRAFORM_ECS_SETUP.md) — ECS INFRASTRUCTURE (REFERENCE ONLY)
- **Audience**: Infrastructure engineers, evaluators
- **Content**: Reference notes for ECS cluster, task definition, ALB, IAM roles
- **Time to read**: 15 minutes
- **Prerequisite**: AWS account ready; manual AWS Console provisioning is the active path
- **Key sections**:
  - Add aws_ecs_task_definition resource
  - Add aws_ecs_service resource
  - Configure IAM roles (task execution + task role)
  - Setup ALB (application load balancer)
  - Add security groups + target groups
  - CloudWatch log group configuration
  - Manual AWS Console setup steps
- **Output**: Provisioned ECS cluster + service + ALB running in AWS

#### 5. [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) — GITHUB SECRETS & IAM
- **Audience**: DevOps, security engineers
- **Content**: Setup GitHub Secrets dan IAM user untuk CI/CD
- **Time to execute**: 20 minutes
- **Prerequisite**: AWS account access, GitHub repository write permission
- **Key sections**:
  1. Create IAM user (github-actions-tbsm) dengan policy
  2. Generate access key + secret key
  3. Create S3 bucket for evidence storage and deployment artifacts
  4. Update ECS task definition template with manual values
  5. Configure 6 GitHub Secrets in Settings > Secrets > Actions:
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY
     - AWS_REGION
     - AWS_ACCOUNT_ID
     - TF_BACKEND_BUCKET
     - DB_PASSWORD
  6. Verify secrets masked in GitHub Actions logs
  7. Manual AWS provisioning atau automated application deployment
- **Output**: GitHub ready untuk CI/CD automation

#### 6. [SECRETS_MANAGER_SETUP.md](SECRETS_MANAGER_SETUP.md) — AWS SECRETS MANAGER
- **Audience**: Database administrators, security engineers
- **Content**: Setup AWS Secrets Manager untuk database credentials dan secrets
- **Time to execute**: 10 minutes
- **Prerequisite**: AWS CLI installed, GITHUB_SECRETS_SETUP completed
- **Key sections**:
  - Why Secrets Manager (security, rotation, audit)
  - Create secrets:
    - tbsm/database-url
    - tbsm/db-password
    - tbsm/admin-token (optional)
  - Integration dengan ECS task definition
  - IAM role permissions untuk baca secrets
  - Verify secrets stored
  - Rotate secrets (maintenance)
  - Troubleshooting (access denied, encryption)
- **Output**: Secrets stored encrypted, ECS task dapat baca credentials on startup

---

### 📐 Architecture & Design

#### 7. [ARCHITECTURE_DIAGRAM_GUIDE.md](ARCHITECTURE_DIAGRAM_GUIDE.md) — ARCHITECTURE DIAGRAM CREATION ⭐ **MANUAL, NOT AI**
- **Audience**: Architects, technical writers
- **Content**: Step-by-step guide untuk membuat architecture diagram menggunakan draw.io
- **Time to create**: 30-45 minutes (manual drawing)
- **Prerequisite**: draw.io account (free)
- **Important**: **Diagram MUST be manually created, NOT AI-generated** (PRD requirement)
- **Key sections**:
  - Tools recommendation (draw.io, Lucidchart, AWS Icons)
  - Components checklist (11 layers dari client sampai CI/CD)
  - Step-by-step drawing guide:
    - Layer 1: Users
    - Layer 2: Internet + ALB
    - Layer 3: VPC containers
    - Layer 4-5: Public/Private subnets
    - Layer 6: ECS cluster + tasks
    - Layer 7: RDS database
    - Layer 8-9: S3 + CloudFront
    - Layer 10: Secrets + monitoring
    - Layer 11: CI/CD pipeline
  - Connector + annotation guidelines
  - Export to PNG/SVG
  - Security annotations
- **Output**: TBSM_Architecture_Diagram.png (untuk submit ke ETS2)

---

### 🔑 Configuration & Examples

#### 8. [prd.md](prd.md) — PROJECT REQUIREMENTS DOCUMENT
- **Audience**: Project managers, evaluators
- **Content**: Complete PRD specification untuk project
- **Key sections**:
  - Business requirements
  - Functional features (monitoring, reporting, upload, admin)
  - Technical architecture (section 5)
  - Evaluation criteria (section 6 — rubric points)
- **Reference**: Gunakan untuk align development dengan requirements

---

## 🗺️ Documentation Navigation Map

### Untuk Role berbeda:

**👨‍💼 Project Manager / Evaluator**
1. Start: README.md → Project overview
2. Read: PROMPT_CHECK.md → Rubric checklist
3. Review: ARCHITECTURE_DIAGRAM_GUIDE.md → System design
4. Reference: prd.md → Requirements

**🏗️ DevOps Engineer / Infrastructure**
1. Start: TERRAFORM_ECS_SETUP.md → Reference only for ECS settings
2. Setup: GITHUB_SECRETS_SETUP.md → Secrets configuration
3. Config: SECRETS_MANAGER_SETUP.md → Credential storage
4. Deploy: ETS2_DEPLOYMENT_RUNBOOK.md → Execution steps
5. Verify: PROMPT_CHECK.md → Compliance validation

**👨‍💻 Backend Developer**
1. Start: README.md → Project overview
2. Setup: Backend local development (README.md section)
3. Reference: FastAPI API endpoints (README.md)
4. Test: pytest suite (backend/tests/)

**🎨 Frontend Developer**
1. Start: README.md → Project overview
2. Setup: Frontend local development (README.md section)
3. Code: React components (frontend/src/)
4. Build: `npm run build` production (README.md)

**🔒 Security Reviewer**
1. Start: PROMPT_CHECK.md → Security section (10 points)
2. Check: SECRETS_MANAGER_SETUP.md → Credential management
3. Verify: TERRAFORM_ECS_SETUP.md → IAM roles + security groups (reference)
4. Review: README.md → Security features section

**📊 QA / Tester**
1. Start: ETS2_DEPLOYMENT_RUNBOOK.md → Testing procedures
2. Execute: Phase 6 → End-to-end testing
3. Verify: PROMPT_CHECK.md → Test coverage items
4. Capture: Screenshots untuk submission

**🚀 First-Time Deployer**
1. Read: ETS2_DEPLOYMENT_RUNBOOK.md (1 hour)
2. Setup: GITHUB_SECRETS_SETUP.md (20 min)
3. Config: TERRAFORM_ECS_SETUP.md (reference only)
4. Create: SECRETS_MANAGER_SETUP.md (10 min)
5. Execute: ETS2_DEPLOYMENT_RUNBOOK.md phases (45 min)

---

## 📋 File Locations Summary

```
docs/
├── README.md (root)                          ← Project overview
├── docs/
│   ├── prd.md                                ← Original requirements
│   ├── PROMPT_CHECK.md                       ← ⭐ Rubric checklist
│   ├── ETS2_DEPLOYMENT_RUNBOOK.md           ← ⭐ Deployment guide
│   ├── TERRAFORM_ECS_SETUP.md                ← Reference only
│   ├── GITHUB_SECRETS_SETUP.md               ← Secrets + IAM setup
│   ├── SECRETS_MANAGER_SETUP.md              ← Credential storage
│   ├── ARCHITECTURE_DIAGRAM_GUIDE.md         ← Diagram creation
│   ├── DOCUMENTATION_INDEX.md                ← This file
│   └── images/                               ← Screenshots + diagrams
│       └── TBSM_Architecture_Diagram.png     ← (created manually)
├── .aws/
│   └── task-definition.json                  ← ECS task template
├── .github/workflows/
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   ├── deploy-ecr-ecs.yml                    ← ⭐ Main CI/CD workflow
│   └── (no terraform workflow)
└── infrastructure/
  └── (manual AWS Console provisioning only)
```

---

## 🎯 Quick Reference — What to Read When

| Scenario | Read This | Time |
|----------|-----------|------|
| **I need to understand the project** | README.md | 10 min |
| **I'm evaluating for ETS2** | PROMPT_CHECK.md | 20 min |
| **I need to deploy to AWS** | ETS2_DEPLOYMENT_RUNBOOK.md | 60 min |
| **I need to understand the architecture** | ARCHITECTURE_DIAGRAM_GUIDE.md | 30 min |
| **I need to setup GitHub Secrets** | GITHUB_SECRETS_SETUP.md | 20 min |
| **I need ECS reference settings** | TERRAFORM_ECS_SETUP.md | 15 min |
| **I need to setup secrets storage** | SECRETS_MANAGER_SETUP.md | 10 min |
| **I need to review requirements** | prd.md | 30 min |

---

## ✅ Documentation Checklist

Before submitting to ETS2:

- [ ] README.md sudah comprehensive dengan links
- [ ] PROMPT_CHECK.md sudah complete checklist
- [ ] ETS2_DEPLOYMENT_RUNBOOK.md sudah tested
- [ ] TERRAFORM_ECS_SETUP.md ditandai sebagai referensi saja
- [ ] GITHUB_SECRETS_SETUP.md sudah follow AWS best practices
- [ ] SECRETS_MANAGER_SETUP.md sudah secure
- [ ] ARCHITECTURE_DIAGRAM_GUIDE.md sudah clear instructions
- [ ] Architecture diagram sudah created manual (PNG + draw.io files)
- [ ] All links in docs working
- [ ] All code examples tested
- [ ] All paths correct
- [ ] Typos checked

---

## 📞 Documentation Support

- **Questions about deployment?** → ETS2_DEPLOYMENT_RUNBOOK.md
- **Questions about infrastructure?** → ETS2_DEPLOYMENT_RUNBOOK.md + TERRAFORM_ECS_SETUP.md (reference)
- **Questions about security?** → SECRETS_MANAGER_SETUP.md + PROMPT_CHECK.md
- **Questions about architecture?** → ARCHITECTURE_DIAGRAM_GUIDE.md
- **Questions about requirements?** → prd.md + PROMPT_CHECK.md
- **Questions about evaluation?** → PROMPT_CHECK.md (rubric section)

---

**Last Updated**: [Current Date]  
**Documentation Version**: 1.0  
**Status**: Complete & Ready for ETS2
