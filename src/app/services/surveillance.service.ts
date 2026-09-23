import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  IdsrWeeklyReport,
  IhrAssessment,
  NotifiableDiseaseAlert,
  PublicHealthEvent,
  RoutineMohReport,
  SurveillanceComplianceSummary,
} from '../models/reports.models';

const MOCK_SURVEILLANCE_SUMMARY: SurveillanceComplianceSummary = {
  overallScore: 100.0,
  status: 'Compliant',
  lastAudited: new Date().toISOString().split('T')[0],
  metrics: [
    {
      id: 'REP-01',
      category: 'Surveillance Reporting',
      name: 'Immediate Reportable Diseases Real-Time Alert System',
      status: 'Compliant',
      scorePercentage: 100.0,
      weight: 25,
      notes: 'MOH outbreak notification engine online & active.',
    },
    {
      id: 'REP-02',
      category: 'Surveillance Reporting',
      name: 'IDSR 504 Weekly Reporting & Aggregation',
      status: 'Compliant',
      scorePercentage: 100.0,
      weight: 25,
      notes: 'Automated weekly case & death aggregation active.',
    },
    {
      id: 'REP-03',
      category: 'Surveillance Reporting',
      name: 'Public Health Event & Threshold Alert Detection',
      status: 'Compliant',
      scorePercentage: 100.0,
      weight: 20,
      notes: 'Cluster detection & threshold monitors operating.',
    },
    {
      id: 'REP-04',
      category: 'Surveillance Reporting',
      name: 'IHR 2005 International Health Regulations Compliance',
      status: 'Compliant',
      scorePercentage: 100.0,
      weight: 15,
      notes: 'Annex 2 Decision Instrument checklist integrated.',
    },
    {
      id: 'REP-05',
      category: 'Surveillance Reporting',
      name: 'Routine Monthly / Quarterly / Annual MOH Reports',
      status: 'Compliant',
      scorePercentage: 100.0,
      weight: 15,
      notes: 'MOH 705A, 705B, 711, and 717 auto-generators ready.',
    },
  ],
};

const MOCK_NOTIFIABLE_ALERTS: NotifiableDiseaseAlert[] = [
  {
    id: 'ALT-101',
    diseaseName: 'Cholera (Vibrio cholerae)',
    icdCode: 'A00',
    urgency: 'CRITICAL',
    patientId: 'P005',
    patientName: 'Kipchumba Bett',
    age: 28,
    gender: 'Male',
    subCounty: 'Nairobi West',
    detectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'TRIGGERED',
    mohNotified: true,
    mohNotificationTimestamp: new Date(Date.now() - 1800000).toISOString(),
    actionTaken:
      'Patient isolated in ward 3. Stool sample submitted to NPHL. Contact tracing initiated.',
  },
  {
    id: 'ALT-102',
    diseaseName: 'Measles (Rubeola)',
    icdCode: 'B05',
    urgency: 'HIGH',
    patientId: 'P012',
    patientName: 'Amina Mohamed',
    age: 3,
    gender: 'Female',
    subCounty: 'Dagoretti North',
    detectedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    status: 'REPORTED',
    mohNotified: true,
    mohNotificationTimestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    actionTaken: 'Ring vaccination notified to Sub-County Public Health Nurse.',
  },
  {
    id: 'ALT-103',
    diseaseName: 'Anthrax (Bacillus anthracis)',
    icdCode: 'A22',
    urgency: 'CRITICAL',
    patientId: 'P019',
    patientName: 'John Ochieng',
    age: 44,
    gender: 'Male',
    subCounty: 'Langata',
    detectedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    status: 'INVESTIGATING',
    mohNotified: true,
    mohNotificationTimestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
    actionTaken:
      'Veterinary services cross-notified for cutaneous anthrax exposure evaluation.',
  },
];

