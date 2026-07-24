import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Patient,
  RegisterPatientPayload,
} from '../../features/patients/patient.models';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

interface RegisterPatientDialogData {
  patient?: Patient;
}

@Component({
  selector: 'app-register-patient-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    CommonModule,
  ],
  templateUrl: './register-patient-dialog.component.html',
  styleUrl: './register-patient-dialog.component.css',
})
export class RegisterPatientDialogComponent {
  bloodGroups = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
  ];
  readonly today = new Date();
  private readonly formBuilder = inject(FormBuilder);
  private readonly data = inject<RegisterPatientDialogData | null>(
    MAT_DIALOG_DATA,
    { optional: true },
  );
  private readonly dialogRef = inject(
    MatDialogRef<
      RegisterPatientDialogComponent,
      RegisterPatientPayload | undefined
    >,
  );

  readonly patientToEdit = this.data?.patient;

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

  constructor() {
    console.log('Patient to edit:', this.patientToEdit);
    console.log('data:', this.data);
    if (!this.patientToEdit) {
      return;
    }

    this.registerForm.patchValue({
      firstName: this.patientToEdit.firstName ?? '',
      lastName: this.patientToEdit.lastName ?? '',
      age: this.patientToEdit.age,
      gender: this.patientToEdit.gender,
      phone: this.patientToEdit.phone,
      email: this.patientToEdit.email,
      bloodGroup: this.patientToEdit.bloodGroup,
    });
  }

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
