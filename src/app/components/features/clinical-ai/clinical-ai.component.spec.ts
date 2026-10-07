import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { PermissionsService } from '../../../core/permissions.service';
import {
  ClinicalAIResponse,
  ClinicalPatientContext,
} from '../../../models/clinical-ai.models';
import { ClinicalAIService } from '../../../services/clinical-ai.service';
import { PatientsService } from '../../../services/patients.service';
import { ClinicalAIComponent } from './clinical-ai.component';

describe('ClinicalAIComponent', () => {
  let fixture: ComponentFixture<ClinicalAIComponent>;
  let component: ClinicalAIComponent;
  let clinicalAI: any;
  let permissions: any;

  const response: ClinicalAIResponse = {
    aiConsultationId: '6',
    clinicalSummary: '<img src=x onerror=alert(1)>',
    differentialDiagnoses: [],
    redFlags: [],
    recommendedInvestigations: [],
    treatmentRecommendations: [],
    medicationSafety: [],
    supportiveMeasures: [],
    dietaryRecommendations: [],
    followUpRecommendations: [],
    patientEducation: [],
    evidenceCitations: [],
    confidenceLevel: 'Low',
    uncertainty: 'Limited context',
    modelVersion: 'test',
    generatedAt: '2026-01-01T00:00:00Z',
    disclaimer: 'Advisory only',
  };

  beforeEach(async () => {
    clinicalAI = {
      getPatientHistory: jasmine
        .createSpy('getPatientHistory')
        .and.returnValue(of({ patientId: 'PAT0001' })),
      analyze: jasmine.createSpy('analyze').and.returnValue(of(response)),
      getConsultation: jasmine
        .createSpy('getConsultation')
        .and.returnValue(of(response)),
      askQuestion: jasmine.createSpy('askQuestion'),
      submitFeedback: jasmine.createSpy('submitFeedback'),
      approvePrescription: jasmine.createSpy('approvePrescription'),
    } as unknown as ClinicalAIService;
    permissions = {
      hasPermission: jasmine.createSpy('hasPermission'),
    } as unknown as PermissionsService;
    permissions.hasPermission.and.callFake(
      (module: string, action?: string) => {
        if (module === 'ehr' || module === 'clinical_ai') {
          return action === 'create' || action === 'update';
        }
        return module === 'pharmacy' && action === 'create';
      },
    );

    await TestBed.configureTestingModule({
      imports: [ClinicalAIComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: ClinicalAIService, useValue: clinicalAI },
        { provide: PatientsService, useValue: { getPatients: () => of([]) } },
        { provide: PermissionsService, useValue: permissions },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalAIComponent);
    component = fixture.componentInstance;
  });

  it('requires an active consultation and clinician identity before analysis', () => {
    component.selectedPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    component.patientContext = { patientId: 'PAT0001' };
    component.chiefComplaint = 'Headache';
    expect(component.canAnalyze).toBeFalsy();

    component.consultationId = 'CONS-01';
    component.clinicianId = 'EMP-01';
    expect(component.canAnalyze).toBeTruthy();
  });

  it('blocks analysis when the clinical_ai permission is missing, even on direct handler invocation', () => {
    permissions.hasPermission.and.returnValue(false);
    component.selectedPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    component.patientContext = { patientId: 'PAT0001' };
    component.consultationId = 'CONS-01';
    component.clinicianId = 'EMP-01';
    component.chiefComplaint = 'Headache';

    component.confirmAnalysis();

    expect(clinicalAI.analyze).not.toHaveBeenCalled();
  });

  it('constructs an analysis request only from the selected authorized context', () => {
    component.selectedPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    component.patientContext = {
      patientId: 'PAT0001',
      laboratoryResults: [],
      imagingResults: [],
      currentMedications: [],
      allergies: [],
    };
    component.facilityId = 12;
    component.clinicianId = 'EMP-01';
    component.consultationId = 'CONS-01';
    component.chiefComplaint = ' Headache ';
    component.symptomsText = 'Headache, nausea';

    component.confirmAnalysis();

    expect(clinicalAI.analyze).toHaveBeenCalledWith(
      jasmine.objectContaining({
        consultation_id: 'CONS-01',
        chief_complaint: 'Headache',
        patient_id: 'PAT0001',
        symptoms: 'Symptoms: Headache, nausea',
        imaging_reports: [],
        laboratory_results: [],
      }),
    );
    expect(component.aiConsultationId).toBe('6');
    expect(
      clinicalAI.analyze.calls.mostRecent().args[0].vitals,
    ).toBeUndefined();
  });

  it('discards patient context that arrives after switching patients', () => {
    const firstContext = new Subject<ClinicalPatientContext>();
    const secondContext = new Subject<ClinicalPatientContext>();
    clinicalAI.getPatientHistory.and.returnValues(
      firstContext.asObservable(),
      secondContext.asObservable(),
    );
    component.facilityId = 12;
    const firstPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    const secondPatient = {
      id: 'PAT0002',
      firstName: 'Kamau',
      lastName: 'Example',
      age: 37,
      gender: 'Male',
    } as never;

    component.selectPatient(firstPatient);
    component.selectPatient(secondPatient);
    firstContext.next({ patientId: 'PAT0001' });
    expect(component.patientContext).toBeNull();

    secondContext.next({ patientId: 'PAT0002' });
    expect(component.patientContext?.patientId).toBe('PAT0002');
  });

  it('renders normalized patient history, laboratory, imaging, and medication data', () => {
    clinicalAI.getPatientHistory.and.returnValue(
      of({
        patientId: 'PAT0001',
        demographics: { age: 56, sex: 'male', bloodGroup: 'A-' },
        currentMedications: [
          {
            name: 'insulin',
            dose: '500ml injection twice a day',
            status: 'Pending',
          },
        ],
        laboratoryResults: [
          {
            id: 'LAB-001-1',
            name: 'Complete Blood Count (CBC) · hkh',
            value: 'hk',
            unit: 'kk',
            referenceRange: 'mn',
            status: 'Normal',
            reportStatus: 'Approved',
            testedAt: '2026-08-11',
          },
        ],
        imagingResults: [
          {
            id: 'RPT001',
            modality: 'CT Scan',
            studyName: 'chest x-raay',
            bodyPart: 'thorrax',
            findings: 'sd',
            impression: 'sd',
            status: 'Draft',
            reportDate: '2026-08-15',
          },
        ],
        allergies: [],
        medicalHistory: {
          conditions: ['Type 2 diabetes mellitus'],
          previousDiagnoses: ['Diabetes mellitus'],
          previousConsultations: [],
          previousMedications: [],
          allergies: [],
          adverseDrugReactions: [],
          procedures: [],
          relevantOutcomes: [],
        },
      }),
    );
    component.facilityId = 12;
    component.selectPatient({
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 56,
      gender: 'Female',
    } as never);

    fixture.detectChanges();

    const renderedText = fixture.nativeElement.textContent as string;
    expect(renderedText).toContain('Complete Blood Count (CBC) · hkh');
    expect(renderedText).toContain('Approved');
    expect(renderedText).toContain('chest x-raay');
    expect(renderedText).toContain('Draft');
    expect(renderedText).toContain('insulin');
    expect(renderedText).toContain('Type 2 diabetes mellitus');
    expect(renderedText).toContain('Diabetes mellitus');
  });

  it('discards analysis output from a patient selection that is no longer active', () => {
    const analysis = new Subject<ClinicalAIResponse>();
    clinicalAI.analyze.and.returnValue(analysis.asObservable());
    component.selectedPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    component.patientContext = { patientId: 'PAT0001' };
    component.consultationId = 'CONS-01';
    component.clinicianId = 'EMP-01';
    component.chiefComplaint = 'Headache';

    component.confirmAnalysis();
    component.selectPatient({
      id: 'PAT0002',
      firstName: 'Kamau',
      lastName: 'Example',
      age: 37,
      gender: 'Male',
    } as never);
    analysis.next(response);

    expect(component.response).toBeNull();
  });

  it('shows emergency escalation for backend-critical red flags', () => {
    component.response = {
      ...response,
      redFlags: [
        {
          id: 'RF-1',
          title: 'Urgent review',
          detail: 'Immediate clinical assessment indicated.',
          severity: 'Warning',
          requiresEmergencyEscalation: true,
        },
      ],
    };
    expect(component.hasCriticalRedFlag).toBeTruthy();
  });

  it('does not permit nurse prescription approval and requires critical-warning acknowledgement', () => {
    component.clinicianRole = 'nurse';
    component.response = response;
    expect(component.canApprovePrescriptions).toBeFalsy();

    component.clinicianRole = 'doctor';
    component.response = {
      ...response,
      medicationSafety: [
        {
          id: 'MS-1',
          category: 'Allergy conflict',
          severity: 'Critical',
          message: 'Review allergy conflict.',
          acknowledgementRequired: true,
        },
      ],
    };
    expect(component.canApprovePrescriptions).toBeFalsy();
    component.acknowledgeSafetyWarning('MS-1', true);
    expect(component.canApprovePrescriptions).toBeTruthy();
  });

  it('renders AI content as text rather than HTML', () => {
    component.selectedPatient = {
      id: 'PAT0001',
      firstName: 'Amina',
      lastName: 'Example',
      age: 42,
      gender: 'Female',
    } as never;
    component.response = response;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      '<img src=x onerror=alert(1)>',
    );
  });
});
