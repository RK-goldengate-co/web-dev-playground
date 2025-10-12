# User Management System - Infrastructure as Code
# Terraform configuration cho production deployment

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket = "user-management-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "user-management-system"
      ManagedBy   = "terraform"
    }
  }
}

# ========================================
# VARIABLES
# ========================================
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "api.usermanagement.com"
}

# ========================================
# DATA SOURCES
# ========================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

# ========================================
# VPC và NETWORKING
# ========================================
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "user-management-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
  enable_dns_support     = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }

  tags = {
    Name = "user-management-vpc"
  }
}

# ========================================
# SECURITY GROUPS
# ========================================
resource "aws_security_group" "alb" {
  name_prefix = "user-management-alb-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "user-management-alb-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "user-management-rds-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  ingress {
    description     = "MongoDB"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name = "user-management-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "user-management-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name = "user-management-redis-sg"
  }
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "user-management-eks-nodes-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Node to node communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description     = "ALB to nodes"
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "user-management-eks-nodes-sg"
  }
}

# ========================================
# EKS CLUSTER
# ========================================
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = local.cluster_name
  cluster_version = "1.27"

  cluster_endpoint_public_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      name           = "user-management-node-group"
      instance_types = ["t3.medium", "t3.large"]

      min_size     = 2
      max_size     = 10
      desired_size = 3

      capacity_type = "ON_DEMAND"

      labels = {
        Environment = var.environment
        Project     = "user-management-system"
      }

      tags = {
        Name = "user-management-eks-nodes"
      }
    }
  }

  node_security_group_additional_rules = {
    ingress_allow_access_from_alb = {
      type                     = "ingress"
      protocol                 = "tcp"
      from_port                = 0
      to_port                  = 0
      source_security_group_id = aws_security_group.alb.id
    }
  }

  tags = {
    Name = "user-management-eks"
  }
}

# ========================================
# RDS DATABASE
# ========================================
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "user-management-db"

  engine               = "postgres"
  engine_version       = "15.3"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "user_management"
  username = "user_mgmt_app"
  password = var.db_password
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window              = "sun:03:00-sun:04:00"
  backup_window                  = "02:00-03:00"
  backup_retention_period        = 7
  copy_tags_to_snapshot         = true
  deletion_protection           = true
  skip_final_snapshot           = false
  final_snapshot_identifier     = "user-management-db-final-snapshot"

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_enhanced_monitoring.arn

  parameters = [
    {
      name  = "log_statement"
      value = "all"
    },
    {
      name  = "log_min_duration_statement"
      value = "1000"
    },
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]

  tags = {
    Name = "user-management-rds"
  }
}

# ========================================
# ELASTICACHE REDIS
# ========================================
module "redis" {
  source = "terraform-aws-modules/elasticache/aws"

  cluster_id               = "user-management-redis"
  engine                   = "redis"
  engine_version           = "7.0"
  family                   = "redis7"
  parameter_group_name     = "default.redis7"
  port                     = 6379

  subnet_group_name        = module.vpc.elasticache_subnet_group_name
  security_group_ids       = [aws_security_group.redis.id]

  num_cache_clusters       = 2
  node_type               = "cache.t3.medium"

  maintenance_window       = "sun:03:00-sun:04:00"
  snapshot_window         = "02:00-03:00"
  snapshot_retention_period = 7

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_password

  tags = {
    Name = "user-management-redis"
  }
}

# ========================================
# LOAD BALANCER
# ========================================
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.0"

  name = "user-management-alb"

  load_balancer_type = "application"

  vpc_id             = module.vpc.vpc_id
  subnets           = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]

  target_groups = [
    {
      name_prefix      = "api-"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    }
  ]

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      ssl_policy        = "ELBSecurityPolicy-TLS13-1-0-2021-06"
      certificate_arn   = aws_acm_certificate.api.arn

      default_action = {
        type = "forward"
        target_group_index = 0
      }
    }
  ]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      redirect = {
        port = "443"
        protocol = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = {
    Name = "user-management-alb"
  }
}

