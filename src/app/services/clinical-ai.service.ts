import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ClinicalAIResponse,
  ClinicalAIWireResponse,
  ClinicalChatRequest,
  ClinicalChatResponse,
  ClinicalChatWireResponse,
  ClinicalConsultationRequest,
  ClinicalFeedbackRequest,
  ClinicalFeedbackResponse,
  ClinicalPatientContext,
  ClinicalPatientHistoryApiResponse,
  ClinicalPatientHistorySnakeCaseResponse,
  ClinicalPrescriptionApprovalRequest,
  ClinicalPrescriptionApprovalResponse,
} from '../models/clinical-ai.models';

@Injectable({ providedIn: 'root' })
export class ClinicalAIService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/clinical-ai');

  getPatientHistory(
    patientId: string,
    facilityId: string | number,
  ): Observable<ClinicalPatientContext> {
    const query = new URLSearchParams({ facilityId: String(facilityId) });
    return this.http
      .get<ClinicalPatientHistoryApiResponse>(
        `${this.baseUrl}/patient-history/${encodeURIComponent(patientId)}/?${query}`,
      )
      .pipe(map((response) => this.mapPatientHistory(response)));
  }

  analyze(
    request: ClinicalConsultationRequest,
  ): Observable<ClinicalAIResponse> {
    return this.http
      .post<ClinicalAIWireResponse>(`${this.baseUrl}/consultation/`, request)
      .pipe(map((response) => mapClinicalAIResponse(response)));
  }

  getConsultation(
    consultationId: string,
    facilityId: string | number,
  ): Observable<ClinicalAIResponse> {
    return this.http
      .get<ClinicalAIWireResponse>(
        `${this.baseUrl}/consultation/${encodeURIComponent(consultationId)}/?facilityId=${encodeURIComponent(String(facilityId))}`,
      )
      .pipe(map((response) => mapClinicalAIResponse(response)));
  }

  askQuestion(request: ClinicalChatRequest): Observable<ClinicalChatResponse> {
    return this.http
      .post<ClinicalChatWireResponse>(`${this.baseUrl}/chat/`, request)
      .pipe(
        map((response) => ({
          consultationId: response.consultation_id,
          answer: response.reply ?? response.answer ?? '',
          evidenceCitations: response.evidence_citations ?? [],
          uncertainty:
            normalizeStringList(response.uncertainty).join(' ') || undefined,
          disclaimer: response.disclaimer,
        })),
      );
  }

  submitFeedback(
    request: ClinicalFeedbackRequest,
  ): Observable<ClinicalFeedbackResponse> {
    return this.http.post<ClinicalFeedbackResponse>(
      `${this.baseUrl}/feedback/`,
      request,
    );
  }

  approvePrescription(
    request: ClinicalPrescriptionApprovalRequest,
  ): Observable<ClinicalPrescriptionApprovalResponse> {
    return this.http.post<ClinicalPrescriptionApprovalResponse>(
      `${this.baseUrl}/prescription/approve/`,
      request,
    );
  }

  private mapPatientHistory(
    response: ClinicalPatientHistoryApiResponse,
  ): ClinicalPatientContext {
    if ('patientId' in response) return response;

    const demographics = response.demographics;
    const medicalHistory = {
      conditions: mapHistoryItems(response.active_problems),
      previousDiagnoses: mapHistoryItems(response.previous_diagnoses),
      previousConsultations: mapHistoryItems(response.previous_consultations),
      previousMedications: mapHistoryItems(response.previous_medications),
      allergies: mapHistoryItems(response.allergies),
      adverseDrugReactions: mapHistoryItems(response.adverse_drug_reactions),
      procedures: mapHistoryItems(response.procedures),
      relevantOutcomes: mapHistoryItems(response.relevant_outcomes),
    };

    return {
      patientId: response.patient_id ?? demographics?.patient_id ?? '',
      consultationId: response.consultation_id,
      demographics:
        demographics?.age != null && demographics.gender
          ? {
              age: demographics.age,
              sex: demographics.gender,
              dateOfBirth: demographics.date_of_birth ?? undefined,
              bloodGroup: demographics.blood_group,
            }
          : undefined,
      chiefComplaint: response.chief_complaint,
      symptoms:
        typeof response.symptoms === 'string'
          ? [response.symptoms]
          : (response.symptoms ?? []),
      symptomDuration: response.symptom_duration,
      relevantClinicalNotes: response.relevant_clinical_notes,
      allergies: medicalHistory.allergies,
      medicalHistory,
      currentMedications: (response.current_medications ?? []).flatMap(
        (prescription) =>
          (prescription.drugs ?? []).flatMap((drug) =>
            drug.name
              ? [
                  {
                    name: drug.name,
                    dose: drug.dosage ?? drug.dose,
                    frequency: drug.frequency,
                    status: prescription.status,
                  },
                ]
              : [],
          ),
      ),
      laboratoryResults: (response.recent_lab_results ?? []).flatMap(
        (lab, labIndex) => {
          const testName = lab.test_name ?? 'Laboratory result';
          const labId = lab.lab_id ?? `lab-${labIndex + 1}`;
          const parameters = lab.parameters ?? [];
          if (!parameters.length) {
            return [
              {
                id: labId,
                name: testName,
                value: undefined,
                unit: undefined,
                referenceRange: undefined,
                status: undefined,
                reportStatus: lab.status,
                remarks: lab.remarks,
                testedAt: lab.completed_date,
              },
            ];
          }
          return parameters.map((parameter, parameterIndex) => ({
            id: `${labId}-${parameterIndex + 1}`,
            name: parameter.name ? `${testName} · ${parameter.name}` : testName,
            value:
              parameter.value == null ? undefined : String(parameter.value),
            unit: parameter.unit,
            referenceRange: parameter.range ?? parameter.reference_range,
            status: parameter.status,
            reportStatus: lab.status,
            remarks: lab.remarks,
            testedAt: lab.completed_date,
          }));
        },
      ),
      imagingResults: (response.recent_imaging_reports ?? []).map(
        (report, index) => ({
          id: report.report_id ?? `imaging-${index + 1}`,
          modality: report.modality ?? report.study_name ?? 'Imaging report',
          studyName: report.study_name,
          bodyPart: report.body_part,
          findings: report.findings,
          impression: report.impression,
          status: report.status,
          reportDate: report.scan_date,
          reportUrl: report.report_url,
        }),
      ),
      pregnancyStatus: response.pregnancy_status,
      partialData: response.partial_data,
      unavailableData: response.unavailable_data,
    };
  }
}

