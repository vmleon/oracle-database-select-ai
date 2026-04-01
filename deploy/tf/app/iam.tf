locals {
  dynamic_group_name = "genai_dynamic_group_${local.project_name}${local.deploy_id}"
}

resource "oci_identity_dynamic_group" "autonomous_dynamic_group" {
  provider = oci.home

  name           = local.dynamic_group_name
  description    = "${local.dynamic_group_name} Autonomous Dynamic Group"
  compartment_id = var.tenancy_ocid
  matching_rule  = "ALL {resource.type = 'autonomousdatabase', resource.compartment.id = '${var.compartment_ocid}'}"
}

resource "oci_identity_policy" "dg_allow_genai_in_compartment_policy" {
  provider       = oci.home
  compartment_id = var.tenancy_ocid
  name           = "dg_${local.project_name}${local.deploy_id}"
  description    = "Allow dynamic group ${local.dynamic_group_name} to call service at compartment level for ${local.project_name} ${local.deploy_id}"
  statements = [
    "Allow dynamic-group ${local.dynamic_group_name} to manage generative-ai-family in compartment id ${var.compartment_ocid}"
  ]

  depends_on = [oci_identity_dynamic_group.autonomous_dynamic_group]
}

resource "oci_identity_policy" "dg_allow_more_genai_in_compartment_policy" {
  provider       = oci.home
  compartment_id = var.tenancy_ocid
  name           = "dg_any_user_${local.project_name}${local.deploy_id}"
  description    = "Allow any-user to call ${local.dynamic_group_name} service at compartment level for ${local.project_name} ${local.deploy_id}"
  statements = [
    "Allow any-user to manage generative-ai-family in compartment id ${var.compartment_ocid} where any {request.principal.type='autonomous-databases-family', request.principal.id='${module.adbs.id}'}"
  ]

  depends_on = [oci_identity_dynamic_group.autonomous_dynamic_group, module.adbs]
}
