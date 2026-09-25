"""
Management command to seed sample diagnostic centres and tests.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear  # clears existing data first

This command is idempotent by default — it uses get_or_create so it's
safe to run multiple times without creating duplicates.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.centres.models import DiagnosticCentre, DiagnosticTest

SEED_DATA = [
    {
        "name": "Apollo Diagnostics",
        "location": "Delhi",
        "address": "23, Connaught Place, New Delhi - 110001",
        "phone": "+91-11-2345-6789",
        "tests": [
            {"name": "Complete Blood Count (CBC)", "price": Decimal("750.00"), "description": "Comprehensive blood panel"},
            {"name": "Lipid Profile", "price": Decimal("1200.00"), "description": "Cholesterol and triglycerides"},
            {"name": "HbA1c", "price": Decimal("850.00"), "description": "3-month blood sugar average"},
            {"name": "Thyroid Profile (T3/T4/TSH)", "price": Decimal("1500.00"), "description": "Full thyroid panel"},
            {"name": "Liver Function Test (LFT)", "price": Decimal("1100.00"), "description": "Liver enzyme panel"},
        ],
    },
    {
        "name": "Metropolis Healthcare",
        "location": "Mumbai",
        "address": "7, Linking Road, Bandra West, Mumbai - 400050",
        "phone": "+91-22-6789-0123",
        "tests": [
            {"name": "Chest X-Ray", "price": Decimal("600.00"), "description": "Digital chest radiograph"},
            {"name": "ECG (12-Lead)", "price": Decimal("500.00"), "description": "Electrocardiogram"},
            {"name": "Ultrasound Abdomen", "price": Decimal("2500.00"), "description": "Full abdomen scan"},
            {"name": "COVID-19 RT-PCR", "price": Decimal("800.00"), "description": "Molecular diagnostic test"},
            {"name": "Vitamin D (25-OH)", "price": Decimal("1000.00"), "description": "Vitamin D levels"},
        ],
    },
    {
        "name": "SRL Diagnostics",
        "location": "Bangalore",
        "address": "14, MG Road, Bangalore - 560001",
        "phone": "+91-80-4567-8901",
        "tests": [
            {"name": "MRI Brain (Plain)", "price": Decimal("8000.00"), "description": "Brain MRI without contrast"},
            {"name": "CT Scan Chest", "price": Decimal("6500.00"), "description": "High-resolution CT chest"},
            {"name": "Urine Culture & Sensitivity", "price": Decimal("450.00"), "description": "Urine infection test"},
            {"name": "Dengue NS1 Antigen", "price": Decimal("700.00"), "description": "Early dengue detection"},
            {"name": "Vitamin B12", "price": Decimal("900.00"), "description": "B12 serum levels"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed sample diagnostic centres and tests into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing centres and tests before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted_count, _ = DiagnosticTest.objects.all().delete()
            DiagnosticCentre.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared existing data."))

        created_centres = 0
        created_tests = 0

        for centre_data in SEED_DATA:
            tests = centre_data.pop("tests")
            centre, centre_created = DiagnosticCentre.objects.get_or_create(
                name=centre_data["name"],
                defaults=centre_data,
            )
            if centre_created:
                created_centres += 1

            for test_data in tests:
                _, test_created = DiagnosticTest.objects.get_or_create(
                    centre=centre,
                    name=test_data["name"],
                    defaults=test_data,
                )
                if test_created:
                    created_tests += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeding complete: {created_centres} centre(s) and {created_tests} test(s) created."
            )
        )
