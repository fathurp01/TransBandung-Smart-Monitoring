# ETS2 Deployment Runbook — Step-by-Step Guide untuk Hari Evaluasi

**Tujuan**: Quick reference guide untuk deploy aplikasi TBSM ke AWS pada hari ETS2 evaluation. Dokumen ini mengasumsikan semua prerequisites (IAM, GitHub Secrets, Terraform) sudah setup per GITHUB_SECRETS_SETUP.md dan TERRAFORM_ECS_SETUP.md.

**Estimated Duration**: 30-45 minutes (sekali jalan)

---

## Pre-Deployment Checklist (Lakukan sehari sebelum evaluasi)

- [ ] AWS Account access verified (dapat login dengan IAM user)
- [ ] GitHub Secrets sudah configured (6 secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCOUNT_ID, TF_BACKEND_BUCKET, DB_PASSWORD)
- [ ] GitHub repository cloned locally: `git clone <repo-url>`
- [ ] AWS CLI installed dan configured: `aws --version` dan `aws sts get-caller-identity`
- [ ] Docker installed (untuk test build images locally): `docker --version`
- [ ] Terraform installed: `terraform --version`
- [ ] All source code pushed to GitHub main branch

---

## Phase 1: Infrastructure Provisioning dengan Terraform (15 minutes)

### Step 1.1: Prepare Terraform Variables

```bash
cd infrastructure/terraform

# Create terraform.tfvars dari template
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars dengan actual values:
# - aws_region: ap-southeast-1
# - project_name: tbsm
# - vpc_cidr: 10.0.0.0/16
# - db_name: tbsm_db
# - db_username: tbsm_admin
# - db_password: (masukkan password secure)

nano terraform.tfvars  # atau editor yang preferred
```

**Expected content**:
```hcl
aws_region     = "ap-southeast-1"
project_name   = "tbsm"
vpc_cidr       = "10.0.0.0/16"
db_name        = "tbsm_db"
db_username    = "tbsm_admin"
db_password    = "YourSecurePassword123!@#"
```

### Step 1.2: Initialize Terraform

```bash
terraform init -upgrade

# Expected output:
# Initializing the backend...
# Successfully configured the backend "s3"!
# Initializing provider plugins...
# Terraform has been successfully initialized!
```

### Step 1.3: Validate Terraform Configuration

```bash
terraform validate

# Expected output:
# Success! The configuration is valid.
```

### Step 1.4: Plan Resources

```bash
terraform plan -var-file=terraform.tfvars -out=tfplan

# Review output:
# Plan: XX to add, 0 to change, 0 to destroy.
# 
# Check untuk key resources:
# - VPC (1)
# - Subnets (2)
# - Internet Gateway (1)
# - NAT Gateway (1)
# - RDS PostgreSQL (1)
# - ECS Cluster (1)
# - ECS Service (1)
# - ECR Repositories (2)
# - ALB (1)
# - S3 Bucket (1)
# - CloudFront Distribution (1)
# - Security Groups (3)
# - IAM Roles (2)
```

### Step 1.5: Apply Terraform Configuration

```bash
terraform apply tfplan

# Process akan memakan 15-20 minutes (banyak resources)
# Expected output:
# 
# Apply complete! Resources: XX added, 0 changed, 0 destroyed.
# 
# Outputs:
# alb_dns_name = "tbsm-alb-123456.ap-southeast-1.elb.amazonaws.com"
# alb_url = "http://tbsm-alb-123456.ap-southeast-1.elb.amazonaws.com"
# cloudfront_domain = "dXXXXXXXXXXXXXX.cloudfront.net"
# rds_endpoint = "tbsm-db.c123def456.ap-southeast-1.rds.amazonaws.com:5432"
# s3_bucket_name = "tbsm-evidence-123456789"
# ecs_service_name = "tbsm-backend-service"
```

**CATAT outputs di atas** — akan dipakai di step berikutnya.

### Step 1.6: Verify Resources Created di AWS Console

```bash
# Atau gunakan AWS CLI untuk verify

# Check RDS instance
aws rds describe-db-instances --db-instance-identifier tbsm-db --region ap-southeast-1

# Check ECS cluster
aws ecs describe-clusters --clusters tbsm-cluster --region ap-southeast-1

# Check S3 bucket
aws s3 ls | grep tbsm-evidence

# Check CloudFront
aws cloudfront list-distributions | grep tbsm
```

