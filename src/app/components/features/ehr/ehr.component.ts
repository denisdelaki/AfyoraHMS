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

  async downloadPatientRecordPdf(): Promise<void> {
    if (!this.selectedPatient) {
      return;
    }

    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40;
    const pageWidth = document.internal.pageSize.getWidth();
    const pageHeight = document.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (spaceNeeded = 24): void => {
      if (y + spaceNeeded <= pageHeight - margin) {
        return;
      }

      document.addPage();
      y = margin;
    };

    const writeWrapped = (
      text: string,
      fontSize = 11,
      lineGap = 15,
      isBold = false,
    ): void => {
      ensureSpace(lineGap * 2);
      document.setFont('helvetica', isBold ? 'bold' : 'normal');
      document.setFontSize(fontSize);
      const lines = document.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        ensureSpace(lineGap);
        document.text(line, margin, y);
        y += lineGap;
      });
    };

    writeWrapped('Electronic Health Record', 18, 22, true);
    writeWrapped(
      `${this.selectedPatient.name} (${this.selectedPatient.id}) • ${this.selectedPatient.age}y • ${this.selectedPatient.gender}`,
      11,
      16,
    );
    writeWrapped(`Generated: ${new Date().toLocaleString()}`, 10, 16);
    y += 8;

    writeWrapped('Medical Records', 14, 18, true);
    this.ehrRecords.forEach((record, recordIndex) => {
      y += 4;
      writeWrapped(
        `${recordIndex + 1}. ${record.diagnosis} (${record.date}) - ${record.doctor}`,
        11,
        16,
        true,
      );

      if (record.prescriptions.length > 0) {
        writeWrapped('Prescriptions:', 11, 15, true);
        record.prescriptions.forEach((prescription) => {
          writeWrapped(`• ${prescription}`, 10, 14);
        });
      }

      if (record.labResults.length > 0) {
        writeWrapped('Lab Results:', 11, 15, true);
        record.labResults.forEach((result) => {
          writeWrapped(
            `• ${result.test}: ${result.result} (${result.status})`,
            10,
            14,
          );
        });
      }

      writeWrapped(`Doctor's Notes: ${record.notes}`, 10, 14);
    });

    y += 6;
    writeWrapped('Radiology', 14, 18, true);
    this.radiologyImages.forEach((image) => {
      writeWrapped(
        `• ${image.type} (${image.date}) - ${image.radiologist} | ${image.status}`,
        10,
        14,
      );
      writeWrapped(`  Findings: ${image.findings}`, 10, 14);
    });

    const fileBaseName = `${this.selectedPatient.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const fileName = `${fileBaseName || 'patient'}-${this.selectedPatient.id}-ehr.pdf`;

    document.save(fileName);
  }

  printPatientRecord(): void {
    if (!this.selectedPatient) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(this.buildPrintableRecordHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
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

  private buildPrintableRecordHtml(): string {
    if (!this.selectedPatient) {
      return '';
    }

    const recordsHtml = this.ehrRecords
      .map(
        (record) => `
          <section class="record">
            <h3>${this.escapeHtml(record.diagnosis)}</h3>
            <p class="meta">${this.escapeHtml(record.date)} • ${this.escapeHtml(record.doctor)}</p>
            ${
              record.prescriptions.length
                ? `<p><strong>Prescriptions:</strong></p><ul>${record.prescriptions
                    .map(
                      (prescription) =>
                        `<li>${this.escapeHtml(prescription)}</li>`,
                    )
                    .join('')}</ul>`
                : ''
            }
            ${
              record.labResults.length
                ? `<p><strong>Lab Results:</strong></p><ul>${record.labResults
                    .map(
                      (result) =>
                        `<li>${this.escapeHtml(result.test)}: ${this.escapeHtml(result.result)} (${this.escapeHtml(result.status)})</li>`,
                    )
                    .join('')}</ul>`
                : ''
            }
            <p><strong>Doctor's Notes:</strong> ${this.escapeHtml(record.notes)}</p>
          </section>
        `,
      )
      .join('');

    const radiologyHtml = this.radiologyImages
      .map(
        (image) => `
          <li>
            <strong>${this.escapeHtml(image.type)}</strong> (${this.escapeHtml(image.date)}) - ${this.escapeHtml(image.radiologist)} [${this.escapeHtml(image.status)}]<br/>
            Findings: ${this.escapeHtml(image.findings)}
          </li>
        `,
      )
      .join('');

    return `
      <!doctype html>
      <html>
        <head>
          <title>EHR - ${this.escapeHtml(this.selectedPatient.name)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            h2 { margin: 20px 0 10px; font-size: 18px; }
            h3 { margin: 0 0 4px; font-size: 16px; }
            .subtitle { margin: 0 0 18px; color: #4b5563; }
            .record { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
            .meta { margin: 0 0 10px; color: #6b7280; font-size: 13px; }
            ul { margin: 8px 0 10px 20px; }
            p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>Electronic Health Record</h1>
          <p class="subtitle">
            ${this.escapeHtml(this.selectedPatient.name)} (${this.escapeHtml(this.selectedPatient.id)}) •
            ${this.selectedPatient.age}y • ${this.escapeHtml(this.selectedPatient.gender)}
          </p>

          <h2>Medical Records</h2>
          ${recordsHtml}

          <h2>Radiology</h2>
          <ul>${radiologyHtml}</ul>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
