import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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
export class RegisterPatientDialogComponent implements OnInit, OnDestroy {
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
  private readonly destroy$ = new Subject<void>();
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
    nationalId: [''],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    age: [null as number | null, [Validators.required, Validators.min(0)]],
    gender: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.email]],
    bloodGroup: ['', [Validators.required]],
    dob: [''],
    address: [''],
    emergencyContact: [''],
    medicalHistory: [''],
  });

  constructor() {
    if (!this.patientToEdit) {
      return;
    }

    this.registerForm.patchValue({
      nationalId: this.patientToEdit.nationalId ?? '',
      firstName: this.patientToEdit.firstName ?? '',
      lastName: this.patientToEdit.lastName ?? '',
      age: this.patientToEdit.age,
      gender: this.patientToEdit.gender,
      phone: this.patientToEdit.phone,
      email: this.patientToEdit.email,
      bloodGroup: this.patientToEdit.bloodGroup,
    });
  }

  ngOnInit(): void {
    // Auto-calculate age whenever the date of birth changes
    this.registerForm.get('dob')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((dob) => {
        const age = this.calculateAge(dob, this.today);
        if (age !== null) {
          this.registerForm.get('age')!.setValue(age, { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calculates full years between dob and registrationDate.
   * Returns null when dob is missing or invalid.
   */
  private calculateAge(dob: string | Date | null | undefined, registrationDate: Date): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;

    let age = registrationDate.getFullYear() - birth.getFullYear();
    const monthDiff = registrationDate.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && registrationDate.getDate() < birth.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
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
      nationalId: value.nationalId ?? '',
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
