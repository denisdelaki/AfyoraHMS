import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Appointment } from '../../../models';
import { AppointmentsService } from '../../../services';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly facilityId =
    JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';

  appointments: Appointment[] = [];

  ngOnInit(): void {
    this.appointmentsService.getAppointments(this.facilityId).subscribe({
      next: (data) => {
        this.appointments = data || [];
      },
      error: () => {},
    });
  }

  cancelAppointment(appointment: Appointment): void {
    if (
      appointment.status === 'Cancelled' ||
      appointment.status === 'Completed'
    ) {
      return;
    }

    this.appointmentsService
      .cancelAppointment(this.facilityId, appointment.id)
      .subscribe({
        next: (response) => {
          const updatedAppointment = response.results || response.data;
          this.patchAppointment(appointment.id, {
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

  rescheduleAppointment(appointment: Appointment): void {
    if (
      appointment.status === 'Cancelled' ||
      appointment.status === 'Completed'
    ) {
      return;
    }

    const newDate = window.prompt(
      'Enter new appointment date (YYYY-MM-DD):',
      appointment.date,
    );
    if (!newDate) {
      return;
    }

    const newTime = window.prompt(
      'Enter new appointment time (HH:MM):',
      appointment.time,
    );
    if (!newTime) {
      return;
    }

    this.appointmentsService
      .updateAppointment(this.facilityId, appointment.id, {
        date: newDate,
        time: newTime,
        status: 'Scheduled',
      })
      .subscribe({
        next: (response) => {
          const updatedAppointment = response.results || response.data;
          this.patchAppointment(appointment.id, {
            ...appointment,
            ...updatedAppointment,
            date: newDate,
            time: newTime,
          });
        },
        error: (error) => {
          this.showApiError(error, 'Unable to reschedule appointment.');
        },
      });
  }

  statusClasses(status: Appointment['status']): string {
    const styles: Record<Appointment['status'], string> = {
      Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
      Completed: 'bg-slate-100 text-slate-700 border-slate-200',
      Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  canCancel(appointment: Appointment): boolean {
    return (
      appointment.status !== 'Cancelled' && appointment.status !== 'Completed'
    );
  }

  canReschedule(appointment: Appointment): boolean {
    return (
      appointment.status !== 'Cancelled' && appointment.status !== 'Completed'
    );
  }

  private patchAppointment(id: string, updated: Appointment): void {
    this.appointments = this.appointments.map((item) =>
      item.id === id ? { ...item, ...updated } : item,
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
