# --- RAG Documents Bucket ---

resource "oci_objectstorage_bucket" "rag_bucket" {
  compartment_id = var.compartment_ocid
  name           = "rag_docs_${local.project_name}${local.deploy_id}"
  namespace      = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
}

resource "oci_objectstorage_object" "rag_docs" {
  for_each  = fileset("${path.module}/../../ansible/ops/base/files/rag-docs", "*.txt")
  bucket    = oci_objectstorage_bucket.rag_bucket.name
  namespace = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object    = each.value
  source    = "${path.module}/../../ansible/ops/base/files/rag-docs/${each.value}"
}

resource "time_static" "deploy_time" {}

# --- Artifacts Bucket ---

resource "oci_objectstorage_bucket" "artifacts_bucket" {
  compartment_id = var.compartment_ocid
  name           = "artifacts_${local.project_name}${local.deploy_id}"
  namespace      = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
}

resource "oci_objectstorage_object" "ansible_ops_artifact_object" {
  bucket      = oci_objectstorage_bucket.artifacts_bucket.name
  source      = data.archive_file.ansible_ops_artifact.output_path
  namespace   = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object      = "ansible_ops_artifact.zip"
  content_md5 = data.archive_file.ansible_ops_artifact.output_md5
}

resource "oci_objectstorage_preauthrequest" "ansible_ops_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "ansible_ops_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.ansible_ops_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}

resource "oci_objectstorage_object" "ansible_backend_artifact_object" {
  bucket      = oci_objectstorage_bucket.artifacts_bucket.name
  source      = data.archive_file.ansible_backend_artifact.output_path
  namespace   = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object      = "ansible_backend_artifact.zip"
  content_md5 = data.archive_file.ansible_backend_artifact.output_md5
}

resource "oci_objectstorage_preauthrequest" "ansible_backend_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "ansible_backend_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.ansible_backend_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}

resource "oci_objectstorage_object" "backend_jar_artifact_object" {
  bucket      = oci_objectstorage_bucket.artifacts_bucket.name
  source      = data.archive_file.backend_jar_artifact.output_path
  namespace   = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object      = "backend_jar_artifact.zip"
  content_md5 = data.archive_file.backend_jar_artifact.output_md5
}

resource "oci_objectstorage_preauthrequest" "backend_jar_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "backend_jar_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.backend_jar_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}

resource "oci_objectstorage_object" "db_wallet_artifact_object" {
  bucket    = oci_objectstorage_bucket.artifacts_bucket.name
  content   = module.adbs.wallet_zip_base64
  namespace = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object    = "db_wallet_artifact.zip"
}

resource "oci_objectstorage_preauthrequest" "db_wallet_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "db_wallet_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.db_wallet_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}

resource "oci_objectstorage_object" "ansible_web_artifact_object" {
  bucket      = oci_objectstorage_bucket.artifacts_bucket.name
  source      = data.archive_file.ansible_web_artifact.output_path
  namespace   = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object      = "ansible_web_artifact.zip"
  content_md5 = data.archive_file.ansible_web_artifact.output_md5
}

resource "oci_objectstorage_preauthrequest" "ansible_web_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "ansible_web_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.ansible_web_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}

resource "oci_objectstorage_object" "web_artifact_object" {
  bucket      = oci_objectstorage_bucket.artifacts_bucket.name
  source      = data.archive_file.web_artifact.output_path
  namespace   = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object      = "web_artifact.zip"
  content_md5 = data.archive_file.web_artifact.output_md5
}

resource "oci_objectstorage_preauthrequest" "web_artifact_par" {
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "web_artifact_par"
  access_type  = "ObjectRead"
  object_name  = oci_objectstorage_object.web_artifact_object.object
  time_expires = timeadd(time_static.deploy_time.rfc3339, "${var.artifacts_par_expiration_in_days * 24}h")
}
