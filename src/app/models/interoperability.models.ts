export type HieConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR';

export type InteroperabilityMaturityLevel = 1 | 2 | 3 | 4;

export interface InteroperabilityLevelInfo {
  level: InteroperabilityMaturityLevel;
  title: string;
  subtitle: string;
  description: string;
  supported: boolean;
  standards: string[];
}

export interface MedicalTerminologyStandard {
  code: 'SNOMED-CT' | 'ICD-11' | 'LOINC' | 'KNHTS' | 'CIEL' | 'KEMSA-HPT';
  name: string;
  description: string;
  version: string;
  activeCount: number;
  status: 'ACTIVE' | 'SYNCED' | 'PENDING';
}

export interface FhirResourceHeader {
  resourceType: string;
  id: string;
  status: string;
  lastUpdated: string;
}

export interface FhirBundleSummary {
  resourceType: 'Bundle';
  type: 'transaction' | 'document' | 'collection';
  timestamp: string;
  totalEntries: number;
  patientId: string;
  patientName: string;
  containedResources: string[];
  rawFhirJson: string;
}

export interface SdmxHDExportPayload {
  header: {
    id: string;
    prepared: string;
    sender: string;
    receiver: string;
    datasetId: string;
  };
  period: string;
  facilityMflCode: string;
  indicators: {
    code: string;
    name: string;
    value: number;
    category?: string;
  }[];
}

export interface QualityMeasureItem {
  id: string;
  code: string;
  title: string;
  category: 'Maternal & Child Health' | 'Communicable Diseases' | 'Non-Communicable Diseases' | 'Hospital Operational';
  numeratorDescription: string;
  denominatorDescription: string;
  numeratorValue: number;
  denominatorValue: number;
  calculatedRate: number; // percentage
  targetRate: number;
  status: 'Compliant' | 'At Risk' | 'Needs Improvement';
  lastCalculated: string;
}

export interface HieSyncLog {
  id: string;
  timestamp: string;
  type: 'OUTBOUND_BUNDLE' | 'SURVEILLANCE_SDMX' | 'QUALITY_MEASURE' | 'PATIENT_PUSH';
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  recordsTransferred: number;
  message: string;
  payloadSnippet?: string;
}
