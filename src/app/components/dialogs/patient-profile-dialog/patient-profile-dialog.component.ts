import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Appointment,
  CreateAppointmentPayload,
  Patient,
  VisitHistory,
} from '../../features/patients/patient.models';
import { AppointmentBookingDialogComponent } from '../appointment-booking-dialog/appointment-booking-dialog.component';
import { AppointmentsService } from '../../../services/appointments.service';
import { DepartmentService } from '../../../services/department.service';
import { EmployeeService } from '../../../services/employee.service';
import { forkJoin } from 'rxjs';

type PatientAppointment = Appointment & { id?: string };

interface PatientProfileDialogData {
  patient: Patient;
  appointments: PatientAppointment[];
  visitHistory: VisitHistory[];
}

@Component({
  selector: 'app-patient-profile-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './patient-profile-dialog.component.html',
  styleUrl: './patient-profile-dialog.component.css',
})
export class PatientProfileDialogComponent implements OnInit {
  facilityId: string | number = '';
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(
    MatDialogRef<PatientProfileDialogComponent>,
  );
  private readonly snackBar = inject(MatSnackBar);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  data = inject<PatientProfileDialogData>(MAT_DIALOG_DATA);
  private doctorNames = new Map<string, string>();
  private departmentNames = new Map<string, string>();

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';

    forkJoin({
      employees: this.employeeService.fetchEmployees(this.facilityId),
      departments: this.departmentService.fetchDepartments(this.facilityId),
    }).subscribe({
      next: ({ employees, departments }) => {
        this.doctorNames = new Map(
          employees.map((employee) => [
            this.normalizeId(employee.id),
            employee.name,
          ]),
        );
        this.departmentNames = new Map(
          departments.map((department) => [
            this.normalizeId(department.id),
            department.name,
          ]),
        );
      },
      error: () => {
        this.doctorNames = new Map();
        this.departmentNames = new Map();
      },
    });
  }

  cancelAppointment(appointment: PatientAppointment): void {
    if (!appointment.id || !this.canCancel(appointment)) {
      return;
    }

    this.appointmentsService
      .cancelAppointment(this.facilityId, appointment.id)
      .subscribe({
        next: (response) => {
          const updatedAppointment = response.results || response.data;
          this.patchAppointment(appointment.id!, {
            ...appointment,
            ...updatedAppointment,
            status: 'Cancelled',
          });
        },
        error: (error) => {
          this.showApiError(error, 'Unable to cancel appointment.');
        },
      });
  }

  rescheduleAppointment(appointment: PatientAppointment): void {
    if (!appointment.id || !this.canReschedule(appointment)) {
      return;
    }

    const rescheduleDialogRef = this.dialog.open(
      AppointmentBookingDialogComponent,
      {
        width: '90vw',
        maxWidth: '700px',
        maxHeight: '90vh',
        data: {
          patients: [this.data.patient],
          mode: 'reschedule',
          initialValues: {
            patientId: appointment.patientId,
            date: this.parseDate(appointment.date),
            time: appointment.time,
            doctor: this.normalizeId(appointment.doctor),
            department: this.normalizeId(appointment.department),
          } as Partial<CreateAppointmentPayload>,
        },
      },
    );

    rescheduleDialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.appointmentsService
        .updateAppointment(this.facilityId, appointment.id!, {
          date: result.date.toISOString().slice(0, 10),
          time: result.time,
          doctor: result.doctor,
          department: result.department,
          status: 'Scheduled',
        })
        .subscribe({
          next: (response) => {
            const updatedAppointment = response.results || response.data;
            this.patchAppointment(appointment.id!, {
              ...appointment,
              ...updatedAppointment,
              date: result.date.toISOString().slice(0, 10),
              time: result.time,
              doctor: result.doctor,
              department: result.department,
              status: 'Scheduled',
            });
            this.snackBar.open('Appointment updated successfully.', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close();
          },
          error: (error) => {
            this.showApiError(error, 'Unable to reschedule appointment.');
          },
        });
    });
  }

  canCancel(appointment: PatientAppointment): boolean {
    return (
      !!appointment.id &&
      appointment.status !== 'Cancelled' &&
      appointment.status !== 'Completed'
    );
  }

  canReschedule(appointment: PatientAppointment): boolean {
    return (
      !!appointment.id &&
      appointment.status !== 'Cancelled' &&
      appointment.status !== 'Completed'
    );
  }

  statusClasses(status: string): string {
    const normalizedStatus = (status || '').trim();

    if (normalizedStatus === 'Scheduled') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    if (normalizedStatus === 'Confirmed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (normalizedStatus === 'In Progress') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    if (normalizedStatus === 'Completed') {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    if (normalizedStatus === 'Cancelled') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  displayDoctor(doctorIdOrName: string): string {
    return (
      this.doctorNames.get(this.normalizeId(doctorIdOrName)) ||
      doctorIdOrName ||
      'Unknown Doctor'
    );
  }

  displayDepartment(departmentIdOrName: string): string {
    return (
      this.departmentNames.get(this.normalizeId(departmentIdOrName)) ||
      departmentIdOrName ||
      'Unknown Department'
    );
  }

  private normalizeId(value: string | number | null | undefined): string {
    return String(value ?? '').trim();
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private patchAppointment(
    appointmentId: string,
    updated: PatientAppointment,
  ): void {
    this.data.appointments = this.data.appointments.map((item) =>
      item.id === appointmentId ? { ...item, ...updated } : item,
    );
  }

  private showApiError(error: unknown, fallbackMessage: string): void {
    this.snackBar.open(
      this.extractApiErrorMessage(error) || fallbackMessage,
      'Close',
      {
        duration: 5000,
      },
    );
  }

  private extractApiErrorMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const payload = (error as { error?: unknown }).error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    for (const value of Object.values(payload as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const firstMessage = value.find(
          (entry): entry is string =>
            typeof entry === 'string' && entry.trim().length > 0,
        );
        if (firstMessage) {
          return firstMessage;
        }
        continue;
      }

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }
}
