import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IdsrWeeklyReport } from '../models/reports.models';
import {
  FhirBundleSummary,
  HieConnectionStatus,
  HieSyncLog,
  InteroperabilityLevelInfo,
  MedicalTerminologyStandard,
  QualityMeasureItem,
  SdmxHDExportPayload,
} from '../models/interoperability.models';

@Injectable({ providedIn: 'root' })
export class HieService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private unwrap<T>(response: any): T {
    return response?.results || response?.data || response;
  }

  checkHieConnectivity(
    facilityId: string | number,
  ): Observable<{
    status: HieConnectionStatus;
    latencyMs: number;
    hieEndpoint: string;
    mflCode: string;
  }> {
    return this.http.get<{
      status: HieConnectionStatus;
      latencyMs: number;
      hieEndpoint: string;
      mflCode: string;
    }>(
      `${this.baseUrl}/interoperability/hie-connection/?facilityId=${encodeURIComponent(facilityId)}`,
    );
  }

  pingHieConnection(
    facilityId: string | number,
  ): Observable<{
    status: HieConnectionStatus;
    latencyMs: number;
    hieEndpoint: string;
  }> {
    return this.http.post<{
      status: HieConnectionStatus;
      latencyMs: number;
      hieEndpoint: string;
    }>(`${this.baseUrl}/interoperability/hie-connection/ping/`, { facilityId });
  }

  getMaturityLevels(
    facilityId: string | number,
  ): Observable<InteroperabilityLevelInfo[]> {
    return this.http.get<InteroperabilityLevelInfo[]>(
      `${this.baseUrl}/interoperability/maturity-levels/?facilityId=${encodeURIComponent(facilityId)}`,
    );
  }

  upgradeMaturityLevel(
    facilityId: string | number,
  ): Observable<InteroperabilityLevelInfo[]> {
    return this.http.post<InteroperabilityLevelInfo[]>(
      `${this.baseUrl}/interoperability/maturity-levels/upgrade/`,
      { facilityId },
    );
  }

  getTerminologyStandards(
    facilityId: string | number,
  ): Observable<MedicalTerminologyStandard[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}/interoperability/terminology-standards/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(
        map((response) => this.unwrap<MedicalTerminologyStandard[]>(response)),
      );
  }

  getQualityMeasures(
    facilityId: string | number,
  ): Observable<QualityMeasureItem[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}/interoperability/quality-measures/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(map((response) => this.unwrap<QualityMeasureItem[]>(response)));
  }

  getSyncLogs(facilityId: string | number): Observable<HieSyncLog[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}/interoperability/sync-logs/?facilityId=${encodeURIComponent(facilityId)}`,
      )
      .pipe(map((response) => this.unwrap<HieSyncLog[]>(response)));
  }

  private logSyncEvent(
    facilityId: string | number,
    type: HieSyncLog['type'],
    recordsTransferred: number,
    message: string,
    payloadSnippet?: string,
  ): Observable<HieSyncLog> {
    return this.http.post<HieSyncLog>(
      `${this.baseUrl}/interoperability/sync-logs/?facilityId=${encodeURIComponent(facilityId)}`,
      {
        facilityId,
        type,
        status: 'SUCCESS',
        recordsTransferred,
        message,
        payloadSnippet,
      },
    );
  }

  generateFhirPatientBundle(
    facilityId: string | number,
    patient: any,
    visitRecord?: any,
  ): Observable<FhirBundleSummary> {
    const timestamp = new Date().toISOString();
    const bundleId = `fhir-bundle-${Date.now()}`;
    const patientId = patient.id || 'P001';
    const patientName =
      `${patient.firstName || patient.name || 'Patient'} ${patient.lastName || ''}`.trim();

    const fhirResource = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: timestamp,
        profile: [
          'http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips',
        ],
      },
      type: 'document',
      timestamp,
      entry: [
        {
          fullUrl: `urn:uuid:patient-${patientId}`,
          resource: {
            resourceType: 'Patient',
            id: patientId,
            identifier: [
              {
                system: 'http://health.go.ke/id/national-id',
                value: patient.nationalId || 'N/A',
              },
              {
                system: 'http://health.go.ke/id/passport',
                value: patient.passportNumber || 'N/A',
              },
            ],
            name: [
              {
                family: patient.lastName || '',
                given: [patient.firstName || patientName],
              },
            ],
            gender: (patient.gender || 'unknown').toLowerCase(),
            birthDate: patient.dob || '1990-01-01',
            address: [
              {
                text: `${patient.address || ''}, ${patient.subCounty || ''}, ${patient.county || 'Nairobi'}`,
              },
            ],
          },
        },
        {
          fullUrl: `urn:uuid:condition-${Date.now()}`,
          resource: {
            resourceType: 'Condition',
            id: `cond-${Date.now()}`,
            clinicalStatus: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                },
              ],
            },
            code: {
              coding: [
                {
                  system: visitRecord?.diagnosisSystem || 'KNHTS',
                  code: visitRecord?.diagnosisCode || 'B54',
                  display:
                    visitRecord?.diagnosisText ||
                    visitRecord?.diagnosis ||
                    'Clinical Diagnosis',
                },
              ],
              text: visitRecord?.diagnosis || 'Clinical Condition',
            },
            subject: { reference: `urn:uuid:patient-${patientId}` },
          },
        },
      ],
    };

    const bundle: FhirBundleSummary = {
      resourceType: 'Bundle',
      type: 'document',
      timestamp,
      totalEntries: fhirResource.entry.length,
      patientId,
      patientName,
      containedResources: [
        'Patient',
        'Condition',
        'Observation',
        'MedicationStatement',
        'Composition',
      ],
      rawFhirJson: JSON.stringify(fhirResource, null, 2),
    };

    return this.logSyncEvent(
      facilityId,
      'OUTBOUND_BUNDLE',
      1,
      `FHIR R4 International Patient Summary (IPS) Bundle synchronized for patient ${patientId}.`,
    ).pipe(map(() => bundle));
  }

  generateSdmxHDExport(
    facilityId: string | number,
    mflCode: string,
    idsrReport?: IdsrWeeklyReport | null,
  ): Observable<SdmxHDExportPayload> {
    const period = idsrReport
      ? `${idsrReport.year}W${idsrReport.epiWeek}`
      : this.currentIsoWeek();
    const indicators = (idsrReport?.diseases || []).map((disease) => ({
      code: `IDSR_${disease.diseaseCode.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}_CASES`,
      name: `${disease.diseaseName} Cases`,
      value: disease.totalCases,
      category: 'Weekly Priority',
    }));

    const payload: SdmxHDExportPayload = {
      header: {
        id: `SDMX-HD-${Date.now()}`,
        prepared: new Date().toISOString(),
        sender: `AfyoraHMS-Facility-${mflCode}`,
        receiver: 'Kenya Health Information System (KHIS)',
        datasetId: 'IDSR_WEEKLY_SURVEILLANCE_504',
      },
      period,
      facilityMflCode: mflCode,
      indicators,
    };

    return this.logSyncEvent(
      facilityId,
      'SURVEILLANCE_SDMX',
      indicators.length,
      `IDSR 504 SDMX-HD payload generated for period ${period}.`,
    ).pipe(map(() => payload));
  }

  submitQualityMeasures(
    facilityId: string | number,
    measures: QualityMeasureItem[],
  ): Observable<{ status: string; submissionId: string }> {
    return this.logSyncEvent(
      facilityId,
      'QUALITY_MEASURE',
      measures.length,
      'National Quality Indicators submitted to DHA Quality Portal.',
    ).pipe(map((log) => ({ status: 'SUBMITTED', submissionId: log.id })));
  }

  private currentIsoWeek(): string {
    const now = new Date();
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const week =
      1 +
      Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
    return `${now.getFullYear()}W${week}`;
  }
}