# ========================================
# SSL CERTIFICATE
# ========================================
resource "aws_acm_certificate" "api" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "user-management-cert"
  }
}

# ========================================
# ROUTE 53
# ========================================
data "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.lb_dns_name
    zone_id               = module.alb.lb_zone_id
    evaluate_target_health = true
  }
}

# ========================================
# KMS KEY
# ========================================
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "user-management-rds-key"
  }
}

# ========================================
# IAM ROLES
# ========================================
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "user-management-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  ]

  tags = {
    Name = "user-management-rds-enhanced-monitoring"
  }
}

# ========================================
# SECRETS MANAGER
# ========================================
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "user-management/db-password"
  description             = "Database password for user management system"
  recovery_window_in_days = 7

  tags = {
    Name = "user-management-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = var.db_password
  })
}

# ========================================
# CLOUDWATCH LOGS
# ========================================
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/eks/user-management-api"
  retention_in_days = 30

  tags = {
    Name = "user-management-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/user-management-db/postgresql"
  retention_in_days = 30

  tags = {
    Name = "user-management-rds-logs"
  }
}

# ========================================
# BACKUP PLAN
# ========================================
resource "aws_backup_vault" "user_management" {
  name        = "user-management-backup-vault"
  encryption_key_arn = aws_kms_key.backups.arn

  tags = {
    Name = "user-management-backup-vault"
  }
}

resource "aws_backup_plan" "user_management" {
  name = "user-management-backup-plan"

  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.user_management.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM UTC

    lifecycle {
      delete_after = 30 # days
    }
  }

  tags = {
    Name = "user-management-backup-plan"
  }
}

resource "aws_backup_selection" "user_management" {
  name         = "user-management-backup-selection"
  plan_id      = aws_backup_plan.user_management.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    module.rds.db_instance_arn,
    module.redis.cluster_arn
  ]
}

# ========================================
# KUBERNETES PROVIDER
# ========================================
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# ========================================
# KUBERNETES DEPLOYMENTS
# ========================================
resource "kubernetes_namespace" "user_management" {
  metadata {
    name = "user-management"
    labels = {
      name = "user-management"
    }
  }
}

resource "kubernetes_secret" "db_credentials" {
  metadata {
    name      = "db-credentials"
    namespace = kubernetes_namespace.user_management.metadata[0].name
  }

  data = {
    password = var.db_password
  }

  type = "Opaque"
}

resource "kubernetes_secret" "redis_credentials" {
  metadata {
    name      = "redis-credentials"
    namespace = kubernetes_namespace.user_management.metadata[0].name
  }

  data = {
    password = var.redis_password
  }

  type = "Opaque"
}

resource "kubernetes_secret" "jwt_secret" {
  metadata {
    name      = "jwt-secret"
    namespace = kubernetes_namespace.user_management.metadata[0].name
  }

  data = {
    secret = var.jwt_secret
  }

  type = "Opaque"
}

# ========================================
# HELM CHARTS
# ========================================
resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.user_management.metadata[0].name
  version    = "48.1.1"

  values = [
    file("${path.module}/helm/prometheus-values.yaml")
  ]
}

resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = "ingress-nginx"
  version    = "4.7.1"

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-cross-zone-load-balancing-enabled"
    value = "true"
  }
}

# ========================================
# OUTPUTS
# ========================================
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = module.eks.cluster_name
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_instance_endpoint
}

output "load_balancer_dns_name" {
  description = "Load balancer DNS name"
  value       = module.alb.lb_dns_name
}

output "certificate_arn" {
  description = "SSL certificate ARN"
  value       = aws_acm_certificate.api.arn
}

# ========================================
# LOCALS
# ========================================
locals {
  cluster_name = "user-management-${var.environment}"
}
