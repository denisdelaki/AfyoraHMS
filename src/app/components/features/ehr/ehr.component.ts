import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import {
  CreateEhrRecordPayload,
  EhrRecordDialogComponent,
} from '../../dialogs/ehr-record-dialog/ehr-record-dialog.component';
import {
  AllergyItem,
  CdsAlert,
  CpoeOrder,
  CpoeOrderType,
  CreateEhrRecordRequest,
  EhrLabResult,
  EhrPatient,
  EhrRecord,
  GrowthChartData,
  MchEncounterData,
  PatientVitals,
  ProblemItem,
  RadiologyImage,
  VitalSignsRecord,
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
  CdsService,
  HieService,
} from '../../../services';
import { FhirBundleSummary } from '../../../models/interoperability.models';
import { VitalsSummaryCardComponent } from '../../shared/vitals-summary-card/vitals-summary-card.component';
import { VitalsEntryDialogComponent } from '../../dialogs/vitals-entry-dialog/vitals-entry-dialog.component';

type EhrPrintSectionKey =
  | 'visits'
  | 'problems'
  | 'allergies'
  | 'orders'
  | 'vitals'
  | 'labs'
  | 'radiology'
  | 'alerts'
  | 'hie';

type EhrPrintSection = {
  key: EhrPrintSectionKey;
  label: string;
  selected: boolean;
};

