#!/usr/bin/env python3
"""CLI for managing the Oracle Database Select AI demo deployment."""

import configparser
import os
import secrets
import sys
from pathlib import Path

import click
from dotenv import load_dotenv, set_key
from InquirerPy import inquirer
from jinja2 import Template
from rich.console import Console
from rich.panel import Panel

console = Console()

PROJECT_ROOT = Path(__file__).parent
ENV_FILE = PROJECT_ROOT / ".env"
TF_DIR = PROJECT_ROOT / "deploy" / "tf" / "app"
ANSIBLE_DIR = PROJECT_ROOT / "deploy" / "ansible"

# Tier 1 GenAI regions with full on-demand model support
GENAI_TIER1_REGIONS = [
    "us-chicago-1",
    "eu-frankfurt-1",
    "uk-london-1",
    "ap-osaka-1",
    "sa-saopaulo-1",
]

# Maps non-Tier-1 regions to nearest Tier 1 GenAI region
GENAI_REGION_MAP = {
    # Americas → Chicago
    "us-ashburn-1": "us-chicago-1",
    "us-phoenix-1": "us-chicago-1",
    "us-sanjose-1": "us-chicago-1",
    "ca-toronto-1": "us-chicago-1",
    "ca-montreal-1": "us-chicago-1",
    "mx-queretaro-1": "us-chicago-1",
    "mx-monterrey-1": "us-chicago-1",
    # South America → Sao Paulo
    "sa-santiago-1": "sa-saopaulo-1",
    "sa-vinhedo-1": "sa-saopaulo-1",
    # EMEA → Frankfurt
    "eu-amsterdam-1": "eu-frankfurt-1",
    "eu-zurich-1": "eu-frankfurt-1",
    "eu-madrid-1": "eu-frankfurt-1",
    "eu-marseille-1": "eu-frankfurt-1",
    "eu-milan-1": "eu-frankfurt-1",
    "eu-paris-1": "eu-frankfurt-1",
    "eu-stockholm-1": "eu-frankfurt-1",
    "il-jerusalem-1": "eu-frankfurt-1",
    "af-johannesburg-1": "eu-frankfurt-1",
    "me-jeddah-1": "eu-frankfurt-1",
    "me-dubai-1": "eu-frankfurt-1",
    "me-riyadh-1": "eu-frankfurt-1",
    # APAC → Osaka
    "ap-tokyo-1": "ap-osaka-1",
    "ap-mumbai-1": "ap-osaka-1",
    "ap-hyderabad-1": "ap-osaka-1",
    "ap-singapore-1": "ap-osaka-1",
    "ap-sydney-1": "ap-osaka-1",
    "ap-melbourne-1": "ap-osaka-1",
    "ap-seoul-1": "ap-osaka-1",
    "ap-chuncheon-1": "ap-osaka-1",
}


def _read_oci_config():
    """Read OCI config file and return available profiles."""
    oci_config_path = Path.home() / ".oci" / "config"
    if not oci_config_path.exists():
        console.print(f"[red]Error:[/red] OCI config not found at {oci_config_path}")
        sys.exit(1)

    config = configparser.ConfigParser()
    config.read(oci_config_path)

    profiles = list(config.sections())
    if config.defaults():
        profiles.insert(0, "DEFAULT")

    return profiles, config


def _generate_password(length=20):
    """Generate Oracle-compliant password (starts with letter, 2+ specials, 2+ digits)."""
    letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    digits = "0123456789"
    specials = "#_-"

    password = [secrets.choice(letters)]
    password.append(secrets.choice(specials))
    password.append(secrets.choice(specials))
    password.append(secrets.choice(digits))
    password.append(secrets.choice(digits))

    alphabet = letters + digits + specials
    for _ in range(length - 5):
        password.append(secrets.choice(alphabet))

    tail = password[1:]
    secrets.SystemRandom().shuffle(tail)
    password[1:] = tail

    return "".join(password)


