# Architecture Diagram Guide — Manual Creation with draw.io

**Requirement**: PRD section 6 — "Arsitektur Cloud (5%)" rubric requires complete AWS architecture diagram showing all components and their relationships.

**Instruction**: Diagram MUST be manually created, NOT AI-generated.

---

## 1. Tools untuk Create Diagram

Pilih salah satu:

- **draw.io** (Free, web-based) — https://www.draw.io/
- **Lucidchart** (Paid) — https://www.lucidchart.com/
- **AWS Architecture Icons** (AWS official) — https://aws.amazon.com/architecture/icons/
- **Miro** (Free tier) — https://miro.com/

**Recommended**: draw.io — sudah include AWS icon library, free, dan bisa export ke PNG/SVG.

---

## 2. Components yang Harus Ditampilkan

### Layer 1: Client/User
- [ ] User (web browser)
- [ ] Admin user (web browser)

### Layer 2: Internet & Security
- [ ] Internet Gateway
- [ ] Route 53 (optional — untuk DNS)
- [ ] WAF (optional — untuk advanced security)

### Layer 3: Load Balancer & Networking
- [ ] Application Load Balancer (ALB)
  - Port 80 listener
  - Port 443 listener (optional — HTTPS)
  - Health check path: `/api/health`

### Layer 4: VPC & Network
- [ ] VPC (10.0.0.0/16)
  - [ ] Public Subnet (10.0.1.0/24)
    - ALB location
    - NAT Gateway
  - [ ] Private Subnet (10.0.2.0/24)
    - RDS location (no public access)

### Layer 5: Compute
- [ ] ECS Cluster (tbsm-cluster)
  - [ ] ECS Service (backend-service)
    - [ ] Multiple ECS Tasks (Fargate)
      - Backend container (port 8000)
      - Health check endpoint
  - [ ] CloudWatch Logs (/ecs/tbsm-backend)

### Layer 6: Container Registry
- [ ] ECR Repositories
  - [ ] tbsm-backend repository
  - [ ] tbsm-frontend repository (optional)

### Layer 7: Database
- [ ] RDS PostgreSQL
  - Private subnet
  - Security group (5432 from ECS only)
  - Backup retention

### Layer 8: Storage & CDN
- [ ] S3 Bucket (evidence storage)
  - Block all public access
  - Encryption enabled
- [ ] CloudFront Distribution
  - Origin: S3 via Origin Access Control (OAC)
  - Custom domain (optional)

### Layer 9: Secrets & IAM
- [ ] AWS Secrets Manager
  - tbsm/database-url
  - tbsm/db-password
- [ ] IAM Roles
  - ECS task execution role
  - ECS task role (S3 + Secrets Manager)

### Layer 10: Monitoring & Logging
- [ ] CloudWatch
  - Log groups
  - Metrics (optional)
- [ ] CloudTrail (optional — for audit)

### Layer 11: CI/CD Pipeline
- [ ] GitHub Repository
  - GitHub Actions workflows
- [ ] ECR Push (from CI/CD)
- [ ] ECS Service Update (from CI/CD)

---

## 3. Step-by-Step — Draw Architecture dengan draw.io

### Step 1: Open draw.io

1. Go to https://www.draw.io/
2. Click "Create new diagram"
3. Choose "Blank Diagram" or "AWS Architecture" template
4. Name: `TBSM_Architecture` atau `TransBandung-Smart-Monitoring-Architecture`

### Step 2: Setup Canvas

1. Right-click canvas → "Edit Data" → Set properties (optional)
2. Format → Page Setup → 
   - Page size: Ledger (landscape for big diagram)
   - Grid: Show grid (helps alignment)

### Step 3: Add AWS Icon Library (if not auto-loaded)

1. Left sidebar → "More Shapes"
2. Search: "aws"
3. Check: "AWS Architecture Icons"
4. Click "Apply"

### Step 4: Draw Layers dari Top ke Bottom

**Layer 1: Users**
- Drag icon: Person/User icon
- Label: "User (Browser)"
- Duplicate → "Admin User"

**Layer 2: Internet & Load Balancer**
- Drag: ALB icon (from AWS Architecture Icons)
- Label: "Application Load Balancer"
- Add connector from User → ALB
- Add ports: "80 (HTTP)" and "443 (HTTPS)" as annotations

**Layer 3: VPC Container**
- Drag: Rounded rectangle shape
- Resize: Large container untuk VPC
- Label: "VPC (10.0.0.0/16)"
- Color: Light blue background (optional)
- Add: "Availability Zone" containers inside (2 AZs recommended)

**Layer 4: Public Subnet**
- Inside VPC → Left side (AZ-1)
- Drag: Rounded rectangle
- Label: "Public Subnet (10.0.1.0/24)"
- Place ALB inside public subnet
- Add NAT Gateway icon
- Color: Light green background

