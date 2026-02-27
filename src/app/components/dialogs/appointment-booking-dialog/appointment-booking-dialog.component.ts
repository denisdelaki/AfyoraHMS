import { Component, inject } from '@angular/core';
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

interface AppointmentBookingDialogData {
  patients: Patient[];
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
export class AppointmentBookingDialogComponent {
  readonly today = new Date();

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

  appointmentForm = this.formBuilder.group({
    patientId: ['', [Validators.required]],
    date: [null as Date | null, [Validators.required]],
    time: ['', [Validators.required]],
    doctor: ['', [Validators.required]],
    department: ['', [Validators.required]],
  });

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
      time: value.time ?? '',
      doctor: value.doctor ?? '',
      department: value.department ?? '',
    });
  }
}