def _list_regions(oci_config):
    """List subscribed regions using OCI SDK."""
    import oci

    try:
        identity_client = oci.identity.IdentityClient(oci_config)
        tenancy_id = oci_config["tenancy"]

        tenancy = identity_client.get_tenancy(tenancy_id).data
        home_region_key = tenancy.home_region_key

        subscriptions = identity_client.list_region_subscriptions(tenancy_id).data
        regions = []
        for sub in subscriptions:
            is_home = sub.region_key == home_region_key
            regions.append(
                {"name": sub.region_name, "key": sub.region_key, "is_home": is_home}
            )

        regions.sort(key=lambda x: (not x["is_home"], x["name"]))
        return regions
    except Exception as e:
        console.print(f"[yellow]Warning:[/yellow] Could not fetch regions: {e}")
        return None


def _list_compartments(oci_config):
    """List compartments in the tenancy using OCI SDK."""
    import oci

    try:
        identity_client = oci.identity.IdentityClient(oci_config)
        tenancy_id = oci_config["tenancy"]

        tenancy = identity_client.get_compartment(tenancy_id).data
        compartments = [
            {
                "name": f"{tenancy.name} (root)",
                "id": tenancy_id,
                "description": tenancy.description or "Root compartment",
            }
        ]

        response = oci.pagination.list_call_get_all_results(
            identity_client.list_compartments,
            compartment_id=tenancy_id,
            compartment_id_in_subtree=True,
            access_level="ACCESSIBLE",
        )

        for comp in response.data:
            if comp.lifecycle_state == "ACTIVE":
                compartments.append(
                    {
                        "name": comp.name,
                        "id": comp.id,
                        "description": comp.description or "",
                    }
                )

        return compartments
    except Exception as e:
        console.print(f"[yellow]Warning:[/yellow] Could not fetch compartments: {e}")
        return None


@click.group()
def cli():
    """Oracle Database Select AI Demo Manager."""


