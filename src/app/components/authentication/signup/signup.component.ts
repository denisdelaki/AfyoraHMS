import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../services';
import { FacilityType, SignupRequest } from '../../../models';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { LogoComponent } from '../../features/logo/logo.component';

type SelectedFacilityType = FacilityType | null;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    LogoComponent,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly signupDraftStorageKey = 'afyora.signupDraft';
  private readonly organizationIdStorageKey = 'afyora.organizationId';
  private readonly onboardingDraftStorageKey = 'afyora.onboardingDraft';
  private readonly onboardingStatusStorageKey = 'afyora.onboardingStatus';
  private readonly namePattern = /^[a-zA-Z' -]+$/;
  private readonly phonePattern = /^\+?[0-9\s()-]{7,20}$/;
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  facilityType: SelectedFacilityType = null;
  readonly signupForm = this.fb.group(
    {
      facilityType: [null as SelectedFacilityType, [Validators.required]],
      facilityName: ['', [Validators.required, Validators.minLength(2)]],
      registrationNumber: ['', [Validators.required, Validators.minLength(3)]],
      adminFirstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(this.namePattern),
        ],
      ],
      adminLastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(this.namePattern),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(this.passwordPattern),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: this.passwordsMatchValidator() },
  );

  constructor(private router: Router) {}

  setFacilityType(type: SelectedFacilityType) {
    this.facilityType = type;
    this.signupForm.patchValue({ facilityType: type });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!control && control.touched && control.invalid;
  }

  hasControlError(controlName: string, errorName: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  handleSignup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    if (!this.facilityType) {
      return;
    }

    const payload: SignupRequest = {
      facilityType: this.facilityType,
      facilityName: this.signupForm.value.facilityName ?? '',
      registrationNumber: this.signupForm.value.registrationNumber ?? '',
      adminFirstName: this.signupForm.value.adminFirstName ?? '',
      adminLastName: this.signupForm.value.adminLastName ?? '',
      email: this.signupForm.value.email ?? '',
      phone: this.signupForm.value.phone ?? '',
      password: this.signupForm.value.password ?? '',
    };

    this.isSubmitting = true;
    this.authService.signup(payload).subscribe({
      next: (response) => {
        localStorage.removeItem(this.onboardingStatusStorageKey);
        localStorage.setItem(
          this.signupDraftStorageKey,
          JSON.stringify(payload),
        );

        const responseData = (response as { data?: unknown })?.data ?? response;
        const signupResponse = responseData as {
          organization_id?: number | string;
          organizationId?: number | string;
        };

        const organizationId =
          signupResponse.organization_id ?? signupResponse.organizationId;

        if (organizationId !== null && organizationId !== undefined) {
          localStorage.setItem(
            this.organizationIdStorageKey,
            String(organizationId),
          );
        }

        this.snackBar.open(
          'Signup successful! Please check your email for verification.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );

        this.isSubmitting = false;
        this.router.navigate(['/onboarding'], {
          queryParams: { type: this.facilityType },
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.handleExistingAccount(err, payload);
      },
    });
  }

  private handleExistingAccount(err: unknown, payload: SignupRequest): void {
    const error = err as { error?: unknown };
    const response = (error?.error ?? {}) as {
      data?: unknown;
      organizationId?: number | string;
      organization_id?: number | string;
      onboardingRequired?: boolean;
      onboarding_required?: boolean;
      onboardingCompleted?: boolean;
      onboarding_completed?: boolean;
      error?: string;
      details?: Record<string, string[]>;
      message?: string;
    };
    const data = (response.data ?? response) as typeof response;
    const organizationId = data.organization_id ?? data.organizationId;
    const onboardingComplete =
      data.onboardingCompleted === true || data.onboarding_completed === true;
    const onboardingIncomplete =
      data.onboardingRequired === true ||
      data.onboarding_required === true ||
      data.onboardingCompleted === false ||
      data.onboarding_completed === false;
    const savedOrganizationId = localStorage.getItem(
      this.organizationIdStorageKey,
    );
    const canResumeSavedOnboarding =
      !onboardingComplete &&
      !!savedOrganizationId &&
      this.hasSavedOnboardingFor(payload.email);
    const errorMessage = this.getSignupErrorMessage(data);

    if (
      !onboardingComplete &&
      ((organizationId !== undefined && onboardingIncomplete) ||
        canResumeSavedOnboarding)
    ) {
      localStorage.removeItem(this.onboardingStatusStorageKey);
      localStorage.setItem(this.signupDraftStorageKey, JSON.stringify(payload));
      localStorage.setItem(
        this.organizationIdStorageKey,
        String(organizationId ?? savedOrganizationId),
      );
      this.snackBar.open(
        'An unfinished facility setup was found. Resuming your onboarding.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        },
      );
      this.router.navigate(['/onboarding'], {
        queryParams: { type: payload.facilityType },
      });
      return;
    }

    if (onboardingComplete) {
      localStorage.removeItem(this.onboardingDraftStorageKey);
      this.snackBar.open(
        'This facility has already completed onboarding. Please log in.',
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        },
      );
      return;
    }

    if (/account with this email already exists/i.test(errorMessage)) {
      this.snackBar.open(
        'An account with this email already exists. Please log in.',
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        },
      );
      return;
    }

    this.snackBar.open(
      errorMessage || 'Unable to create the account. Please try again.',
      'Close',
      { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top' },
    );
  }

  private getSignupErrorMessage(response: {
    message?: string;
    error?: string;
    details?: Record<string, string[]>;
  }): string {
    const validationMessage = Object.values(response.details ?? {})
      .flat()
      .find(Boolean);

    return validationMessage || response.message || response.error || '';
  }

  private hasSavedOnboardingFor(email: string): boolean {
    const savedDraft = localStorage.getItem(this.signupDraftStorageKey);

    try {
      return (
        JSON.parse(savedDraft ?? '{}')?.email?.toLowerCase() ===
        email.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPasswordControl = control.get('confirmPassword');
      const confirmPassword = confirmPasswordControl?.value;

      if (!confirmPasswordControl) {
        return null;
      }

      if (!password || !confirmPassword) {
        if (confirmPasswordControl.hasError('passwordMismatch')) {
          const { passwordMismatch, ...remainingErrors } =
            confirmPasswordControl.errors ?? {};
          confirmPasswordControl.setErrors(
            Object.keys(remainingErrors).length > 0 ? remainingErrors : null,
          );
        }
        return null;
      }

      if (password !== confirmPassword) {
        confirmPasswordControl.setErrors({
          ...(confirmPasswordControl.errors ?? {}),
          passwordMismatch: true,
        });
        return { passwordMismatch: true };
      }

      if (confirmPasswordControl.hasError('passwordMismatch')) {
        const { passwordMismatch, ...remainingErrors } =
          confirmPasswordControl.errors ?? {};
        confirmPasswordControl.setErrors(
          Object.keys(remainingErrors).length > 0 ? remainingErrors : null,
        );
      }

      return null;
    };
  }
}
