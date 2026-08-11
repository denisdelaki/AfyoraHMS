import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services';
import { LoginRequest } from '../../../models';

function passwordMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const newPasswordCtrl = group.get('newPassword');
  const confirmCtrl = group.get('confirmPassword');
  if (!newPasswordCtrl || !confirmCtrl) return null;

  const mismatch =
    !!newPasswordCtrl.value &&
    !!confirmCtrl.value &&
    newPasswordCtrl.value !== confirmCtrl.value;

  const { passwordMismatch, ...otherErrors } = confirmCtrl.errors ?? {};
  const hasOtherErrors = Object.keys(otherErrors).length > 0;

  if (mismatch) {
    confirmCtrl.setErrors({ ...otherErrors, passwordMismatch: true });
  } else {
    confirmCtrl.setErrors(hasOtherErrors ? otherErrors : null);
  }

  return null;
}

@Component({
  selector: 'app-login',
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  showPassword = false;
  isSubmitting = false;
  isFirstTimeLogin = false;
  temporaryPassword = '';
  readonly loginForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
      newPassword: this.fb.control<string | null>(null),
      confirmPassword: this.fb.control<string | null>(null),
    },
    { validators: passwordMatchValidator },
  );

  constructor(private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  hasControlError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  handleLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = {
      email: this.loginForm.value.email ?? '',
      password: this.loginForm.value.password ?? this.temporaryPassword ?? '',
      newPassword: this.loginForm.value.newPassword ?? '',
      confirmPassword: this.loginForm.value.confirmPassword ?? '',
      rememberMe: this.loginForm.value.rememberMe ?? false,
    };

    this.isSubmitting = true;
    this.authService.login(payload).subscribe({
      next: (resp: any) => {
        this.isFirstTimeLogin = resp?.first_login ?? false;
        this.temporaryPassword = this.loginForm.value.password ?? '';

        if (this.isFirstTimeLogin) {
          this.loginForm.get('password')?.disable();

          const newPasswordCtrl = this.loginForm.get('newPassword')!;
          const confirmCtrl = this.loginForm.get('confirmPassword')!;

          newPasswordCtrl.enable();
          confirmCtrl.enable();
          newPasswordCtrl.setValidators([
            Validators.required,
            Validators.minLength(8),
          ]);
          confirmCtrl.setValidators([Validators.required]);
          newPasswordCtrl.updateValueAndValidity();
          confirmCtrl.updateValueAndValidity();

          this.isSubmitting = false;
        } else {
          this.handleLoginSuccess();
        }
      },
      error: (err) => {
        const errorMessage =
          err?.error?.details?.non_field_errors?.[0] ||
          err?.error?.message ||
          'Login failed. Please try again.';

        this.snackBar.open(errorMessage, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isSubmitting = false;
      },
    });
  }

  handlePasswordReset() {
    const email = this.loginForm.value.email ?? '';
    if (!email) {
      this.snackBar.open(
        'Please enter your email to reset password.',
        'Close',
        { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' },
      );
      return;
    }

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.snackBar.open(
          'Password reset link sent. Please check your email.',
          'Close',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          },
        );
      },
      error: (err: any) => {
        const errorMessage =
          err?.error?.details?.non_field_errors?.[0] ||
          err?.error?.message ||
          'Password reset request failed. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  handleLoginSuccess() {
    let firstName = 'User';
    const storedUser = localStorage.getItem('afyora.user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as {
          firstName?: string;
          first_name?: string;
        };
        firstName = user.firstName || user.first_name || 'User';
      } catch {
        firstName = 'User';
      }
    }

    this.snackBar.open(`Hello, ${firstName} welcome back!`, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });

    this.isSubmitting = false;
    this.router.navigate(['/dashboard']);
  }
}
