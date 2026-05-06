# GitHub Secrets Setup Guide

**Tujuan**: Mengatur secrets di repository GitHub agar CI/CD pipeline bisa akses AWS credentials & database secara aman.

---

## Langkah 1: Buat IAM User di AWS (untuk GitHub Actions)

1. Buka AWS Console → **IAM** → **Users**
2. Klik **Create user** → Nama: `github-actions-tbsm`
3. **Permissions**:
   - Attach policy `AmazonEC2ContainerRegistryFullAccess` (untuk ECR push)
   - Attach policy `AmazonECS_FullAccess` (untuk ECS updates)
   - Attach policy `AmazonS3FullAccess` (untuk S3 bucket)
   - Attach policy `AmazonRDSFullAccess` (opsional, untuk RDS management)
4. Create **Access Key**:
   - Pilih "Application running outside AWS"
   - Klik **Create access key** → copy `Access key ID` dan `Secret access key`
   - **Simpan di tempat aman** (hanya ditampilkan sekali)

---

## Langkah 2: Cari AWS Account ID & Region

1. Buka AWS Console → Click profile kamu di top-right
2. Lihat **Account ID** (format: 123456789012)
3. Atau buka **AWS CloudShell** jalankan:
```bash
aws sts get-caller-identity --query Account --output text
```
4. Untuk region, cek region saat ini di top-right (misal: `ap-southeast-1`)

---

## Langkah 3: Setup S3 Bucket untuk Evidence Storage

1. **Buat S3 bucket** untuk evidence storage (pastikan unique name globally):
```bash
aws s3 mb s3://tbsm-terraform-state-$(aws sts get-caller-identity --query Account --output text) \
  --region ap-southeast-1
```

2. Atau buka AWS Console → **S3** → **Create bucket**:
   - Name: `tbsm-terraform-state-{ACCOUNT_ID}` (misal: `tbsm-terraform-state-123456789012`)
   - Region: `ap-southeast-1` (sesuai pilihan kamu)
   - Block all public access: ✓
   - Versioning: Enable
   - Encryption: Enable (default)
   - Create

3. Simpan bucket name ini untuk `S3_BUCKET` dan CloudFront origin.

---

## Langkah 4: Masukkan Secrets ke GitHub Repository

1. Buka repository GitHub kamu → **Settings**
2. Sidebar kiri → **Secrets and variables** → **Actions**
3. Klik **New repository secret** (ulangi untuk setiap secret):

### Secrets yang wajib diisi:

| Secret Name | Nilai | Catatan |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | (dari step 1) | Access Key dari IAM user `github-actions-tbsm` |
| `AWS_SECRET_ACCESS_KEY` | (dari step 1) | Secret Access Key (hati-hati, jangan biarkan exposed) |
| `AWS_REGION` | `ap-southeast-1` | Atau region pilihan kamu |
| `AWS_ACCOUNT_ID` | `123456789012` | Account ID AWS kamu |
| `TF_BACKEND_BUCKET` | `tbsm-evidence-123456789012` | S3 bucket evidence |
| `DB_PASSWORD` | (kamu set saat RDS creation) | Master password RDS (atau ambil dari RDS parameter group) |

### Cara input secret di GitHub:

```
Secret Name: AWS_ACCESS_KEY_ID
Secret:      AKIAIOSFODNN7EXAMPLE

(Klik "Add secret")
```

Ulangi untuk semua 6 secrets di atas.

---

## Langkah 5: Verifikasi Secrets Sudah Masuk

1. Buka repository → **Settings** → **Secrets and variables** → **Actions**
2. Kamu harus lihat 6 secrets (nilai tersembunyi, cuma nama yang terlihat)
3. Jangan expose secrets di git commits! Pastikan `.gitignore` include `.env` dan credential files

---

## Langkah 6: Deploy Infrastructure via GitHub Actions (atau Manual)

### Opsi A: Manual Deploy (rekomendasi untuk v1)

1. Local machine, siapkan file `.aws/task-definition.json` dan AWS Console resources:
```bash
echo "Create VPC, RDS, ALB, ECR, S3, and CloudFront manually"
```

2. Setelah resource dibuat, catat:
   - RDS endpoint
   - S3 bucket name
   - CloudFront domain
   - ECR repository URLs

### Opsi B: GitHub Actions Deploy (advanced)

1. Push code ke branch baru:
```bash
git add .
git commit -m "Add Terraform for AWS infra"
git push origin main
```

2. Klik **Actions** tab di GitHub → workflow deployment aplikasi
3. Workflow akan build/push image lalu update ECS service

---

## Langkah 7: Update Environment Variables di ECS Task Definition

Setelah RDS & S3 dibuat, update file `.aws/task-definition.json` dengan nilai sesungguhnya:

```json
{
  "containerDefinitions": [
    {
      "name": "backend-container",
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://tbsm_admin:<DB_PASSWORD>@<RDS_ENDPOINT>:5432/tbsm_db"},
        {"name": "AWS_REGION", "value": "ap-southeast-1"},
        {"name": "S3_BUCKET", "value": "tbsm-evidence-123456789012"},
        {"name": "CLOUDFRONT_DOMAIN", "value": "d123456abcdef.cloudfront.net"},
        {"name": "ADMIN_TOKEN", "value": "<admin-secret-token>"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:tbsm/db-password"}
      ]
    }
  ]
}
```

---

## Langkah 8: Deploy Backend & Frontend to ECR (via GitHub Actions)

1. Push code ke `main`:
```bash
git add .
git commit -m "Update task definition & docker images"
git push origin main
```

2. GitHub Actions akan **automatically trigger** workflow `deploy-ecr-ecs.yml`
3. Wait untuk pipeline:
   - ✓ Build backend image
   - ✓ Push ke ECR
   - ✓ Build frontend image (opsional)
   - ✓ Update ECS service
   - ✓ Deploy dengan image terbaru

4. Lihat **Actions** tab → **Deploy to Amazon ECS** → check logs untuk status

---

## Troubleshooting

### Error: "No credentials provided"
- Pastikan `AWS_ACCESS_KEY_ID` dan `AWS_SECRET_ACCESS_KEY` sudah benar di GitHub Secrets
- Check IAM user permissions (harus attach policies untuk ECR, ECS, S3)

### Error: "Repository does not exist"
- ECR repository belum dibuat (buat via AWS Console dulu)
- Atau repository name tidak match di workflow (`ECR_REPOSITORY_BACKEND` = `tbsm-backend`)

### Error: "AccessDenied" untuk S3 / ECS
- Check IAM policy attached ke user yang make access keys
- Pastikan policy allow `s3:GetObject`, `ecs:UpdateService`, `ecr:PutImage`

### Error: "Task definition does not exist"
- File `.aws/task-definition.json` tidak ada atau path salah
- Run locally dulu: `aws ecs register-task-definition --cli-input-json file://.aws/task-definition.json`

---

## Selesai!

Setelah setup ini, setiap kali kamu:
1. Push code ke `main` branch
2. GitHub Actions akan otomatis:
   - Build Docker images
   - Push ke ECR
   - Update ECS service
   - Deploy live ke AWS

Kamu bisa monitor via:
- GitHub **Actions** tab
- AWS **ECS** console → Service → Deployments
- CloudWatch Logs (via ECS cluster logs)

Sukses! 🎉
