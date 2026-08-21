import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse, CreateDrugRequest, Drug, Prescription } from '../models';
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
}
