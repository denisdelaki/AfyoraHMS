import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { apiUrl } from '../core/api.config';
import {
  ClinicalAIResponse,
  ClinicalPatientContext,
} from '../models/clinical-ai.models';
import { ClinicalAIService } from './clinical-ai.service';

describe('ClinicalAIService', () => {
  let service: ClinicalAIService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClinicalAIService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads patient context through the authenticated Django API gateway', () => {
    let context: ClinicalPatientContext | undefined;
    service.getPatientHistory('PAT/0001', 12).subscribe((result) => {
      context = result;
    });
    const request = httpMock.expectOne(
      `${apiUrl('/clinical-ai')}/patient-history/PAT%2F0001/?facilityId=12`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.url).not.toContain(':8001');
    request.flush({
      demographics: {
        patient_id: 'PAT/0001',
        age: 56,
        gender: 'male',
        date_of_birth: null,
        blood_group: 'A-',
      },
      allergies: [],
      active_problems: [{ display: 'Type 2 diabetes mellitus' }],
      previous_diagnoses: ['Diabetes mellitus'],
      current_medications: [
        {
          prescription_id: 'RX003',
          date: '2026-08-05',
          status: 'Pending',
          drugs: [
            {
              id: '',
              name: 'insulin',
              quantity: 4,
              dosage: '500ml injection twice a day',
            },
          ],
        },
      ],
      recent_lab_results: [
        {
          lab_id: 'LAB-001',
          test_name: 'Complete Blood Count (CBC)',
          completed_date: '2026-08-11',
          status: 'Approved',
          parameters: [
            {
              name: 'hkh',
              value: 'hk',
              unit: 'kk',
              range: 'mn',
              status: 'Normal',
            },
            {
              name: 'b',
              value: 'bb',
              unit: 'mnmn',
              range: 'nn',
              status: 'Normal',
            },
          ],
          remarks: 'nb',
        },
      ],
      recent_imaging_reports: [
        {
          report_id: 'RPT001',
          study_name: 'chest x-raay',
          modality: 'CT Scan',
          body_part: 'thorrax',
          scan_date: '2026-08-15',
          findings: 'sd',
          impression: 'sd',
          status: 'Draft',
        },
        {
          report_id: 'RPT002',
          study_name: 'chest x-raay',
          modality: 'CT Scan',
          body_part: 'thorrax',
          scan_date: '2026-08-15',
          findings: 'cxv',
          impression: 'xcv',
          status: 'Draft',
        },
      ],
    });

    expect(context?.patientId).toBe('PAT/0001');
    expect(context?.demographics).toEqual({
      age: 56,
      sex: 'male',
      dateOfBirth: undefined,
      bloodGroup: 'A-',
    });
    expect(context?.currentMedications?.[0]).toEqual({
      name: 'insulin',
      dose: '500ml injection twice a day',
      frequency: undefined,
      status: 'Pending',
    });
    expect(context?.laboratoryResults?.length).toBe(2);
    expect(context?.laboratoryResults?.[0]).toEqual(
      jasmine.objectContaining({
        id: 'LAB-001-1',
        name: 'Complete Blood Count (CBC) · hkh',
        value: 'hk',
        unit: 'kk',
        referenceRange: 'mn',
        status: 'Normal',
        reportStatus: 'Approved',
        testedAt: '2026-08-11',
      }),
    );
    expect(context?.imagingResults?.length).toBe(2);
    expect(context?.imagingResults?.[0]).toEqual(
      jasmine.objectContaining({
        id: 'RPT001',
        modality: 'CT Scan',
        studyName: 'chest x-raay',
        bodyPart: 'thorrax',
        findings: 'sd',
        impression: 'sd',
        status: 'Draft',
        reportDate: '2026-08-15',
      }),
    );
    expect(context?.medicalHistory?.conditions).toEqual([
      'Type 2 diabetes mellitus',
    ]);
    expect(context?.medicalHistory?.previousDiagnoses).toEqual([
      'Diabetes mellitus',
    ]);
  });

  it('posts analysis to the gateway without persisting patient data locally', () => {
    const requestBody = {
      patient_id: 'PAT0001',
      consultation_id: 'CONS-01',
      chief_complaint: 'Headache',
      symptoms: 'Symptoms: Headache; Duration: 2 days',
      laboratory_results: [],
      imaging_reports: [],
    };

    let mappedResponse: ClinicalAIResponse | undefined;
    service.analyze(requestBody).subscribe((response) => {
      mappedResponse = response;
    });

    const request = httpMock.expectOne(
      `${apiUrl('/clinical-ai')}/consultation/`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    expect(request.request.url).not.toContain(':8001');
    request.flush({
      consultation_id: '6',
      status: 'success',
      clinical_summary: 'Clinical evaluation for running stomach.',
      emergency: false,
      urgency: 'Routine',
      red_flags: [],
      differential_diagnoses: [
        {
          disease: 'Acute Undifferentiated Febrile / Systemic Illness',
          code: 'R50.9',
          confidence: 'low',
          supporting_findings: ['diarrhoea for 2 days'],
          contradicting_findings: [],
          recommended_confirmation_tests: ['Full Blood Count'],
        },
      ],
      recommended_investigations: [
        {
          test_name: 'Full Blood Count',
          indication: 'Confirmation',
          urgency: 'routine',
        },
      ],
      treatment_recommendations: [],
      medication_safety: [],
      supportive_measures: ['Maintain oral fluids.'],
      dietary_recommendations: ['Eat small frequent meals.'],
      patient_education: ['Return if symptoms worsen.'],
      follow_up: ['Review in 48-72 hours.'],
      evidence_citations: [],
      confidence_level: 'low',
      uncertainty: ['Some patient data is missing.'],
      model_version: 'afyora-cds-v1.0',
      knowledge_version: 'knhts-who-v2026.1',
      generated_at: '2026-10-05T16:44:44.446446+00:00',
      disclaimer: 'Advisory only.',
    });

    expect(mappedResponse?.aiConsultationId).toBe('6');
    expect(mappedResponse?.clinicalSummary).toBe(
      'Clinical evaluation for running stomach.',
    );
    expect(mappedResponse?.differentialDiagnoses[0].name).toBe(
      'Acute Undifferentiated Febrile / Systemic Illness',
    );
    expect(mappedResponse?.differentialDiagnoses[0].confidence).toBe('Low');
    expect(mappedResponse?.recommendedInvestigations[0].name).toBe(
      'Full Blood Count',
    );
    expect(mappedResponse?.followUpRecommendations).toEqual([
      'Review in 48-72 hours.',
    ]);
  });

  it('preserves plain-text and structured red flags in analysis responses', () => {
    let response: ClinicalAIResponse | undefined;
    service
      .analyze({
        patient_id: 'PAT0001',
        consultation_id: 'CONS-01',
        chief_complaint: 'Headache',
        symptoms: 'Headache for two days',
        laboratory_results: [],
        imaging_reports: [],
      })
      .subscribe((result) => {
        response = result;
      });

    httpMock.expectOne(`${apiUrl('/clinical-ai')}/consultation/`).flush({
      consultation_id: '6',
      red_flags: [
        'Seek urgent review if symptoms worsen.',
        'Monitor for new symptoms.',
        {
          id: 'critical-1',
          title: 'Urgent assessment',
          message: 'Immediate clinical assessment is required.',
          severity: 'critical',
          requires_emergency_escalation: true,
          escalation_instructions: 'Follow the emergency pathway.',
        },
      ],
    });

    expect(response?.redFlags.length).toBe(3);
    expect(response?.redFlags[0]).toEqual(
      jasmine.objectContaining({
        id: '6-red-flag-1',
        detail: 'Seek urgent review if symptoms worsen.',
        severity: 'Info',
      }),
    );
    expect(response?.redFlags[1].detail).toBe('Monitor for new symptoms.');
    expect(response?.redFlags[1].id).toBe('6-red-flag-2');
    expect(response?.redFlags[2]).toEqual(
      jasmine.objectContaining({
        id: 'critical-1',
        title: 'Urgent assessment',
        detail: 'Immediate clinical assessment is required.',
        severity: 'Critical',
        requiresEmergencyEscalation: true,
        escalationInstructions: 'Follow the emergency pathway.',
      }),
    );
  });

  it('maps triage and referral disposition for the outcome section', () => {
    let response: ClinicalAIResponse | undefined;
    service
      .analyze({
        patient_id: 'PAT0001',
        consultation_id: 'CONS-01',
        chief_complaint: 'Shortness of breath',
        symptoms: '',
        laboratory_results: [],
        imaging_reports: [],
      })
      .subscribe((result) => {
        response = result;
      });

    httpMock.expectOne(`${apiUrl('/clinical-ai')}/consultation/`).flush({
      clinical_summary: 'Urgent assessment is required.',
      risk_level: 'high',
      triage: {
        level: 'urgent',
        urgent_care_recommended: true,
        reasons: ['Oxygen saturation is critically low.'],
        recommendation: 'Urgent in-person assessment now.',
        requires_human_review: true,
        rule_set: 'adult-vital-screening-v1',
      },
      referral_recommendation: {
        required: true,
        urgency: 'urgent',
        reason: 'Transfer for urgent clinical assessment.',
      },
      requires_human_review: true,
    });

    expect(response?.riskLevel).toBe('high');
    expect(response?.triage).toEqual({
      level: 'urgent',
      urgentCareRecommended: true,
      reasons: ['Oxygen saturation is critically low.'],
      recommendation: 'Urgent in-person assessment now.',
      requiresHumanReview: true,
      ruleSet: 'adult-vital-screening-v1',
    });
    expect(response?.referralRecommendation).toEqual({
      required: true,
      urgency: 'urgent',
      reason: 'Transfer for urgent clinical assessment.',
    });
    expect(response?.requiresHumanReview).toBe(true);
  });

  it('preserves plain-text red flags in saved raw responses', () => {
    let response: ClinicalAIResponse | undefined;
    service.getConsultation('6', 12).subscribe((result) => {
      response = result;
    });

    httpMock
      .expectOne(`${apiUrl('/clinical-ai')}/consultation/6/?facilityId=12`)
      .flush({
        consultation_id: '6',
        raw_response: {
          red_flags: ['Review worsening symptoms promptly.'],
        },
      });

    expect(response?.redFlags[0].detail).toBe(
      'Review worsening symptoms promptly.',
    );
  });

  it('scopes saved consultation retrieval to the current facility', () => {
    service.getConsultation('CONS/01', 12).subscribe();

    const request = httpMock.expectOne(
      `${apiUrl('/clinical-ai')}/consultation/CONS%2F01/?facilityId=12`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('maps the Django chat reply into the rendered answer and preserves its disclaimer', () => {
    let mappedResponse:
      | import('../models/clinical-ai.models').ClinicalChatResponse
      | undefined;
    service
      .askQuestion({
        patientId: 'PAT0001',
        consultationId: '12',
        facilityId: 9,
        question: 'What about drugs?',
      })
      .subscribe((response) => {
        mappedResponse = response;
      });

    const request = httpMock.expectOne(`${apiUrl('/clinical-ai')}/chat/`);
    expect(request.request.method).toBe('POST');
    request.flush({
      consultation_id: '12',
      reply:
        "Regarding 'drugs?': Please review the patient's vitals, active problem list, and lab results. All treatment actions must be confirmed by the treating clinician.",
      disclaimer:
        'This response is advisory decision support and does not replace clinician judgment.',
    });

    expect(mappedResponse?.consultationId).toBe('12');
    expect(mappedResponse?.answer).toContain("Regarding 'drugs?'");
    expect(mappedResponse?.disclaimer).toContain('advisory decision support');
    expect(mappedResponse?.evidenceCitations).toEqual([]);
  });
});
