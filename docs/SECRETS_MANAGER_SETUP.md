# AWS Secrets Manager Setup — Database & Configuration Secrets

**Tujuan**: Mengatur AWS Secrets Manager untuk menyimpan database credentials dan configuration secrets secara aman. Secrets ini akan direferensikan oleh ECS task definition.

---

## 1. Konsep — Mengapa Secrets Manager?

Berdasarkan PRD section 5 (security best practices):
- **Problem**: Database credentials, API tokens tidak boleh hardcoded di Docker image atau task definition
- **Solution**: Simpan di AWS Secrets Manager, ECS task baca on runtime via IAM role
- **Benefit**: 
  - Credentials tidak visible di source code atau logs
  - Mudah rotate credentials tanpa redeploy container
  - Audit trail tersimpan di CloudTrail
  - Automatic encryption at rest

---

## 2. Struktur Secrets yang Diperlukan

```
tbsm/
├── database-url          # Full PostgreSQL connection string
├── db-password           # DB admin password
└── admin-token           # Backend admin authentication token
```

---

## 3. Step-by-Step Setup di AWS Console atau CLI

### Option A: Menggunakan AWS CLI (Recommended)

**Pre-requisite**: 
- AWS CLI terinstall dan configured dengan credentials yang punya permission `secretsmanager:CreateSecret`
- IAM user dari GITHUB_SECRETS_SETUP.md sudah ada

#### Step 1: Buat Database-URL Secret

```bash
# Dapatkan RDS endpoint dari Terraform output
# Misal: tbsm-db.c123def456.ap-southeast-1.rds.amazonaws.com

aws secretsmanager create-secret \
  --name tbsm/database-url \
  --description "PostgreSQL connection string untuk TBSM backend" \
  --secret-string "postgresql://tbsm_admin:YOUR_DB_PASSWORD@tbsm-db.c123def456.ap-southeast-1.rds.amazonaws.com:5432/tbsm_db" \
  --region ap-southeast-1 \
  --tags Key=Project,Value=TBSM Key=Environment,Value=Production
```

**Output**:
```json
{
  "ARN": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:tbsm/database-url-AbCdEf",
  "Name": "tbsm/database-url",
  "VersionId": "00000000-1111-2222-3333-444444444444"
}
```

**Catat ARN** — digunakan di task definition.

#### Step 2: Buat DB-Password Secret

```bash
aws secretsmanager create-secret \
  --name tbsm/db-password \
  --description "PostgreSQL admin password" \
  --secret-string "YourSecurePostgresPassword123!@#" \
  --region ap-southeast-1 \
  --tags Key=Project,Value=TBSM Key=Environment,Value=Production
```

#### Step 3: Buat Admin-Token Secret (Optional)

```bash
aws secretsmanager create-secret \
  --name tbsm/admin-token \
  --description "Backend admin authentication token" \
  --secret-string "your-secure-admin-token-string-here" \
  --region ap-southeast-1 \
  --tags Key=Project,Value=TBSM Key=Environment,Value=Production
```

---

### Option B: Menggunakan AWS Console

1. **Buka AWS Console** → Services → Secrets Manager
2. **Click "Store a new secret"**
3. **Secret type**: Select "Other type of secret"
4. **Key/value pairs**:
   - Key: `database-url`
   - Value: `postgresql://tbsm_admin:PASSWORD@RDS-ENDPOINT:5432/tbsm_db`
5. **Secret name**: `tbsm/database-url`
6. **Encryption**: (default) `aws/secretsmanager`
7. **Tags** (optional):
   - Key: `Project`, Value: `TBSM`
   - Key: `Environment`, Value: `Production`
8. **Click "Store secret"**

Ulangi untuk `tbsm/db-password` dan `tbsm/admin-token`.

---

## 4. Verifikasi Secrets Tersimpan

```bash
# List semua secrets di namespace tbsm/
aws secretsmanager list-secrets \
  --filters Key=name,Values=tbsm/ \
  --region ap-southeast-1

# Get value dari specific secret
aws secretsmanager get-secret-value \
  --secret-id tbsm/database-url \
  --region ap-southeast-1
```

