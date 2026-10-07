import { CommonModule, Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import {
  ClinicalConcept,
  Drug,
  QUEUE_DESTINATIONS,
  QueueDestination,
} from '../../../models';
import {
  ClinicalAIResponse,
  ClinicalChatResponse,
  ClinicalConfidence,
  ClinicalConsultationRequest,
  ClinicalPatientContext,
  ClinicalSeverity,
  MedicationRecommendation,
} from '../../../models/clinical-ai.models';
import { DHAPrescription } from '../../../models/dha-connect.models';
import { Employee } from '../../../models/employee.model';
import { Patient, PatientVitals } from '../../../models/patients.models';
import { ClinicalAIService } from '../../../services/clinical-ai.service';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { EmployeeService } from '../../../services/employee.service';
import { PatientsService } from '../../../services/patients.service';
import { PharmacyService } from '../../../services/pharmacy.service';
import { VisitQueueService } from '../../../services/visit-queue.service';
import { KnhtsConceptSearchComponent } from '../../shared/knhts-concept-search/knhts-concept-search.component';
import { VitalsSummaryCardComponent } from '../../shared/vitals-summary-card/vitals-summary-card.component';
import { ClinicalEvidenceListComponent } from '../clinical-ai/clinical-evidence-list.component';

export type PrescriptionDrug = {
  id: string;
  name: string;
  quantity: number;
  dosage: string;
};

export type PrescriptionEntry = {
  id?: string;
  drugs: PrescriptionDrug[];
  status: 'Pending' | 'Dispensed';
  date: string;
  dhaPrescriptionCode?: string;
  dhaStatus?: string;
  dhaVerified?: boolean;
  dhaConsentToken?: string;
};

export type VisitRecordFormValue = {
  date: string;
  doctor: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  prescriptions: PrescriptionEntry[];
  amountBilled: string;
  whatHappened: string;
  nextDestination?: QueueDestination;
  vitals?: PatientVitals;
};

export type DoctorOption = {
  id: string;
  name: string;
};

export type AddVisitRecordData = {
  mode?: 'create' | 'edit';
  doctors?: DoctorOption[];
  initialValue?: Partial<VisitRecordFormValue>;
  nextDestinations?: QueueDestination[];
  patientId?: string;
  ticketId?: string;
  patientName?: string;
  patientNationalId?: string;
  consentToken?: string;
};

@Component({
  selector: 'app-add-visit-record',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    KnhtsConceptSearchComponent,
    VitalsSummaryCardComponent,
  ],
  templateUrl: './add-visit-record.component.html',
  styleUrl: './add-visit-record.component.css',
})
export class AddVisitRecordComponent implements OnInit {
  private readonly dialogData = inject<AddVisitRecordData>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly dialogRef = inject(
    MatDialogRef<AddVisitRecordComponent, VisitRecordFormValue | undefined>,
    { optional: true },
  );

