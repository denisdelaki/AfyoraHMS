import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { PermissionsService } from '../../../core/permissions.service';
import {
  ClinicalAIResponse,
  ClinicalChatResponse,
  ClinicalConfidence,
  ClinicalConsultationRequest,
  ClinicalFeedbackRequest,
  ClinicalPatientContext,
  ClinicalRecommendationAction,
  ClinicalRedFlag,
  ClinicalSeverity,
  MedicationRecommendation,
} from '../../../models/clinical-ai.models';
import { Patient } from '../../../models/patients.models';
import { ClinicalAIService } from '../../../services/clinical-ai.service';
import { PatientsService } from '../../../services/patients.service';
import { ClinicalEvidenceListComponent } from './clinical-evidence-list.component';

type StoredClinicalUser = {
  facility?: string | number;
  id?: string;
  employeeId?: string;
  role?: string;
};

type ReviewAction = {
  recommendationId: string;
  action: ClinicalRecommendationAction;
};

@Component({
  selector: 'app-clinical-ai',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ClinicalEvidenceListComponent,
  ],
  templateUrl: './clinical-ai.component.html',
  styleUrl: './clinical-ai.component.css',
})
export class ClinicalAIComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientsService = inject(PatientsService);
  private readonly clinicalAI = inject(ClinicalAIService);
  private readonly permissions = inject(PermissionsService);
  private selectionGeneration = 0;

  @ViewChild('analysisDialog')
  private analysisDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('prescriptionDialog')
  private prescriptionDialog?: ElementRef<HTMLDialogElement>;

  get canRequestAnalysis(): boolean {
    return this.permissions.hasPermission('clinical_ai', 'create');
  }

  get canReviewRecommendations(): boolean {
    return (
      this.isClinicalReviewer &&
      this.permissions.hasPermission('clinical_ai', 'update')
    );
  }

  get canApprovePrescriptions(): boolean {
    return (
      this.isPrescribingClinician &&
      this.permissions.hasPermission('clinical_ai', 'update') &&
      this.permissions.hasPermission('ehr', 'update') &&
      this.permissions.hasPermission('pharmacy', 'create') &&
      !this.hasUnacknowledgedCriticalMedicationWarning
    );
  }

  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  patientContext: ClinicalPatientContext | null = null;
  editableVitals: ClinicalPatientContext['vitals'] = null;
  response: ClinicalAIResponse | null = null;
  chatResponse: ClinicalChatResponse | null = null;
  consultationId = '';
  aiConsultationId = '';
  facilityId: string | number = '';
  clinicianId = '';
  clinicianRole = '';
  chiefComplaint = '';
  symptomsText = '';
  symptomDuration = '';
  relevantClinicalNotes = '';
  chatQuestion = '';
  feedbackReason = '';
  modifiedRecommendation = '';
  selectedMedication: MedicationRecommendation | null = null;
  reviewAction: ReviewAction | null = null;
  prescriptionDraft = {
    drug: '',
    dose: '',
    frequency: '',
    route: '',
    duration: '',
    quantity: 0,
    instructions: '',
  };
  loadingPatients = true;
  loadingContext = false;
  analyzing = false;
  askingQuestion = false;
  savingReview = false;
  approvingPrescription = false;
  partialContext = false;
  editVitals = false;
  errorMessage = '';
  actionMessage = '';
  acknowledgedSafetyWarnings = new Set<string>();

  ngOnInit(): void {
    const user = this.readStoredUser();
    this.facilityId = user?.facility ?? '';
    this.clinicianId = user?.employeeId ?? user?.id ?? '';
    this.clinicianRole = (user?.role ?? '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    this.consultationId =
      this.route.snapshot.queryParamMap.get('consultationId') ?? '';
    this.aiConsultationId =
      this.route.snapshot.queryParamMap.get('aiConsultationId') ?? '';

    if (!this.facilityId) {
      this.loadingPatients = false;
      this.errorMessage =
        'Your facility context is unavailable. Sign in again to continue.';
      return;
    }

    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loadingPatients = false;
        const requestedPatientId =
          this.route.snapshot.queryParamMap.get('patientId');
        const initialPatient = patients.find(
          (patient) => patient.id === requestedPatientId,
        );
        if (initialPatient) this.selectPatient(initialPatient);
      },
      error: () => {
        this.loadingPatients = false;
        this.errorMessage =
          'Patient list is unavailable. Continue using the standard clinical workflow.';
      },
    });
  }

  selectPatient(patient: Patient): void {
    const generation = ++this.selectionGeneration;
    this.selectedPatient = patient;
    this.patientContext = null;
    this.editableVitals = null;
    this.editVitals = false;
    this.response = null;
    this.chatResponse = null;
    this.aiConsultationId = '';
    this.reviewAction = null;
    this.selectedMedication = null;
    this.partialContext = false;
    this.analyzing = false;
    this.askingQuestion = false;
    this.savingReview = false;
    this.approvingPrescription = false;
    this.acknowledgedSafetyWarnings.clear();
    const routePatientId = this.route.snapshot.queryParamMap.get('patientId');
    this.consultationId =
      routePatientId === patient.id
        ? (this.route.snapshot.queryParamMap.get('consultationId') ?? '')
        : '';
    this.aiConsultationId =
      routePatientId === patient.id
        ? (this.route.snapshot.queryParamMap.get('aiConsultationId') ?? '')
        : '';
    this.errorMessage = '';
    this.actionMessage = '';
    this.chatQuestion = '';
    this.loadingContext = true;
    this.clinicalAI
      .getPatientHistory(patient.id, this.facilityId)
      .pipe(
        finalize(() => {
          if (generation === this.selectionGeneration)
            this.loadingContext = false;
        }),
      )
      .subscribe({
        next: (context) => {
          if (
            generation !== this.selectionGeneration ||
            this.selectedPatient?.id !== patient.id
          ) {
            return;
          }
          if (context.patientId !== patient.id) {
            this.errorMessage =
              'The authorized clinical context did not match the selected patient.';
            return;
          }
          this.patientContext = {
            ...context,
            laboratoryResults: context.laboratoryResults ?? [],
            imagingResults: context.imagingResults ?? [],
            currentMedications: context.currentMedications ?? [],
            allergies: context.allergies ?? [],
            medicalHistory: {
              conditions: context.medicalHistory?.conditions ?? [],
              previousDiagnoses:
                context.medicalHistory?.previousDiagnoses ?? [],
              previousConsultations:
                context.medicalHistory?.previousConsultations ?? [],
              previousMedications:
                context.medicalHistory?.previousMedications ?? [],
              allergies: context.medicalHistory?.allergies ?? [],
              adverseDrugReactions:
                context.medicalHistory?.adverseDrugReactions ?? [],
              procedures: context.medicalHistory?.procedures ?? [],
              relevantOutcomes: context.medicalHistory?.relevantOutcomes ?? [],
            },
          };
          this.editableVitals = this.patientContext.vitals
            ? { ...this.patientContext.vitals }
            : null;
          this.chiefComplaint = context.chiefComplaint ?? '';
          this.symptomsText = (context.symptoms ?? []).join(', ');
          this.symptomDuration = context.symptomDuration ?? '';
          this.relevantClinicalNotes = context.relevantClinicalNotes ?? '';
          this.partialContext =
            context.partialData ?? (context.unavailableData?.length ?? 0) > 0;
          if (context.consultationId) {
            if (
              this.consultationId &&
              this.consultationId !== context.consultationId
            ) {
              this.patientContext = null;
              this.consultationId = '';
              this.errorMessage =
                'The requested consultation does not match the selected patient context.';
              return;
            }
            this.consultationId = context.consultationId;
          }
          if (this.aiConsultationId) {
            this.loadExistingConsultation(
              generation,
              patient.id,
              this.aiConsultationId,
            );
          }
        },
        error: () => {
          if (generation === this.selectionGeneration) {
            this.errorMessage =
              'Patient clinical context is unavailable. No data was sent for analysis.';
          }
        },
      });
  }

  openAnalysisConfirmation(): void {
    if (!this.canRequestAnalysis || !this.canAnalyze) return;
    this.analysisDialog?.nativeElement.showModal();
  }

  confirmAnalysis(): void {
    this.analysisDialog?.nativeElement.close();
    const patient = this.selectedPatient;
    const context = this.patientContext;
    if (!this.canRequestAnalysis || !patient || !context || !this.canAnalyze)
      return;

    this.errorMessage = '';
    this.actionMessage = '';
    this.response = null;
    this.analyzing = true;
    const generation = this.selectionGeneration;
    const patientId = patient.id;
    const encounterId = this.consultationId;
    this.clinicalAI
      .analyze(this.buildConsultationRequest(patient, context))
      .pipe(
        timeout({ first: 60_000 }),
        finalize(() => {
          if (generation === this.selectionGeneration) this.analyzing = false;
        }),
      )
      .subscribe({
        next: (result) => {
          if (
            generation !== this.selectionGeneration ||
            this.selectedPatient?.id !== patientId ||
            this.consultationId !== encounterId
          ) {
            return;
          }
          if (!result.aiConsultationId) {
            this.errorMessage =
              'The AI response did not include its consultation record ID.';
            return;
          }
          this.aiConsultationId = result.aiConsultationId;
          this.response = this.normalizeResponse(result);
        },
        error: (error: unknown) => {
          if (generation !== this.selectionGeneration) return;
          this.errorMessage = this.isTimeout(error)
            ? 'AI analysis timed out. No clinical decision should be based on an incomplete response.'
            : 'Clinical AI is temporarily unavailable. Continue using the standard clinical workflow.';
        },
      });
  }

  beginReview(
    recommendationId: string,
    action: ClinicalRecommendationAction,
  ): void {
    if (!this.canReviewRecommendations) return;
    this.reviewAction = { recommendationId, action };
    this.feedbackReason = '';
    this.modifiedRecommendation = '';
  }

  saveReview(): void {
    const current = this.reviewAction;
    const patient = this.selectedPatient;
    if (
      !this.canReviewRecommendations ||
      !current ||
      !patient ||
      !this.aiConsultationId ||
      this.savingReview
    )
      return;
    if (current.action === 'rejected' && !this.feedbackReason.trim()) return;
    if (current.action === 'modified' && !this.modifiedRecommendation.trim())
      return;

    const feedback: ClinicalFeedbackRequest = {
      patientId: patient.id,
      consultationId: this.aiConsultationId,
      facilityId: this.facilityId,
      recommendationId: current.recommendationId,
      action: current.action,
      reason: this.feedbackReason.trim() || undefined,
      modifiedRecommendation: this.modifiedRecommendation.trim() || undefined,
    };
    this.savingReview = true;
    const generation = this.selectionGeneration;
    const patientId = patient.id;
    const encounterId = this.consultationId;
    const aiConsultationId = this.aiConsultationId;
    this.clinicalAI
      .submitFeedback(feedback)
      .pipe(
        finalize(() => {
          if (generation === this.selectionGeneration)
            this.savingReview = false;
        }),
      )
      .subscribe({
        next: (result) => {
          if (
            generation !== this.selectionGeneration ||
            this.selectedPatient?.id !== patientId ||
            this.consultationId !== encounterId ||
            this.aiConsultationId !== aiConsultationId
          ) {
            return;
          }
          this.actionMessage = result.recorded
            ? 'Your review was recorded for this consultation.'
            : 'The review could not be confirmed by the clinical service.';
          this.reviewAction = null;
          if (result.auditEvent && this.response) {
            this.response = {
              ...this.response,
              auditEvents: [
                ...(this.response.auditEvents ?? []),
                result.auditEvent,
              ],
            };
          }
        },
        error: () => {
          if (generation === this.selectionGeneration) {
            this.errorMessage =
              'Your review could not be saved. No prescription was created.';
          }
        },
      });
  }

  openPrescriptionReview(medication: MedicationRecommendation): void {
    if (!this.canApprovePrescriptions) return;
    this.selectedMedication = medication;
    this.prescriptionDraft = {
      drug: medication.genericName,
      dose: medication.suggestedDose ?? '',
      frequency: medication.frequency ?? '',
      route: medication.route ?? '',
      duration: medication.duration ?? '',
      quantity: medication.quantity ?? 0,
      instructions: medication.instructions ?? '',
    };
    this.prescriptionDialog?.nativeElement.showModal();
  }

  acknowledgeSafetyWarning(warningId: string, checked: boolean): void {
    if (checked) this.acknowledgedSafetyWarnings.add(warningId);
    else this.acknowledgedSafetyWarnings.delete(warningId);
  }

  approvePrescription(): void {
    const patient = this.selectedPatient;
    const medication = this.selectedMedication;
    if (
      !this.canApprovePrescriptions ||
      !patient ||
      !medication ||
      !this.aiConsultationId ||
      this.approvingPrescription
    )
      return;
    this.approvingPrescription = true;
    const generation = this.selectionGeneration;
    const patientId = patient.id;
    const encounterId = this.consultationId;
    const aiConsultationId = this.aiConsultationId;
    this.clinicalAI
      .approvePrescription({
        patientId: patient.id,
        consultationId: this.aiConsultationId,
        facilityId: this.facilityId,
        recommendationId: medication.id,
        prescription: { ...this.prescriptionDraft },
      })
      .pipe(
        finalize(() => {
          if (generation === this.selectionGeneration) {
            this.approvingPrescription = false;
          }
        }),
      )
      .subscribe({
        next: (result) => {
          if (
            generation !== this.selectionGeneration ||
            this.selectedPatient?.id !== patientId ||
            this.consultationId !== encounterId ||
            this.aiConsultationId !== aiConsultationId
          ) {
            return;
          }
          this.prescriptionDialog?.nativeElement.close();
          this.actionMessage = `Prescription ${result.prescriptionId} was submitted through the clinician approval workflow.`;
          if (result.auditEvent && this.response) {
            this.response = {
              ...this.response,
              auditEvents: [
                ...(this.response.auditEvents ?? []),
                result.auditEvent,
              ],
            };
          }
          this.selectedMedication = null;
        },
        error: () => {
          if (generation === this.selectionGeneration) {
            this.errorMessage =
              'Prescription approval could not be completed. No prescription status is assumed.';
          }
        },
      });
  }

  askQuestion(): void {
    const patient = this.selectedPatient;
    const question = this.chatQuestion.trim();
    if (
      !this.canRequestAnalysis ||
      !patient ||
      !this.response ||
      !question ||
      !this.aiConsultationId ||
      this.askingQuestion
    )
      return;
    this.askingQuestion = true;
    this.chatResponse = null;
    const generation = this.selectionGeneration;
    const patientId = patient.id;
    const encounterId = this.consultationId;
    const aiConsultationId = this.aiConsultationId;
    this.clinicalAI
      .askQuestion({
        patientId: patient.id,
        consultationId: this.aiConsultationId,
        facilityId: this.facilityId,
        question,
      })
      .pipe(
        timeout({ first: 60_000 }),
        finalize(() => {
          if (generation === this.selectionGeneration)
            this.askingQuestion = false;
        }),
      )
      .subscribe({
        next: (answer) => {
          if (
            generation === this.selectionGeneration &&
            this.selectedPatient?.id === patientId &&
            this.consultationId === encounterId &&
            this.aiConsultationId === aiConsultationId
          ) {
            this.chatResponse = answer;
          }
        },
        error: () => {
          if (generation === this.selectionGeneration) {
            this.errorMessage =
              'The clinical question could not be answered. Continue using standard clinical references.';
          }
        },
      });
  }

  get canAnalyze(): boolean {
    return !!(
      this.selectedPatient &&
      this.patientContext &&
      this.consultationId.trim() &&
      this.clinicianId &&
      this.chiefComplaint.trim() &&
      !this.loadingContext &&
      !this.analyzing
    );
  }

  get hasCriticalRedFlag(): boolean {
    return !!this.response?.redFlags.some(
      (flag) =>
        flag.requiresEmergencyEscalation || flag.severity === 'Critical',
    );
  }

  get lowConfidence(): boolean {
    return this.response?.confidenceLevel === 'Low';
  }

  get hasUnacknowledgedCriticalMedicationWarning(): boolean {
    return !!this.response?.medicationSafety.some(
      (warning) =>
        warning.acknowledgementRequired &&
        warning.severity === 'Critical' &&
        !this.acknowledgedSafetyWarnings.has(warning.id),
    );
  }

  get isClinicalReviewer(): boolean {
    return [
      'doctor',
      'physician',
      'specialist',
      'consultant',
      'medical_officer',
    ].includes(this.clinicianRole);
  }

  get isPrescribingClinician(): boolean {
    return this.isClinicalReviewer;
  }

  confidenceClass(confidence: ClinicalConfidence): string {
    return {
      High: 'confidence-high',
      Medium: 'confidence-medium',
      Low: 'confidence-low',
      Unknown: 'confidence-unknown',
    }[confidence];
  }

  redFlagClass(severity: ClinicalSeverity): string {
    return severity === 'Critical' || severity === 'Urgent'
      ? 'red-flag-critical'
      : severity === 'Warning'
        ? 'red-flag-warning'
        : 'red-flag-info';
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private buildConsultationRequest(
    patient: Patient,
    context: ClinicalPatientContext,
  ): ClinicalConsultationRequest {
    const symptoms = [
      this.symptomsText.trim() ? `Symptoms: ${this.symptomsText.trim()}` : '',
      this.symptomDuration.trim()
        ? `Duration: ${this.symptomDuration.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    return {
      patient_id: patient.id,
      consultation_id: this.consultationId,
      chief_complaint: this.chiefComplaint.trim(),
      symptoms,
      ...(this.editableVitals ? { vitals: this.editableVitals } : {}),
      laboratory_results: context.laboratoryResults ?? [],
      imaging_reports: context.imagingResults ?? [],
      pregnancy_status: context.pregnancyStatus,
      weight_kg: this.editableVitals?.weightKg,
    };
  }

  private loadExistingConsultation(
    generation: number,
    patientId: string,
    aiConsultationId: string,
  ): void {
    this.clinicalAI
      .getConsultation(aiConsultationId, this.facilityId)
      .subscribe({
        next: (result) => {
          if (
            generation !== this.selectionGeneration ||
            this.selectedPatient?.id !== patientId ||
            this.aiConsultationId !== aiConsultationId
          ) {
            return;
          }
          if (result.aiConsultationId !== aiConsultationId) {
            this.errorMessage =
              'Saved clinical decision support did not match the requested AI record.';
            return;
          }
          this.response = this.normalizeResponse(result);
        },
        error: (error: HttpErrorResponse) => {
          if (
            generation === this.selectionGeneration &&
            this.selectedPatient?.id === patientId &&
            this.aiConsultationId === aiConsultationId &&
            error.status !== 404
          ) {
            this.errorMessage =
              'Saved clinical decision support is unavailable.';
          }
        },
      });
  }

  selectPatientById(patientId: string): void {
    const patient = this.patients.find((item) => item.id === patientId);
    if (patient) this.selectPatient(patient);
  }

  private isTimeout(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError'
    );
  }

  private normalizeResponse(response: ClinicalAIResponse): ClinicalAIResponse {
    return {
      ...response,
      differentialDiagnoses: (response.differentialDiagnoses ?? []).map(
        (diagnosis) => ({
          ...diagnosis,
          supportingFindings: diagnosis.supportingFindings ?? [],
          contradictingFindings: diagnosis.contradictingFindings ?? [],
          relevantHistory: diagnosis.relevantHistory ?? [],
          confirmationInvestigations:
            diagnosis.confirmationInvestigations ?? [],
          evidenceCitations: diagnosis.evidenceCitations ?? [],
        }),
      ),
      redFlags: response.redFlags ?? [],
      recommendedInvestigations: (response.recommendedInvestigations ?? []).map(
        (investigation) => ({
          ...investigation,
          evidenceCitations: investigation.evidenceCitations ?? [],
        }),
      ),
      treatmentRecommendations: (response.treatmentRecommendations ?? []).map(
        (treatment) => ({
          ...treatment,
          medicationSuggestions: (treatment.medicationSuggestions ?? []).map(
            (medication) => ({
              ...medication,
              contraindications: medication.contraindications ?? [],
              allergies: medication.allergies ?? [],
              interactions: medication.interactions ?? [],
              sideEffects: medication.sideEffects ?? [],
              monitoringRequirements: medication.monitoringRequirements ?? [],
              evidenceCitations: medication.evidenceCitations ?? [],
            }),
          ),
          evidenceCitations: treatment.evidenceCitations ?? [],
        }),
      ),
      medicationSafety: response.medicationSafety ?? [],
      supportiveMeasures: response.supportiveMeasures ?? [],
      dietaryRecommendations: response.dietaryRecommendations ?? [],
      followUpRecommendations: response.followUpRecommendations ?? [],
      patientEducation: response.patientEducation ?? [],
      evidenceCitations: response.evidenceCitations ?? [],
    };
  }

  private readStoredUser(): StoredClinicalUser | null {
    try {
      return JSON.parse(
        localStorage.getItem('afyora.user') ?? 'null',
      ) as StoredClinicalUser | null;
    } catch {
      return null;
    }
  }
}