**Layer 5: Private Subnet**
- Inside VPC → Right side (AZ-2)
- Drag: Rounded rectangle
- Label: "Private Subnet (10.0.2.0/24)"
- Color: Light yellow background

**Layer 6: ECS Cluster**
- Inside Private Subnet
- Add "ECS Cluster" container (rounded rectangle)
- Inside ECS Cluster:
  - Add "ECS Service" container
  - Inside ECS Service: 
    - Add multiple "ECS Task" rectangles (2-3 tasks)
    - Inside each task: "Backend Container" + "Port 8000"
- Connect ALB → ECS Service (path-based routing)
- Add connector: ECS Service ↔ Health Check (/api/health)

**Layer 7: Database**
- Inside Private Subnet
- Add: RDS icon (cylinder shape)
- Label: "RDS PostgreSQL (tb.t3.micro)"
- Color: Orange
- Add: "Private access only" annotation
- Security group: "Port 5432 from ECS"
- Connect: ECS Task → RDS (DATABASE_URL)

**Layer 8: Storage**
- Outside VPC (separate area)
- Add: S3 bucket icon
- Label: "S3 Bucket\n(Evidence Storage)"
- Annotations:
  - Block all public access ✓
  - Encryption enabled ✓

**Layer 9: CDN**
- Next to S3
- Add: CloudFront icon
- Label: "CloudFront Distribution"
- Add: OAC (Origin Access Control) connection
- Connect: S3 → CloudFront (OAC, no direct S3 access)
- Connect: ECS Task → CloudFront (presigned URLs)
- Annotation: "No direct S3 URLs"

**Layer 10: Secrets**
- Add: "AWS Secrets Manager" container
- Inside:
  - "tbsm/database-url"
  - "tbsm/db-password"
- Connect: ECS Task Execution Role → Secrets Manager

**Layer 11: Monitoring**
- Add: "CloudWatch Logs" container
- Connect: ECS Task → CloudWatch (/ecs/tbsm-backend)

**Layer 12: CI/CD**
- Outside AWS (left side)
- Add: GitHub icon/rectangle
- Label: "GitHub Repository"
- Annotation: "CI/CD Workflows"
- Add: Arrows showing workflow
  - GitHub → ECR (Build & Push)
  - ECR → ECS Service (Update Service)
- Add: CloudTrail icon (optional)

### Step 5: Add Connector Lines & Annotations

1. **Lines**:
   - Solid line: Active connection
   - Dashed line: Optional/conditional
   - Arrow direction: Direction of data flow

2. **Annotations** (text labels on connectors):
   - HTTP/HTTPS
   - Database query
   - S3 PUT/GET
   - Presigned URL
   - Secret injection
   - Docker push

3. **Colors**:
   - Green: External users
   - Blue: AWS public services
   - Purple: AWS compute (ECS, Lambda)
   - Orange: AWS storage (S3, RDS)
   - Red: Security (WAF, Secrets Manager)

### Step 6: Security Annotations

Add security-related annotations at relevant components:

1. **ALB**: 
   - "Security Group: 80, 443"
   - "Auto-scaling based on load"

2. **ECS**:
   - "Security Group: 8000 from ALB"
   - "No public IP"
   - "Auto-retry + health check"

3. **RDS**:
   - "Security Group: 5432 from ECS only"
   - "Backup retention: 7 days"
   - "No public access"

4. **S3**:
   - "Block all public access"
   - "Encryption: KMS default"

5. **CloudFront**:
   - "OAC enabled"
   - "No direct S3 access"

6. **Secrets Manager**:
   - "Encryption at rest"
   - "Access via IAM role"

### Step 7: Add Legend (Optional)

- Create small table/text area:
  - Green lines = Primary data flow
  - Blue lines = AWS service-to-service
  - Dashed lines = Optional components
  - Icons = AWS official architecture icons

### Step 8: Export & Save

1. **Save diagram**:
   - File → Save → Choose: "Save as Google Drive" or "Download XML"
   - Filename: `TBSM_Architecture_Diagram.drawio`
   - Store locally in project

2. **Export to PNG**:
   - File → Export as → PNG
   - Check: "Zoom (100%)", "Border (10)"
   - Filename: `TBSM_Architecture_Diagram.png`
   - Save to: `docs/images/TBSM_Architecture_Diagram.png`

3. **Export to SVG** (optional — for web):
   - File → Export as → SVG
   - Filename: `TBSM_Architecture_Diagram.svg`

---

## 4. Sample Architecture Structure (Text Representation)