@cli.command()
def setup():
    """Interactive OCI configuration. Stores results in .env."""
    console.print("[bold]Oracle Database 26ai Select AI — Setup[/bold]\n")

    profiles, oci_config_parser = _read_oci_config()

    profile = inquirer.select(
        message="OCI profile:",
        choices=profiles,
        default=profiles[0] if profiles else None,
    ).execute()

    profile_config = oci_config_parser[profile]
    tenancy_ocid = profile_config.get("tenancy")
    user_ocid = profile_config.get("user")
    fingerprint = profile_config.get("fingerprint")
    key_file = profile_config.get("key_file")
    config_region = profile_config.get("region", "us-phoenix-1")

    sdk_config = {
        "user": user_ocid,
        "key_file": key_file,
        "fingerprint": fingerprint,
        "tenancy": tenancy_ocid,
        "region": config_region,
    }

    # Region selection
    console.print("\nFetching subscribed regions...")
    regions = _list_regions(sdk_config)

    if regions:
        region_choices = []
        for reg in regions:
            label = f"{reg['name']} (home)" if reg["is_home"] else reg["name"]
            region_choices.append(label)

        selected = inquirer.select(
            message="Region:",
            choices=region_choices,
            default=region_choices[0],
        ).execute()
        region = selected.replace(" (home)", "")
    else:
        region = click.prompt("Region", default=config_region)

    sdk_config["region"] = region

    # GenAI region resolution
    if region in GENAI_TIER1_REGIONS:
        genai_region = region
        console.print(f"\n[green]GenAI region:[/green] {genai_region} (full model support)")
    elif region in GENAI_REGION_MAP:
        genai_region = GENAI_REGION_MAP[region]
        console.print(f"\n[green]GenAI region:[/green] {genai_region} (nearest full-support region)")
        if click.confirm("Override GenAI region?", default=False):
            genai_region = inquirer.select(
                message="GenAI region:",
                choices=GENAI_TIER1_REGIONS,
                default=genai_region,
            ).execute()
    else:
        console.print(f"\n[yellow]Region {region} not in GenAI mapping.[/yellow]")
        genai_region = inquirer.select(
            message="Select GenAI region:",
            choices=GENAI_TIER1_REGIONS,
            default=GENAI_TIER1_REGIONS[0],
        ).execute()

    # Compartment selection
    console.print("\nFetching compartments...")
    compartments = _list_compartments(sdk_config)

    if compartments:
        comp_choices = [c["name"] for c in compartments]
        comp_map = {c["name"]: c["id"] for c in compartments}

        selected_comp = inquirer.fuzzy(
            message="Compartment (type to search):",
            choices=comp_choices,
            default=None,
        ).execute()
        compartment_ocid = comp_map[selected_comp]
    else:
        compartment_ocid = click.prompt("Compartment OCID")

    # SSH key
    ssh_dir = Path.home() / ".ssh"
    ssh_keys = sorted(
        f.name
        for f in ssh_dir.iterdir()
        if f.is_file() and not f.suffix and (f.with_suffix(".pub")).exists()
    ) if ssh_dir.is_dir() else []

    if ssh_keys:
        ssh_private_key_path = str(ssh_dir / inquirer.fuzzy(
            message="SSH private key:",
            choices=ssh_keys,
        ).execute())
    else:
        ssh_private_key_path = click.prompt("SSH private key path")
    ssh_public_key_path = ssh_private_key_path + ".pub"
    if Path(ssh_public_key_path).exists():
        ssh_public_key = Path(ssh_public_key_path).read_text().strip()
    else:
        ssh_public_key = click.prompt("SSH public key (paste content)")

    # Read API key content
    key_file_path = Path(key_file).expanduser()
    if key_file_path.exists():
        private_api_key_content = key_file_path.read_text().strip()
    else:
        console.print(f"[yellow]Warning:[/yellow] Key file not found: {key_file}")
        private_api_key_content = click.prompt("Paste OCI API private key content")

    # GenAI configuration
    console.print()
    oci_genai_compartment_id = inquirer.text(
        message="GenAI compartment OCID (Enter to use same as above):",
        default=compartment_ocid,
    ).execute()

    oci_genai_model_name = inquirer.text(
        message="GenAI model name:",
        default="meta.llama-3.3-70b-instruct",
    ).execute()

    oci_genai_runtime_name = inquirer.text(
        message="GenAI runtime name:",
        default="oci",
    ).execute()

    # Generate DB password
    db_admin_password = _generate_password()

    # Summary
    console.print(
        Panel(
            f"Profile:      {profile}\n"
            f"Tenancy:      {tenancy_ocid}\n"
            f"Region:       {region}\n"
            f"GenAI Region: {genai_region}\n"
            f"Compartment:  {compartment_ocid}\n"
            f"SSH key:      {ssh_private_key_path}\n"
            f"DB password:  (generated, stored in .env)",
            title="Configuration Summary",
        )
    )

    if not click.confirm("Save configuration?", default=True):
        console.print("[yellow]Setup cancelled.[/yellow]")
        sys.exit(0)

    # Write .env
    env_vars = {
        "OCI_PROFILE": profile,
        "OCI_TENANCY_OCID": tenancy_ocid,
        "OCI_USER_OCID": user_ocid,
        "OCI_FINGERPRINT": fingerprint,
        "OCI_KEY_FILE": key_file,
        "OCI_COMPARTMENT_OCID": compartment_ocid,
        "OCI_REGION": region,
        "OCI_GENAI_REGION": genai_region,
        "PROJECT_NAME": "selectai",
        "DB_ADMIN_PASSWORD": db_admin_password,
        "SSH_PRIVATE_KEY_PATH": ssh_private_key_path,
        "SSH_PUBLIC_KEY": ssh_public_key,
        "OCI_PRIVATE_API_KEY_CONTENT": private_api_key_content,
        "OCI_GENAI_COMPARTMENT_ID": oci_genai_compartment_id,
        "OCI_GENAI_MODEL_NAME": oci_genai_model_name,
        "OCI_GENAI_RUNTIME_NAME": oci_genai_runtime_name,
    }

    with open(ENV_FILE, "w") as f:
        for key, value in env_vars.items():
            f.write(f'{key}="{value}"\n')

    console.print(f"\n[green]Configuration saved to {ENV_FILE}[/green]")
    console.print("\nNext step: [bold]python manage.py tf[/bold]")