---

## Phase 2: AWS Secrets Manager Setup (5 minutes)

### Step 2.1: Create Database Secrets

```bash
# Get RDS endpoint dari Terraform output
RDS_ENDPOINT="tbsm-db.c123def456.ap-southeast-1.rds.amazonaws.com"
DB_PASSWORD="YourSecurePassword123!@#"  # same sebagai terraform.tfvars
AWS_REGION="ap-southeast-1"

# Create database-url secret
aws secretsmanager create-secret \
  --name tbsm/database-url \
  --secret-string "postgresql://tbsm_admin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/tbsm_db" \
  --region ${AWS_REGION}

# Output:
# {
#   "ARN": "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:tbsm/database-url-XXXXX",
#   "Name": "tbsm/database-url",
#   "VersionId": "12345678-abcd-1234-abcd-123456789abc"
# }

# Create db-password secret
aws secretsmanager create-secret \
  --name tbsm/db-password \
  --secret-string "${DB_PASSWORD}" \
  --region ${AWS_REGION}

# Verify
aws secretsmanager get-secret-value \
  --secret-id tbsm/database-url \
  --region ${AWS_REGION}
```

---

## Phase 3: Update ECS Task Definition dengan Actual Values (5 minutes)

Terraform sudah create task definition template di `.aws/task-definition.json`. Update placeholder values:

### Step 3.1: Get Actual Values dari Terraform Output

```bash
cd infrastructure/terraform

# Extract values
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="ap-southeast-1"
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)

echo "Account ID: $ACCOUNT_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront: $CLOUDFRONT_DOMAIN"
```

### Step 3.2: Update .aws/task-definition.json

Replace placeholders:

```bash
cd /path/to/project

# Using sed (Linux/Mac)
sed -i "s/ACCOUNT_ID/$ACCOUNT_ID/g" .aws/task-definition.json
sed -i "s/REGION/$AWS_REGION/g" .aws/task-definition.json
sed -i "s|S3_BUCKET|$S3_BUCKET|g" .aws/task-definition.json
sed -i "s|CLOUDFRONT_DOMAIN|$CLOUDFRONT_DOMAIN|g" .aws/task-definition.json

# Verify (check file)
cat .aws/task-definition.json | grep -E "ACCOUNT_ID|REGION|S3_BUCKET|CLOUDFRONT_DOMAIN"
# Should output: (blank = no placeholders left)
```

---

## Phase 4: Push Code to GitHub & Trigger CI/CD (5 minutes)

### Step 4.1: Commit & Push ke Main Branch

```bash
git add -A
git commit -m "chore: prepare for ETS2 deployment - update task definition and secrets"
git push origin main

# GitHub Actions akan otomatis trigger:
# 1. backend-ci.yml (lint/test)
# 2. frontend-ci.yml (build)
# 3. deploy-ecr-ecs.yml (build images → push ECR → deploy ECS)
```

### Step 4.2: Monitor GitHub Actions Workflow

**Di GitHub**:
1. Go to repository
2. Click "Actions" tab
3. See running workflow: "backend-ci", "frontend-ci", "deploy-ecr-ecs"
4. Wait semua jobs complete (green ✓)

**Expected timing**:
- backend-ci: 2-3 minutes
- frontend-ci: 3-5 minutes
- deploy-ecr-ecs: 10-15 minutes (include ECR push dan ECS update)

**Monitor di CLI**:
```bash
# Watch workflow status
gh run list --limit 1 --json status,conclusion,name

# Or check ECS service update
CLUSTER="tbsm-cluster"
SERVICE="tbsm-backend-service"

aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region ap-southeast-1 \
  --query 'services[0].{Status:status,TaskCount:runningCount,DesiredCount:desiredCount}'
```

---

## Phase 5: Verify Application Health (5 minutes)

### Step 5.1: Get ALB DNS Name

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
echo "Application URL: http://$ALB_DNS"
```

### Step 5.2: Test Health Check Endpoint

```bash
curl -i http://$ALB_DNS/api/health

# Expected response (200 OK):
# HTTP/1.1 200 OK
# Content-Type: application/json
# {"status":"ok"}
```

### Step 5.3: Test API Endpoints

```bash
# Test routes endpoint
curl http://$ALB_DNS/api/routes

