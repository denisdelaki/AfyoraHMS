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
  email: string = '';
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
  isVerifyingOtp = false;
  isResendingOtp = false;
  otpVerified = false;
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
    otp1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    otp2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    otp3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    otp4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    otp5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    otp6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
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
      price: 'Kes 2999',
      features: [
        'Up to 100 patients',
        '3 users',
        'Basic modules',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: 'Kes 5999',
      features: [
        'Up to 500 patients',
        '15 users',
        'All modules',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Kes 12999',
      features: [
        'Unlimited patients',
        'Unlimited users',
        'All modules',
        '24/7 support',
      ],
    },
  ];

  Math = Math; // to allow Math.max usage in template
  readonly otpControlNames = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'] as const;

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

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    const control = this.onboardingForm.get(this.otpControlNames[index]);

    control?.setValue(digit);
    this.otpVerified = false;

    if (digit && index < this.otpControlNames.length - 1) {
      this.focusOtpInput(index + 1);
    }

    this.verifyOtpWhenComplete();
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (
      event.key === 'Backspace' &&
      !this.onboardingForm.get(this.otpControlNames[index])?.value &&
      index > 0
    ) {
      this.focusOtpInput(index - 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const digits = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, this.otpControlNames.length);

    if (!digits) {
      return;
    }

    this.otpControlNames.forEach((controlName, index) => {
      this.onboardingForm.get(controlName)?.setValue(digits[index] ?? '');
    });
    this.otpVerified = false;
    this.focusOtpInput(Math.min(digits.length, this.otpControlNames.length) - 1);
    this.verifyOtpWhenComplete();
  }

  verifyOtp(): void {
    if (this.isVerifyingOtp || this.otpVerified) {
      return;
    }

    const otp = this.getOtp();

    if (!/^\d{6}$/.test(otp)) {
      this.otpControlNames.forEach((controlName) => {
        this.onboardingForm.get(controlName)?.markAsTouched();
      });
      this.snackBar.open('Enter the complete 6-digit verification code.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    const email = this.getVerificationEmail();
    if (!email) {
      this.snackBar.open('An email address is required to verify the code.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    this.isVerifyingOtp = true;
    this.authService.verifyOtp(email, otp).subscribe({
      next: (response) => {
        this.otpVerified = true;
        this.isVerifyingOtp = false;
        this.snackBar.open(response?.message || 'Email verified successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.currentStep = 2;
      },
      error: (err) => {
        this.isVerifyingOtp = false;
        this.snackBar.open(
          err?.error?.message || 'The verification code is invalid or has expired.',
          'Close',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          },
        );
      },
    });
  }

  resendOtp(): void {
    if (this.isResendingOtp) {
      return;
    }

    const email = this.getVerificationEmail();
    if (!email) {
      this.snackBar.open('An email address is required to resend the code.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    this.isResendingOtp = true;
    this.authService.resendOtp(email).subscribe({
      next: (response) => {
        this.isResendingOtp = false;
        this.otpVerified = false;
        this.otpControlNames.forEach((controlName) => {
          this.onboardingForm.get(controlName)?.reset('');
        });
        this.focusOtpInput(0);
        this.snackBar.open(response?.message || 'A new verification code has been sent.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
      error: (err) => {
        this.isResendingOtp = false;
        this.snackBar.open(
          err?.error?.message || 'Unable to resend the verification code. Please try again.',
          'Close',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          },
        );
      },
    });
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.otpVerified) {
      this.verifyOtp();
      return;
    }

    this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
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

  private verifyOtpWhenComplete(): void {
    if (this.currentStep === 1 && !this.otpVerified && /^\d{6}$/.test(this.getOtp())) {
      this.verifyOtp();
    }
  }

  private getOtp(): string {
    return this.otpControlNames
      .map((controlName) => this.onboardingForm.get(controlName)?.value ?? '')
      .join('');
  }

  private getVerificationEmail(): string {
    return (
      this.onboardingForm.get('facilityEmail')?.value ||
      this.onboardingForm.get('adminEmail')?.value ||
      ''
    );
  }

  private focusOtpInput(index: number): void {
    document.getElementById(`otp-${index}`)?.focus();
  }
}
