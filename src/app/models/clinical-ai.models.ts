export type ClinicalConfidence = 'High' | 'Medium' | 'Low' | 'Unknown';
export type ClinicalSeverity = 'Critical' | 'Urgent' | 'Warning' | 'Info';
export type ClinicalRecommendationAction =
  | 'accepted'
  | 'modified'
  | 'rejected'
  | 'saved';

export interface ClinicalVitals {
  temperatureC?: number | null;
  heartRateBpm?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturationPercent?: number | null;
  bloodGlucose?: number | null;
  weightKg?: number | null;
  recordedAt?: string;
}

export interface ClinicalLabResult {
  id: string;
  name: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
  reportStatus?: string;
  remarks?: string;
  testedAt?: string;
}

export interface ClinicalImagingResult {
  id: string;
  modality: string;
  studyName?: string;
  bodyPart?: string;
  findings?: string;
  impression?: string;
  status?: string;
  reportDate?: string;
  reportUrl?: string;
}

export interface ClinicalMedication {
  name: string;
  dose?: string;
  frequency?: string;
  status?: string;
}

export interface ClinicalMedicalHistory {
  conditions: string[];
  previousDiagnoses: string[];
  previousConsultations: string[];
  previousMedications: string[];
  allergies: string[];
  adverseDrugReactions: string[];
  procedures: string[];
  relevantOutcomes: string[];
}

export interface ClinicalPatientContext {
  patientId: string;
  consultationId?: string;
  demographics?: ClinicalDemographics & { bloodGroup?: string };
  chiefComplaint?: string;
  symptoms?: string[];
  symptomDuration?: string;
  relevantClinicalNotes?: string;
  vitals?: ClinicalVitals | null;
  laboratoryResults?: ClinicalLabResult[];
  imagingResults?: ClinicalImagingResult[];
  currentMedications?: ClinicalMedication[];
  allergies?: string[];
  medicalHistory?: ClinicalMedicalHistory;
  pregnancyStatus?: string;
  partialData?: boolean;
  unavailableData?: string[];
}

export interface ClinicalHistoryItem {
  id?: string;
  name?: string;
  display?: string;
  description?: string;
  condition?: string;
  diagnosis?: string;
  allergen_name?: string;
  allergenName?: string;
}

export type ClinicalHistoryValue = string | ClinicalHistoryItem;

export interface ClinicalPatientHistoryDemographics {
  patient_id?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string | null;
  blood_group?: string;
}

export interface ClinicalPatientHistoryLabParameter {
  name?: string;
  value?: string | number | null;
  unit?: string;
  range?: string;
  reference_range?: string;
  status?: string;
}

export interface ClinicalPatientHistoryLabResult {
  lab_id?: string;
  test_name?: string;
  completed_date?: string;
  status?: string;
  parameters?: ClinicalPatientHistoryLabParameter[];
  remarks?: string;
}

export interface ClinicalPatientHistoryDrug {
  id?: string;
  name?: string;
  dosage?: string;
  dose?: string;
  frequency?: string;
  route?: string;
}

export interface ClinicalPatientHistoryMedication {
  prescription_id?: string;
  date?: string;
  status?: string;
  drugs?: ClinicalPatientHistoryDrug[];
}

export interface ClinicalPatientHistoryImagingReport {
  report_id?: string;
  study_name?: string;
  modality?: string;
  body_part?: string;
  scan_date?: string;
  findings?: string;
  impression?: string;
  status?: string;
  report_url?: string;
}

