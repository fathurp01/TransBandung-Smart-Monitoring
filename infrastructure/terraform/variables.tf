variable "project_name" {
  type    = string
  default = "tbsm"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  type    = string
  default = "10.0.2.0/24"
}

variable "db_name" {
  type    = string
  default = "tbsm_db"
}

variable "db_username" {
  type    = string
  default = "tbsm_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}