# Expected response (200 OK):
# [
#   {
#     "id": 1,
#     "route_code": "TMB-01",
#     "route_name": "Bandung-Jakarta",
#     "operator": "TransBandung Inc.",
#     "schedules": [
#       {"id": 1, "departure_time": "06:00:00", "arrival_time": "09:00:00", "day_of_week": "MON"},
#       ...
#     ]
#   }
# ]

# Test create report
curl -X POST http://$ALB_DNS/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bus delay report",
    "description": "TMB-01 arrived 30 mins late",
    "location": "Bandung Station",
    "report_type": "DELAY",
    "submitted_by": "John Doe"
  }'

# Expected response (201 Created):
# {
#   "id": 1,
#   "title": "Bus delay report",
#   ...
#   "status": "PENDING"
# }
```

### Step 5.4: Test Frontend (Web UI)

Open browser: `http://$ALB_DNS`

Expected screens:
- [ ] Home page loads (Transport Monitor)
- [ ] Route list displays dengan schedules
- [ ] Report form page accessible
- [ ] Evidence upload form accessible
- [ ] Admin dashboard (with token) accessible

---

## Phase 6: End-to-End Testing (10 minutes)

### Scenario: Submit Report with Evidence

**Step 6.1**: Di UI, submit report
1. Go to "Submit Report" page
2. Fill form:
   - Title: "Test Evidence Upload"
   - Description: "Verification for ETS2"
   - Location: "Bandung Terminal"
   - Type: "DELAY"
   - Submitted by: "ETS2 Evaluator"
3. Click "Submit"
4. Expected: Report ID displayed (misal: Report ID: 5)

**Step 6.2**: Upload evidence untuk report
1. Go to "Upload Evidence" page
2. Select Report ID 5 (dari step sebelumnya)
3. Choose image file (test.jpg)
4. Click "Upload"
5. Expected: Upload progress → "Upload successful! CloudFront URL: https://d..."

**Step 6.3**: Verify evidence di admin dashboard
1. Go to "Admin Dashboard"
2. Input admin token: `change-me-admin-token` (default dari task definition)
3. Click "Load Reports"
4. Expected: Report 5 listed dengan status "PENDING"
5. Click report → see evidence thumbnail (loaded from CloudFront)
6. Update status to "APPROVED" dengan notes "Verified by ETS2"
7. Click "Update Status"
8. Expected: Status changed to "APPROVED"

**Step 6.4**: Verify data persisted di database
```bash
# Connect ke RDS
psql -h $RDS_ENDPOINT -U tbsm_admin -d tbsm_db

# Query reports
SELECT id, title, status, submitted_by FROM reports;
# Expected output:
# id | title                  | status   | submitted_by
# 5  | Test Evidence Upload   | APPROVED | ETS2 Evaluator

# Query evidence
SELECT id, report_id, upload_status, cloudfront_url FROM evidence_files;
# Expected output:
# id | report_id | upload_status | cloudfront_url
# 5  | 5         | SUCCESS       | https://d...cloudfront.net/evidence/...
```

---

## Phase 7: Prepare Submission Evidence (5 minutes)

### Screenshots untuk ETS2 Submission

Ambil screenshots ini untuk submit:

1. **Health Check Success**
   ```bash
   curl -i http://$ALB_DNS/api/health
   # Screenshot response: HTTP 200 OK
   ```

2. **Routes API Response**
   ```bash
   curl http://$ALB_DNS/api/routes | jq
   # Screenshot JSON output
   ```

3. **Report List**
   - Open browser → `http://$ALB_DNS`
   - Screenshot: Transport Monitor + Reports list

4. **Report Form Submission**
   - Screenshot: Form filled + Submit button clicked
   - Screenshot: Success message dengan Report ID

5. **Evidence Upload**
   - Screenshot: File selected + Upload in progress
   - Screenshot: Upload success message dengan CloudFront URL

6. **Admin Dashboard**
   - Screenshot: Reports list dengan status
   - Screenshot: Evidence thumbnail displayed
   - Screenshot: Status update successful

7. **Database Verification**
   - Screenshot: psql query hasil reports table
   - Screenshot: psql query hasil evidence table

8. **CloudWatch Logs**
   ```bash
   aws logs tail /ecs/tbsm-backend --follow --region ap-southeast-1
   # Screenshot: Recent logs showing request processing
   ```