export interface ClinicalPatientHistorySnakeCaseResponse {
  patient_id?: string;
  consultation_id?: string;
  demographics?: ClinicalPatientHistoryDemographics;
  chief_complaint?: string;
  symptoms?: string[] | string;
  symptom_duration?: string;
  relevant_clinical_notes?: string;
  allergies?: ClinicalHistoryValue[];
  active_problems?: ClinicalHistoryValue[];
  previous_diagnoses?: ClinicalHistoryValue[];
  previous_consultations?: ClinicalHistoryValue[];
  previous_medications?: ClinicalHistoryValue[];
  adverse_drug_reactions?: ClinicalHistoryValue[];
  procedures?: ClinicalHistoryValue[];
  relevant_outcomes?: ClinicalHistoryValue[];
  current_medications?: ClinicalPatientHistoryMedication[];
  recent_lab_results?: ClinicalPatientHistoryLabResult[];
  recent_imaging_reports?: ClinicalPatientHistoryImagingReport[];
  pregnancy_status?: string;
  partial_data?: boolean;
  unavailable_data?: string[];
}

export type ClinicalPatientHistoryApiResponse =
  | ClinicalPatientContext
  | ClinicalPatientHistorySnakeCaseResponse;

export interface ClinicalDemographics {
  age: number;
  sex: string;
  dateOfBirth?: string;
}

export interface ClinicalConsultationRequest {
  patient_id: string;
  consultation_id: string;
  chief_complaint: string;
  symptoms: string;
  vitals?: ClinicalVitals;
  laboratory_results: ClinicalLabResult[];
  imaging_reports: ClinicalImagingResult[];
  pregnancy_status?: string;
  breastfeeding?: boolean | null;
  weight_kg?: number | null;
  renal_function?: string;
  hepatic_function?: string;
}

export interface EvidenceCitation {
  source: string;
  publication?: string;
  versionOrDate?: string;
  recommendation?: string;
  url?: string;
}

export interface ClinicalRedFlag {
  id: string;
  title: string;
  detail: string;
  severity: ClinicalSeverity;
  requiresEmergencyEscalation: boolean;
  escalationInstructions?: string;
}

export interface DifferentialDiagnosis {
  id: string;
  name: string;
  confidence: ClinicalConfidence;
  uncertainty?: string;
  supportingFindings: string[];
  contradictingFindings: string[];
  relevantHistory: string[];
  confirmationInvestigations: string[];
  evidenceCitations: EvidenceCitation[];
}

export interface RecommendedInvestigation {
  id: string;
  name: string;
  rationale: string;
  urgency?: string;
  evidenceCitations: EvidenceCitation[];
}

export interface MedicationRecommendation {
  id: string;
  genericName: string;
  brandNames?: string[];
  suggestedDose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  indication?: string;
  contraindications: string[];
  allergies: string[];
  interactions: string[];
  sideEffects: string[];
  monitoringRequirements: string[];
  evidenceCitations: EvidenceCitation[];
}

export interface TreatmentRecommendation {
  id: string;
  title: string;
  rationale: string;
  medicationSuggestions: MedicationRecommendation[];
  evidenceCitations: EvidenceCitation[];
}

export interface MedicationSafetyWarning {
  id: string;
  category: string;
  severity: ClinicalSeverity;
  message: string;
  acknowledgementRequired: boolean;
}

export interface ClinicalAuditEvent {
  id: string;
  event: string;
  occurredAt: string;
  actorDisplayName?: string;
}

export interface ClinicalAIResponse {
  aiConsultationId: string;
  clinicalSummary: string;
  differentialDiagnoses: DifferentialDiagnosis[];
  redFlags: ClinicalRedFlag[];
  recommendedInvestigations: RecommendedInvestigation[];
  treatmentRecommendations: TreatmentRecommendation[];
  medicationSafety: MedicationSafetyWarning[];
  supportiveMeasures: string[];
  dietaryRecommendations: string[];
  followUpRecommendations: string[];
  patientEducation: string[];
  evidenceCitations: EvidenceCitation[];
  confidenceLevel: ClinicalConfidence;
  uncertainty: string;
  modelVersion: string;
  generatedAt: string;
  disclaimer: string;
  auditEvents?: ClinicalAuditEvent[];
}

