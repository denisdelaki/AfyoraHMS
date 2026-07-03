import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services';
import { LoginRequest } from '../../../models';

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
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

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
      password: this.loginForm.value.password ?? '',
      rememberMe: this.loginForm.value.rememberMe ?? false,
    };

    this.isSubmitting = true;
    this.authService.login(payload).subscribe({
      next: (resp) => {
        console.log('Login successful:', resp);

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
      },
      error: (err) => {
        const errorMessage =
          err?.details?.non_field_errors?.[0] ||
          err?.error?.message ||
          'Login failed. Please try again.';

        console.error('Login failed:', errorMessage);
        this.snackBar.open(errorMessage, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isSubmitting = false;
      },
    });
  }
}
