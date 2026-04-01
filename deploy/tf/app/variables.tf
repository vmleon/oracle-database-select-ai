variable "tenancy_ocid" {
  type = string
}

variable "region" {
  type = string
}

variable "config_file_profile" {
  type = string
}

variable "compartment_ocid" {
  type = string
}

variable "ssh_private_key_path" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "project_name" {
  type    = string
  default = "selectai"
}

variable "instance_shape" {
  type    = string
  default = "VM.Standard.A1.Flex"
}

variable "ecpu_count" {
  type    = number
  default = 2
}

variable "storage_in_tbs" {
  type    = number
  default = 1
}

variable "artifacts_par_expiration_in_days" {
  type    = number
  default = 7
}
