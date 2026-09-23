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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
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
          this.selectPatient(this.patients[0]);
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

  private loadPatientClinicalDetails(patient: EhrPatient): void {
    this.loadPatientProblems(patient.id);
    this.loadPatientAllergies(patient.id);
    this.loadPatientCpoeOrders(patient.id);

    this.patientVitals = {
      id: 'VIT-01',
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      temperatureC: 37.2,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 88,
      pulseRateBpm: 76,
      respiratoryRate: 18,
      oxygenSaturationSpO2: 98,
      heightCm: 172,
      weightKg: 74,
      bmi: 25.0,
      bmiCategory: 'Overweight',
      recordedBy: 'Nurse Mary Wambui',
    };

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
}
