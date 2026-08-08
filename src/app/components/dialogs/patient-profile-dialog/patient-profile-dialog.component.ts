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
import {
  AddVisitRecordDialogComponent,
  DoctorOption,
  PrescriptionEntry,
  VisitRecordFormValue,
} from '../add-visit-record-dialog/add-visit-record-dialog.component';
import { AppointmentsService } from '../../../services/appointments.service';
import { DepartmentService } from '../../../services/department.service';
import { EmployeeService } from '../../../services/employee.service';
import { PatientsService } from '../../../services/patients.service';
import { Prescription } from '../../../models/pharmacy.models';
import { forkJoin } from 'rxjs';
import { Employee } from '../../../models/employee.model';
import { PharmacyService } from '../../../services/pharmacy.service';

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
  private readonly patientsService = inject(PatientsService);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly pharmacyService = inject(PharmacyService);
  data = inject<PatientProfileDialogData>(MAT_DIALOG_DATA);
  private doctorNames = new Map<string, string>();
  private departmentNames = new Map<string, string>();
  private doctors: DoctorOption[] = [];

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.data.visitHistory = this.data.visitHistory.map((record) =>
      this.normalizeVisitRecord(record),
    );

    forkJoin({
      employees: this.employeeService.fetchEmployees(this.facilityId),
      departments: this.departmentService.fetchDepartments(this.facilityId),
    }).subscribe({
      next: ({ employees, departments }) => {
        this.doctors = employees.map((e: Employee) => ({
          id: this.normalizeId(e.id),
          name: e.name,
        }));
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
        this.doctors = [];
        this.doctorNames = new Map();
        this.departmentNames = new Map();
      },
    });
  }

  openAddVisitRecordDialog(): void {
    const dialogRef = this.dialog.open(AddVisitRecordDialogComponent, {
      width: '90vw',
      maxWidth: '640px',
      maxHeight: '90vh',
      data: {
        mode: 'create',
        doctors: this.doctors,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.createVisitRecord(result);
    });
  }

  openEditVisitRecordDialog(visitRecord: VisitHistory): void {
    const dialogRef = this.dialog.open(AddVisitRecordDialogComponent, {
      width: '90vw',
      maxWidth: '640px',
      maxHeight: '90vh',
      data: {
        mode: 'edit',
        doctors: this.doctors,
        initialValue: {
          date: visitRecord.date,
          doctor: visitRecord.doctor,
          diagnosis: visitRecord.diagnosis,
          prescriptions: visitRecord.prescriptions,
          amountBilled: String(visitRecord.amountBilled ?? '0.00'),
          whatHappened: visitRecord.whatHappened,
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.updateVisitRecord(visitRecord, result);
    });
  }

  deleteVisitRecord(visitRecord: VisitHistory): void {
    if (!confirm('Delete this visit record?')) {
      return;
    }

    const prescriptionIds = Array.from(
      new Set(
        (visitRecord.prescriptions ?? [])
          .map((item) => this.normalizeId(item.id))
          .filter((id) => id.length > 0),
      ),
    );

    if (!visitRecord.id) {
      this.data.visitHistory = this.data.visitHistory.filter(
        (entry) => entry !== visitRecord,
      );
      this.snackBar.open('Visit record deleted.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    this.patientsService
      .deletePatientVisitHistory(
        this.data.patient.id,
        visitRecord.id,
        this.facilityId,
      )
      .subscribe({
        next: () => {
          this.data.visitHistory = this.data.visitHistory.filter(
            (entry) => entry.id !== visitRecord.id,
          );

          if (!prescriptionIds.length) {
            this.snackBar.open('Visit record deleted.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            return;
          }

          forkJoin(
            prescriptionIds.map((prescriptionId) =>
              this.pharmacyService.deletePrescription(
                prescriptionId,
                this.facilityId,
              ),
            ),
          ).subscribe({
            next: () => {
              this.snackBar.open('Visit record deleted.', 'Close', {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              });
            },
            error: (error) => {
              console.error('Error deleting associated prescriptions:', error);
              this.snackBar.open(
                'Visit record deleted, but some prescriptions could not be deleted.',
                'Close',
                {
                  duration: 5000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                },
              );
            },
          });
        },
        error: (error) => {
          this.snackBar.open(
            error?.error?.message || 'Unable to delete visit record.',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
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
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
          error: (error) => {
            this.snackBar.open(
              error?.error?.message || 'Unable to reschedule appointment.',
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              },
            );
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

  private createVisitRecord(formValue: VisitRecordFormValue): void {
    this.patientsService
      .createPatientVisitHistory(
        this.data.patient.id,
        formValue,
        this.facilityId,
      )
      .subscribe({
        next: (response) => {
          const createdRecord = this.normalizeVisitRecord(
            (response.results || response.data) ?? {
              ...formValue,
              facility: this.facilityId,
            },
          );
          this.data.visitHistory = [createdRecord, ...this.data.visitHistory];
          this.snackBar.open('Visit record added successfully.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: () => {
          const localRecord = this.normalizeVisitRecord({
            ...formValue,
          });
          this.data.visitHistory = [localRecord, ...this.data.visitHistory];
          this.snackBar.open(
            'Visit record saved locally. Sync with server failed.',
            'Close',
            {
              duration: 5000,
            },
          );
        },
      });
  }

  private updateVisitRecord(
    currentRecord: VisitHistory,
    formValue: VisitRecordFormValue,
  ): void {
    if (!currentRecord.id) {
      this.patchVisitRecord(currentRecord, formValue);
      this.snackBar.open('Visit record updated.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.patientsService
      .updatePatientVisitHistory(
        this.data.patient.id,
        currentRecord.id,
        formValue,
        this.facilityId,
      )
      .subscribe({
        next: (response) => {
          const updatedRecord = this.normalizeVisitRecord(
            (response.results || response.data) ?? {
              ...currentRecord,
              ...formValue,
            },
          );
          this.patchVisitRecord(currentRecord, updatedRecord);
          this.snackBar.open('Visit record updated.', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.patchVisitRecord(currentRecord, formValue);
          this.snackBar.open(
            'Visit record updated locally. Sync with server failed.',
            'Close',
            {
              duration: 5000,
            },
          );
        },
      });
  }

  private patchVisitRecord(
    targetRecord: VisitHistory,
    update: Partial<Omit<VisitHistory, 'prescriptions'>> & {
      prescriptions?: (Prescription | PrescriptionEntry)[];
    },
  ): void {
    this.data.visitHistory = this.data.visitHistory.map((record) =>
      record === targetRecord
        ? this.normalizeVisitRecord({ ...record, ...update })
        : record,
    );
  }

  private normalizeVisitRecord(
    record: Partial<Omit<VisitHistory, 'prescriptions'>> & {
      prescriptions?: (Prescription | PrescriptionEntry)[];
    } & Record<string, unknown>,
  ): VisitHistory {
    const rawPrescriptions = record['prescriptions'];
    const prescriptions: Prescription[] = Array.isArray(rawPrescriptions)
      ? rawPrescriptions.map((p) => ({
          id: (p as Prescription).id ?? '',
          patientId: (p as Prescription).patientId ?? '',
          doctorId: (p as Prescription).doctorId ?? '',
          drugs: (p.drugs ?? []).map((d) => ({
            id: (d as { id?: string }).id ?? '',
            name: d.name,
            quantity: d.quantity,
            dosage: d.dosage,
          })),
          status: p.status,
          date: p.date,
        }))
      : [];
    return {
      id: record['id'] as string | undefined,
      date: (record['date'] as string) || new Date().toISOString().slice(0, 10),
      doctor:
        (record['doctor'] as string) || (record['servedBy'] as string) || '',
      diagnosis: (record['diagnosis'] as string) || '',
      prescriptions,
      amountBilled: record['amountBilled'] ?? '0.00',
      whatHappened:
        (record['whatHappened'] as string) ||
        (record['happened'] as string) ||
        '',
    };
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
      item.id === appointmentId
        ? { ...item, ...updated, facility: this.facilityId }
        : item,
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