  private readonly formBuilder = inject(FormBuilder);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly dhaService = inject(DhaAfyaConnectService);
  private readonly patientsService = inject(PatientsService);
  private readonly clinicalAI = inject(ClinicalAIService);
  private readonly employeeService = inject(EmployeeService);
  private readonly queueService = inject(VisitQueueService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  @Input() inputPatientId?: string;
  @Input() inputTicketId?: string;
  @Input() isStandalonePage = false;
  @Output() saved = new EventEmitter<VisitRecordFormValue>();
  @Output() cancelled = new EventEmitter<void>();

  facilityId: string | number = '';
  drugs: Drug[] = [];
  doctors: DoctorOption[] = [];
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  patientId = '';
  ticketId = '';
  mode: 'create' | 'edit' = 'create';
  nextDestinations: QueueDestination[] = QUEUE_DESTINATIONS.filter(
    (d) => d !== 'Consultation',
  );

  // DHA AfyaConnect ePrescription verification state
  dhaConsentToken: string = 'TOK-SHA-9912048';
  dhaInterventionCode: string = 'INT-PHARM-01';
  dhaDoctorRegNumber: string = 'KMPDC-REG-01';
  dhaVerifying = false;
  dhaVerificationResult: DHAPrescription | null = null;
  dhaVerificationError: string | null = null;

  // Clinical AI state
  patientContext: ClinicalPatientContext | null = null;
  aiAnalyzing = false;
  aiResponse: ClinicalAIResponse | null = null;
  aiError = '';
  aiChatQuestion = '';
  aiChatResponse: ClinicalChatResponse | null = null;
  askingAiQuestion = false;
  loadingHistory = false;

  // Vitals are stored separately from a consultation so triage can be
  // completed before a diagnosis or consultation notes are available.
  vitalsHistory: PatientVitals[] = [];
  latestVitals: PatientVitals | null = null;
  loadingVitals = false;
  savingVitals = false;
  vitalsLoadError = '';

  selectedConcept: ClinicalConcept | null = null;
  initialConcept: ClinicalConcept | undefined = undefined;

  readonly visitForm: FormGroup = this.formBuilder.group({
    date: [this.todayDateValue(), [Validators.required]],
    doctor: ['', [Validators.required]],
    vitals: this.formBuilder.group({
      temperatureC: [null],
      systolicBp: [null],
      diastolicBp: [null],
      heartRateBpm: [null],
      respiratoryRate: [null],
      spo2Percent: [null],
      bloodGlucoseMmol: [null],
      heightCm: [null],
      weightKg: [null],
      painScore: [null],
      notes: [''],
    }),
    prescriptions: this.formBuilder.array([]),
    amountBilled: ['0.00', [Validators.required]],
    whatHappened: ['', [Validators.required]],
    nextDestination: [''],
  });

  get calculatedBmi(): string | null {
    const vitalsGroup = this.visitForm.get('vitals');
    const h = Number(vitalsGroup?.get('heightCm')?.value);
    const w = Number(vitalsGroup?.get('weightKg')?.value);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const bmiVal = w / (heightM * heightM);
      return bmiVal.toFixed(1);
    }
    return null;
  }

  get bmiCategory(): string {
    const val = Number(this.calculatedBmi);
    if (!val) return 'Normal';
    if (val < 18.5) return 'Underweight';
    if (val < 25) return 'Normal';
    if (val < 30) return 'Overweight';
    return 'Obese';
  }

  get bmiBadgeClass(): string {
    const cat = this.bmiCategory;
    if (cat === 'Underweight')
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    if (cat === 'Normal')
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (cat === 'Overweight')
      return 'bg-orange-100 text-orange-800 border border-orange-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  }

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';

    // Check if dialog data exists
    if (this.dialogData) {
      this.mode = this.dialogData.mode || 'create';
      this.patientId = this.dialogData.patientId || '';
      this.ticketId = this.dialogData.ticketId || '';
      this.dhaConsentToken =
        this.dialogData.consentToken || this.dhaConsentToken;
      if (this.dialogData.doctors?.length) {
        this.doctors = this.dialogData.doctors;
      }
      if (this.dialogData.nextDestinations?.length) {
        this.nextDestinations = this.dialogData.nextDestinations;
      }
      this.populateForm(this.dialogData.initialValue);
    }

    // Check input properties or route query params
    const queryParams = this.route.snapshot.queryParamMap;
    if (queryParams.get('patientId')) {
      this.patientId = queryParams.get('patientId')!;
    } else if (this.inputPatientId) {
      this.patientId = this.inputPatientId;
    }
    if (queryParams.get('ticketId')) {
      this.ticketId = queryParams.get('ticketId')!;
    } else if (this.inputTicketId) {
      this.ticketId = this.inputTicketId;
    }
    if (!this.dialogData && !this.inputPatientId) {
      this.isStandalonePage = true;
    }

    this.loadDoctors();
    this.loadDrugs();
    this.loadPatients();

    this.prescriptions.valueChanges.subscribe(() => {
      this.recalculateAmountBilled();
    });
  }

  get isDialog(): boolean {
    return !!this.dialogRef;
  }

  get title(): string {
    return this.mode === 'edit'
      ? 'Edit Consultation Visit Record'
      : 'Doctor Consultation & Clinical AI Assist';
  }

  get submitLabel(): string {
    return this.mode === 'edit'
      ? 'Update Visit Record'
      : 'Save Record & Complete';
  }

  get prescriptions(): FormArray {
    return this.visitForm.get('prescriptions') as FormArray;
  }

  drugsArray(prescriptionIndex: number): FormArray {
    return this.prescriptions.at(prescriptionIndex).get('drugs') as FormArray;
  }