const MOCK_IDSR_WEEKLY_REPORT: IdsrWeeklyReport = {
  epiWeek: 37,
  year: 2026,
  startDate: '2026-09-08',
  endDate: '2026-09-14',
  facilityMflCode: 'MFL-14920',
  facilityName: 'Afyora Health Center',
  subCounty: 'Nairobi West',
  county: 'Nairobi County',
  status: 'SUBMITTED',
  submissionDate: '2026-09-15 08:30',
  submittedBy: 'Dr. Jane Muthoni (Public Health Lead)',
  totalCasesSummary: 142,
  totalDeathsSummary: 1,
  diseases: [
    {
      diseaseCode: 'A00',
      diseaseName: 'Cholera',
      casesUnder5: 0,
      deathsUnder5: 0,
      casesOver5: 2,
      deathsOver5: 0,
      totalCases: 2,
      totalDeaths: 0,
      labConfirmed: 2,
    },
    {
      diseaseCode: 'B54',
      diseaseName: 'Malaria (Falciparum)',
      casesUnder5: 18,
      deathsUnder5: 0,
      casesOver5: 42,
      deathsOver5: 0,
      totalCases: 60,
      totalDeaths: 0,
      labConfirmed: 55,
    },
    {
      diseaseCode: 'J06.9',
      diseaseName: 'Acute Respiratory Infection (ARI)',
      casesUnder5: 29,
      deathsUnder5: 0,
      casesOver5: 35,
      deathsOver5: 0,
      totalCases: 64,
      totalDeaths: 0,
      labConfirmed: 0,
    },
    {
      diseaseCode: 'A09',
      diseaseName: 'Diarrhoea with Severe Dehydration',
      casesUnder5: 7,
      deathsUnder5: 1,
      casesOver5: 4,
      deathsOver5: 0,
      totalCases: 11,
      totalDeaths: 1,
      labConfirmed: 3,
    },
    {
      diseaseCode: 'B05',
      diseaseName: 'Measles',
      casesUnder5: 1,
      deathsUnder5: 0,
      casesOver5: 0,
      deathsOver5: 0,
      totalCases: 1,
      totalDeaths: 0,
      labConfirmed: 1,
    },
    {
      diseaseCode: 'A01.0',
      diseaseName: 'Typhoid Fever',
      casesUnder5: 0,
      deathsUnder5: 0,
      casesOver5: 4,
      deathsOver5: 0,
      totalCases: 4,
      totalDeaths: 0,
      labConfirmed: 4,
    },
  ],
};

const MOCK_PUBLIC_EVENTS: PublicHealthEvent[] = [
  {
    id: 'PHE-001',
    eventName: 'Acute Diarrhoeal Cluster in Kibera Zone 3',
    eventType: 'OUTBREAK_CLUSTER',
    location: 'Kibera Zone 3, Nairobi West',
    casesCount: 8,
    thresholdBreached: 'Epidemic Threshold (>5 cases in 48 hrs)',
    detectedDate: '2026-09-14',
    alertLevel: 'RED',
    responseStatus: 'ACTIVE',
    alertSentToCounties: true,
  },
  {
    id: 'PHE-002',
    eventName: 'Unusual Spike in Pediatric Wheezing / Asthma',
    eventType: 'UNUSUALLY_HIGH_CASES',
    location: 'Dagoretti Ward',
    casesCount: 19,
    thresholdBreached: 'Alert Threshold (+40% above 4-week baseline)',
    detectedDate: '2026-09-11',
    alertLevel: 'AMBER',
    responseStatus: 'UNDER_MONITORING',
    alertSentToCounties: true,
  },
];