@Component({
  selector: 'app-ehr',
  standalone: true,
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
    MatSnackBarModule,
    MatSelectModule,
    VitalsSummaryCardComponent,
  ],
  templateUrl: './ehr.component.html',
  styleUrl: './ehr.component.css',
})
export class EhrComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly ehrService = inject(EhrService);
  private readonly patientService = inject(PatientsService);
  private readonly radiologyService = inject(RadiologyService);
  private readonly laboratoryService = inject(LaboratoryService);
  private readonly cdsService = inject(CdsService);
  private readonly hieService = inject(HieService);
  private readonly snackBar = inject(MatSnackBar);

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
  showPrintOptions = false;
  showPdfPreview = false;
  previewPdfUrl: SafeResourceUrl | null = null;
  private previewObjectUrl: string | null = null;
  @ViewChild('ehrPdfPreviewFrame')
  private ehrPdfPreviewFrame?: ElementRef<HTMLIFrameElement>;
  selectedVisitIndexes: number[] = [];
  printSections: EhrPrintSection[] = [
    { key: 'visits', label: 'Clinical visits and notes', selected: true },
    { key: 'problems', label: 'Problem list and diagnoses', selected: true },
    { key: 'allergies', label: 'Allergies', selected: true },
    { key: 'orders', label: 'CPOE orders', selected: true },
    { key: 'vitals', label: 'Vitals and growth charts', selected: true },
    { key: 'labs', label: 'Laboratory results', selected: true },
    { key: 'radiology', label: 'Radiology reports', selected: true },
    { key: 'alerts', label: 'Clinical decision support alerts', selected: true },
    { key: 'hie', label: 'Kenya HIE clinical summary', selected: true },
  ];

  ehrRecords: EhrRecord[] = [];

  // Problem List & Allergies
  patientProblems: ProblemItem[] = [];
  patientAllergies: AllergyItem[] = [];
  patientCpoeOrders: CpoeOrder[] = [];
  patientVitals: VitalSignsRecord | null = null;
  patientGrowthChart: GrowthChartData | null = null;
  patientMchEncounter: MchEncounterData | null = null;
  cdsAlerts: CdsAlert[] = [];
  fhirSummary: FhirBundleSummary | null = null;

  // CPOE Modal State
  showCpoeModal = false;
  newOrder: Partial<CpoeOrder> = {
    orderType: 'Medications',
    title: '',
    instructions: '',
    billingAmount: 500,
  };

  cpoeTypes: CpoeOrderType[] = [
    'Medications',
    'Dispensing',
    'Laboratory',
    'Radiology',
    'Physiotherapy',
    'Occupational Therapy',
    'Nutrition/Dietetics',
    'Social Work',
    'Counselling',
    'Family History',
    'Vital Signs',
    'BMI/Growth Charts',
    'Billing',
    'MCH Encounter',
  ];

  // Problem Form
  showProblemModal = false;
  newProblem: Partial<ProblemItem> = {
    system: 'ICD-10-WHO',
    code: 'I10',
    display: 'Essential hypertension',
    status: 'Active',
    onsetDate: new Date().toISOString().split('T')[0],
  };

  // Allergy Form
  showAllergyModal = false;
  newAllergy: Partial<AllergyItem> = {
    allergenName: 'Penicillin',
    allergyType: 'Medication',
    severity: 'Severe',
    reaction: 'Anaphylactic rash & shortness of breath',
  };

  /** Stores visit history keyed by patient ID so records are never overwritten */
  private visitHistoryMap = new Map<string, EhrRecord[]>();

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.getPatientsRecords();
  }

  ngOnDestroy(): void {
    this.clearPdfPreviewUrl();
  }

  get filteredPatients(): EhrPatient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.patients;
    return this.patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.nationalId && p.nationalId.toLowerCase().includes(term)),
    );
  }

  selectPatient(patient: EhrPatient): void {
    this.selectedPatient = patient;
    this.ehrRecords = this.visitHistoryMap.get(patient.id) || [];
    this.loadPatientLabResults(patient.id);
    this.loadPatientRadiology(patient.id);
    this.loadPatientClinicalDetails(patient);
  }

  private getPatientsRecords(): void {
    this.patientService.getPatients(this.facilityId).subscribe({
      next: (data) => {
        this.patients = data.map((patient) => ({
          id: patient.id,
          name: patient.firstName + ' ' + patient.lastName,
          age: patient.age,
          gender: patient.gender,
          nationalId: patient.nationalId,
          dob: patient.dob,
        }));

        if (this.patients.length > 0) {
          const requestedPatientId =
            this.route.snapshot.queryParamMap.get('patientId');
          const requestedPatient = requestedPatientId
            ? this.patients.find((patient) => patient.id === requestedPatientId)
            : this.patients[0];
          if (requestedPatient) this.selectPatient(requestedPatient);
          this.patients.forEach((patient) => {
            this.loadPatientsVisitHistory(patient.id);
          });
        }
      },
      error: () => {},
    });
  }

  private loadPatientsVisitHistory(patientId: string): void {
    this.patientService
      .getPatientVisitHistory(patientId, this.facilityId)
      .subscribe({
        next: (data) => {
          const records: EhrRecord[] = data.map((record) => ({
            id: record.id || '',
            patientId: patientId,
            date: record.date,
            doctor: record.doctor,
            diagnosis: record.diagnosis,
            diagnosisCode: record.diagnosisCode || 'B54',
            diagnosisSystem: record.diagnosisSystem || 'ICD-10-WHO',
            prescriptions: record.prescriptions ?? [],
            labResults: [],
            vitals: record.vitals,
            notes: record.whatHappened,
          }));
          this.visitHistoryMap.set(patientId, records);
          if (this.selectedPatient?.id === patientId) {
            this.ehrRecords = records;
          }
        },
        error: () => {},
      });
  }

  private loadPatientLabResults(patientId: string): void {
    this.laboratoryService.getRequests().subscribe({
      next: (orders: any[]) => {
        const selectedId = patientId.toLowerCase();
        const patientOrders = (orders || []).filter(
          (o: any) =>
            (o.patientId && o.patientId.toLowerCase() === selectedId) ||
            (this.selectedPatient?.name &&
              o.patient &&
              typeof o.patient === 'string' &&
              o.patient
                .toLowerCase()
                .includes(this.selectedPatient.name.toLowerCase())),
        );

        this.patientLabResults = patientOrders.map((order: any) => ({
          id: order.id || 'LAB-01',
          patientId: patientId,
          date: order.orderDate || new Date().toISOString().split('T')[0],
          test:
            typeof order.test === 'string'
              ? order.test
              : order.test?.name || 'Complete Blood Count',
          loincCode: '2093-3',
          result: 'Normal reference range',
          status: (order.status === 'Completed' ? 'Normal' : 'Abnormal') as any,
          parameters: [],
        }));
      },
      error: () => {
        this.patientLabResults = [];
      },
    });
  }

  vitalsHistory: PatientVitals[] = [];

  private loadPatientClinicalDetails(patient: EhrPatient): void {
    this.loadPatientProblems(patient.id);
    this.loadPatientAllergies(patient.id);
    this.loadPatientCpoeOrders(patient.id);
    this.loadPatientVitals(patient.id);

    if (patient.age < 12) {
      this.patientGrowthChart = {
        patientId: patient.id,
        ageMonths: patient.age * 12,
        heightCm: 115,
        weightKg: 20,
        heightPercentile: 65,
        weightPercentile: 58,
        whoClassification: 'Normal',
      };
    } else {
      this.patientGrowthChart = null;
    }

    this.patientMchEncounter = {
      id: 'MCH-01',
      patientId: patient.id,
      encounterType: 'ANC',
      date: '2026-09-02',
      gestationalAgeWeeks: 28,
      fundalHeightCm: 27,
      fetalHeartRateBpm: 142,
      clinicianNotes: 'Normal singleton pregnancy. Fetal movement present.',
    };

    // Generate Kenya HIE FHIR IPS Bundle
    this.hieService
      .generateFhirPatientBundle(this.facilityId, patient, this.ehrRecords[0])
      .subscribe((bundle) => (this.fhirSummary = bundle));
  }

  private loadPatientProblems(patientId: string): void {
    this.ehrService.getProblems(this.facilityId, patientId).subscribe({
      next: (problems) => {
        this.patientProblems = problems;
        this.runCdsEvaluation();
      },
      error: () => {
        this.patientProblems = [];
      },
    });
  }

  private loadPatientAllergies(patientId: string): void {
    this.ehrService.getAllergies(this.facilityId, patientId).subscribe({
      next: (allergies) => {
        this.patientAllergies = allergies;
        this.runCdsEvaluation();
      },
      error: () => {
        this.patientAllergies = [];
      },
    });
  }

  private loadPatientCpoeOrders(patientId: string): void {
    this.ehrService.getCpoeOrders(this.facilityId, patientId).subscribe({
      next: (orders) => {
        this.patientCpoeOrders = orders;
      },
      error: () => {
        this.patientCpoeOrders = [];
      },
    });
  }

  private runCdsEvaluation(): void {
    if (!this.selectedPatient) return;
    const sampleRx: Prescription[] = [
      {
        id: 'RX-1',
        patientId: this.selectedPatient.id,
        doctorId: 'EMP001',
        drugs: [
          {
            id: 'D-1',
            name: 'Amoxicillin 500mg',
            quantity: 21,
            dosage: '500mg',
          },
        ],
        medication: 'Amoxicillin 500mg',
        dosage: '500mg',
        frequency: 'TDS',
        duration: '7 days',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      },
    ];
    this.cdsAlerts = this.cdsService.evaluatePatientAlerts({
      age: this.selectedPatient.age,
      gender: this.selectedPatient.gender,
      allergies: this.patientAllergies,
      problems: this.patientProblems,
      prescriptions: sampleRx,
      vitals: this.patientVitals ?? undefined,
    });
  }

  // CPOE Actions
  openCpoeModal(type: CpoeOrderType = 'Medications'): void {
    this.newOrder = {
      orderType: type,
      title: `${type} Order`,
      instructions: '',
      billingAmount: 750,
    };
    this.showCpoeModal = true;
  }

  closeCpoeModal(): void {
    this.showCpoeModal = false;
  }

  submitCpoeOrder(): void {
    if (!this.selectedPatient || !this.newOrder.title) return;
    const payload: Partial<CpoeOrder> = {
      patientId: this.selectedPatient.id,
      orderType: this.newOrder.orderType || 'Medications',
      title: this.newOrder.title || 'Clinical Order',
      instructions: this.newOrder.instructions || 'Standard protocol',
      orderedBy: 'Dr. Jane Muthoni',
      billingAmount: this.newOrder.billingAmount || 500,
    };
    this.ehrService.createCpoeOrder(this.facilityId, payload).subscribe({
      next: (createdOrder) => {
        this.patientCpoeOrders.unshift(createdOrder);
        this.showCpoeModal = false;
        this.snackBar.open(
          `CPOE ORDER CREATED: ${createdOrder.orderType} order submitted!`,
          'OK',
          {
            duration: 3500,
          },
        );
      },
      error: () => {
        this.snackBar.open(
          'Failed to create CPOE order. Please try again.',
          'OK',
          { duration: 3500 },
        );
      },
    });
  }

  // Problem List Actions
  openProblemModal(): void {
    this.showProblemModal = true;
  }

  closeProblemModal(): void {
    this.showProblemModal = false;
  }

  submitProblem(): void {
    if (!this.selectedPatient || !this.newProblem.display) return;
    const payload: Partial<ProblemItem> = {
      patientId: this.selectedPatient.id,
      code: this.newProblem.code || 'B54',
      system: this.newProblem.system || 'KNHTS',
      display: this.newProblem.display,
      status: (this.newProblem.status as any) || 'Active',
      onsetDate:
        this.newProblem.onsetDate || new Date().toISOString().split('T')[0],
      notes: this.newProblem.notes || 'Recorded in CPOE session.',
      recordedBy: 'Attending Clinician',
    };
    this.ehrService.createProblem(this.facilityId, payload).subscribe({
      next: (problem) => {
        this.patientProblems.unshift(problem);
        this.showProblemModal = false;
        this.runCdsEvaluation();
        this.snackBar.open(
          `PROBLEM LIST UPDATED: Coded diagnosis added.`,
          'OK',
          { duration: 3000 },
        );
      },
      error: () => {
        this.snackBar.open(
          'Failed to record problem. Please try again.',
          'OK',
          { duration: 3500 },
        );
      },
    });
  }

  // Allergy Actions
  openAllergyModal(): void {
    this.showAllergyModal = true;
  }

  closeAllergyModal(): void {
    this.showAllergyModal = false;
  }

  submitAllergy(): void {
    if (!this.selectedPatient || !this.newAllergy.allergenName) return;
    const payload: Partial<AllergyItem> = {
      patientId: this.selectedPatient.id,
      allergenName: this.newAllergy.allergenName,
      allergyType: (this.newAllergy.allergyType as any) || 'Medication',
      severity: (this.newAllergy.severity as any) || 'Moderate',
      reaction: this.newAllergy.reaction || 'Adverse cutaneous reaction',
      onsetDate: new Date().toISOString().split('T')[0],
    };
    this.ehrService.createAllergy(this.facilityId, payload).subscribe({
      next: (allergy) => {
        this.patientAllergies.unshift(allergy);
        this.showAllergyModal = false;
        // Re-trigger CDS drug-allergy cross check
        this.runCdsEvaluation();
        this.snackBar.open(`ALLERGY REGISTERED & CDS UPDATED!`, 'OK', {
          duration: 3000,
        });
      },
      error: () => {
        this.snackBar.open(
          'Failed to register allergy. Please try again.',
          'OK',
          { duration: 3500 },
        );
      },
    });
  }

  openVitalsEntryModal(): void {
    if (!this.selectedPatient) return;
    const dialogRef = this.dialog.open(VitalsEntryDialogComponent, {
      width: '90vw',
      maxWidth: '650px',
      data: {
        patientId: this.selectedPatient.id,
        patientName: this.selectedPatient.name,
        facilityId: this.facilityId,
      },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loadPatientVitals(this.selectedPatient!.id);
      }
    });
  }

  private loadPatientVitals(patientId: string): void {
    if (!patientId || !this.facilityId) return;
    this.patientService.getPatientVitals(this.facilityId, patientId).subscribe({
      next: (vitalsList) => {
        this.vitalsHistory = vitalsList;
        if (vitalsList.length > 0) {
          const latest = vitalsList[0];
          this.patientVitals = {
            ...latest,
            bloodPressureSystolic: latest.systolicBp,
            bloodPressureDiastolic: latest.diastolicBp,
            pulseRateBpm: latest.heartRateBpm,
            oxygenSaturationSpO2: latest.spo2Percent,
            recordedBy: latest.capturedByName || 'Nurse',
          };
          this.runCdsEvaluation();
        }
      },
      error: () => {},
    });
  }

  openNewRecordDialog(): void {
    if (!this.selectedPatient) return;
    const dialogRef = this.dialog.open(EhrRecordDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: { patient: this.selectedPatient },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: CreateEhrRecordPayload | undefined) => {
        if (!result) return;
        const newRec: EhrRecord = {
          id: `EHR-${Date.now()}`,
          patientId: this.selectedPatient!.id,
          date: new Date().toISOString().split('T')[0],
          doctor: 'Dr. Jane Muthoni',
          diagnosis: result.diagnosis,
          diagnosisCode: result.diagnosisCode || 'B54',
          diagnosisSystem: result.diagnosisSystem || 'KNHTS',
          diagnosisText: result.diagnosisText || result.diagnosis,
          prescriptions: [],
          labResults: [],
          vitals: result.vitals,
          notes: result.doctorNotes,
        };
        this.ehrRecords.unshift(newRec);
        this.snackBar.open('EHR Record successfully saved!', 'OK', {
          duration: 3000,
        });
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
          error: () => {
            this.patientRadiologyReports = patientReports.map((r) => ({
              ...r,
              images: [],
            }));
          },
        });
      },
      error: () => {
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

  get hasSelectedPrintSections(): boolean {
    return this.printSections.some((section) => section.selected);
  }

  get selectedPrintSectionCount(): number {
    return this.printSections.filter((section) => section.selected).length;
  }

  get selectedVisitCount(): number {
    return this.selectedVisitIndexes.length;
  }

  isPrintSectionSelected(key: EhrPrintSectionKey): boolean {
    return this.printSections.find((section) => section.key === key)?.selected ?? false;
  }

  openPrintOptions(): void {
    this.printSections = this.printSections.map((section) => ({
      ...section,
      selected: true,
    }));
    this.selectedVisitIndexes = this.ehrRecords.map((_, index) => index);
    this.showPrintOptions = true;
  }

  closePrintOptions(): void {
    this.showPrintOptions = false;
  }

  closePdfPreview(): void {
    this.showPdfPreview = false;
    this.clearPdfPreviewUrl();
  }

  printPreviewPdf(): void {
    const previewWindow =
      this.ehrPdfPreviewFrame?.nativeElement.contentWindow;
    if (!previewWindow) {
      this.snackBar.open(
        'PDF preview is not ready to print. Please wait and try again.',
        'OK',
        { duration: 3500 },
      );
      return;
    }

    previewWindow.focus();
    previewWindow.print();
  }

  downloadPreviewPdf(): void {
    if (!this.previewObjectUrl || !this.selectedPatient) return;

    const patientFileName = this.getPatientPdfFileName();
    const anchor = document.createElement('a');
    anchor.href = this.previewObjectUrl;
    anchor.download = `${patientFileName}-ehr.pdf`;
    anchor.click();
  }

  private getPatientPdfFileName(): string {
    return (
      this.selectedPatient?.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      this.selectedPatient?.id ||
      'patient'
    );
  }

  private clearPdfPreviewUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewPdfUrl = null;
  }

  selectAllPrintSections(selected: boolean): void {
    this.printSections = this.printSections.map((section) => ({
      ...section,
      selected,
    }));
  }

  isVisitSelected(index: number): boolean {
    return this.selectedVisitIndexes.includes(index);
  }

  toggleVisitSelection(index: number, selected: boolean): void {
    this.selectedVisitIndexes = selected
      ? [...new Set([...this.selectedVisitIndexes, index])]
      : this.selectedVisitIndexes.filter((selectedIndex) => selectedIndex !== index);
  }

  selectAllVisits(selected: boolean): void {
    this.selectedVisitIndexes = selected
      ? this.ehrRecords.map((_, index) => index)
      : [];
  }

  async previewEhrPdf(): Promise<void> {
    const patient = this.selectedPatient;
    const selectedSections = this.printSections
      .filter((section) => section.selected)
      .map((section) => section.key);
    if (!patient || selectedSections.length === 0) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      const pageBottom = doc.internal.pageSize.getHeight() - margin;
      let y = margin;

      const writeSectionHeader = (title: string): void => {
        if (y > pageBottom - 34) {
          doc.addPage();
          y = margin;
        }
        y += 10;
        doc.setFillColor(30, 64, 115);
        doc.rect(margin, y - 13, contentWidth, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, margin + 10, y + 3);
        doc.setTextColor(30, 41, 59);
        y += 22;
      };

      const writeSection = (title: string, entries: string[]): void => {
        writeSectionHeader(title);
        if (entries.length === 0) entries = ['No records available.'];
        entries.forEach((entry) => {
          const lines = entry
            .split('\n')
            .flatMap((line) => doc.splitTextToSize(line, contentWidth - 24));
          const lineHeight = 14;
          const cardHeight = Math.max(34, lines.length * lineHeight + 18);
          if (y + cardHeight > pageBottom) {
            doc.addPage();
            y = margin;
            writeSectionHeader(title);
          }
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'FD');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 12, y + 18);
          y += cardHeight + 6;
        });
      };

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 104, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Patient Electronic Health Record', margin, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text('CONFIDENTIAL CLINICAL DOCUMENT', margin, 64);
      doc.text(`Generated ${new Date().toLocaleString()}`, margin, 82);
      doc.setTextColor(30, 41, 59);
      y = 122;

      const patientDetails = [
        [`Patient`, patient.name],
        [`Patient ID`, patient.id],
        [`National ID`, patient.nationalId || 'Not recorded'],
        [`Date of birth`, patient.dob || 'Not recorded'],
        [`Age`, `${patient.age} years`],
        [`Gender`, patient.gender],
      ];
      const columnWidth = contentWidth / 2;
      const rowHeight = 34;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(
        margin,
        y,
        contentWidth,
        rowHeight * 3 + 12,
        5,
        5,
        'FD',
      );
      patientDetails.forEach(([label, value], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + 12 + column * columnWidth;
        const detailY = y + 22 + row * rowHeight;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), x, detailY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(doc.splitTextToSize(value, columnWidth - 28)[0] || '', x, detailY + 12);
      });
      y += rowHeight * 3 + 26;

      if (selectedSections.includes('visits')) {
        writeSection(
          'Clinical visits and notes',
          this.ehrRecords
            .map((record, index) => ({ record, index }))
            .filter(({ index }) => this.selectedVisitIndexes.includes(index))
            .map(({ record }) =>
              [
                `Visit date: ${record.date}  |  Clinician: ${record.doctor}`,
                `Diagnosis: ${record.diagnosis} (${record.diagnosisSystem || 'KNHTS'}: ${record.diagnosisCode || 'Not coded'})`,
                `Clinical notes: ${record.notes || 'No notes recorded.'}`,
                ...(record.prescriptions || []).map(
                  (prescription) =>
                    `Prescription: ${prescription.medication || prescription.drugs?.map((drug) => drug.name).join(', ') || 'Medication'}  |  ${prescription.dosage || 'Dosage not recorded'}  |  ${prescription.frequency || 'Frequency not recorded'}  |  ${prescription.duration || 'Duration not recorded'}`,
                ),
              ].join('\n'),
            ),
        );
      }

      if (selectedSections.includes('problems')) {
        writeSection(
          'Problem list and diagnoses',
          this.patientProblems.length
            ? this.patientProblems.map(
                (problem) =>
                  `${problem.display} | ${problem.system}: ${problem.code} | Status: ${problem.status} | Onset: ${problem.onsetDate}${problem.notes ? ` | Notes: ${problem.notes}` : ''}`,
              )
            : ['No problems or diagnoses recorded.'],
        );
      }

      if (selectedSections.includes('allergies')) {
        writeSection(
          'Allergies',
          this.patientAllergies.length
            ? this.patientAllergies.map(
                (allergy) =>
                  `${allergy.allergenName} | ${allergy.allergyType} | Severity: ${allergy.severity} | Reaction: ${allergy.reaction}`,
              )
            : ['No allergies recorded.'],
        );
      }

      if (selectedSections.includes('orders')) {
        writeSection(
          'CPOE orders',
          this.patientCpoeOrders.length
            ? this.patientCpoeOrders.map(
                (order) =>
                  `${order.orderType}: ${order.title} | Status: ${order.status} | Ordered by: ${order.orderedBy} | Date: ${order.orderDate} | Instructions: ${order.instructions}`,
              )
            : ['No CPOE orders recorded.'],
        );
      }

      if (selectedSections.includes('vitals')) {
        const vitalsLines = this.vitalsHistory.map(
          (vitals) =>
            `Date: ${vitals.recordedAt || 'Not recorded'} | Blood pressure: ${vitals.systolicBp ?? 'N/A'}/${vitals.diastolicBp ?? 'N/A'} | Heart rate: ${vitals.heartRateBpm ?? 'N/A'} bpm | Temperature: ${vitals.temperatureC ?? 'N/A'} C | SpO2: ${vitals.spo2Percent ?? 'N/A'}% | Weight: ${vitals.weightKg ?? 'N/A'} kg | Height: ${vitals.heightCm ?? 'N/A'} cm | BMI: ${vitals.bmi ?? 'N/A'}`,
        );
        if (this.vitalsHistory.length === 0 && this.patientVitals) {
          vitalsLines.push(
            `Blood pressure: ${this.patientVitals.bloodPressureSystolic ?? 'N/A'}/${this.patientVitals.bloodPressureDiastolic ?? 'N/A'} | Heart rate: ${this.patientVitals.pulseRateBpm ?? 'N/A'} bpm | Temperature: ${this.patientVitals.temperatureC ?? 'N/A'} C | SpO2: ${this.patientVitals.oxygenSaturationSpO2 ?? 'N/A'}% | Weight: ${this.patientVitals.weightKg ?? 'N/A'} kg | Height: ${this.patientVitals.heightCm ?? 'N/A'} cm | BMI: ${this.patientVitals.bmi ?? 'N/A'}`,
          );
        }
        if (this.patientGrowthChart) {
          vitalsLines.push(
            `Growth chart: ${this.patientGrowthChart.ageMonths} months | Height: ${this.patientGrowthChart.heightCm} cm (${this.patientGrowthChart.heightPercentile}th percentile) | Weight: ${this.patientGrowthChart.weightKg} kg (${this.patientGrowthChart.weightPercentile}th percentile) | WHO classification: ${this.patientGrowthChart.whoClassification}`,
          );
        }
        writeSection(
          'Vitals and growth charts',
          vitalsLines.length ? vitalsLines : ['No vitals recorded.'],
        );
      }

      if (selectedSections.includes('labs')) {
        writeSection(
          'Laboratory results',
          this.patientLabResults.length
            ? this.patientLabResults.map(
                (result) =>
                  `${result.date} | ${result.test}${result.loincCode ? ` (${result.loincCode})` : ''} | Result: ${result.result} | Status: ${result.status}`,
              )
            : ['No laboratory results recorded.'],
        );
      }

      if (selectedSections.includes('radiology')) {
        writeSection(
          'Radiology reports',
          this.patientRadiologyReports.length
            ? this.patientRadiologyReports.flatMap((report) => [
                `${report.type} | Date: ${report.scanDate} | Radiologist: ${report.radiologist} | Status: ${report.status}`,
                `Findings: ${report.findings || 'Not recorded.'}`,
                `Impression: ${report.impression || 'Not recorded.'}`,
                `Recommendations: ${report.recommendations || 'Not recorded.'}`,
                '',
              ])
            : ['No radiology reports recorded.'],
        );
      }

      if (selectedSections.includes('alerts')) {
        writeSection(
          'Clinical decision support alerts',
          this.cdsAlerts.length
            ? this.cdsAlerts.map(
                (alert) =>
                  `${alert.severity}: ${alert.title} | ${alert.message} | Recommendation: ${alert.recommendation} | Source: ${alert.source}`,
              )
            : ['No clinical alerts recorded.'],
        );
      }

      if (selectedSections.includes('hie')) {
        writeSection(
          'Kenya HIE clinical summary',
          this.fhirSummary?.rawFhirJson
            ? [this.fhirSummary.rawFhirJson]
            : ['No HIE summary available.'],
        );
      }

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, pageBottom + 12, pageWidth - margin, pageBottom + 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('CONFIDENTIAL - For authorized care use only', margin, pageBottom + 26);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageBottom + 26, {
          align: 'right',
        });
      }

      this.clearPdfPreviewUrl();
      this.previewObjectUrl = URL.createObjectURL(doc.output('blob'));
      this.previewPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.previewObjectUrl,
      );
      this.showPrintOptions = false;
      this.showPdfPreview = true;
    } catch (error) {
      console.error('Failed to generate patient EHR PDF:', error);
      this.snackBar.open(
        'Failed to generate the patient EHR PDF. Please try again.',
        'OK',
        { duration: 3500 },
      );
    }
  }
}
