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
import { AuthService } from '../../../services';
import { FacilityType, SignupRequest } from '../../../models';

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
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  facilityType: SelectedFacilityType = null;
  readonly signupForm = this.fb.group({
    facilityType: [null as SelectedFacilityType, [Validators.required]],
    facilityName: ['', [Validators.required]],
    registrationNumber: ['', [Validators.required]],
    adminFirstName: ['', [Validators.required]],
    adminLastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
    terms: [false, [Validators.requiredTrue]],
  });

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
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/onboarding'], {
          queryParams: { type: this.facilityType },
        });
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
    //for testing without backend, uncomment below and comment out the above block
    this.router.navigate(['/onboarding'], {
      queryParams: { type: this.facilityType },
    });
  }
}
