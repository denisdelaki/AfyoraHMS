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

type FacilityType = 'hospital' | 'clinic' | null;

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
  showPassword = false;
  showConfirmPassword = false;
  facilityType: FacilityType = null;
  readonly signupForm = this.fb.group({
    facilityType: [null as FacilityType, [Validators.required]],
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

  setFacilityType(type: FacilityType) {
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

    // Navigate to onboarding with facility type
    this.router.navigate(['/onboarding'], {
      queryParams: { type: this.facilityType },
    });
  }
}