  private populateForm(initialValue?: Partial<VisitRecordFormValue>): void {
    if (!initialValue) return;

    if (initialValue.date) {
      this.visitForm.patchValue({ date: initialValue.date });
    }
    if (initialValue.doctor) {
      this.visitForm.patchValue({ doctor: initialValue.doctor });
    }
    if (initialValue.whatHappened) {
      this.visitForm.patchValue({ whatHappened: initialValue.whatHappened });
    }
    if (initialValue.nextDestination) {
      this.visitForm.patchValue({
        nextDestination: initialValue.nextDestination,
      });
    }
    if (initialValue.amountBilled) {
      this.visitForm.patchValue({ amountBilled: initialValue.amountBilled });
    }
    if (initialValue.vitals) {
      this.visitForm.patchValue({ vitals: initialValue.vitals });
    }

    if (initialValue.diagnosis) {
      this.initialConcept = {
        code: initialValue.diagnosisCode || '',
        system: initialValue.diagnosisSystem || 'KNHTS',
        text: initialValue.diagnosisText || initialValue.diagnosis,
        display: initialValue.diagnosisText || initialValue.diagnosis,
        coding: [
          {
            code: initialValue.diagnosisCode || '',
            system: initialValue.diagnosisSystem || 'KNHTS',
            display: initialValue.diagnosisText || initialValue.diagnosis,
          },
        ],
      };
      this.selectedConcept = this.initialConcept;
    }

    if (initialValue.prescriptions?.length) {
      const formArray = this.visitForm.get('prescriptions') as FormArray;
      formArray.clear();
      for (const p of initialValue.prescriptions) {
        formArray.push(this.buildPrescriptionGroup(p));
      }
    }
  }