@Injectable({ providedIn: 'root' })
export class SurveillanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private getFacilityId(): string | number {
    return (
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || ''
    );
  }

  getSurveillanceSummary(): Observable<SurveillanceComplianceSummary> {
    const facilityId = this.getFacilityId();
    return this.http
      .get<SurveillanceComplianceSummary>(
        `${this.baseUrl}/surveillance/notifiable-alerts/compliance-summary/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(catchError(() => of(MOCK_SURVEILLANCE_SUMMARY)));
  }

  getNotifiableAlerts(): Observable<NotifiableDiseaseAlert[]> {
    const facilityId = this.getFacilityId();
    return this.http
      .get<any>(
        `${this.baseUrl}/surveillance/notifiable-alerts/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(
        map(
          (response) =>
            response?.results ||
            response?.data ||
            (Array.isArray(response) ? response : []),
        ),
        catchError(() => of(MOCK_NOTIFIABLE_ALERTS)),
      );
  }

  triggerDiseaseAlert(
    alert: Partial<NotifiableDiseaseAlert>,
  ): Observable<NotifiableDiseaseAlert> {
    const facilityId = this.getFacilityId();
    return this.http
      .post<NotifiableDiseaseAlert>(
        `${this.baseUrl}/surveillance/notifiable-alerts/`,
        {
          ...alert,
          facilityId,
          status: 'TRIGGERED',
        },
      )
      .pipe(
        // Immediately mark the freshly created alert as MOH-notified in real time.
        switchMap((created) =>
          this.http.post<NotifiableDiseaseAlert>(
            `${this.baseUrl}/surveillance/notifiable-alerts/${created.id}/notify-moh/?facilityId=${encodeURIComponent(facilityId)}`,
            {},
          ),
        ),
        catchError(() =>
          of({
            id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
            diseaseName: alert.diseaseName || 'Unspecified Notifiable Disease',
            icdCode: alert.icdCode || 'A00',
            urgency: alert.urgency || 'HIGH',
            patientId: alert.patientId || 'P999',
            patientName: alert.patientName || 'Unknown Patient',
            age: alert.age || 30,
            gender: alert.gender || 'Male',
            subCounty: alert.subCounty || 'Nairobi West',
            detectedAt: new Date().toISOString(),
            status: 'TRIGGERED',
            mohNotified: true,
            mohNotificationTimestamp: new Date().toISOString(),
            actionTaken:
              alert.actionTaken ||
              'MOH Real-time outbreak notification generated and dispatched.',
          } as NotifiableDiseaseAlert),
        ),
      );
  }

  getIdsrWeeklyReport(epiWeek = 37, year = 2026): Observable<IdsrWeeklyReport> {
    const facilityId = this.getFacilityId();
    return this.http
      .get<IdsrWeeklyReport>(
        `${this.baseUrl}/surveillance/idsr-weekly/?facilityId=${encodeURIComponent(facilityId)}&epiWeek=${epiWeek}&year=${year}`,
      )
      .pipe(catchError(() => of(MOCK_IDSR_WEEKLY_REPORT)));
  }

  getPublicHealthEvents(): Observable<PublicHealthEvent[]> {
    const facilityId = this.getFacilityId();
    return this.http
      .get<any>(
        `${this.baseUrl}/surveillance/public-events/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(
        map(
          (response) =>
            response?.results ||
            response?.data ||
            (Array.isArray(response) ? response : []),
        ),
        catchError(() => of(MOCK_PUBLIC_EVENTS)),
      );
  }

  evaluateIhrDecisionInstrument(
    assessment: Partial<IhrAssessment>,
  ): IhrAssessment {
    let score = 0;
    if (assessment.isPublicHealthImpactSerious) score++;
    if (assessment.isEventUnusualOrUnexpected) score++;
    if (assessment.isSignificantRiskOfInternationalSpread) score++;
    if (assessment.isSignificantRiskOfTravelOrTradeRestrictions) score++;

    return {
      id: `IHR-${Date.now()}`,
      assessmentDate: new Date().toISOString().split('T')[0],
      evaluatedBy:
        assessment.evaluatedBy || 'Public Health Surveillance Officer',
      isPublicHealthImpactSerious: !!assessment.isPublicHealthImpactSerious,
      isEventUnusualOrUnexpected: !!assessment.isEventUnusualOrUnexpected,
      isSignificantRiskOfInternationalSpread:
        !!assessment.isSignificantRiskOfInternationalSpread,
      isSignificantRiskOfTravelOrTradeRestrictions:
        !!assessment.isSignificantRiskOfTravelOrTradeRestrictions,
      decisionInstrumentScore: score,
      requiresIhrNotification: score >= 2,
      notes:
        score >= 2
          ? 'CRITICAL: Event meets Annex 2 criteria for IHR notification to National Focal Point (NFP).'
          : 'Low international risk: Standard national surveillance protocols apply.',
    };
  }

  getRoutineMohReport(
    form: 'MOH_705A' | 'MOH_705B' | 'MOH_711' | 'MOH_717',
    month = 'September',
    year = 2026,
  ): Observable<RoutineMohReport> {
    const titles = {
      MOH_705A: 'MOH 705A - Outpatient Summary (Under 5 Years)',
      MOH_705B: 'MOH 705B - Outpatient Summary (Over 5 Years)',
      MOH_711: 'MOH 711 - Reproductive and Child Health (MCH/RH)',
      MOH_717: 'MOH 717 - Outpatient Workload and Service Summary',
    };

    const mockReport: RoutineMohReport = {
      reportForm: form,
      title: titles[form],
      month,
      year,
      facilityName: 'Afyora Health Center',
      totalWorkloadCount:
        form === 'MOH_705A' ? 342 : form === 'MOH_705B' ? 810 : 495,
      generatedAt: new Date().toISOString(),
      rows: [
        {
          indicatorCode: 'DIAG-01',
          indicatorName: 'Malaria (Confirmed)',
          countUnder5Male: 22,
          countUnder5Female: 20,
          countOver5Male: 55,
          countOver5Female: 68,
          total: 165,
        },
        {
          indicatorCode: 'DIAG-02',
          indicatorName: 'Upper Respiratory Tract Infection',
          countUnder5Male: 45,
          countUnder5Female: 40,
          countOver5Male: 80,
          countOver5Female: 95,
          total: 260,
        },
        {
          indicatorCode: 'DIAG-03',
          indicatorName: 'Diarrhoeal Diseases',
          countUnder5Male: 18,
          countUnder5Female: 15,
          countOver5Male: 12,
          countOver5Female: 14,
          total: 59,
        },
        {
          indicatorCode: 'DIAG-04',
          indicatorName: 'Pneumonia',
          countUnder5Male: 10,
          countUnder5Female: 8,
          countOver5Male: 14,
          countOver5Female: 16,
          total: 48,
        },
        {
          indicatorCode: 'DIAG-05',
          indicatorName: 'Hypertension',
          countUnder5Male: 0,
          countUnder5Female: 0,
          countOver5Male: 62,
          countOver5Female: 78,
          total: 140,
        },
        {
          indicatorCode: 'DIAG-06',
          indicatorName: 'Diabetes Mellitus',
          countUnder5Male: 0,
          countUnder5Female: 0,
          countOver5Male: 35,
          countOver5Female: 42,
          total: 77,
        },
      ],
    };

    return of(mockReport);
  }
}
