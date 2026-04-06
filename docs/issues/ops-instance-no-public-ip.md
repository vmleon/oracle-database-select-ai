# Ops instance has no public IP — SSH unreachable from outside VCN

## Problem

The ops compute instance (jump machine) was deployed in the private `app_subnet` with
`assign_public_ip = false`. The `ops_public_ip` terraform output was actually returning
the private IP (`10.0.2.x`), making the SSH command printed by `manage.py ansible`
unusable from outside the VCN.

## Fix

- Moved the ops instance from `app_subnet` (private) to `public_subnet`
- Set `assign_public_ip = true` on the ops instance VNIC
- Added `public_ip` output to the ops module
- Updated `app/outputs.tf` to use `module.ops.public_ip`

## Notes

- The `public_subnet` already has the default security list (which includes SSH port 22)
  and routes through the internet gateway
- Backend and web instances remain in the private `app_subnet` — only ops needs
  external SSH access as the jump machine
- Requires `terraform apply` to take effect (instance will be recreated)