```
┌─────────────────────────────────────────────────────────────────┐
│                         GITHUB REPOSITORY                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ backend-ci   │  │ frontend-ci  │  │ deploy-ecr-ecs       │   │
│  │ (lint/test)  │  │ (npm build)  │  │ (build→ECR→ECS)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ Push to main
                                   ▼
         ┌─────────────────────────────────────────────────┐
         │     AWS REGION (ap-southeast-1)                 │
         │                                                 │
         │ ┌──────────────────────────────────────────┐   │
         │ │         INTERNET GATEWAY                 │   │
         │ └──────────────────────────────────────────┘   │
         │                    ▲                           │
         │                    │                           │
         │ ┌──────────────────────────────────────────┐   │
         │ │   Application Load Balancer (ALB)       │   │
         │ │   Port 80 → Health Check: /api/health   │   │
         │ └──────────────────────────────────────────┘   │
         │                    │                           │
         │    ┌───────────────┴────────────────┐          │
         │    │                                │          │
         │ ┌──┴──────────┐          ┌──────────┴─────┐    │
         │ │  Public     │          │  Private       │    │
         │ │  Subnet     │          │  Subnet        │    │
         │ │             │          │                │    │
         │ │ ┌─────────┐ │          │ ┌────────────┐│    │
         │ │ │  NAT    │ │          │ │  ECS      ││    │
         │ │ │Gateway  │ │          │ │  Cluster  ││    │
         │ │ └─────────┘ │          │ │           ││    │
         │ │             │          │ │┌─────────┐││    │
         │ │             │          │ ││ECS Task ││    │
         │ │             │          │ ││ Backend ││    │
         │ │             │          │ ││Container││    │
         │ │             │          │ │└─────────┘││    │
         │ │             │          │ │           ││    │
         │ │             │          │ │ CloudWatch││    │
         │ │             │          │ │ Logs:     ││    │
         │ │             │          │ │ /ecs/tbsm-││    │
         │ │             │          │ │ backend   ││    │
         │ │             │          │ └────────────┘│    │
         │ │             │          │                │    │
         │ │             │          │ ┌────────────┐ │    │
         │ │             │          │ │   RDS      │ │    │
         │ │             │          │ │   PG SQL   │ │    │
         │ │             │          │ │   (5432)   │ │    │
         │ │             │          │ └────────────┘ │    │
         │ └─────────────┘          └────────────────┘    │
         │                                                 │
         └─────────────────────────────────────────────────┘

         ┌──────────────────────┐  ┌──────────────────┐
         │   ECR Repositories   │  │  S3 + CloudFront │
         │                      │  │                  │
         │ ┌──────────────────┐ │  │ ┌──────────────┐ │
         │ │ tbsm-backend     │ │  │ │  S3 Bucket   │ │
         │ │ tbsm-frontend    │ │  │ │  (Evidence)  │ │
         │ └──────────────────┘ │  │ │              │ │
         └──────────────────────┘  │ │   ↓OAC       │ │
                ▲                  │ │ CloudFront   │ │
                │ Push             │ │ Distribution │ │
         ┌──────┴─────────┐        │ └──────────────┘ │
         │ GitHub Actions │        └──────────────────┘
         └────────────────┘
```

---

## 5. PRD Alignment

Diagram harus show compliance dengan PRD section 5 requirements:

✓ **Networking** (VPC, subnets, IGW, NAT, security groups)  
✓ **Database** (RDS PostgreSQL, private subnet, no public access)  
✓ **Storage** (S3 dengan block all public access, CloudFront dengan OAC)  
✓ **Compute** (ECS Fargate, ECR, ALB, health checks)  
✓ **CI/CD** (GitHub Actions → ECR → ECS)  
✓ **Security** (Secrets Manager, IAM roles, encryption)  
✓ **Monitoring** (CloudWatch Logs)  

---

## 6. Deliverables

Simpan di project:

- `docs/images/TBSM_Architecture_Diagram.png` — PNG export (untuk inclusion di README)
- `docs/TBSM_Architecture_Diagram.drawio` — Original draw.io file (untuk editing nanti)
- `docs/ARCHITECTURE.md` — Brief description explaining diagram components

---

## 7. Checklist Sebelum Submit

- [ ] Diagram menampilkan ALL AWS components (VPC, subnets, ALB, ECS, RDS, S3, CloudFront)
- [ ] Data flow arrows jelas (GitHub → ECR → ECS, ECS → RDS, ECS → S3 → CloudFront)
- [ ] Security annotations ada (security groups, no public access, OAC, IAM)
- [ ] Diagram menggunakan official AWS architecture icons
- [ ] PNG dan SVG export successful
- [ ] Diagram dapat dipahami oleh evaluator (not AI-generated)
- [ ] File size reasonable (< 2MB for PNG)
- [ ] All components labeled dengan jelas
- [ ] VPC CIDR blocks dan subnet ranges labeled
- [ ] Database private access dan S3 block public access clearly shown

---

**Selesai!** Diagram architecture sudah siap dibuat manual menggunakan draw.io.
