import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ClinicalConcept, KnhtsConceptSearchResult } from '../models';

const KNHTS_FALLBACK_CONCEPTS: KnhtsConceptSearchResult[] = [
  {
    coding: [
      { system: 'ICD-10-WHO', code: 'B54', display: 'Unspecified malaria' },
    ],
    text: 'Unspecified malaria',
    display: 'Unspecified malaria',
    system: 'ICD-10-WHO',
    code: 'B54',
  },
  {
    coding: [
      {
        system: 'ICD-10-WHO',
        code: 'J06.9',
        display: 'Acute upper respiratory infection, unspecified',
      },
    ],
    text: 'Acute upper respiratory infection, unspecified',
    display: 'Acute upper respiratory infection, unspecified',
    system: 'ICD-10-WHO',
    code: 'J06.9',
  },
  {
    coding: [
      { system: 'ICD-10-WHO', code: 'I10', display: 'Essential hypertension' },
    ],
    text: 'Essential hypertension',
    display: 'Essential hypertension',
    system: 'ICD-10-WHO',
    code: 'I10',
  },
  {
    coding: [
      {
        system: 'ICD-10-WHO',
        code: 'E11',
        display: 'Type 2 diabetes mellitus',
      },
    ],
    text: 'Type 2 diabetes mellitus',
    display: 'Type 2 diabetes mellitus',
    system: 'ICD-10-WHO',
    code: 'E11',
  },
  {
    coding: [{ system: 'ICD-10-WHO', code: 'A00', display: 'Cholera' }],
    text: 'Cholera',
    display: 'Cholera',
    system: 'ICD-10-WHO',
    code: 'A00',
  },
];

@Injectable({ providedIn: 'root' })
export class KnhtsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    environment.knhtsApiBaseUrl || environment.apiBaseUrl;

  normalizeClinicalConcept(input: Partial<ClinicalConcept>): ClinicalConcept {
    const system = (
      input.system ||
      input.coding?.[0]?.system ||
      'KNHTS'
    ).trim();
    const code = (input.code || input.coding?.[0]?.code || '').trim();
    const display = (
      input.display ||
      input.text ||
      input.coding?.[0]?.display ||
      ''
    ).trim();
    const text = (
      input.text ||
      display ||
      code ||
      'Unspecified clinical concept'
    ).trim();

    return {
      coding: [
        {
          system,
          code,
          display: display || text,
        },
      ],
      text,
      display: display || text,
      system,
      code,
    };
  }

  validateConcept(concept: Partial<ClinicalConcept>): boolean {
    const normalized = this.normalizeClinicalConcept(concept);
    return !!normalized.text && !!normalized.coding?.[0]?.code;
  }

  searchConcepts(searchTerm: string): Observable<KnhtsConceptSearchResult[]> {
    const normalized = (searchTerm || '').trim();
    if (!normalized) {
      return of([]);
    }

    const queryUrl = `${this.baseUrl}/knhts/concepts?search=${encodeURIComponent(normalized)}`;

    return this.http.get<any>(queryUrl).pipe(
      map((response) => {
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.results)
            ? response.results
            : Array.isArray(response)
              ? response
              : [];

        return items.map((item: any) =>
          this.normalizeClinicalConcept({
            ...item,
            coding: item.coding ?? [
              {
                system: item.system || 'KNHTS',
                code: item.code || item.conceptCode || '',
                display: item.display || item.text || item.name || '',
              },
            ],
            text: item.text || item.display || item.name || '',
            display: item.display || item.text || item.name || '',
            system: item.system || item.coding?.[0]?.system || 'KNHTS',
            code: item.code || item.conceptCode || item.coding?.[0]?.code || '',
          }),
        );
      }),
      catchError(() => {
        const matches = KNHTS_FALLBACK_CONCEPTS.filter((concept) => {
          const haystack =
            `${concept.display ?? ''} ${concept.text ?? ''}`.toLowerCase();
          return haystack.includes(normalized.toLowerCase());
        });

        return of(
          matches.length ? matches : KNHTS_FALLBACK_CONCEPTS.slice(0, 3),
        );
      }),
    );
  }

  lookupConceptByCode(
    system: string,
    code: string,
  ): Observable<ClinicalConcept | null> {
    const normalizedSystem = (system || 'KNHTS').trim();
    const normalizedCode = (code || '').trim();

    if (!normalizedCode) {
      return of(null);
    }

    const queryUrl = `${this.baseUrl}/knhts/concepts?system=${encodeURIComponent(normalizedSystem)}&code=${encodeURIComponent(normalizedCode)}`;

    return this.http.get<any>(queryUrl).pipe(
      map((response) => {
        const item =
          response?.data?.[0] ?? response?.results?.[0] ?? response ?? null;
        if (!item) {
          return this.normalizeClinicalConcept({
            system: normalizedSystem,
            code: normalizedCode,
            text: normalizedCode,
          });
        }

        return this.normalizeClinicalConcept(item);
      }),
      catchError(() => {
        const match = KNHTS_FALLBACK_CONCEPTS.find(
          (concept) => concept.code === normalizedCode,
        );
        return of(match ? this.normalizeClinicalConcept(match) : null);
      }),
    );
  }

  isKnhtsCompliantConcept(concept: Partial<ClinicalConcept> | null | undefined): boolean {
    if (!concept) {
      return false;
    }
    const normalized = this.normalizeClinicalConcept(concept);
    const code = normalized.coding?.[0]?.code?.trim();
    const system = normalized.coding?.[0]?.system?.trim();
    const display = normalized.text?.trim() || normalized.display?.trim() || normalized.coding?.[0]?.display?.trim();

    return !!(code && system && display);
  }

  getTerminologyLog(facilityId: string | number, page = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/compliance/terminology-log/?facilityId=${facilityId}&page=${page}&page_size=${pageSize}`
    );
  }
}
