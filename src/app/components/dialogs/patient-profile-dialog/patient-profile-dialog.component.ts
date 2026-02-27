import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Appointment,
  Patient,
  VisitHistory,
} from '../../features/patients/patient.models';

interface PatientProfileDialogData {
  patient: Patient;
  appointments: Appointment[];
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
    MatTabsModule,
  ],
  templateUrl: './patient-profile-dialog.component.html',
  styleUrl: './patient-profile-dialog.component.css',
})
export class PatientProfileDialogComponent {
  readonly data = inject<PatientProfileDialogData>(MAT_DIALOG_DATA);
}
