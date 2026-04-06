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
    default_ssh = str(Path.home() / ".ssh" / "id_rsa")
    ssh_private_key_path = click.prompt(
        "SSH private key path", default=default_ssh
    )
    ssh_public_key_path = ssh_private_key_path + ".pub"
    if Path(ssh_public_key_path).exists():
        ssh_public_key = Path(ssh_public_key_path).read_text().strip()
    else:
        ssh_public_key = click.prompt("SSH public key (paste content)")

    # Generate DB password
    db_admin_password = _generate_password()

    # Summary
    console.print(
        Panel(
            f"Profile:     {profile}\n"
            f"Tenancy:     {tenancy_ocid}\n"
            f"Region:      {region}\n"
            f"Compartment: {compartment_ocid}\n"
            f"SSH key:     {ssh_private_key_path}\n"
            f"DB password: (generated, stored in .env)",
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
        "PROJECT_NAME": "selectai",
        "DB_ADMIN_PASSWORD": db_admin_password,
        "SSH_PRIVATE_KEY_PATH": ssh_private_key_path,
        "SSH_PUBLIC_KEY": ssh_public_key,
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

    load_dotenv(ENV_FILE)

    required_vars = [
        "OCI_PROFILE",
        "OCI_TENANCY_OCID",
        "OCI_COMPARTMENT_OCID",
        "OCI_REGION",
        "PROJECT_NAME",
        "DB_ADMIN_PASSWORD",
        "SSH_PUBLIC_KEY",
        "SSH_PRIVATE_KEY_PATH",
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
        compartment_ocid=os.getenv("OCI_COMPARTMENT_OCID"),
        region=os.getenv("OCI_REGION"),
        project_name=os.getenv("PROJECT_NAME"),
        db_admin_password=os.getenv("DB_ADMIN_PASSWORD"),
        ssh_public_key=os.getenv("SSH_PUBLIC_KEY"),
        ssh_private_key_path=os.getenv("SSH_PRIVATE_KEY_PATH"),
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

    load_dotenv(ENV_FILE)

    console.print("[bold]Ansible Provisioning Commands[/bold]\n")

    console.print(
        "Cloud-init handles automated provisioning on instance creation.\n"
        "Use these commands for manual re-runs or troubleshooting:\n"
    )

    # Check for terraform outputs
    outputs_file = TF_DIR / "outputs.json"
    if outputs_file.exists():
        import json

        outputs = json.loads(outputs_file.read_text())
        lb_ip = outputs.get("lb_public_ip", {}).get("value", "<LB_IP>")
        ops_ip = outputs.get("ops_public_ip", {}).get("value", "<OPS_IP>")

        console.print(f"  Load Balancer: [bold]{lb_ip}[/bold]")
        console.print(f"  Ops instance:  [bold]{ops_ip}[/bold]\n")
    else:
        console.print(
            "  [yellow]Tip:[/yellow] Run 'cd deploy/tf/app && terraform output -json > outputs.json'\n"
        )

    console.print("1. SSH to ops instance:")
    console.print("   ssh opc@<OPS_PUBLIC_IP>\n")
    console.print("2. Run ops playbook (database setup):")
    console.print("   ansible-playbook -i inventory ops/server.yaml\n")
    console.print("3. Run backend playbook:")
    console.print("   ansible-playbook -i inventory backend/server.yaml\n")
    console.print("4. Run web playbook:")
    console.print("   ansible-playbook -i inventory web/server.yaml\n")


@cli.command()
def clean():
    """Print commands to destroy infrastructure."""
    console.print("[bold]Destroy Infrastructure[/bold]\n")
    console.print("Run the following commands:\n")
    console.print("  cd deploy/tf/app")
    console.print("  terraform destroy\n")
    console.print(
        "[yellow]Note:[/yellow] After destroying, delete .env if no longer needed."
    )


if __name__ == "__main__":
    cli()