function mapHistoryItems(
  items?: ClinicalPatientHistorySnakeCaseResponse['active_problems'],
): string[] {
  return (items ?? [])
    .map((item) => {
      if (typeof item === 'string') return item;
      return (
        item.display ??
        item.name ??
        item.condition ??
        item.diagnosis ??
        item.description ??
        item.allergen_name ??
        item.allergenName ??
        ''
      );
    })
    .filter((item) => item.length > 0);
}

function mapClinicalAIResponse(
  payload: ClinicalAIWireResponse,
): ClinicalAIResponse {
  const response = payload.raw_response ?? payload;
  const aiConsultationId = String(
    response.consultation_id ?? payload.consultation_id ?? payload.id ?? '',
  );
  const redFlags = (response.red_flags ?? []).map((flag, index) => {
    const warning = typeof flag === 'string' ? { detail: flag } : flag;
    return {
      id: String(warning.id ?? `${aiConsultationId}-red-flag-${index + 1}`),
      title: warning.title ?? warning.name ?? 'Clinical warning',
      detail: warning.detail ?? warning.message ?? '',
      severity: mapSeverity(warning.severity),
      requiresEmergencyEscalation:
        warning.requires_emergency_escalation ?? false,
      escalationInstructions: warning.escalation_instructions,
    };
  });

  if (response.emergency && redFlags.length === 0) {
    redFlags.push({
      id: `${aiConsultationId}-emergency`,
      title: 'Emergency warning',
      detail: 'The backend marked this response as an emergency.',
      severity: 'Critical',
      requiresEmergencyEscalation: true,
      escalationInstructions: response.urgency,
    });
  }

  return {
    aiConsultationId,
    clinicalSummary: response.clinical_summary ?? '',
    differentialDiagnoses: (response.differential_diagnoses ?? []).map(
      (diagnosis, index) => ({
        id: String(
          diagnosis.id ??
            diagnosis.code ??
            `${aiConsultationId}-dx-${index + 1}`,
        ),
        name:
          diagnosis.disease ??
          diagnosis.diagnosis ??
          diagnosis.name ??
          'Differential consideration',
        confidence: mapConfidence(diagnosis.confidence),
        uncertainty: diagnosis.uncertainty,
        supportingFindings: diagnosis.supporting_findings ?? [],
        contradictingFindings: diagnosis.contradicting_findings ?? [],
        relevantHistory: [],
        confirmationInvestigations:
          diagnosis.recommended_confirmation_tests ?? [],
        evidenceCitations: diagnosis.evidence ?? [],
      }),
    ),
    redFlags,
    recommendedInvestigations: (response.recommended_investigations ?? []).map(
      (investigation, index) => ({
        id: String(
          investigation.id ?? `${aiConsultationId}-investigation-${index + 1}`,
        ),
        name: investigation.test_name ?? investigation.name ?? 'Investigation',
        rationale: investigation.indication ?? '',
        urgency: investigation.urgency,
        evidenceCitations: investigation.evidence ?? [],
      }),
    ),
    treatmentRecommendations: (response.treatment_recommendations ?? []).map(
      (treatment, index) => ({
        id: String(
          treatment.id ?? `${aiConsultationId}-treatment-${index + 1}`,
        ),
        title:
          treatment.title ??
          treatment.recommendation ??
          treatment.treatment ??
          'Treatment consideration',
        rationale: treatment.rationale ?? '',
        medicationSuggestions: (
          treatment.medication_suggestions ??
          treatment.medications ??
          []
        ).map((medication, medicationIndex) => ({
          id: String(
            medication.id ??
              `${aiConsultationId}-medication-${index + 1}-${medicationIndex + 1}`,
          ),
          genericName:
            medication.generic_name ??
            medication.drug_name ??
            medication.name ??
            'Medication consideration',
          brandNames: medication.brand_names,
          suggestedDose:
            medication.suggested_dose ?? medication.dose ?? medication.dosage,
          frequency: medication.frequency,
          route: medication.route,
          duration: medication.duration,
          quantity: medication.quantity,
          instructions: medication.instructions,
          indication: medication.indication,
          contraindications: medication.contraindications ?? [],
          allergies: medication.allergies ?? [],
          interactions: medication.interactions ?? [],
          sideEffects: medication.side_effects ?? [],
          monitoringRequirements: medication.monitoring_requirements ?? [],
          evidenceCitations: medication.evidence ?? [],
        })),
        evidenceCitations: treatment.evidence ?? [],
      }),
    ),
    medicationSafety: (response.medication_safety ?? []).map(
      (warning, index) => ({
        id: String(warning.id ?? `${aiConsultationId}-safety-${index + 1}`),
        category: warning.category ?? warning.type ?? 'Medication safety',
        severity: mapSeverity(warning.severity),
        message: warning.message ?? warning.warning ?? '',
        acknowledgementRequired: warning.acknowledgement_required ?? false,
      }),
    ),
    supportiveMeasures: response.supportive_measures ?? [],
    dietaryRecommendations: response.dietary_recommendations ?? [],
    followUpRecommendations: normalizeStringList(response.follow_up),
    patientEducation: response.patient_education ?? [],
    evidenceCitations: response.evidence_citations ?? [],
    confidenceLevel: mapConfidence(response.confidence_level),
    uncertainty: normalizeStringList(response.uncertainty).join(' '),
    modelVersion:
      response.model_version ?? response.knowledge_version ?? 'Unknown',
    generatedAt: response.generated_at ?? '',
    disclaimer:
      response.disclaimer ??
      'Advisory only. Verify recommendations independently.',
  };
}

function mapConfidence(value?: string): ClinicalAIResponse['confidenceLevel'] {
  switch (value?.toLowerCase()) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
}

function mapSeverity(
  value?: string,
): ClinicalAIResponse['redFlags'][number]['severity'] {
  switch (value?.toLowerCase()) {
    case 'critical':
      return 'Critical';
    case 'urgent':
      return 'Urgent';
    case 'warning':
      return 'Warning';
    default:
      return 'Info';
  }
}

function normalizeStringList(value?: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
