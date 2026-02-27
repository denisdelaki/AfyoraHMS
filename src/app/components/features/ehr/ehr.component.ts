import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CreateEhrRecordPayload,
  EhrRecordDialogComponent,
} from '../../dialogs/ehr-record-dialog/ehr-record-dialog.component';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface LabResult {
  test: string;
  result: string;
  status: 'Normal' | 'Abnormal' | 'High';
}

interface EhrRecord {
  date: string;
  doctor: string;
  diagnosis: string;
  prescriptions: string[];
  labResults: LabResult[];
  notes: string;
}

interface RadiologyImage {
  date: string;
  type: string;
  radiologist: string;
  findings: string;
  status: string;
}

@Component({
  selector: 'app-ehr',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
  ],
  templateUrl: './ehr.component.html',
  styleUrl: './ehr.component.css',
})
export class EhrComponent {
  private readonly dialog = inject(MatDialog);

  searchTerm = '';
  selectedPatient: Patient | null = null;

  patients: Patient[] = [
    { id: 'P001', name: 'John Smith', age: 45, gender: 'Male' },
    { id: 'P002', name: 'Sarah Johnson', age: 32, gender: 'Female' },
    { id: 'P003', name: 'Michael Brown', age: 58, gender: 'Male' },
  ];

  ehrRecords: EhrRecord[] = [
    {
      date: '2024-02-20',
      doctor: 'Dr. Emily Chen',
      diagnosis: 'Hypertension',
      prescriptions: [
        'Amlodipine 5mg - Once daily',
        'Lisinopril 10mg - Once daily',
      ],
      labResults: [
        { test: 'Blood Pressure', result: '140/90 mmHg', status: 'Abnormal' },
        { test: 'Cholesterol', result: '220 mg/dL', status: 'High' },
      ],
      notes:
        'Patient shows signs of uncontrolled hypertension. Adjusted medication dosage.',
    },
    {
      date: '2024-01-15',
      doctor: 'Dr. James Wilson',
      diagnosis: 'Annual Physical Examination',
      prescriptions: [],
      labResults: [
        {
          test: 'Complete Blood Count',
          result: 'Normal',
          status: 'Normal',
        },
        { test: 'Blood Sugar', result: '95 mg/dL', status: 'Normal' },
      ],
      notes: 'All vital signs within normal range. Patient in good health.',
    },
  ];

  radiologyImages: RadiologyImage[] = [
    {
      date: '2024-02-15',
      type: 'Chest X-Ray',
      radiologist: 'Dr. Sarah Park',
      findings: 'No acute abnormalities detected',
      status: 'Completed',
    },
    {
      date: '2024-01-20',
      type: 'CT Scan - Abdomen',
      radiologist: 'Dr. Michael Lee',
      findings: 'Normal abdominal anatomy',
      status: 'Completed',
    },
  ];

  get filteredPatients(): Patient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.patients;
    }

    return this.patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.id.toLowerCase().includes(term),
    );
  }

  get allPrescriptions(): Array<{
    prescription: string;
    doctor: string;
    date: string;
  }> {
    return this.ehrRecords.flatMap((record) =>
      record.prescriptions.map((prescription) => ({
        prescription,
        doctor: record.doctor,
        date: record.date,
      })),
    );
  }

  get allLabResults(): Array<{
    test: string;
    result: string;
    status: LabResult['status'];
    date: string;
  }> {
    return this.ehrRecords.flatMap((record) =>
      record.labResults.map((lab) => ({
        test: lab.test,
        result: lab.result,
        status: lab.status,
        date: record.date,
      })),
    );
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
  }

  openNewRecordDialog(): void {
    const dialogRef = this.dialog.open(EhrRecordDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: {
        patients: this.patients,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.saveRecord(result);
    });
  }

  saveRecord(payload: CreateEhrRecordPayload): void {
    this.ehrRecords = [
      {
        date: new Date().toISOString().slice(0, 10),
        doctor: 'Dr. Assigned',
        diagnosis: payload.diagnosis.trim(),
        prescriptions: payload.treatment
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        labResults: [],
        notes: payload.doctorNotes.trim() || payload.symptoms.trim(),
      },
      ...this.ehrRecords,
    ];

    this.selectedPatient =
      this.patients.find((patient) => patient.id === payload.patientId) ??
      this.selectedPatient;
  }

  getLabStatusClass(status: LabResult['status']): string {
    return status === 'Normal'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