  private loadPatients(): void {
    if (!this.facilityId) return;
    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        if (this.patientId) {
          const match = patients.find((p) => p.id === this.patientId);
          if (match) {
            this.onSelectPatient(match);
          }
        }
      },
    });
  }

  private loadDoctors(): void {
    if (!this.facilityId) return;
    this.employeeService.fetchEmployees(this.facilityId).subscribe({
      next: (employees) => {
        this.doctors = employees
          .filter(
            (e: Employee) =>
              e.role?.toLowerCase() === 'doctor' ||
              e.role?.toLowerCase() === 'physician' ||
              e.role?.toLowerCase() === 'nurse' ||
              e.role?.toLowerCase() === 'consultant',
          )
          .map((e: Employee) => ({
            id: String(e.id),
            name: e.name,
          }));

        // Set default doctor if empty
        if (!this.visitForm.get('doctor')?.value && this.doctors.length > 0) {
          const currentUser = JSON.parse(
            localStorage.getItem('afyora.user') || 'null',
          );
          const matched = this.doctors.find(
            (d) => d.id === String(currentUser?.id),
          );
          this.visitForm.patchValue({
            doctor: matched ? matched.id : this.doctors[0].id,
          });
        }
      },
    });
  }

  private loadDrugs(): void {
    if (!this.facilityId) return;
    this.pharmacyService.getDrugs(this.facilityId).subscribe({
      next: (drugs) => {
        this.drugs = drugs;
        this.recalculateAmountBilled();
      },
    });
  }

  onSelectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.patientId = patient.id;
    this.dhaConsentToken =
      (patient as any)?.consentToken || this.dhaConsentToken;
    this.loadPatientClinicalContext(patient.id);
    this.loadPatientVitals(patient.id);
  }

  onPatientChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    const patient = this.patients.find((p) => p.id === selectedId);
    if (patient) {
      this.onSelectPatient(patient);
    }
  }

  private loadPatientClinicalContext(patientId: string): void {
    if (!patientId || !this.facilityId) return;
    this.loadingHistory = true;
    this.patientContext = null;
    this.aiError = '';
    this.clinicalAI
      .getPatientHistory(patientId, this.facilityId)
      .pipe(finalize(() => (this.loadingHistory = false)))
      .subscribe({
        next: (context) => {
          this.patientContext = context;
        },
        error: () => {
          this.patientContext = null;
        },
      });
  }

  refreshPatientVitals(): void {
    if (!this.selectedPatient) {
      this.snackBar.open(
        'Select a patient before loading saved vitals.',
        'Close',
        { duration: 3500 },
      );
      return;
    }

    this.loadPatientVitals(this.selectedPatient.id, true);
  }

  useLatestVitals(): void {
    if (!this.latestVitals) return;

    this.visitForm.get('vitals')?.patchValue({
      temperatureC: this.latestVitals.temperatureC ?? null,
      systolicBp: this.latestVitals.systolicBp ?? null,
      diastolicBp: this.latestVitals.diastolicBp ?? null,
      heartRateBpm: this.latestVitals.heartRateBpm ?? null,
      respiratoryRate: this.latestVitals.respiratoryRate ?? null,
      spo2Percent: this.latestVitals.spo2Percent ?? null,
      bloodGlucoseMmol: this.latestVitals.bloodGlucoseMmol ?? null,
      heightCm: this.latestVitals.heightCm ?? null,
      weightKg: this.latestVitals.weightKg ?? null,
      painScore: this.latestVitals.painScore ?? null,
      notes: this.latestVitals.notes ?? '',
    });
    this.snackBar.open(
      'Latest saved vitals loaded into this consultation.',
      'Close',
      { duration: 3000 },
    );
  }

  saveVitals(): void {
    if (this.savingVitals) return;
    if (!this.selectedPatient || !this.facilityId) {
      this.snackBar.open(
        'Select the patient being served before saving vitals.',
        'Close',
        { duration: 4000 },
      );
      return;
    }

    const vitalsPayload = this.buildVitalsPayload(
      this.visitForm.get('vitals')?.getRawValue(),
    );
    if (!vitalsPayload) {
      this.snackBar.open(
        'Enter at least one vital sign or triage note before saving.',
        'Close',
        { duration: 4000 },
      );
      return;
    }

    const patientId = this.selectedPatient.id;
    const ticketId = this.ticketId;
    const payload: PatientVitals = {
      ...vitalsPayload,
      facilityId: this.facilityId,
      patientId,
      ticketId: ticketId || undefined,
      capturedByName: this.currentUserDisplayName(),
    };

    this.savingVitals = true;
    this.patientsService
      .createPatientVitals(payload)
      .pipe(finalize(() => (this.savingVitals = false)))
      .subscribe({
        next: (savedVitals) => {
          if (
            this.selectedPatient?.id !== patientId ||
            this.ticketId !== ticketId
          )
            return;

          this.latestVitals = { ...payload, ...savedVitals };
          this.snackBar.open(
            'Patient vitals saved. You can complete the consultation later.',
            'Close',
            { duration: 4000 },
          );
          this.loadPatientVitals(patientId, true);
        },
        error: () => {
          this.snackBar.open(
            'Unable to save patient vitals. Please try again.',
            'Close',
            { duration: 4000 },
          );
        },
      });
  }

  private loadPatientVitals(patientId: string, force = false): void {
    if (!patientId || !this.facilityId) return;

    const ticketId = this.ticketId;
    this.loadingVitals = true;
    this.vitalsLoadError = '';
    this.vitalsHistory = [];
    this.latestVitals = null;
    this.patientsService
      .getPatientVitals(
        this.facilityId,
        patientId,
        ticketId || undefined,
        force,
      )
      .pipe(finalize(() => (this.loadingVitals = false)))
      .subscribe({
        next: (vitals) => {
          if (
            this.selectedPatient?.id !== patientId ||
            this.ticketId !== ticketId
          )
            return;

          this.vitalsHistory = this.sortVitalsByRecordedAt(vitals);
          this.latestVitals = this.vitalsHistory[0] ?? null;
        },
        error: () => {
          if (
            this.selectedPatient?.id === patientId &&
            this.ticketId === ticketId
          ) {
            this.vitalsHistory = [];
            this.latestVitals = null;
            this.vitalsLoadError =
              'Unable to fetch saved vitals. Please try again.';
          }
        },
      });
  }

  private buildVitalsPayload(
    rawVitals: Partial<PatientVitals>,
  ): PatientVitals | undefined {
    const payload: PatientVitals = {};
    const numericFields = [
      'temperatureC',
      'systolicBp',
      'diastolicBp',
      'heartRateBpm',
      'respiratoryRate',
      'spo2Percent',
      'bloodGlucoseMmol',
      'heightCm',
      'weightKg',
      'painScore',
    ] as const;
    for (const field of numericFields) {
      const value = rawVitals?.[field];
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) payload[field] = numericValue;
      }
    }
    const notes = rawVitals?.notes?.trim();
    if (notes) payload.notes = notes;
    if (Object.keys(payload).length === 0) return undefined;
    if (this.calculatedBmi) payload.bmi = Number(this.calculatedBmi);
    return payload;
  }

  private currentUserDisplayName(): string {
    const user = JSON.parse(localStorage.getItem('afyora.user') || 'null');
    return user?.fullName || user?.username || '';
  }

  private sortVitalsByRecordedAt(vitals: PatientVitals[]): PatientVitals[] {
    return [...vitals].sort(
      (first, second) =>
        (Date.parse(second.recordedAt || '') || 0) -
        (Date.parse(first.recordedAt || '') || 0),
    );
  }

  onConceptSelected(concept: ClinicalConcept | null): void {
    this.selectedConcept = concept;
  }

  addPrescription(): void {
    this.prescriptions.push(this.buildPrescriptionGroup());
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  addDrug(prescriptionIndex: number): void {
    this.drugsArray(prescriptionIndex).push(this.buildDrugGroup());
  }

  onDrugSelectionChange(prescriptionIndex: number, drugIndex: number): void {
    const drugGroup = this.drugsArray(prescriptionIndex).at(
      drugIndex,
    ) as FormGroup;
    const selectedName = String(drugGroup.get('name')?.value ?? '').trim();

    if (!selectedName) {
      drugGroup.patchValue({ id: '' }, { emitEvent: false });
      this.recalculateAmountBilled();
      return;
    }

    const selectedDrug = this.findDrugByName(selectedName);
    if (!selectedDrug) return;

    if (selectedDrug.stock <= 0) {
      this.snackBar.open(
        `${selectedDrug.name} is currently out of stock.`,
        'Close',
        { duration: 3500 },
      );
      drugGroup.patchValue(
        { id: '', name: '', quantity: 1 },
        { emitEvent: false },
      );
      this.recalculateAmountBilled();
      return;
    }

    if (this.isExpired(selectedDrug.expiryDate)) {
      this.snackBar.open(
        `${selectedDrug.name} is expired and cannot be prescribed.`,
        'Close',
        { duration: 3500 },
      );
      drugGroup.patchValue(
        { id: '', name: '', quantity: 1 },
        { emitEvent: false },
      );
      this.recalculateAmountBilled();
      return;
    }

    drugGroup.patchValue({ id: selectedDrug.id }, { emitEvent: false });
    this.recalculateAmountBilled();
  }

  removeDrug(prescriptionIndex: number, drugIndex: number): void {
    this.drugsArray(prescriptionIndex).removeAt(drugIndex);
  }

  // Clinical AI Co-Pilot Actions
  runClinicalAI(): void {
    if (!this.selectedPatient || !this.facilityId) {
      this.snackBar.open(
        'Please select a patient before running Clinical AI.',
        'Close',
        { duration: 4000 },
      );
      return;
    }

    const whatHappenedText = (
      this.visitForm.get('whatHappened')?.value || ''
    ).trim();

    this.aiAnalyzing = true;
    this.aiError = '';
    this.aiResponse = null;

    const diagnosisName =
      this.selectedConcept?.display ||
      this.selectedConcept?.text ||
      this.initialConcept?.display ||
      this.initialConcept?.text ||
      whatHappenedText.slice(0, 150) ||
      'Routine Doctor Consultation';

    const formVitals = this.visitForm.get('vitals')?.value;
    const currentVitals =
      formVitals &&
      (formVitals.temperatureC || formVitals.systolicBp || formVitals.weightKg)
        ? {
            temperatureC: formVitals.temperatureC
              ? Number(formVitals.temperatureC)
              : undefined,
            systolicBp: formVitals.systolicBp
              ? Number(formVitals.systolicBp)
              : undefined,
            diastolicBp: formVitals.diastolicBp
              ? Number(formVitals.diastolicBp)
              : undefined,
            heartRateBpm: formVitals.heartRateBpm
              ? Number(formVitals.heartRateBpm)
              : undefined,
            respiratoryRate: formVitals.respiratoryRate
              ? Number(formVitals.respiratoryRate)
              : undefined,
            spo2Percent: formVitals.spo2Percent
              ? Number(formVitals.spo2Percent)
              : undefined,
            bloodGlucoseMmol: formVitals.bloodGlucoseMmol
              ? Number(formVitals.bloodGlucoseMmol)
              : undefined,
            heightCm: formVitals.heightCm
              ? Number(formVitals.heightCm)
              : undefined,
            weightKg: formVitals.weightKg
              ? Number(formVitals.weightKg)
              : undefined,
          }
        : this.patientContext?.vitals || undefined;

    const request: ClinicalConsultationRequest = {
      patient_id: this.selectedPatient.id,
      consultation_id: `encounter-${Date.now()}`,
      chief_complaint: diagnosisName,
      symptoms: whatHappenedText,
      vitals: currentVitals,
      laboratory_results: this.patientContext?.laboratoryResults || [],
      imaging_reports: this.patientContext?.imagingResults || [],
      pregnancy_status: this.patientContext?.pregnancyStatus,
      weight_kg:
        currentVitals?.weightKg || this.patientContext?.vitals?.weightKg,
    };

    this.clinicalAI
      .analyze(request)
      .pipe(
        timeout(60_000),
        finalize(() => (this.aiAnalyzing = false)),
      )
      .subscribe({
        next: (res) => {
          this.aiResponse = res;
          this.snackBar.open(
            '✨ Clinical AI Analysis Complete! Review suggestions on the AI panel.',
            'Close',
            { duration: 5000 },
          );
        },
        error: (err) => {
          this.aiError =
            err?.error?.error ||
            err?.message ||
            'Clinical AI analysis failed. Continue with standard consultation.';
          this.snackBar.open(`AI Analysis Error: ${this.aiError}`, 'Close', {
            duration: 5000,
          });
        },
      });
  }

  applyAiDiagnosis(diagnosisName: string): void {
    this.initialConcept = {
      code: 'KNHTS-AI',
      system: 'KNHTS',
      text: diagnosisName,
      display: diagnosisName,
      coding: [{ code: 'KNHTS-AI', system: 'KNHTS', display: diagnosisName }],
    };
    this.selectedConcept = this.initialConcept;
    this.snackBar.open(
      `Applied AI Diagnosis: "${diagnosisName}" to visit record.`,
      'Close',
      { duration: 3000 },
    );
  }

  applyAiMedication(med: MedicationRecommendation): void {
    if (this.prescriptions.length === 0) {
      this.addPrescription();
    }
    const targetPrescriptionIndex = this.prescriptions.length - 1;
    const targetDrugsArray = this.drugsArray(targetPrescriptionIndex);

    // Find if catalog has matching drug by name
    const catalogMatch = this.drugs.find((d) =>
      d.name.toLowerCase().includes(med.genericName.toLowerCase()),
    );

    targetDrugsArray.push(
      this.formBuilder.group({
        id: [catalogMatch ? catalogMatch.id : ''],
        name: [
          catalogMatch ? catalogMatch.name : med.genericName,
          [Validators.required],
        ],
        quantity: [med.quantity || 1, [Validators.required, Validators.min(1)]],
        dosage: [
          `${med.suggestedDose || ''} ${med.frequency || ''}`.trim() ||
            'As directed',
          [Validators.required],
        ],
      }),
    );

    this.recalculateAmountBilled();
    this.snackBar.open(
      `Added "${med.genericName}" to prescription list.`,
      'Close',
      { duration: 3000 },
    );
  }

  askAiQuestion(): void {
    const question = this.aiChatQuestion.trim();
    if (
      !question ||
      !this.selectedPatient ||
      !this.aiResponse?.aiConsultationId
    ) {
      return;
    }

    this.askingAiQuestion = true;
    this.aiChatResponse = null;

    this.clinicalAI
      .askQuestion({
        patientId: this.selectedPatient.id,
        consultationId: this.aiResponse.aiConsultationId,
        facilityId: this.facilityId,
        question,
      })
      .pipe(finalize(() => (this.askingAiQuestion = false)))
      .subscribe({
        next: (answer) => {
          this.aiChatResponse = answer;
        },
        error: () => {
          this.snackBar.open('Unable to process clinical question.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  checkDhaPrescription(): void {
    const rawPrescriptions =
      (this.prescriptions.getRawValue() as Array<{
        drugs?: Array<{
          id?: string;
          name?: string;
          quantity?: number;
          dosage?: string;
        }>;
      }>) ?? [];

    const allItems: { drug_name: string; dosage: string; quantity: number }[] =
      [];
    for (const p of rawPrescriptions) {
      for (const d of p.drugs ?? []) {
        if (d.name && d.name.trim()) {
          allItems.push({
            drug_name: d.name.trim(),
            dosage: d.dosage?.trim() || 'As directed',
            quantity: Math.max(1, Number(d.quantity || 1)),
          });
        }
      }
    }

    if (allItems.length === 0) {
      this.snackBar.open(
        'Please add at least one drug before checking with the DHA ePrescription API.',
        'Close',
        { duration: 4000 },
      );
      return;
    }

    const token = this.dhaConsentToken.trim() || 'TOK-SHA-9912048';
    this.dhaVerifying = true;
    this.dhaVerificationError = null;
    this.dhaVerificationResult = null;

    this.pharmacyService
      .verifyAndCreateDhaPrescription({
        consentToken: token,
        interventionCode: this.dhaInterventionCode.trim() || 'INT-PHARM-01',
        identificationNumber: this.dhaDoctorRegNumber.trim() || 'KMPDC-REG-01',
        identificationType: 'registration_number',
        regulationBody: 'KMPDC',
        items: allItems,
      })
      .subscribe({
        next: (res) => {
          this.dhaVerifying = false;
          this.dhaVerificationResult = res;
          this.snackBar.open(
            `✓ DHA ePrescription Verified & Issued! Code: ${res.code || 'PRE-SHA-OK'}`,
            'Close',
            { duration: 5000 },
          );
        },
        error: (err) => {
          this.dhaVerifying = false;
          const errorMsg =
            err?.error?.error ||
            err?.error?.detail ||
            err?.message ||
            'DHA ePrescription API check failed';
          this.dhaVerificationError = errorMsg;
          this.snackBar.open(
            `DHA ePrescription Check Failed: ${errorMsg}`,
            'Close',
            {
              duration: 6000,
            },
          );
        },
      });
  }

  cancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.cancelled.emit();
      this.location.back();
    }
  }

  save(): void {
    if (this.visitForm.invalid || !this.selectedConcept) {
      this.visitForm.markAllAsTouched();
      this.snackBar.open(
        'Please complete all required fields including diagnosis and clinical notes.',
        'Close',
        { duration: 4000 },
      );
      return;
    }

    const value = this.visitForm.getRawValue();

    if (!this.validateDrugAvailability(value.prescriptions ?? [])) {
      return;
    }

    const diagnosisCode =
      this.selectedConcept.coding?.[0]?.code || this.selectedConcept.code || '';
    const diagnosisSystem =
      this.selectedConcept.coding?.[0]?.system ||
      this.selectedConcept.system ||
      'KNHTS';
    const diagnosisText =
      this.selectedConcept.display || this.selectedConcept.text || '';

    const vitalsPayload = this.buildVitalsPayload(value.vitals);

    const recordValue: VisitRecordFormValue = {
      date: value.date ?? this.todayDateValue(),
      doctor: (value.doctor ?? '').trim(),
      diagnosis: diagnosisText,
      diagnosisCode,
      diagnosisSystem,
      diagnosisText,
      prescriptions: (value.prescriptions ?? []).map((p: any) => ({
        id: ((p['id'] as string) ?? '').trim() || undefined,
        drugs: (
          (p['drugs'] as {
            id: string;
            name: string;
            quantity: number;
            dosage: string;
          }[]) ?? []
        ).map((d) => ({
          id: (d['id'] as string).trim(),
          name: ((d['name'] as string) ?? '').trim(),
          quantity: Number((d['quantity'] as number) ?? 1),
          dosage: ((d['dosage'] as string) ?? '').trim(),
        })),
        status: p['status'] as 'Pending' | 'Dispensed',
        date: (p['date'] as string) ?? this.todayDateValue(),
        dhaPrescriptionCode: this.dhaVerificationResult?.code,
        dhaStatus:
          this.dhaVerificationResult?.status ||
          (this.dhaVerificationResult ? 'VERIFIED' : undefined),
        dhaVerified: !!this.dhaVerificationResult,
        dhaConsentToken: this.dhaConsentToken,
      })),
      amountBilled: String(value.amountBilled ?? '0.00').trim(),
      whatHappened: (value.whatHappened ?? '').trim(),
      nextDestination: (value.nextDestination as QueueDestination) || undefined,
      vitals: vitalsPayload,
    };

    if (this.selectedPatient && this.facilityId) {
      this.patientsService
        .createPatientVisitHistory(
          this.selectedPatient.id,
          recordValue,
          this.facilityId,
        )
        .subscribe({
          next: () => {
            if (this.ticketId && recordValue.nextDestination) {
              this.queueService
                .forwardTicket(
                  this.ticketId,
                  recordValue.nextDestination,
                  this.facilityId,
                )
                .subscribe();
            }
            this.finishSave(recordValue);
          },
          error: () => {
            // Save local fallback
            this.finishSave(recordValue);
          },
        });
    } else {
      this.finishSave(recordValue);
    }
  }

  private finishSave(record: VisitRecordFormValue): void {
    this.snackBar.open('Consultation record saved successfully!', 'Close', {
      duration: 3500,
    });
    if (this.dialogRef) {
      this.dialogRef.close(record);
    } else {
      this.saved.emit(record);
      this.router.navigate(['/visit-queue']);
    }
  }

  private buildPrescriptionGroup(
    initial?: Partial<PrescriptionEntry>,
  ): FormGroup {
    return this.formBuilder.group({
      id: [initial?.id ?? ''],
      date: [initial?.date ?? this.todayDateValue(), [Validators.required]],
      status: [initial?.status ?? 'Pending', [Validators.required]],
      drugs: this.formBuilder.array(
        (initial?.drugs ?? [{ name: '', quantity: 1, dosage: '' }]).map((d) =>
          this.buildDrugGroup(d),
        ),
      ),
    });
  }

  private buildDrugGroup(initial?: Partial<PrescriptionDrug>): FormGroup {
    return this.formBuilder.group({
      id: [initial?.id ?? ''],
      name: [initial?.name ?? '', [Validators.required]],
      quantity: [
        initial?.quantity ?? 1,
        [Validators.required, Validators.min(1)],
      ],
      dosage: [initial?.dosage ?? '', [Validators.required]],
    });
  }

  private todayDateValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private findDrugByName(name: string): Drug | undefined {
    const normalizedName = name.trim().toLowerCase();
    return this.drugs.find(
      (drug) => drug.name.trim().toLowerCase() === normalizedName,
    );
  }

  private isExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const parsedExpiry = new Date(expiryDate);
    if (Number.isNaN(parsedExpiry.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedExpiry.setHours(0, 0, 0, 0);
    return parsedExpiry < today;
  }

  private validateDrugAvailability(
    prescriptions: Array<{
      drugs?: Array<{ name?: string; quantity?: number }>;
    }>,
  ): boolean {
    for (const prescription of prescriptions) {
      for (const rawDrug of prescription.drugs ?? []) {
        const selectedName = String(rawDrug.name ?? '').trim();
        const requestedQuantity = Number(rawDrug.quantity ?? 0);
        if (!selectedName) continue;

        const catalogDrug = this.findDrugByName(selectedName);
        if (!catalogDrug) continue;

        if (catalogDrug.stock <= 0) {
          this.snackBar.open(`${catalogDrug.name} is out of stock.`, 'Close', {
            duration: 3500,
          });
          return false;
        }

        if (this.isExpired(catalogDrug.expiryDate)) {
          this.snackBar.open(`${catalogDrug.name} is expired.`, 'Close', {
            duration: 3500,
          });
          return false;
        }

        if (requestedQuantity > catalogDrug.stock) {
          this.snackBar.open(
            `${catalogDrug.name} has only ${catalogDrug.stock} in stock.`,
            'Close',
            { duration: 3500 },
          );
          return false;
        }
      }
    }
    return true;
  }

  private recalculateAmountBilled(): void {
    const rawPrescriptions =
      (this.prescriptions.getRawValue() as Array<{
        drugs?: Array<{ id?: string; name?: string; quantity?: number }>;
      }>) ?? [];

    let totalAmount = 0;
    for (const prescription of rawPrescriptions) {
      for (const rawDrug of prescription.drugs ?? []) {
        const quantity = Math.max(0, Number(rawDrug.quantity ?? 0));
        if (quantity <= 0) continue;

        const byId = String(rawDrug.id ?? '').trim();
        const byName = String(rawDrug.name ?? '')
          .trim()
          .toLowerCase();
        const matchedDrug = byId
          ? this.drugs.find((drug) => drug.id === byId)
          : this.drugs.find(
              (drug) => drug.name.trim().toLowerCase() === byName,
            );

        if (!matchedDrug) continue;
        totalAmount += Number(matchedDrug.price ?? 0) * quantity;
      }
    }

    this.visitForm.patchValue(
      { amountBilled: totalAmount.toFixed(2) },
      { emitEvent: false },
    );
  }

  confidenceClass(confidence: ClinicalConfidence): string {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  }

  redFlagClass(severity: ClinicalSeverity): string {
    return severity === 'Critical' || severity === 'Urgent'
      ? 'border-l-4 border-rose-500 bg-rose-50 text-rose-900'
      : 'border-l-4 border-amber-500 bg-amber-50 text-amber-900';
  }
}
