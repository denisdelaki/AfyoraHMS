import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin, map } from 'rxjs';
import {
  CreateEhrRecordPayload,
  EhrRecordDialogComponent,
} from '../../dialogs/ehr-record-dialog/ehr-record-dialog.component';
import {
  CreateEhrRecordRequest,
  EhrLabResult,
  EhrPatient,
  EhrRecord,
  RadiologyImage,
} from '../../../models';
import { Prescription } from '../../../models/pharmacy.models';
import {
  RadiologyReport,
  UploadedRadiologyImage,
} from '../../../models/radiology.models';
import {
  EhrService,
  PatientsService,
  RadiologyService,
  LaboratoryService,
} from '../../../services';

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
export class EhrComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly ehrService = inject(EhrService);
  private readonly patientService = inject(PatientsService);
  private readonly radiologyService = inject(RadiologyService);
  private readonly laboratoryService = inject(LaboratoryService);
  facilityId: string | number = '';

  searchTerm = '';
  selectedPatient: EhrPatient | null = null;

  patients: EhrPatient[] = [];
  patientLabResults: EhrLabResult[] = [];
  patientPrescriptions: Prescription[] = [];
  patientRadiologyReports: (RadiologyReport & {
    images?: UploadedRadiologyImage[];
  })[] = [];
  selectedImagePreview: UploadedRadiologyImage | null = null;

  ehrRecords: EhrRecord[] = [];

  /** Stores visit history keyed by patient ID so records are never overwritten */
  private visitHistoryMap = new Map<string, EhrRecord[]>();

  // radiologyImages: RadiologyImage[] = [
  //   {
  //     id: 'RAD-001',
  //     patientId: 'P001',
  //     date: '2024-02-15',
  //     type: 'Chest X-Ray',
  //     radiologist: 'Dr. Sarah Park',
  //     findings: 'No acute abnormalities detected',
  //     status: 'Completed',
  //   },
  //   {
  //     id: 'RAD-002',
  //     patientId: 'P001',
  //     date: '2024-01-20',
  //     type: 'CT Scan - Abdomen',
  //     radiologist: 'Dr. Michael Lee',
  //     findings: ' Normal abdominal anatomy',
  //     status: 'Completed',
  //   },
  // ];

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    // this.ehrService.getPatients().subscribe({
    //   next: ({ data }) => {
    //     this.patients = data;
    //   },
    //   error: () => {},
    // });
    this.getPatientsRecords();
  }

  private getPatientsRecords(): void {
    this.patientService.getPatients(this.facilityId).subscribe({
      next: (data) => {
        this.patients = data.map((patient) => ({
          id: patient.id,
          name: patient.firstName + ' ' + patient.lastName,
          age: patient.age,
          gender: patient.gender,
        }));

        if (this.patients.length > 0) {
          this.patients.forEach((patient) => {
            this.loadPatientsVisitHistory(patient.id);
            this.loadPatientRadiology(patient.id);
            this.loadPatientLabResults(patient.id);
          });
        }
      },
      error: () => { },
    });
  }

  private loadPatientsVisitHistory(patientId: string): void {
    this.patientService
      .getPatientVisitHistory(patientId, this.facilityId)
      .subscribe({
        next: (data) => {
          console.log('Visit History for', patientId, ':', data);
          const records: EhrRecord[] = data.map((record) => ({
            id: record.id || '',
            patientId: patientId,
            date: record.date,
            doctor: record.doctor,
            diagnosis: record.diagnosis,
            prescriptions: record.prescriptions ?? [],
            labResults: [],
            notes: record.whatHappened,
          }));
          // Store in the map — never overwrite other patients' records
          this.visitHistoryMap.set(patientId, records);
          // If this is the currently selected patient, update the view
          if (this.selectedPatient?.id === patientId) {
            this.ehrRecords = records;
            this.patientPrescriptions = records.flatMap((r) => r.prescriptions);
          }
        },
        error: () => { },
      });
  }

  private loadPatientLabResults(patientId: string): void {
    this.laboratoryService.getResults().subscribe({
      next: (data: any) => {
        this.patientLabResults = data
          .filter((labResult: any) => labResult.patient === patientId)
          .map((labResult: any) => ({
            id: labResult.id || '',
            patientId: patientId,
            date: labResult.completedDate,
            test: labResult.test,
            result: labResult.result,
            status: labResult.status,
            parameters: labResult.parameters,
          }));
      },
      error: () => { },
    });
  }

  get filteredPatients(): EhrPatient[] {
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
    prescription: Prescription;
    doctor: string;
    date: string;
  }> {
    return (this.ehrRecords ?? []).flatMap((record) =>
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
    status: EhrLabResult['status'];
    date: string;
  }> {
    return (this.ehrRecords ?? []).flatMap((record) =>
      record.labResults.map((lab) => ({
        test: lab.test,
        result: lab.result,
        status: lab.status,
        date: record.date,
      })),
    );
  }

  selectPatient(patient: EhrPatient): void {
    this.selectedPatient = patient;
    // Load visit history from the cached map; re-fetch if not yet loaded
    const cached = this.visitHistoryMap.get(patient.id);
    if (cached) {
      this.ehrRecords = cached;
      this.patientPrescriptions = cached.flatMap((r) => r.prescriptions);
    } else {
      this.ehrRecords = [];
      this.patientPrescriptions = [];
      this.loadPatientsVisitHistory(patient.id);
    }
    this.loadPatientLabResults(patient.id);
    this.loadPatientRadiology(patient.id);
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
    writeWrapped('Prescriptions', 14, 18, true);
    if (this.patientPrescriptions.length === 0) {
      writeWrapped('No prescriptions found for this patient.', 10, 14);
    } else {
      this.patientPrescriptions.forEach((item, index) => {
        writeWrapped(
          `${index + 1}. ${item.drugs.map((d) => `${d.name} ${d.dosage}`).join(', ')} — ${item.date}`,
          11,
          15,
          true,
        );
        writeWrapped(`   Prescribed by: ${item.doctorId}`, 10, 14);
        item.drugs.forEach((d) => {
          writeWrapped(
            `   • ${d.name} — Dosage: ${d.dosage}, Quantity: ${d.quantity}`,
            10,
            14,
          );
        });
        y += 4;
      });
    }

    y += 6;
    writeWrapped('Lab Results', 14, 18, true);
    if (this.patientLabResults.length === 0) {
      writeWrapped('No lab results found for this patient.', 10, 14);
    } else {
      this.patientLabResults.forEach((lab, index) => {
        writeWrapped(
          `${index + 1}. ${lab.test} (${lab.date}) - ${lab.status}`,
          11,
          15,
          true,
        );
        writeWrapped(`   Result: ${lab.result}`, 10, 14);
        (lab.parameters ?? []).forEach((param: any) => {
          writeWrapped(
            `   • ${param.name}: ${param.value} ${param.unit} (Range: ${param.range}) - ${param.status}`,
            10,
            14,
          );
        });
        y += 4;
      });
    }
    writeWrapped('Radiology Reports', 14, 18, true);
    if (this.patientRadiologyReports.length === 0) {
      writeWrapped('No radiology reports found for this patient.', 10, 14);
    } else {
      this.patientRadiologyReports.forEach((report, index) => {
        writeWrapped(
          `${index + 1}. ${report.type} (${report.scanDate || ''}) - ${report.radiologist || ''} [${report.status || ''}]`,
          11,
          15,
          true,
        );
        if (report.orderId) {
          writeWrapped(`   Order ID: ${report.orderId}`, 10, 14);
        }
        writeWrapped(`   Findings: ${report.findings || 'None'}`, 10, 14);
        if (report.impression) {
          writeWrapped(`   Impression: ${report.impression}`, 10, 14);
        }
        if (report.recommendations) {
          writeWrapped(`   Recommendations: ${report.recommendations}`, 10, 14);
        }
        y += 4;
      });
    }

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
    const requestPayload: CreateEhrRecordRequest = {
      patientId: payload.patientId,
      diagnosis: payload.diagnosis,
      symptoms: payload.symptoms,
      treatment: payload.treatment,
      doctorNotes: payload.doctorNotes,
    };

    this.ehrService.createRecord(requestPayload).subscribe({
      next: ({ data }) => {
        this.ehrRecords = [
          data,
          ...this.ehrRecords.filter((entry) => entry.id !== data.id),
        ];
        this.selectedPatient =
          this.patients.find((patient) => patient.id === payload.patientId) ??
          this.selectedPatient;
      },
      error: () => {
        this.saveRecordLocally(payload);
      },
    });
  }

  getLabStatusClass(status: EhrLabResult['status']): string {
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
          <p><strong>Doctor's Notes:</strong> ${this.escapeHtml(record.notes)}</p>
        </section>
      `,
      )
      .join('');

    const prescriptionsHtml = this.patientPrescriptions.length
      ? this.patientPrescriptions
        .map(
          (item) => `
          <div class="record">
            <h3>${this.escapeHtml(item.drugs.map((d) => `${d.name} ${d.dosage}`).join(', '))}</h3>
            <p class="meta">Prescribed by ${this.escapeHtml(item.doctorId)} on ${this.escapeHtml(item.date)}</p>
            <ul>
              ${item.drugs
              .map(
                (d) =>
                  `<li>${this.escapeHtml(d.name)} — Dosage: ${this.escapeHtml(d.dosage)}, Quantity: ${this.escapeHtml(d.quantity?.toString())}</li>`,
              )
              .join('')}
            </ul>
            <span class="badge badge-active">Active</span>
          </div>
        `,
        )
        .join('')
      : '<p>No prescriptions found for this patient.</p>';

    const labResultsHtml = this.patientLabResults.length
      ? this.patientLabResults
        .map((lab) => {
          const paramsRows = (lab.parameters ?? [])
            .map(
              (param: any) => `
              <tr>
                <td>${this.escapeHtml(param.name)}</td>
                <td><strong>${this.escapeHtml(param.value)}</strong></td>
                <td>${this.escapeHtml(param.unit)}</td>
                <td>${this.escapeHtml(param.range)}</td>
                <td><span class="badge ${param.status === 'Normal' ? 'badge-normal' : 'badge-abnormal'}">${this.escapeHtml(param.status)}</span></td>
              </tr>
            `,
            )
            .join('');

          return `
          <div class="record">
            <div class="flex-between">
              <h3>${this.escapeHtml(lab.test)}</h3>
              <span class="badge ${lab.status === 'Normal' ? 'badge-normal' : 'badge-abnormal'}">${this.escapeHtml(lab.status)}</span>
            </div>
            <p class="meta">Date: ${this.escapeHtml(lab.date)} • Result: ${this.escapeHtml(lab.result)}</p>
            ${paramsRows
              ? `<table class="lab-table">
                    <thead>
                      <tr>
                        <th>Parameter</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>${paramsRows}</tbody>
                  </table>`
              : ''
            }
          </div>
        `;
        })
        .join('')
      : '<p>No lab results found for this patient.</p>';

    const radiologyHtml = this.patientRadiologyReports.length
      ? this.patientRadiologyReports
        .map(
          (report) => `
            <div class="record">
              <h3>${this.escapeHtml(report.type)} - ${this.escapeHtml(report.status)}</h3>
              <p class="meta">Order ID: ${this.escapeHtml(report.orderId)} • Scan Date: ${this.escapeHtml(report.scanDate)} • Radiologist: ${this.escapeHtml(report.radiologist)}</p>
              <p><strong>Findings:</strong> ${this.escapeHtml(report.findings)}</p>
              ${report.impression ? `<p><strong>Impression:</strong> ${this.escapeHtml(report.impression)}</p>` : ''}
              ${report.recommendations ? `<p><strong>Recommendations:</strong> ${this.escapeHtml(report.recommendations)}</p>` : ''}
            </div>
          `,
        )
        .join('')
      : '<p>No radiology reports found for this patient.</p>';

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
          .flex-between { display: flex; align-items: center; justify-content: space-between; }
          .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 9999px; }
          .badge-active { background: #dbeafe; color: #1e40af; }
          .badge-normal { background: #d1fae5; color: #065f46; }
          .badge-abnormal { background: #fee2e2; color: #991b1b; }
          .lab-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          .lab-table th { text-align: left; background: #f8fafc; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; color: #475569; }
          .lab-table td { padding: 6px 8px; border-top: 1px solid #f1f5f9; }
          @media print { .record { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h1>Electronic Health Record</h1>
        <p class="subtitle">
          ${this.escapeHtml(this.selectedPatient.name)} (${this.escapeHtml(this.selectedPatient.id)}) •
          ${this.selectedPatient.age}y • ${this.escapeHtml(this.selectedPatient.gender)}
        </p>

        <h2>Medical Records</h2>
        ${recordsHtml || '<p>No medical records found for this patient.</p>'}

        <h2>Prescriptions</h2>
        ${prescriptionsHtml}

        <h2>Lab Results</h2>
        ${labResultsHtml}

        <h2>Radiology Reports</h2>
        ${radiologyHtml}
      </body>
    </html>
  `;
  }

  private escapeHtml(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private saveRecordLocally(payload: CreateEhrRecordPayload): void {
    this.ehrRecords = [
      {
        id: `EHR-${Date.now()}`,
        patientId: payload.patientId,
        date: new Date().toISOString().slice(0, 10),
        doctor: 'Dr. Assigned',
        diagnosis: payload.diagnosis.trim(),
        prescriptions: payload.prescriptions,
        labResults: [],
        notes: payload.doctorNotes.trim() || payload.symptoms.trim(),
      },
      ...this.ehrRecords,
    ];

    this.selectedPatient =
      this.patients.find((patient) => patient.id === payload.patientId) ??
      this.selectedPatient;
  }

  private loadPatientRecords(
    patientId: string,
    facilityId: string | number,
  ): void {
    this.ehrService.getPatientRecords(patientId, facilityId).subscribe({
      next: ({ data }) => {
        this.ehrRecords = data ?? [];
      },
      error: () => { },
    });
  }

  private loadPatientRadiology(patientId: string): void {
    this.radiologyService.getReports(this.facilityId).subscribe({
      next: (reports) => {
        const selectedName =
          this.selectedPatient?.name?.toLowerCase().trim() || '';
        const selectedId = (
          this.selectedPatient?.id || patientId
        ).toLowerCase();

        const patientReports = reports.filter((r) => {
          const reportPatientId = (
            r.patient ||
            (r as any).patient_id ||
            ''
          ).toLowerCase();
          const reportPatientName = (r.patient || '').toLowerCase();
          return (
            (reportPatientId && reportPatientId === selectedId) ||
            (selectedName && reportPatientName.includes(selectedName)) ||
            (r.orderId && r.orderId.toLowerCase().includes(selectedId))
          );
        });

        if (patientReports.length === 0) {
          this.patientRadiologyReports = [];
          return;
        }

        const reportsWithImages$ = patientReports.map((report) =>
          this.radiologyService
            .getUploadedImages(this.facilityId, report.orderId)
            .pipe(map((images) => ({ ...report, images }))),
        );

        forkJoin(reportsWithImages$).subscribe({
          next: (fullReports) => {
            this.patientRadiologyReports = fullReports;
          },
          error: (err) => {
            console.error('Error attaching images to radiology report:', err);
            this.patientRadiologyReports = patientReports.map((r) => ({
              ...r,
              images: [],
            }));
          },
        });
      },
      error: (err) => {
        console.error('Failed to load radiology reports for EHR:', err);
        this.patientRadiologyReports = [];
      },
    });
  }

  openImagePreview(image: UploadedRadiologyImage): void {
    this.selectedImagePreview = image;
  }

  closeImagePreview(): void {
    this.selectedImagePreview = null;
  }
}
