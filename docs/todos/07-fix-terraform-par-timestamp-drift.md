# 07 — Fix Terraform PAR timestamp() Drift

## Problem

`deploy/tf/app/storage.tf` uses `timeadd(timestamp(), ...)` for PAR expiration. The `timestamp()` function returns the current time at plan, so every `terraform plan` shows PAR resources as needing replacement — even when nothing changed. This causes unnecessary churn and potential downtime if PARs are recreated mid-demo.

## What Needs to Change

### `deploy/tf/app/storage.tf`

Replace `timestamp()` with a `time_static` resource:

```hcl
resource "time_static" "deploy_time" {}

# Then in each PAR resource:
time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
```

This sets the expiration once at creation and stays stable on subsequent plans.

### `deploy/tf/app/versions.tf`

Add the `hashicorp/time` provider if not already present:

```hcl
terraform {
  required_providers {
    time = {
      source  = "hashicorp/time"
      version = "~> 0.12"
    }
  }
}
```

## Scope

All 6 PARs in `storage.tf` use `timestamp()` and need updating:

1. `ansible_ops_artifact_par`
2. `ansible_backend_artifact_par`
3. `backend_jar_artifact_par`
4. `db_wallet_artifact_par`
5. `ansible_web_artifact_par`
6. `web_artifact_par`

## Acceptance Criteria

- [ ] `terraform plan` shows no changes when run twice with no code changes
- [ ] PARs still work (objects are downloadable via PAR URL)
- [ ] PAR expiration is correctly set to the configured number of days from first deploy