9. **ECS Task Running**
   ```bash
   aws ecs describe-tasks \
     --cluster tbsm-cluster \
     --tasks $(aws ecs list-tasks --cluster tbsm-cluster --query taskArns[0] --output text) \
     --region ap-southeast-1 | jq '.tasks[0] | {taskArn, lastStatus, pullStartedAt, startedAt}'
   # Screenshot: Task status RUNNING
   ```

10. **S3 Evidence Bucket**
    ```bash
    aws s3 ls s3://$S3_BUCKET --recursive
    # Screenshot: Evidence files di bucket
    ```

---

## Phase 8: Troubleshooting Guide

### Issue: ALB health check failing (502 Bad Gateway)

**Debug steps**:
```bash
# Check ECS task logs
aws logs tail /ecs/tbsm-backend --follow --region ap-southeast-1

# Check ECS task status
aws ecs describe-tasks --cluster tbsm-cluster \
  --tasks $(aws ecs list-tasks --cluster tbsm-cluster --query taskArns[0] --output text) \
  --region ap-southeast-1

# Check security group rules
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=tbsm-alb-sg" \
  --region ap-southeast-1
```

**Common fixes**:
- ECS task not started → Check IAM role permissions
- Database connection refused → Check RDS security group rules
- Task definition image not found → Check ECR image pushed successfully

### Issue: Evidence upload to S3 failing

**Debug steps**:
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket $S3_BUCKET

# Check CloudFront OAC
aws cloudfront list-distributions --query 'DistributionList.Items[0].{DomainName,Origins}'

# Check ECS task IAM role policy
aws iam get-role-policy \
  --role-name tbsm-ecs-task-role \
  --policy-name tbsm-ecs-task-s3
```

**Common fixes**:
- S3 bucket blocking all public access (correct, as per PRD) — but task needs IAM permission
- CloudFront distribution not created → Check Terraform apply output
- ECS task role missing S3 permissions → Add policy via Terraform

### Issue: GitHub Actions workflow stuck or failed

**Debug steps**:
```bash
# Check GitHub Actions logs
gh run list --limit 5

gh run view <RUN_ID> --log

# Check ECR image push
aws ecr describe-images --repository-name tbsm-backend --region ap-southeast-1

# Check ECS service events
aws ecs describe-services \
  --cluster tbsm-cluster \
  --services tbsm-backend-service \
  --region ap-southeast-1 | jq '.services[0].events[:5]'
```

**Common fixes**:
- GitHub Secrets missing → Verify 6 secrets are set
- ECR repository not exist → Terraform should create, check plan output
- Task definition invalid → Validate JSON format, all placeholders replaced

---

## Post-Deployment Verification Checklist

- [ ] ALB DNS resolves: `nslookup <alb_dns_name>`
- [ ] Health check passes: HTTP 200 at `/api/health`
- [ ] Routes API responds: `/api/routes` returns array of routes
- [ ] Report creation works: POST `/api/reports` returns 201
- [ ] Evidence upload works: 3-step presigned URL flow succeeds
- [ ] Admin dashboard loads: token auth works
- [ ] Database has data: `SELECT COUNT(*) FROM reports;` > 0
- [ ] CloudWatch logs appear: `/ecs/tbsm-backend` has recent entries
- [ ] CloudFront serving: Evidence URLs return 200 from CloudFront
- [ ] S3 blocks public: Direct S3 URLs return 403 (only CloudFront allowed)
- [ ] Screenshots captured untuk submission

---

## Quick Reference — Important Commands

```bash
# Get ALB URL
ALB_URL=$(terraform output -raw alb_url)
echo $ALB_URL

# Test health
curl $ALB_URL/api/health

# Monitor ECS service
aws ecs describe-services --cluster tbsm-cluster \
  --services tbsm-backend-service --region ap-southeast-1

# Tail logs
aws logs tail /ecs/tbsm-backend --follow --region ap-southeast-1

# Check GitHub Actions
gh run list --limit 1

# Clean up (after ETS2, optional)
terraform destroy -var-file=terraform.tfvars
```

---

**Estimated Total Time: 45-60 minutes (pertama kali)**

Setelah infrastructure setup, deployment ke ECS hanya tinggal push code → GitHub Actions otomatis handle.

**GOOD LUCK! 🚀**