@cli.command()
def tf():
    """Generate terraform.tfvars from Jinja2 template and .env values."""
    if not ENV_FILE.exists():
        console.print("[red]Error:[/red] .env not found. Run 'python manage.py setup' first.")
        sys.exit(1)

    load_dotenv(ENV_FILE, override=True)

    required_vars = [
        "OCI_PROFILE",
        "OCI_TENANCY_OCID",
        "OCI_USER_OCID",
        "OCI_FINGERPRINT",
        "OCI_KEY_FILE",
        "OCI_COMPARTMENT_OCID",
        "OCI_REGION",
        "OCI_GENAI_REGION",
        "PROJECT_NAME",
        "DB_ADMIN_PASSWORD",
        "SSH_PUBLIC_KEY",
        "SSH_PRIVATE_KEY_PATH",
        "OCI_PRIVATE_API_KEY_CONTENT",
        "OCI_GENAI_COMPARTMENT_ID",
        "OCI_GENAI_MODEL_NAME",
        "OCI_GENAI_RUNTIME_NAME",
    ]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        console.print(
            f"[red]Error:[/red] Missing variables in .env: {', '.join(missing)}"
        )
        sys.exit(1)

    console.print("[bold]Generating terraform.tfvars...[/bold]\n")

    template_file = TF_DIR / "terraform.tfvars.j2"
    if not template_file.exists():
        console.print(f"[red]Error:[/red] Template not found: {template_file}")
        sys.exit(1)

    template = Template(template_file.read_text())
    tfvars_content = template.render(
        profile=os.getenv("OCI_PROFILE"),
        tenancy_ocid=os.getenv("OCI_TENANCY_OCID"),
        user_ocid=os.getenv("OCI_USER_OCID"),
        fingerprint=os.getenv("OCI_FINGERPRINT"),
        private_api_key_content=os.getenv("OCI_PRIVATE_API_KEY_CONTENT"),
        compartment_ocid=os.getenv("OCI_COMPARTMENT_OCID"),
        region=os.getenv("OCI_REGION"),
        genai_region=os.getenv("OCI_GENAI_REGION"),
        project_name=os.getenv("PROJECT_NAME"),
        db_admin_password=os.getenv("DB_ADMIN_PASSWORD"),
        ssh_public_key=os.getenv("SSH_PUBLIC_KEY"),
        ssh_private_key_path=os.getenv("SSH_PRIVATE_KEY_PATH"),
        oci_genai_compartment_id=os.getenv("OCI_GENAI_COMPARTMENT_ID"),
        oci_genai_model_name=os.getenv("OCI_GENAI_MODEL_NAME"),
        oci_genai_runtime_name=os.getenv("OCI_GENAI_RUNTIME_NAME"),
    )

    tfvars_file = TF_DIR / "terraform.tfvars"
    tfvars_file.write_text(tfvars_content)

    console.print(f"[green]Generated:[/green] {tfvars_file}\n")

    console.print("[bold]Next steps:[/bold]")
    console.print("  cd deploy/tf/app")
    console.print("  terraform init")
    console.print("  terraform plan -out=tfplan")
    console.print("  terraform apply tfplan\n")
    console.print("After terraform completes: [bold]python manage.py ansible[/bold]")


