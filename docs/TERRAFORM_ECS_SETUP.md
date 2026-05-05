# Terraform ECS Setup — Task Definition & Services

**Tujuan**: Mengatur ECS cluster, task definitions, services, dan load balancer di Terraform sesuai PRD section 5.

---

## 1. Perbarui `infrastructure/terraform/main.tf` — Tambah ECS Service Definition

Tambahkan blok berikut ke file `main.tf` untuk membuat ECS service dan task definition:

```hcl
# ========================= ECS TASK DEFINITION =========================

resource "aws_ecs_task_definition" "backend" {
  family                   = "tbsm-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "backend-container"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "APP_ENV"
        value = "production"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      },
      {
        name  = "S3_BUCKET"
        value = aws_s3_bucket.evidence.id
      },
      {
        name  = "CLOUDFRONT_DOMAIN"
        value = aws_cloudfront_distribution.cdn.domain_name
      },
      {
        name  = "ADMIN_TOKEN"
        value = "change-me-secure-token-in-secrets-manager"
      }
    ]

    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:tbsm/database-url"
      },
      {
        name      = "DB_PASSWORD"
        valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:tbsm/db-password"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ========================= IAM ROLES =========================

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:tbsm/*"
    }]
  })
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3_policy" {
  name = "${var.project_name}-ecs-task-s3"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ]
      Resource = [
        aws_s3_bucket.evidence.arn,
        "${aws_s3_bucket.evidence.arn}/*"
      ]
    }]
  })
}

# ========================= ALB & TARGET GROUPS =========================

resource "aws_lb" "tbsm" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public.id]

  tags = { Name = "${var.project_name}-alb" }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.tbsm.id
  target_type = "ip"

  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.tbsm.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ========================= ECS SERVICE =========================

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.tbsm.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend-container"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.http]

  tags = { Name = "${var.project_name}-backend-service" }
}

# ========================= CLOUDWATCH LOGS =========================

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/tbsm-backend"
  retention_in_days = 7

  tags = { Name = "${var.project_name}-backend-logs" }
}
```

---

## 2. Update `infrastructure/terraform/outputs.tf` — Add ALB DNS

```hcl
output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.tbsm.dns_name
}

output "alb_url" {
  description = "URL untuk akses aplikasi"
  value       = "http://${aws_lb.tbsm.dns_name}"
}

output "ecs_service_name" {
  description = "ECS service name untuk GitHub Actions"
  value       = aws_ecs_service.backend.name
}
```

---

## 3. Update `infrastructure/terraform/variables.tf` — Add ECS variables

```hcl
variable "ecs_task_cpu" {
  type    = string
  default = "256"
}

variable "ecs_task_memory" {
  type    = string
  default = "512"
}

variable "ecs_desired_count" {
  type    = number
  default = 2
}
```

---

## 4. Deploy Terraform

```bash
cd infrastructure/terraform

# Init (jika belum)
terraform init

# Plan dengan tfvars
terraform plan -var-file=terraform.tfvars

# Apply (create resources di AWS)
terraform apply -var-file=terraform.tfvars
```

**Output yang akan didapat**:
- `alb_dns_name` → gunakan untuk mengakses aplikasi (misal: `http://tbsm-alb-123456.ap-southeast-1.elb.amazonaws.com`)
- `alb_url` → full URL
- `ecs_service_name` → gunakan di GitHub Actions deployment
- RDS endpoint → untuk DATABASE_URL
- S3 bucket name → untuk S3_BUCKET
- CloudFront domain → untuk CLOUDFRONT_DOMAIN

---

## 5. Masukkan Secrets ke AWS Secrets Manager

Sebelum deployment, buat secrets di Secrets Manager untuk database credentials:

```bash
# Create database-url secret
aws secretsmanager create-secret \
  --name tbsm/database-url \
  --secret-string "postgresql://tbsm_admin:PASSWORD@rds-endpoint:5432/tbsm_db" \
  --region ap-southeast-1

# Create db-password secret
aws secretsmanager create-secret \
  --name tbsm/db-password \
  --secret-string "YourSecureDBPassword123!" \
  --region ap-southeast-1
```

---

## 6. Update GitHub Actions — Gunakan Output Terraform

Di workflow `.github/workflows/deploy-ecr-ecs.yml`, gunakan output Terraform:

```yaml
env:
  ECS_SERVICE: tbsm-backend-service        # dari output
  ECS_CLUSTER: tbsm-cluster
```

---

## Checklist

- [ ] `aws_ecs_task_definition` sudah di-add ke `main.tf`
- [ ] `aws_ecs_service` sudah di-add ke `main.tf`
- [ ] IAM roles (`ecs_task_execution_role`, `ecs_task_role`) sudah di-define
- [ ] ALB dan target groups sudah di-configure
- [ ] CloudWatch log group sudah dibuat
- [ ] Secrets Manager secrets sudah dibuat (`tbsm/database-url`, `tbsm/db-password`)
- [ ] `terraform plan` berjalan tanpa error
- [ ] `terraform apply` success → resources created di AWS
- [ ] ALB DNS name bisa di-access dari browser → health check OK
- [ ] GitHub Actions workflow bisa read dari Terraform outputs

---

**Selesai!** ECS services sudah siap untuk CI/CD deployment.
