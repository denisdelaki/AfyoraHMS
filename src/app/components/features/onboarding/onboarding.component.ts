import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    LogoComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  currentStep = 0;
  selectedModules: string[] = [];
  facilityType: string = 'hospital';
  readonly onboardingForm = this.fb.group({
    facilityName: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    facilityEmail: ['', [Validators.required, Validators.email]],
    licenseNumber: ['', [Validators.required]],
    numberOfBeds: [null as number | null],
    specialization: [''],
    otp1: [''],
    otp2: [''],
    otp3: [''],
    otp4: [''],
    otp5: [''],
    otp6: [''],
    adminFirstName: ['', [Validators.required]],
    adminLastName: ['', [Validators.required]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required]],
    adminConfirmPassword: ['', [Validators.required]],
    modules: this.fb.group({
      patientManagement: [false],
      electronicHealthRecords: [false],
      pharmacyManagement: [false],
      billingFinance: [false],
      employeeManagement: [false],
      inventoryManagement: [false],
      laboratoryManagement: [false],
      radiologyManagement: [false],
      reportsAnalytics: [false],
    }),
    selectedPlan: ['', [Validators.required]],
  });

  steps = [
    'Hospital Registration',
    'Email Verification',
    'Admin User',
    'Module Selection',
    'Subscription',
  ];

  modules = [
    { key: 'patientManagement', label: 'Patient Management' },
    { key: 'electronicHealthRecords', label: 'Electronic Health Records' },
    { key: 'pharmacyManagement', label: 'Pharmacy Management' },
    { key: 'billingFinance', label: 'Billing & Finance' },
    { key: 'employeeManagement', label: 'Employee Management' },
    { key: 'inventoryManagement', label: 'Inventory Management' },
    { key: 'laboratoryManagement', label: 'Laboratory Management' },
    { key: 'radiologyManagement', label: 'Radiology Management' },
    { key: 'reportsAnalytics', label: 'Reports & Analytics' },
  ];

  plans = [
    {
      name: 'Basic',
      price: '$299',
      features: [
        'Up to 100 patients',
        '3 users',
        'Basic modules',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: '$599',
      features: [
        'Up to 500 patients',
        '15 users',
        'All modules',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      price: '$1299',
      features: [
        'Unlimited patients',
        'Unlimited users',
        'All modules',
        '24/7 support',
      ],
    },
  ];

  Math = Math; // to allow Math.max usage in template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.facilityType = params['type'] || 'hospital';
    });
  }

  handleComplete(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.router.navigate(['/']);
  }

  toggleModule(moduleKey: string): void {
    const modulesGroup = this.onboardingForm.get('modules');
    const moduleControl = modulesGroup?.get(moduleKey);
    moduleControl?.setValue(!moduleControl.value);
    this.updateSelectedModules();
  }

  isModuleSelected(moduleKey: string): boolean {
    return !!this.onboardingForm.get(['modules', moduleKey])?.value;
  }

  onModuleSelectionChange(): void {
    this.updateSelectedModules();
  }

  selectPlan(planName: string): void {
    this.onboardingForm.patchValue({ selectedPlan: planName });
  }

  private updateSelectedModules(): void {
    this.selectedModules = this.modules
      .filter((module) => this.isModuleSelected(module.key))
      .map((module) => module.label);
  }
}