@cli.command()
def ansible():
    """Print Ansible provisioning commands."""
    if not ENV_FILE.exists():
        console.print("[red]Error:[/red] .env not found. Run 'python manage.py setup' first.")
        sys.exit(1)

    load_dotenv(ENV_FILE, override=True)

    console.print("[bold]Ansible Provisioning Commands[/bold]\n")

    # Get ops_public_ip from terraform output
    import subprocess

    ops_ip = None
    lb_ip = None
    try:
        result = subprocess.run(
            ["terraform", "output", "-raw", "ops_public_ip"],
            cwd=TF_DIR, capture_output=True, text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            ops_ip = result.stdout.strip()

        result = subprocess.run(
            ["terraform", "output", "-raw", "lb_public_ip"],
            cwd=TF_DIR, capture_output=True, text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            lb_ip = result.stdout.strip()
    except FileNotFoundError:
        pass

    if not ops_ip:
        console.print("[red]Error:[/red] Could not read ops_public_ip from terraform output.")
        console.print("Make sure terraform has been applied: cd deploy/tf/app && terraform apply")
        sys.exit(1)

    ssh_private_key = os.getenv("SSH_PRIVATE_KEY_PATH", "")

    console.print(f"  Load Balancer: [bold]{lb_ip or 'N/A'}[/bold]")
    console.print(f"  Ops instance:  [bold]{ops_ip}[/bold]\n")

    console.print(
        "Cloud-init handles automated provisioning on instance creation.\n"
        "Use these commands for manual re-runs or troubleshooting:\n"
    )

    ssh_cmd = f"ssh -i {ssh_private_key} opc@{ops_ip}" if ssh_private_key else f"ssh opc@{ops_ip}"

    console.print("1. SSH to ops instance:")
    console.print(f"   {ssh_cmd}\n")
    console.print("2. Wait for cloud-init to finish:")
    console.print("   sudo cloud-init status --wait\n")
    console.print("3. Re-run ops playbook (if needed):")
    console.print('   ansible-playbook -i ops.ini --extra-vars "@ansible_params.json" ansible_ops/server.yaml\n')


@cli.command()
def clean():
    """Clean up generated files, or show destroy steps if infra exists."""
    import json
    import shutil
    import subprocess

    console.print("[bold]Clean Up[/bold]\n")

    # Check terraform state for existing resources
    has_resources = False
    tf_state = TF_DIR / "terraform.tfstate"
    if tf_state.exists():
        try:
            state = json.loads(tf_state.read_text())
            resources = state.get("resources", [])
            has_resources = len(resources) > 0
        except (json.JSONDecodeError, KeyError):
            has_resources = True

    if has_resources:
        console.print("[yellow]Terraform state has active resources.[/yellow]")
        console.print("Destroy infrastructure first:\n")
        console.print("  cd deploy/tf/app")
        console.print("  terraform destroy\n")
        console.print("Then re-run: [bold]python manage.py clean[/bold]")
        return

    # No active resources — clean generated files and folders
    generated = [
        ENV_FILE,
        TF_DIR / "terraform.tfvars",
        TF_DIR / "terraform.tfstate",
        TF_DIR / "terraform.tfstate.backup",
        TF_DIR / "tfplan",
        TF_DIR / "outputs.json",
        TF_DIR / ".terraform.lock.hcl",
    ]
    generated_dirs = [
        TF_DIR / "generated",
        TF_DIR / ".terraform",
    ]

    deleted = []
    for f in generated:
        if f.exists():
            f.unlink()
            deleted.append(str(f.relative_to(PROJECT_ROOT)))
    for d in generated_dirs:
        if d.exists():
            shutil.rmtree(d)
            deleted.append(str(d.relative_to(PROJECT_ROOT)))

    if deleted:
        console.print("[green]Deleted:[/green]")
        for item in deleted:
            console.print(f"  {item}")
    else:
        console.print("Nothing to clean.")


if __name__ == "__main__":
    cli()
