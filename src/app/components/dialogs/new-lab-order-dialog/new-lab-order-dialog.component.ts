import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateLabOrderPayload,
  LabPriority,
  LabTest,
} from '../../../models/laboratory.models';
import { PatientsService } from '../../../services';
import { EmployeeService } from '../../../services/employee.service';

interface NewLabOrderDialogData {
  tests: LabTest[];
}

@Component({
  selector: 'app-new-lab-order-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './new-lab-order-dialog.component.html',
  styleUrl: './new-lab-order-dialog.component.css',
})
export class NewLabOrderDialogComponent implements OnInit {
  patients: { id: string; name: string }[] = [];
  doctors: { id: string; name: string }[] = [];
  readonly data = inject<NewLabOrderDialogData>(MAT_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(
    MatDialogRef<NewLabOrderDialogComponent, CreateLabOrderPayload | undefined>,
  );
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly patientService = inject(PatientsService);
  private readonly employeeService = inject(EmployeeService);

  readonly priorities: LabPriority[] = ['Routine', 'Urgent', 'STAT'];

  readonly form = this.fb.group({
    patient: ['', [Validators.required, Validators.maxLength(100)]],
    patientId: ['', [Validators.required, Validators.maxLength(30)]],
    orderedBy: ['', [Validators.required, Validators.maxLength(100)]],
    testId: ['', Validators.required],
    priority: ['Routine' as LabPriority, Validators.required],
    notes: ['', Validators.maxLength(400)],
  });

  ngOnInit(): void {
    const facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.fetchPatients(facilityId);
    this.fetchEmployees(facilityId);
    this.form.controls.patient.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedPatientId) => {
        this.form.controls.patientId.setValue(selectedPatientId ?? '');
      });
  }

  private fetchPatients(facilityId: string): void {
    this.patientService.getPatients(facilityId).subscribe({
      next: (patients) => {
        this.patients = patients.map((patient) => ({
          id: patient.id,
          name: patient.firstName + ' ' + patient.lastName,
        }));
      },
    });
  }

  private fetchEmployees(facilityId: string): void {
    this.employeeService.fetchEmployees(facilityId).subscribe({
      next: (employees) => {
        this.doctors = employees.filter(
          (emp) => emp.role.toLowerCase() === 'doctor',
        );
      },
      error: () => {
        this.doctors = [];
      },
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue() as CreateLabOrderPayload);
  }
}
