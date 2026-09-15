export type KnhtsCodingSystem =
  | 'ICD-10-WHO'
  | 'SNOMED-CT'
  | 'LOINC'
  | 'KNHTS'
  | 'OTHER';

export type KnhtsCoding = {
  system: string;
  code: string;
  display?: string;
  version?: string;
};

export type ClinicalConcept = {
  coding: KnhtsCoding[];
  text: string;
  display?: string;
  system?: string;
  code?: string;
};

export type KnhtsConceptSearchResult = ClinicalConcept & {
  matchedText?: string;
};

export const DHA_ALLOWED_CODE_SYSTEMS = [
  'KNHTS',
  'ICD-10-WHO',
  'SNOMED-CT',
  'LOINC'
] as const;

export type ConceptProvenanceRecord = {
  id: number;
  user: string;
  code_system: string;
  code: string;
  display: string;
  record_type: 'ehr' | 'visit' | 'lab' | 'radiology';
  record_id: string;
  looked_up_at: string;
  created_at: string;
};