export interface ClinicalAIWireDifferential {
  id?: string | number;
  disease?: string;
  diagnosis?: string;
  name?: string;
  code?: string;
  confidence?: string;
  uncertainty?: string;
  supporting_findings?: string[];
  contradicting_findings?: string[];
  missing_information?: string[];
  recommended_confirmation_tests?: string[];
  evidence?: EvidenceCitation[];
}

export interface ClinicalAIWireRedFlag {
  id?: string | number;
  title?: string;
  name?: string;
  detail?: string;
  message?: string;
  severity?: string;
  requires_emergency_escalation?: boolean;
  escalation_instructions?: string;
}

export interface ClinicalAIWireInvestigation {
  id?: string | number;
  test_name?: string;
  name?: string;
  indication?: string;
  urgency?: string;
  evidence?: EvidenceCitation[];
}

export interface ClinicalAIWireMedication {
  id?: string | number;
  generic_name?: string;
  drug_name?: string;
  name?: string;
  brand_names?: string[];
  suggested_dose?: string;
  dose?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  indication?: string;
  contraindications?: string[];
  allergies?: string[];
  interactions?: string[];
  side_effects?: string[];
  monitoring_requirements?: string[];
  evidence?: EvidenceCitation[];
}

export interface ClinicalAIWireTreatment {
  id?: string | number;
  title?: string;
  recommendation?: string;
  treatment?: string;
  rationale?: string;
  medication_suggestions?: ClinicalAIWireMedication[];
  medications?: ClinicalAIWireMedication[];
  evidence?: EvidenceCitation[];
}

export interface ClinicalAIWireMedicationSafety {
  id?: string | number;
  category?: string;
  type?: string;
  severity?: string;
  message?: string;
  warning?: string;
  acknowledgement_required?: boolean;
}

export interface ClinicalAIWireResponse {
  consultation_id?: string;
  id?: string | number;
  status?: string;
  clinical_summary?: string;
  emergency?: boolean;
  urgency?: string;
  red_flags?: (ClinicalAIWireRedFlag | string)[];
  differential_diagnoses?: ClinicalAIWireDifferential[];
  recommended_investigations?: ClinicalAIWireInvestigation[];
  treatment_recommendations?: ClinicalAIWireTreatment[];
  medication_safety?: ClinicalAIWireMedicationSafety[];
  supportive_measures?: string[];
  dietary_recommendations?: string[];
  patient_education?: string[];
  follow_up?: string[] | string;
  evidence_citations?: EvidenceCitation[];
  confidence_level?: string;
  uncertainty?: string[] | string;
  model_version?: string;
  knowledge_version?: string;
  generated_at?: string;
  disclaimer?: string;
  raw_response?: ClinicalAIWireResponse;
}

export interface ClinicalChatRequest {
  patientId: string;
  consultationId: string;
  facilityId: string | number;
  question: string;
}

export interface ClinicalChatResponse {
  consultationId?: string;
  answer: string;
  evidenceCitations: EvidenceCitation[];
  uncertainty?: string;
  disclaimer?: string;
}

export interface ClinicalChatWireResponse {
  consultation_id?: string;
  reply?: string;
  answer?: string;
  evidence_citations?: EvidenceCitation[];
  uncertainty?: string[] | string;
  disclaimer?: string;
}

export interface ClinicalFeedbackRequest {
  patientId: string;
  consultationId: string;
  facilityId: string | number;
  recommendationId: string;
  action: ClinicalRecommendationAction;
  reason?: string;
  modifiedRecommendation?: string;
}

export interface ClinicalFeedbackResponse {
  recorded: boolean;
  auditEvent?: ClinicalAuditEvent;
}

export interface ClinicalPrescriptionApprovalRequest {
  patientId: string;
  consultationId: string;
  facilityId: string | number;
  recommendationId: string;
  prescription: {
    drug: string;
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    quantity: number;
    instructions: string;
  };
}

export interface ClinicalPrescriptionApprovalResponse {
  prescriptionId: string;
  auditEvent?: ClinicalAuditEvent;
}
