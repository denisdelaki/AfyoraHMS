import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  isSubmitting = false;
  isSubmitted = false;
  errorMessage = '';
  readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.resetForm.controls.email;
  }

  submit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.requestPasswordReset(this.email.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.message ||
          'We could not send a reset link. Please check the email address and try again.';
      },
    });
  }
}
