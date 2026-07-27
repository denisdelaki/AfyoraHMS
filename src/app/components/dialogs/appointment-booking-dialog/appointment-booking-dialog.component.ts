import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';

import {
  CreateAppointmentPayload,
  Patient,
} from '../../features/patients/patient.models';
import { DepartmentService } from '../../../services/department.service';
import { EmployeeService } from '../../../services/employee.service';

interface AppointmentBookingDialogData {
  patients: Patient[];
  initialValues?: Partial<CreateAppointmentPayload>;
  mode?: 'create' | 'reschedule';
}

@Component({
  selector: 'app-appointment-booking-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
  ],
  templateUrl: './appointment-booking-dialog.component.html',
  styleUrl: './appointment-booking-dialog.component.css',
})
export class AppointmentBookingDialogComponent implements OnInit {
  readonly today = new Date();
  facilityId = '';
  departments: any[] = [];
  doctors: any[] = [];

  get submitLabel(): string {
    return this.data.mode === 'reschedule'
      ? 'Update Appointment'
      : 'Book Appointment';
  }

  get time(): Date {
    return new Date();
  }

  readonly data = inject<AppointmentBookingDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<
      AppointmentBookingDialogComponent,
      CreateAppointmentPayload | undefined
    >,
  );

  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.fetchDepartments(this.facilityId);
    this.fetchDoctors(this.facilityId);
    this.prefillForm();
  }

  appointmentForm = this.formBuilder.group({
    patientId: ['', [Validators.required]],
    date: [null as Date | null, [Validators.required]],
    time: [null as Date | string | null, [Validators.required]],
    doctor: ['', [Validators.required]],
    department: ['', [Validators.required]],
  });

  private fetchDepartments(facilityId: string | number): void {
    this.departmentService.fetchDepartments(facilityId).subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: () => {
        this.departments = [];
      },
    });
  }

  private fetchDoctors(facilityId: string | number): void {
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onBookAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const value = this.appointmentForm.getRawValue();
    if (!value.date) {
      return;
    }

    this.dialogRef.close({
      patientId: value.patientId ?? '',
      date: value.date,
      time: this.formatTime(value.time),
      doctor: value.doctor ?? '',
      department: value.department ?? '',
    });
  }

  private formatTime(value: unknown): string {
    if (value instanceof Date) {
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return typeof value === 'string' ? value : '';
  }

  private prefillForm(): void {
    if (!this.data.initialValues) {
      return;
    }

    const date = this.parseDate(this.data.initialValues.date);
    const time = this.parseTime(this.data.initialValues.time);

    this.appointmentForm.patchValue({
      patientId: this.data.initialValues.patientId ?? '',
      date,
      time,
      doctor: this.data.initialValues.doctor ?? '',
      department: this.data.initialValues.department ?? '',
    });
  }

  private parseDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private parseTime(value: unknown): Date | string | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      return trimmed;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return trimmed;
    }

    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
  }
}
