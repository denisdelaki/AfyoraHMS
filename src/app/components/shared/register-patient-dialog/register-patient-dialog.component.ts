import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RegisterPatientPayload } from '../../features/patients/patient.models';

@Component({
  selector: 'app-register-patient-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register-patient-dialog.component.html',
  styleUrl: './register-patient-dialog.component.css',
})
export class RegisterPatientDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<
      RegisterPatientDialogComponent,
      RegisterPatientPayload | undefined
    >,
  );

  registerForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    age: [null as number | null, [Validators.required, Validators.min(0)]],
    gender: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    bloodGroup: ['', [Validators.required]],
    dob: [''],
    address: [''],
    emergencyContact: [''],
    medicalHistory: [''],
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const value = this.registerForm.getRawValue();

    this.dialogRef.close({
      firstName: value.firstName ?? '',
      lastName: value.lastName ?? '',
      age: value.age ?? 0,
      gender: value.gender ?? '',
      phone: value.phone ?? '',
      email: value.email ?? '',
      bloodGroup: value.bloodGroup ?? '',
      dob: value.dob ?? '',
      address: value.address ?? '',
      emergencyContact: value.emergencyContact ?? '',
      medicalHistory: value.medicalHistory ?? '',
    });
  }
}
