import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse, CreateDrugPurchaseOrderRequest, CreateDrugRequest, Drug, DrugCategory, DrugPurchaseOrder, Prescription } from '../models';
import { DataSyncService } from './data-sync.service';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly dataSync = inject(DataSyncService);
  private readonly baseUrl = apiUrl('/pharmacy');

  getDrugs(facilityId: string | number): Observable<Drug[]> {
    return this.dataSync.query(`pharmacy:drugs:${facilityId}`, () => this.http
      .get<{
        items: Drug[];
        count: number;
      }>(`${this.baseUrl}/drugs/?facilityId=${encodeURIComponent(facilityId)}/`)
      .pipe(
        map((response) =>
          (response?.items ?? []).filter((drug): drug is Drug => Boolean(drug)),
        ),
      ));
  }

  getCategories(facilityId: string | number): Observable<DrugCategory[]> {
    return this.dataSync.query(`pharmacy:categories:${facilityId}`, () => this.http
      .get<{
        items: DrugCategory[];
        count: number;
      }>(`${this.baseUrl}/categories/?facilityId=${encodeURIComponent(facilityId)}/`)
      .pipe(map((response) => response.items ?? [])));
  }

  createCategory(
    payload: { name: string; description?: string },
    facilityId: string | number,
  ): Observable<ApiResponse<DrugCategory>> {
    return this.http.post<ApiResponse<DrugCategory>>(
      `${this.baseUrl}/categories/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:categories:${facilityId}`)));
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
      ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:categories:${facilityId}`)));
  }

  deleteCategory(
    categoryId: number,
    facilityId: string | number,
  ): Observable<ApiResponse<DrugCategory>> {
    return this.http.delete<ApiResponse<DrugCategory>>(
      `${this.baseUrl}/categories/${encodeURIComponent(categoryId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
    ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:categories:${facilityId}`)));
  }

  createDrug(
    payload: CreateDrugRequest,
    facilityId: string | number,
  ): Observable<ApiResponse<Drug>> {
    return this.http.post<ApiResponse<Drug>>(
      `${this.baseUrl}/drugs/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:drugs:${facilityId}`)));
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
      ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:drugs:${facilityId}`)));
  }

  getPrescriptions(facilityId: string | number): Observable<Prescription[]> {
    return this.dataSync.query(`pharmacy:prescriptions:${facilityId}`, () => this.http
      .get<{
        items: Prescription[];
        count: number;
      }>(
        `${this.baseUrl}/prescriptions/?facilityId=${encodeURIComponent(facilityId)}/`,
      )
      .pipe(map((response) => response.items ?? [])));
  }

  createPrescription(
    patientId: string,
    payload: {
      drugs: { name: string; quantity: number; dosage: string }[];
      status: 'Pending' | 'Dispensed';
      date: string;
      doctorId: string;
    },
    facilityId: string | number,
  ): Observable<ApiResponse<Prescription>> {
    return this.http.post<ApiResponse<Prescription>>(
      `${this.baseUrl}/prescriptions/?facilityId=${encodeURIComponent(facilityId)}`,
      { ...payload, patientId },
    ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:prescriptions:${facilityId}`)));
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
      ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:prescriptions:${facilityId}`)));
  }

  deletePrescription(
    prescriptionId: string,
    facilityId: string | number,
  ): Observable<ApiResponse<Prescription>> {
    return this.http.delete<ApiResponse<Prescription>>(
      `${this.baseUrl}/prescriptions/${encodeURIComponent(prescriptionId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
    ).pipe(tap(() => this.dataSync.invalidate(`pharmacy:prescriptions:${facilityId}`)));
  }

  getPurchaseOrders(facilityId: string | number): Observable<DrugPurchaseOrder[]> {
    return this.dataSync.query(`pharmacy:purchase-orders:${facilityId}`, () =>
      this.http
        .get<{ items: DrugPurchaseOrder[]; count: number }>(
          `${this.baseUrl}/purchase-orders/?facilityId=${encodeURIComponent(facilityId)}/`,
        )
        .pipe(map((res) => res.items ?? [])),
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
      .pipe(tap(() => this.dataSync.invalidate(`pharmacy:purchase-orders:${facilityId}`)));
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
      .pipe(tap(() => this.dataSync.invalidate(`pharmacy:purchase-orders:${facilityId}`)));
  }

  deletePurchaseOrder(poId: number, facilityId: string | number): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/purchase-orders/${poId}/?facilityId=${encodeURIComponent(facilityId)}/`,
      )
      .pipe(tap(() => this.dataSync.invalidate(`pharmacy:purchase-orders:${facilityId}`)));
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
}