---

## 5. Integrasi dengan ECS Task Definition

Task definition di Terraform sudah configure untuk baca secrets via `valueFrom`:

```hcl
secrets = [
  {
    name      = "DATABASE_URL"
    valueFrom = "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:tbsm/database-url"
  },
  {
    name      = "DB_PASSWORD"
    valueFrom = "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:tbsm/db-password"
  }
]
```

**Cara kerjanya**:
1. ECS task start
2. ECS task execution role baca ARN dari task definition
3. Secrets Manager API call dengan ARN
4. Decrypt secret value (using KMS if encrypted)
5. Inject sebagai environment variable ke container
6. Backend app baca dari `os.environ["DATABASE_URL"]`

---

## 6. Update ECS Task Execution Role — Tambah Permissions

Terraform IAM policy sudah include permission untuk baca secrets:

```hcl
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  # ...
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:tbsm/*"
    }]
  })
}
```

**Check di AWS Console**:
1. IAM → Roles → `tbsm-ecs-task-execution-role`
2. Verify policy `tbsm-ecs-task-execution-secrets` sudah attach
3. Resource ARN sudah correct untuk `tbsm/*`

---

## 7. Rotate Secrets (Maintenance)

Untuk mengganti password tanpa redeploy:

```bash
# Update secret value
aws secretsmanager update-secret \
  --secret-id tbsm/db-password \
  --secret-string "NewSecurePassword123!@#" \
  --region ap-southeast-1

# ECS task akan otomatis baca value terbaru pada next task restart
```

---

## 8. Security Best Practices (dari PRD section 5)

✓ **Secrets Encryption**: All secrets encrypted at rest using AWS KMS (default: aws/secretsmanager key)

```bash
# Verify encryption
aws secretsmanager describe-secret \
  --secret-id tbsm/database-url \
  --region ap-southeast-1 | grep -A2 "KmsKeyId"
```

✓ **Access Control**: Only ECS task execution role dapat baca secrets

```bash
# Check secret resource policy
aws secretsmanager get-resource-policy \
  --secret-id tbsm/database-url \
  --region ap-southeast-1
```

✓ **Audit**: CloudTrail mencatat semua API calls ke Secrets Manager

✓ **Never expose in logs**: ECS task definition punya flag untuk tidak log environment variables yang sensitive

---

## 9. Troubleshooting

### Error: "AccessDeniedException" saat ECS task startup

**Cause**: ECS task execution role tidak punya permission ke Secrets Manager

**Fix**:
```bash
# Verify role ARN di task definition
# Check IAM role attach policy dengan Action: secretsmanager:GetSecretValue
# Verify Resource ARN pattern sesuai secret name
```

### Error: "ResourceNotFoundException" — secret tidak ditemukan

**Cause**: Secret name typo atau tidak exist

**Fix**:
```bash
# Verify secret name exact
aws secretsmanager list-secrets --region ap-southeast-1

# Verify ARN format correct:
# arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:NAME-SUFFIX
```

### Error: "DecryptionFailure" — KMS key issue

**Cause**: KMS key permissions

**Fix**:
```bash
# Verify KMS key policy allows ecs-tasks principal
aws kms describe-key --key-id <KEY_ID> --region ap-southeast-1
```

---

## 10. Checklist

- [ ] `tbsm/database-url` secret created di Secrets Manager
- [ ] `tbsm/db-password` secret created di Secrets Manager
- [ ] `tbsm/admin-token` secret created (optional)
- [ ] Secret values terverifikasi via `get-secret-value`
- [ ] ECS task execution role punya `secretsmanager:GetSecretValue` permission
- [ ] Task definition `valueFrom` ARN sesuai dengan secret ARN
- [ ] IAM policy resource pattern `arn:aws:secretsmanager:*:*:secret:tbsm/*` correct
- [ ] KMS encryption verified
- [ ] CloudTrail logging enabled untuk audit

---

**Selesai!** Secrets Manager sudah configured untuk aman menyimpan credentials.

Next step: Jalankan `terraform apply` → ECS service start → Task baca secrets → Container start dengan credentials sudah di-inject.
