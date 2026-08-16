import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const pw = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (!pw || !confirm || !confirm.value) return null;
  return pw.value === confirm.value ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  uid = '';
  token = '';
  linkInvalid = false;

  isSubmitting = false;
  isSuccess = false;
  errorMessage = '';

  showNew = false;
  showConfirm = false;

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  get newPassword() {
    return this.form.controls.newPassword;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  ngOnInit(): void {
    this.uid = this.route.snapshot.queryParamMap.get('uid') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.uid || !this.token) {
      this.linkInvalid = true;
    }
  }

  /** Live strength bar: 0–4 */
  get strength(): number {
    const v = this.newPassword.value;
    if (!v) return 0;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength];
  }

  get strengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.strength];
  }

  get hasMinLength(): boolean {
    return this.newPassword.value.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword.value);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.newPassword.value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .confirmPasswordReset(
        this.uid,
        this.token,
        this.newPassword.value,
        this.confirmPassword.value,
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isSuccess = true;
        },
        error: (err) => {
          this.isSubmitting = false;
          const detail = err?.error?.detail ?? err?.error?.error;
          this.errorMessage =
            detail ??
            'The reset link has expired or is invalid. Please request a new one.';
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
