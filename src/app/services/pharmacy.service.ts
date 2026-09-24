import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { apiUrl } from '../core/api.config';
import { ApiResponse, CreateDrugPurchaseOrderRequest, CreateDrugRequest, Drug, DrugCategory, DrugPurchaseOrder, KnhtsConceptSearchResult, Prescription } from '../models';
import { DHAPrescription } from '../models/dha-connect.models';
import { DataSyncService } from './data-sync.service';
import { DhaAfyaConnectService } from './dha-afyaconnect.service';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly dataSync = inject(DataSyncService);
  private readonly dhaService = inject(DhaAfyaConnectService);
  private readonly baseUrl = apiUrl('/pharmacy');

  getDrugs(facilityId: string | number): Observable<Drug[]> {
    return this.dataSync.query(`pharmacy:drugs:${facilityId}`, () => this.http
      .get<any>(`${this.baseUrl}/drugs/?facilityId=${encodeURIComponent(facilityId)}/`)
      .pipe(
        map((response: any) =>
          (response?.items ?? response?.results ?? response?.data ?? (Array.isArray(response) ? response : [])).filter((drug: Drug): drug is Drug => Boolean(drug)),
        ),
      ));
  }

  getCategories(facilityId: string | number): Observable<DrugCategory[]> {
    return this.dataSync.query(`pharmacy:categories:${facilityId}`, () => this.http
      .get<any>(`${this.baseUrl}/categories/?facilityId=${encodeURIComponent(facilityId)}/`)
      .pipe(map((response: any) => response?.items ?? response?.results ?? response?.data ?? (Array.isArray(response) ? response : []))));
  }

  createCategory(
    payload: { name: string; description?: string },
    facilityId: string | number,
  ): Observable<ApiResponse<DrugCategory>> {
    return this.http.post<ApiResponse<DrugCategory>>(
      `${this.baseUrl}/categories/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(tap(() => this.dataSync.invalidate('pharmacy:categories:')));
  }

  updateCategory(
    categoryId: number,
    payload: { name: string; description?: string },
    facilityId: string | number,
  ): Observable<DrugCategory> {
    return this.http
      .patch<
        ApiResponse<DrugCategory> | DrugCategory
      >(`${this.baseUrl}/categories/${encodeURIComponent(categoryId)}/?facilityId=${encodeURIComponent(facilityId)}/`, payload)
      .pipe(
        map((response) => {
          if (
            response &&
            typeof response === 'object' &&
            ('data' in response || 'results' in response)
          ) {
            const apiResponse = response as ApiResponse<DrugCategory>;
            return apiResponse.results ?? apiResponse.data;
          }

          return response as DrugCategory;
        }),
      ).pipe(tap(() => this.dataSync.invalidate('pharmacy:categories:')));
  }

  deleteCategory(
    categoryId: number,
    facilityId: string | number,
  ): Observable<ApiResponse<DrugCategory>> {
    return this.http.delete<ApiResponse<DrugCategory>>(
      `${this.baseUrl}/categories/${encodeURIComponent(categoryId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
    ).pipe(tap(() => this.dataSync.invalidate('pharmacy:categories:')));
  }

  createDrug(
    payload: CreateDrugRequest,
    facilityId: string | number,
  ): Observable<ApiResponse<Drug>> {
    return this.http.post<ApiResponse<Drug>>(
      `${this.baseUrl}/drugs/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(tap(() => this.dataSync.invalidate('pharmacy:drugs:')));
  }

  updateDrug(
    drugId: string,
    payload: Partial<CreateDrugRequest>,
    facilityId: string | number,
  ): Observable<Drug> {
    return this.http
      .patch<
        ApiResponse<Drug> | Drug
      >(`${this.baseUrl}/drugs/${encodeURIComponent(drugId)}/?facilityId=${encodeURIComponent(facilityId)}/`, payload)
      .pipe(
        map((response) => {
          if (
            response &&
            typeof response === 'object' &&
            ('data' in response || 'results' in response)
          ) {
            const apiResponse = response as ApiResponse<Drug>;
            return apiResponse.results ?? apiResponse.data;
          }

          return response as Drug;
        }),
      ).pipe(tap(() => this.dataSync.invalidate('pharmacy:drugs:')));
  }

  getPrescriptions(facilityId: string | number): Observable<Prescription[]> {
    return this.dataSync.query(`pharmacy:prescriptions:${facilityId}`, () => this.http
      .get<any>(
        `${this.baseUrl}/prescriptions/?facilityId=${encodeURIComponent(facilityId)}/`,
      )
      .pipe(map((response: any) => response?.items ?? response?.results ?? response?.data ?? (Array.isArray(response) ? response : []))));
  }

  verifyAndCreateDhaPrescription(payload: {
    consentToken: string;
    interventionCode?: string;
    items: { drug_name: string; dosage: string; quantity: number }[];
    identificationNumber?: string;
    identificationType?: string;
    regulationBody?: string;
  }): Observable<DHAPrescription> {
    return this.dhaService.createPrescription({
      consent_token: payload.consentToken,
      intervention_code: payload.interventionCode || 'INT-PHARM-01',
      identification_number: payload.identificationNumber || 'KMPDC-REG-01',
      identification_type: payload.identificationType || 'registration_number',
      regulation_body: payload.regulationBody || 'KMPDC',
      items: payload.items,
    });
  }

  createPrescription(
    patientId: string,
    payload: {
      drugs: { name: string; quantity: number; dosage: string }[];
      status: 'Pending' | 'Dispensed';
      date: string;
      doctorId: string;
      dhaPrescriptionCode?: string;
      dhaStatus?: string;
      dhaVerified?: boolean;
      consentToken?: string;
    },
    facilityId: string | number,
  ): Observable<ApiResponse<Prescription>> {
    return this.http.post<ApiResponse<Prescription>>(
      `${this.baseUrl}/prescriptions/?facilityId=${encodeURIComponent(facilityId)}`,
      { ...payload, patientId },
    ).pipe(tap(() => this.dataSync.invalidate('pharmacy:prescriptions:')));
  }

  dispensePrescription(
    prescriptionId: string,
    facilityId: string | number,
  ): Observable<Prescription> {
    return this.http
      .patch<
        ApiResponse<Prescription> | Prescription
      >(`${this.baseUrl}/prescriptions/${encodeURIComponent(prescriptionId)}/dispense/?facilityId=${encodeURIComponent(facilityId)}/`, {})
      .pipe(
        map((response) => {
          if (
            response &&
            typeof response === 'object' &&
            ('data' in response || 'results' in response)
          ) {
            const apiResponse = response as ApiResponse<Prescription>;
            return apiResponse.results ?? apiResponse.data;
          }

          return response as Prescription;
        }),
      ).pipe(tap(() => this.dataSync.invalidate('pharmacy:prescriptions:')));
  }

  deletePrescription(
    prescriptionId: string,
    facilityId: string | number,
  ): Observable<ApiResponse<Prescription>> {
    return this.http.delete<ApiResponse<Prescription>>(
      `${this.baseUrl}/prescriptions/${encodeURIComponent(prescriptionId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
    ).pipe(tap(() => this.dataSync.invalidate('pharmacy:prescriptions:')));
  }

  getPurchaseOrders(facilityId: string | number): Observable<DrugPurchaseOrder[]> {
    return this.dataSync.query(`pharmacy:purchase-orders:${facilityId}`, () =>
      this.http
        .get<any>(
          `${this.baseUrl}/purchase-orders/?facilityId=${encodeURIComponent(facilityId)}/`,
        )
        .pipe(map((res: any) => res?.items ?? res?.results ?? res?.data ?? (Array.isArray(res) ? res : []))),
    );
  }

  createPurchaseOrder(
    payload: CreateDrugPurchaseOrderRequest,
    facilityId: string | number,
  ): Observable<DrugPurchaseOrder> {
    return this.http
      .post<DrugPurchaseOrder>(
        `${this.baseUrl}/purchase-orders/?facilityId=${encodeURIComponent(facilityId)}/`,
        payload,
      )
      .pipe(tap(() => this.dataSync.invalidate('pharmacy:purchase-orders:')));
  }

  updatePurchaseOrder(
    poId: number,
    payload: Partial<CreateDrugPurchaseOrderRequest>,
    facilityId: string | number,
  ): Observable<DrugPurchaseOrder> {
    return this.http
      .patch<DrugPurchaseOrder>(
        `${this.baseUrl}/purchase-orders/${poId}/?facilityId=${encodeURIComponent(facilityId)}/`,
        payload,
      )
      .pipe(tap(() => this.dataSync.invalidate('pharmacy:purchase-orders:')));
  }

  deletePurchaseOrder(poId: number, facilityId: string | number): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/purchase-orders/${poId}/?facilityId=${encodeURIComponent(facilityId)}/`,
      )
      .pipe(tap(() => this.dataSync.invalidate('pharmacy:purchase-orders:')));
  }

  downloadPurchaseOrderPDF(poId: number, facilityId: string | number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/purchase-orders/${poId}/pdf/?facilityId=${encodeURIComponent(facilityId)}/`,
      { responseType: 'blob' },
    );
  }

  sendPurchaseOrderEmail(
    poId: number,
    facilityId: string | number,
    ccEmails: string[] = [],
  ): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.baseUrl}/purchase-orders/${poId}/send_email/?facilityId=${encodeURIComponent(facilityId)}/`,
        { cc_emails: ccEmails },
      )
      .pipe(tap(() => this.dataSync.invalidate(`pharmacy:purchase-orders:${facilityId}`)));
  }

  getPORecipients(
    poId: number,
    facilityId: string | number,
  ): Observable<{ vendor_email: string; cc_emails: string[] }> {
    return this.http.get<{ vendor_email: string; cc_emails: string[] }>(
      `${this.baseUrl}/purchase-orders/${poId}/recipients/?facilityId=${encodeURIComponent(facilityId)}/`,
    );
  }

  searchDrugTerminology(searchTerm: string): Observable<KnhtsConceptSearchResult[]> {
    const normalized = (searchTerm || '').trim();
    if (!normalized) {
      return of([]);
    }
    return this.http
      .get<any>(`${this.baseUrl}/drugs/terminology-search/?search=${encodeURIComponent(normalized)}`)
      .pipe(
        map((response: any) => {
          const items: any[] =
            response?.items ?? response?.results ?? response?.data ??
            (Array.isArray(response) ? response : []);

          return items.map((item: any): KnhtsConceptSearchResult => ({
            coding: item.coding ?? [
              {
                system: item.system || 'KNHTS',
                code: item.code || item.conceptCode || '',
                display: item.display || item.name || item.text || '',
              },
            ],
            text: item.text || item.display || item.name || '',
            display: item.display || item.name || item.text || '',
            system: item.system || item.coding?.[0]?.system || 'KNHTS',
            code: item.code || item.conceptCode || item.coding?.[0]?.code || '',
          }));
        }),
        catchError(() => of([])),
      );
  }
}
