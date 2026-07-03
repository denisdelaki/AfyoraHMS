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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LogoComponent } from '../../dialogs/logo/logo.component';
import { AuthService } from '../../../services';
import { FacilityOnboardingRequest, FacilityType } from '../../../models';

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
    MatSnackBarModule,
    LogoComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly signupDraftStorageKey = 'afyora.signupDraft';
  private readonly organizationIdStorageKey = 'afyora.organizationId';
  private readonly onboardingDraftStorageKey = 'afyora.onboardingDraft';
  private readonly userStorageKey = 'afyora.user';
  currentStep = 0;
  isSubmitting = false;
  selectedModules: string[] = [];
  facilityType: FacilityType = 'hospital';
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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.facilityType = params['type'] === 'clinic' ? 'clinic' : 'hospital';
      this.patchFromSignupDraft();
      this.patchFromOnboardingDraft();
      this.saveOnboardingDraft();
    });
  }

  handleComplete(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    const formValue = this.onboardingForm.value;
    const modules = this.modules
      .filter((module) => this.isModuleSelected(module.key))
      .map((module) => module.key);

    const emailOtp = `${formValue.otp1 ?? ''}${formValue.otp2 ?? ''}${formValue.otp3 ?? ''}${formValue.otp4 ?? ''}${formValue.otp5 ?? ''}${formValue.otp6 ?? ''}`;
    const organizationId = localStorage.getItem(this.organizationIdStorageKey);

    if (!organizationId) {
      this.snackBar.open(
        'Organization ID not found. Please sign up again.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      );
      return;
    }

    const payload: FacilityOnboardingRequest = {
      organization_id: organizationId,
      facilityType: this.facilityType,
      facilityName: formValue.facilityName ?? '',
      address: formValue.address ?? '',
      city: formValue.city ?? '',
      phone: formValue.phone ?? '',
      facilityEmail: formValue.facilityEmail ?? '',
      licenseNumber: formValue.licenseNumber ?? '',
      numberOfBeds: formValue.numberOfBeds,
      specialization: formValue.specialization ?? '',
      emailOtp: emailOtp || undefined,
      adminFirstName: formValue.adminFirstName ?? '',
      adminLastName: formValue.adminLastName ?? '',
      adminEmail: formValue.adminEmail ?? '',
      adminPassword: formValue.adminPassword ?? '',
      modules,
      selectedPlan: formValue.selectedPlan ?? '',
    };

    this.isSubmitting = true;
    this.authService.completeFacilityOnboarding(payload).subscribe({
      next: (response) => {
        this.saveAdminAsCurrentUser(formValue);

        const message =
          response?.message ||
          response?.data?.message ||
          'Facility onboarding completed successfully.';

        this.snackBar.open(message, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });

        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const errorMessage =
          err?.error?.message ||
          err?.details?.non_field_errors?.[0] ||
          'Failed to complete onboarding. Please try again.';

        this.snackBar.open(errorMessage, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });

        this.isSubmitting = false;
      },
    });
  }

  private saveAdminAsCurrentUser(formValue: {
    adminFirstName?: string | null;
    adminLastName?: string | null;
    adminEmail?: string | null;
  }): void {
    const adminProfile = {
      first_name: formValue.adminFirstName ?? '',
      last_name: formValue.adminLastName ?? '',
      email: formValue.adminEmail ?? '',
    };

    localStorage.setItem(this.userStorageKey, JSON.stringify(adminProfile));
  }

  private patchFromSignupDraft(): void {
    const draft = localStorage.getItem(this.signupDraftStorageKey);

    if (!draft) {
      return;
    }

    try {
      const parsed = JSON.parse(draft) as {
        facilityType?: string;
        facilityName?: string;
        registrationNumber?: string;
        adminFirstName?: string;
        adminLastName?: string;
        email?: string;
        phone?: string;
        password?: string;
      };

      this.onboardingForm.patchValue({
        facilityName: parsed.facilityName ?? '',
        phone: parsed.phone ?? '',
        facilityEmail: parsed.email ?? '',
        licenseNumber: parsed.registrationNumber ?? '',
        adminFirstName: parsed.adminFirstName ?? '',
        adminLastName: parsed.adminLastName ?? '',
        adminEmail: parsed.email ?? '',
        adminPassword: parsed.password ?? '',
        adminConfirmPassword: parsed.password ?? '',
      });

      if (
        parsed.facilityType === 'clinic' ||
        parsed.facilityType === 'hospital'
      ) {
        this.facilityType = parsed.facilityType;
      }
    } catch {
      localStorage.removeItem(this.signupDraftStorageKey);
    }
  }

  private patchFromOnboardingDraft(): void {
    const draft = localStorage.getItem(this.onboardingDraftStorageKey);

    if (!draft) {
      return;
    }

    try {
      const parsed = JSON.parse(draft) as {
        facilityType?: FacilityType;
        formValue?: unknown;
      };

      this.onboardingForm.patchValue(
        (parsed.formValue ?? {}) as Record<string, unknown>,
      );

      if (
        parsed.facilityType === 'clinic' ||
        parsed.facilityType === 'hospital'
      ) {
        this.facilityType = parsed.facilityType;
      }

      this.updateSelectedModules();
    } catch {
      localStorage.removeItem(this.onboardingDraftStorageKey);
    }
  }

  private saveOnboardingDraft(): void {
    this.onboardingForm.valueChanges.subscribe((value) => {
      localStorage.setItem(
        this.onboardingDraftStorageKey,
        JSON.stringify({
          facilityType: this.facilityType,
          formValue: value,
        }),
      );
    });
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

  quitOnboarding(): void {
    const shouldQuit = window.confirm(
      'Are you sure you want to quit onboarding? This will clear your saved signup and onboarding data.',
    );

    if (!shouldQuit) {
      return;
    }

    localStorage.removeItem(this.signupDraftStorageKey);
    localStorage.removeItem(this.onboardingDraftStorageKey);
    localStorage.removeItem(this.organizationIdStorageKey);
    this.router.navigate(['/signup']);
  }

  private updateSelectedModules(): void {
    this.selectedModules = this.modules
      .filter((module) => this.isModuleSelected(module.key))
      .map((module) => module.label);
  }
}
